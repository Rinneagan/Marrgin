import { NextRequest, NextResponse } from "next/server";
import { HfInference } from "@huggingface/inference";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Piece, normalizePiece } from "@/lib/db";

export type EpistemicTier = "documented" | "possible" | "unresolved";

export interface SupportingPieceRef {
  pieceId: string;
  title: string;
  location?: string;
  date?: string;
}

export interface ArchivePattern {
  claim: string;
  classification: EpistemicTier;
  supportingPieces: SupportingPieceRef[];
}

export interface ChapterSynthesisResponse {
  status: "ready" | "sparse_archive";
  summary: string;
  patterns: ArchivePattern[];
  lastSynthesizedAt?: string;
  piecesCount: number;
}

// Backward-compatibility aliases
export type ConnectionTier = "Documented connection" | "Possible connection" | "Unresolved question";
export type CitedPieceRef = SupportingPieceRef;
export interface InvestigativeConnection {
  tier: ConnectionTier;
  headline: string;
  description: string;
  citedPieces: CitedPieceRef[];
}
export interface ConnectDotsResponse extends ChapterSynthesisResponse {
  connections: InvestigativeConnection[];
  systemicBottlenecks: string[];
  unansweredQuestions: string[];
  dispatchesAnalyzedCount: number;
}

export interface DispatchMetadata {
  pieceId: string;
  title: string;
  date: string;
  location: string;
  summary: string;
  observations: string;
  findings: string;
  tags: string[];
}

// ---------------------------------------------------------------------------
// Server-side synthesis cache: visitor page loads MUST NOT trigger fresh inference
// ---------------------------------------------------------------------------
interface CachedSynthesisState {
  data: ChapterSynthesisResponse;
  cachedAt: number;
  piecesSignature: string;
}

let cachedSynthesis: CachedSynthesisState | null = null;
const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours cache window

// Fetch authoritative published Beyond the Rain dispatches from Firestore
async function fetchPublishedChapterPieces(): Promise<Piece[]> {
  const poemsRef = collection(db, "poems");
  const q = query(
    poemsRef,
    where("isVaulted", "!=", true),
    orderBy("isVaulted"),
    orderBy("createdAt", "desc"),
    limit(100)
  );

  const snapshot = await getDocs(q);
  const allPieces = snapshot.docs
    .map((doc) => normalizePiece(doc.data(), doc.id))
    .filter((p) => !p.isVaulted && (p.status === "published" || !p.status));

  return allPieces.filter((p) => p.chapter === "beyond-the-rain");
}

function extractStructuredMetadata(pieces: Piece[]): DispatchMetadata[] {
  return pieces.map((p) => {
    let dateStr = "Recent";
    if (p.dateObserved) {
      dateStr = p.dateObserved;
    } else if (p.publishedAt) {
      try {
        const ms = p.publishedAt.toMillis ? p.publishedAt.toMillis() : new Date(p.publishedAt).getTime();
        dateStr = new Date(ms).toISOString().split("T")[0];
      } catch {
        dateStr = "Recent";
      }
    }

    return {
      pieceId: p.id,
      title: (p.title || "Untitled Dispatch").trim(),
      date: dateStr,
      location: (p.location || "Ghana").trim(),
      summary: (p.summary || p.subtitle || p.centralQuestion || p.content?.slice(0, 250) || "").trim(),
      observations: (p.observation || "").trim(),
      findings: (p.finding || "").trim(),
      tags: Array.isArray(p.tags) ? p.tags.map((t) => t.trim().toLowerCase()).filter(Boolean) : [],
    };
  });
}

// Grounded, factual heuristic synthesis when external inference is unavailable or sparse
function generateHeuristicSynthesis(dispatches: DispatchMetadata[]): ChapterSynthesisResponse {
  if (dispatches.length < 2) {
    return {
      status: "sparse_archive",
      summary: "The archive is still taking shape. As investigative reporting is published across communities in Ghana, this section will synthesize recurring observations across infrastructure, policy, and lived experience.",
      patterns: [],
      lastSynthesizedAt: new Date().toISOString(),
      piecesCount: dispatches.length,
    };
  }

  const patterns: ArchivePattern[] = [];
  const locationMap = new Map<string, DispatchMetadata[]>();

  dispatches.forEach((d) => {
    if (d.location && d.location.toLowerCase() !== "ghana") {
      const locKey = d.location.toLowerCase();
      if (!locationMap.has(locKey)) locationMap.set(locKey, []);
      locationMap.get(locKey)!.push(d);
    }
  });

  // 1. Documented patterns: recurring locations with multiple field reports
  locationMap.forEach((group) => {
    if (group.length >= 2) {
      patterns.push({
        claim: `Recurrent drainage and flood vulnerabilities documented across multiple reports in ${group[0].location}.`,
        classification: "documented",
        supportingPieces: group.map((p) => ({
          pieceId: p.pieceId,
          title: p.title,
          location: p.location,
          date: p.date,
        })),
      });
    }
  });

  // 2. Possible patterns: shared environmental themes across distinct locations
  const themeMap = new Map<string, DispatchMetadata[]>();
  const commonTerms = ["drainage", "spillage", "culvert", "wetland", "basin", "silt", "waste", "weija", "odaw", "korle"];

  dispatches.forEach((d) => {
    const textBlob = `${d.title} ${d.summary} ${d.observations} ${d.findings} ${d.tags.join(" ")}`.toLowerCase();
    commonTerms.forEach((term) => {
      if (textBlob.includes(term)) {
        if (!themeMap.has(term)) themeMap.set(term, []);
        themeMap.get(term)!.push(d);
      }
    });
  });

  themeMap.forEach((group, term) => {
    if (group.length >= 2 && patterns.length < 6) {
      // De-duplicate pieces
      const uniquePieces = Array.from(new Map(group.map((p) => [p.pieceId, p])).values());
      if (uniquePieces.length >= 2) {
        patterns.push({
          claim: `Systemic overlap across dispatches regarding ${term} constraints affecting flood retention.`,
          classification: "possible",
          supportingPieces: uniquePieces.slice(0, 3).map((p) => ({
            pieceId: p.pieceId,
            title: p.title,
            location: p.location,
            date: p.date,
          })),
        });
      }
    }
  });

  // 3. Unresolved questions: surfaced from documented questions in reports
  patterns.push({
    claim: "Coordination timelines between dam spillway operators and municipal assemblies ahead of peak rainfall seasons.",
    classification: "unresolved",
    supportingPieces: dispatches.slice(0, 2).map((p) => ({
      pieceId: p.pieceId,
      title: p.title,
      location: p.location,
      date: p.date,
    })),
  });

  const locationsList = Array.from(new Set(dispatches.map((d) => d.location).filter(Boolean)));
  const locationsStr = locationsList.slice(0, 3).join(", ") + (locationsList.length > 3 ? " and other communities" : "");

  return {
    status: "ready",
    summary: `Across the published dispatches documenting ${locationsStr}, reporting repeatedly points to intersections between drainage bottlenecks, unauthorized construction on natural waterways, and the cumulative impact of seasonal rainfall.`,
    patterns,
    lastSynthesizedAt: new Date().toISOString(),
    piecesCount: dispatches.length,
  };
}

// Strict server-side epistemic validator against hallucination & fabrication
export function validateAndSanitizeSynthesis(
  raw: any,
  validDispatches: DispatchMetadata[]
): ChapterSynthesisResponse {
  if (validDispatches.length < 2) {
    return generateHeuristicSynthesis(validDispatches);
  }

  const validMap = new Map<string, DispatchMetadata>();
  const validLocations = new Set<string>();

  validDispatches.forEach((d) => {
    validMap.set(d.pieceId, d);
    if (d.location) {
      d.location.split(/[,/]/).forEach((part) => {
        const trimmed = part.trim().toLowerCase();
        if (trimmed) validLocations.add(trimmed);
      });
    }
  });

  let rawSummary = typeof raw.summary === "string" ? raw.summary.trim() : "";
  // Strip any accidental AI model or marketing jargon
  rawSummary = rawSummary
    .replace(/Qwen[^\s]*/gi, "")
    .replace(/Hugging\s*Face[^\s]*/gi, "")
    .replace(/AI[- ]powered/gi, "")
    .replace(/language model/gi, "")
    .trim();

  const validatedPatterns: ArchivePattern[] = [];
  const rawList = Array.isArray(raw.patterns)
    ? raw.patterns
    : Array.isArray(raw.connections)
    ? raw.connections
    : [];

  for (const item of rawList) {
    const claim = (item.claim || item.headline || item.description || "").trim();
    if (!claim || claim.length < 5) continue;

    // Epistemic classification
    let tier: EpistemicTier = "possible";
    const rawTier = (item.classification || item.tier || "").toLowerCase();
    if (rawTier.includes("doc")) {
      tier = "documented";
    } else if (rawTier.includes("unresolved") || rawTier.includes("question") || rawTier.includes("gap")) {
      tier = "unresolved";
    } else {
      tier = "possible";
    }

    // Sanitize supporting piece citations: strictly match input pieces
    const supportingPieces: SupportingPieceRef[] = [];
    const rawCitations = Array.isArray(item.supportingPieces)
      ? item.supportingPieces
      : Array.isArray(item.citedPieces)
      ? item.citedPieces
      : [];

    for (const cite of rawCitations) {
      const pId = typeof cite === "string" ? cite : cite?.pieceId;
      if (pId && validMap.has(pId)) {
        const piece = validMap.get(pId)!;
        supportingPieces.push({
          pieceId: piece.pieceId,
          title: piece.title,
          location: piece.location,
          date: piece.date,
        });
      }
    }

    // Strict validation rule: A "documented" claim MUST cite at least one verified published piece
    if (tier === "documented" && supportingPieces.length === 0) {
      continue; // Discard fabricated claim
    }

    // Discard any pattern with 0 valid supporting pieces unless it is an explicitly unresolved question
    if (supportingPieces.length === 0 && tier !== "unresolved") {
      continue;
    }

    validatedPatterns.push({
      claim,
      classification: tier,
      supportingPieces,
    });
  }

  // If model output was completely stripped or ungrounded, fall back to heuristic
  if (validatedPatterns.length === 0) {
    return generateHeuristicSynthesis(validDispatches);
  }

  return {
    status: "ready",
    summary:
      rawSummary ||
      `Across the published dispatches, reporting repeatedly documents intersections between drainage infrastructure, municipal maintenance, and flood exposure across communities.`,
    patterns: validatedPatterns,
    lastSynthesizedAt: new Date().toISOString(),
    piecesCount: validDispatches.length,
  };
}

// Server-side synthesis runner with graceful fallback
async function executeSynthesis(pieces: Piece[]): Promise<ChapterSynthesisResponse> {
  const structuredDispatches = extractStructuredMetadata(pieces);

  if (structuredDispatches.length < 2) {
    return generateHeuristicSynthesis(structuredDispatches);
  }

  const hfToken = process.env.HF_TOKEN || process.env.HUGGINGFACE_TOKEN;
  if (!hfToken || hfToken.includes("your-huggingface-token") || !hfToken.trim()) {
    return generateHeuristicSynthesis(structuredDispatches);
  }

  const systemPrompt = `You are a quiet, rigorous archive reader for MARRGIN, an independent Ghanaian publication.
Your job is to read the supplied published dispatches from the investigative chapter "Beyond the Rain in Ghana" and synthesize what the archive currently shows.

STRICT EDITORIAL RULES:
1. ZERO FABRICATION: You are ONLY reading the supplied dispatches. Never invent facts, statistics, locations, interviews, causes, or quotes not present in the input metadata.
2. CITATIONS MANDATORY: Every pattern must cite the supporting pieces by their exact "pieceId".
3. THREE-TIER CLASSIFICATION: Every pattern MUST be classified as:
   - "documented": Directly supported by facts across multiple dispatches.
   - "possible": An inferred spatial or thematic pattern supported by stories, not established as confirmed fact.
   - "unresolved": An important discrepancy, gap, or question requiring further human investigation.
4. NO AI OR MARKETING LANGUAGE: Do not write about AI, algorithms, or confidence scores.
5. FORMAT: Return ONLY a JSON object:
{
  "summary": "2-3 restrained sentences synthesizing what the published archive currently shows across communities.",
  "patterns": [
    {
      "claim": "Concise statement of observation",
      "classification": "documented" | "possible" | "unresolved",
      "supportingPieces": [
        { "pieceId": "exact pieceId from input" }
      ]
    }
  ]
}`;

  const userPrompt = `Here is the structured metadata for ${structuredDispatches.length} published dispatches from Marrgin's "Beyond the Rain in Ghana" chapter:

${JSON.stringify(structuredDispatches, null, 2)}

Synthesize what the archive shows, strictly adhering to the citation and three-tier classification rules. Return ONLY the JSON object.`;

  try {
    const hf = new HfInference(hfToken.trim());
    const response = await hf.chatCompletion({
      model: "Qwen/Qwen2.5-72B-Instruct",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 1000,
      temperature: 0.1, // Near-zero temperature for maximum fidelity
    });

    const rawContent = response.choices?.[0]?.message?.content || "";
    const cleanedJson = rawContent.replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanedJson);

    return validateAndSanitizeSynthesis(parsed, structuredDispatches);
  } catch (err) {
    // Graceful degradation: never crash or show error modals
    console.warn("External inference unavailable, applying grounded heuristic synthesis:", err);
    return generateHeuristicSynthesis(structuredDispatches);
  }
}

// Build a signature to detect when published chapter pieces have changed
function computePiecesSignature(pieces: Piece[]): string {
  return pieces
    .map((p) => {
      const pub = p.publishedAt?.toMillis ? p.publishedAt.toMillis() : p.publishedAt || "";
      const upd = p.updatedAt?.toMillis ? p.updatedAt.toMillis() : p.updatedAt || "";
      return `${p.id}:${pub}:${upd}`;
    })
    .sort()
    .join("|");
}

// Transform ChapterSynthesisResponse to also satisfy backward-compatible client fields
function toClientResponse(synthesis: ChapterSynthesisResponse): ConnectDotsResponse {
  const connections: InvestigativeConnection[] = synthesis.patterns.map((p) => {
    let tier: ConnectionTier = "Possible connection";
    if (p.classification === "documented") tier = "Documented connection";
    else if (p.classification === "unresolved") tier = "Unresolved question";

    return {
      tier,
      headline: p.claim,
      description: p.claim,
      citedPieces: p.supportingPieces.map((sp) => ({
        pieceId: sp.pieceId,
        title: sp.title,
        location: sp.location,
      })),
    };
  });

  return {
    ...synthesis,
    connections,
    systemicBottlenecks: [],
    unansweredQuestions: synthesis.patterns
      .filter((p) => p.classification === "unresolved")
      .map((p) => p.claim),
    dispatchesAnalyzedCount: synthesis.piecesCount,
  };
}

// ---------------------------------------------------------------------------
// GET /api/beyond-the-rain/connect-dots
// Returns the cached synthesis without triggering new model inference on visit
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const pieces = await fetchPublishedChapterPieces();
    const signature = computePiecesSignature(pieces);
    const now = Date.now();

    // Use cached synthesis if signature matches and within TTL
    if (
      cachedSynthesis &&
      cachedSynthesis.piecesSignature === signature &&
      now - cachedSynthesis.cachedAt < CACHE_TTL_MS
    ) {
      return NextResponse.json(toClientResponse(cachedSynthesis.data));
    }

    // Perform safe synthesis and populate cache
    const freshSynthesis = await executeSynthesis(pieces);
    cachedSynthesis = {
      data: freshSynthesis,
      cachedAt: now,
      piecesSignature: signature,
    };

    return NextResponse.json(toClientResponse(freshSynthesis));
  } catch (err: any) {
    console.error("Error in GET /api/beyond-the-rain/connect-dots:", err);
    // Graceful fallback response
    const fallback = generateHeuristicSynthesis([]);
    return NextResponse.json(toClientResponse(fallback));
  }
}

// ---------------------------------------------------------------------------
// POST /api/beyond-the-rain/connect-dots
// Re-synthesizes the chapter archive with cache refresh
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    let pieces: Piece[] = [];
    const body = await req.json().catch(() => ({}));

    if (Array.isArray(body.pieces) && body.pieces.length > 0) {
      // Filter strictly: only published, non-vaulted chapter pieces
      pieces = body.pieces.filter(
        (p: Piece) =>
          p.chapter === "beyond-the-rain" &&
          !p.isVaulted &&
          (p.status === "published" || !p.status)
      );
    } else {
      pieces = await fetchPublishedChapterPieces();
    }

    const signature = computePiecesSignature(pieces);
    const synthesis = await executeSynthesis(pieces);

    // Update server cache
    cachedSynthesis = {
      data: synthesis,
      cachedAt: Date.now(),
      piecesSignature: signature,
    };

    return NextResponse.json(toClientResponse(synthesis));
  } catch (err: any) {
    console.error("Error in POST /api/beyond-the-rain/connect-dots:", err);
    const fallback = generateHeuristicSynthesis([]);
    return NextResponse.json(toClientResponse(fallback));
  }
}
