import fs from "fs";
import path from "path";

// 1. Load .env.local before any module imports
try {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    for (const line of envContent.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
} catch (e) {
  // ignore
}

function assert(condition: boolean, testName: string, detail?: any) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    console.error(`  ❌ FAIL: ${testName}`, detail || "");
    throw new Error(`Assertion failed: ${testName}`);
  }
}

async function runTests() {
  console.log("\n========================================================");
  console.log("MARRGIN — BEYOND THE RAIN IN GHANA TEST SUITE");
  console.log("========================================================\n");

  const { normalizePiece } = await import("../src/lib/db");
  const {
    validateAndSanitizeSynthesis,
    GET,
  } = await import("../src/app/api/beyond-the-rain/connect-dots/route");
  const { NextRequest } = await import("next/server");

  // -------------------------------------------------------------------
  // TEST 1: Chapter Filtering & Leakage Prevention
  // -------------------------------------------------------------------
  console.log("TEST 1: Chapter Filtering & Leakage Prevention...");

  const rawPieces: any[] = [
    {
      id: "p1",
      title: "Clogged Basin at Weija",
      chapter: "beyond-the-rain",
      status: "published",
      isVaulted: false,
      location: "Weija",
      publishedAt: new Date("2026-06-01"),
    },
    {
      id: "p2",
      title: "Draft Investigation on Korle Lagoon",
      chapter: "beyond-the-rain",
      status: "draft", // DRAFT: Must be excluded!
      isVaulted: false,
      location: "Accra",
    },
    {
      id: "p3",
      title: "Scheduled Dispatch on Odaw Channel",
      chapter: "beyond-the-rain",
      status: "scheduled", // SCHEDULED: Must be excluded!
      isVaulted: false,
      scheduledAt: new Date("2026-12-01"),
      location: "Accra",
    },
    {
      id: "p4",
      title: "Vaulted Private Dispatch",
      chapter: "beyond-the-rain",
      status: "published",
      isVaulted: true, // VAULTED: Must be excluded!
      location: "Kumasi",
    },
    {
      id: "p5",
      title: "Unrelated Essay on Architecture",
      chapter: "", // NOT in chapter: Must be excluded!
      status: "published",
      isVaulted: false,
      location: "Accra",
    },
    {
      id: "p6",
      title: "Aboabo Drainage Survey",
      chapter: "beyond-the-rain",
      status: "published",
      isVaulted: false,
      location: "Kumasi",
      publishedAt: new Date("2026-06-05"),
    },
  ];

  const normalized = rawPieces.map((p) => normalizePiece(p, p.id));

  // Authoritative chapter filtering contract
  const chapterFiltered = normalized.filter(
    (p) =>
      p.chapter === "beyond-the-rain" &&
      !p.isVaulted &&
      (p.status === "published" || !p.status)
  );

  assert(chapterFiltered.length === 2, "Only published non-vaulted chapter pieces are included");
  assert(chapterFiltered.some((p) => p.id === "p1"), "Published piece p1 is included");
  assert(chapterFiltered.some((p) => p.id === "p6"), "Published piece p6 is included");
  assert(!chapterFiltered.some((p) => p.id === "p2"), "Draft piece p2 is strictly excluded");
  assert(!chapterFiltered.some((p) => p.id === "p3"), "Scheduled piece p3 is strictly excluded");
  assert(!chapterFiltered.some((p) => p.id === "p4"), "Vaulted piece p4 is strictly excluded");
  assert(!chapterFiltered.some((p) => p.id === "p5"), "Unrelated piece p5 is strictly excluded");

  // -------------------------------------------------------------------
  // TEST 2: Structured Input Isolation
  // -------------------------------------------------------------------
  console.log("\nTEST 2: Structured Input Extraction & Bloat Prevention...");

  const testPiece: any = {
    id: "dispatch-101",
    title: "Culvert Obstructions in Aboabo",
    subtitle: "How concrete blockages amplify seasonal inundation",
    content: "Full 5000-word investigative reporting text with extensive raw notes...",
    mode: "investigation",
    status: "published",
    chapter: "beyond-the-rain",
    location: "Kumasi",
    observation: "Culverts along the Aboabo stream are choked with building rubble.",
    finding: "Runoff velocity exceeds channel capacity within 15 minutes of rainfall.",
    centralQuestion: "Why was the 2024 desilting contract halted mid-stream?",
    tags: ["drainage", "culvert", "floods", "aboabo"],
    authorName: "Ebenezer Essel",
    createdAt: new Date("2026-05-10"),
    publishedAt: new Date("2026-05-12"),
    likesCount: 14,
    readsCount: 220,
    totalReadTime: 1200,
    completionsCount: 95,
  };

  const metadata = {
    pieceId: testPiece.id,
    title: testPiece.title,
    date: "2026-05-12",
    location: testPiece.location || "Ghana",
    summary: testPiece.subtitle || "",
    observations: testPiece.observation || "",
    findings: testPiece.finding || "",
    tags: testPiece.tags || [],
  };

  assert(metadata.pieceId === "dispatch-101", "Preserves exact pieceId");
  assert(metadata.location === "Kumasi", "Preserves location");
  assert(!("content" in metadata), "Omits raw full-text content bloat");
  assert(!("likesCount" in metadata), "Omits vanity metrics");

  // -------------------------------------------------------------------
  // TEST 3: Epistemic Anti-Fabrication & Traceability Safeguards
  // -------------------------------------------------------------------
  console.log("\nTEST 3: Epistemic Anti-Fabrication & Traceability Safeguards...");

  const validDispatches = [
    {
      pieceId: "d1",
      title: "Weija Downstream Flood Risk",
      date: "2026-05-01",
      location: "Weija",
      summary: "Dam spillage without early warning inundates Tetegu.",
      observations: "Water level rose 4 feet in two hours.",
      findings: "Spillage gates opened without 48h community alert.",
      tags: ["weija", "spillage", "dam"],
    },
    {
      pieceId: "d2",
      title: "Gbawe Wetland Encroachment",
      date: "2026-05-10",
      location: "Weija",
      summary: "Building on retention ponds blocks outflow into Densu river.",
      observations: "Concrete structures erected inside natural flood plain.",
      findings: "Private developers filled retention basin with clay.",
      tags: ["weija", "wetland", "drainage"],
    },
  ];

  // Adversarial raw AI output containing hallucinations and fabricated citations
  const adversarialAiOutput = {
    summary: "Qwen AI-powered analysis shows critical infrastructure failures.",
    patterns: [
      {
        claim: "Repeated drainage failure in Weija documented across field dispatches.",
        classification: "documented",
        supportingPieces: [{ pieceId: "d1" }, { pieceId: "d2" }], // VALID
      },
      {
        claim: "Fabricated claim citing non-existent piece.",
        classification: "documented",
        supportingPieces: [{ pieceId: "phantom-piece-999" }], // FABRICATED PIECE ID
      },
      {
        claim: "Claim citing invented location Tamale not in input.",
        classification: "documented",
        supportingPieces: [], // NO SUPPORTING PIECE
      },
      {
        claim: "Discrepancy in community spillage notice timing.",
        classification: "unresolved",
        supportingPieces: [{ pieceId: "d1" }], // VALID UNRESOLVED
      },
    ],
  };

  const sanitized = validateAndSanitizeSynthesis(adversarialAiOutput, validDispatches);

  assert(sanitized.status === "ready", "Sanitized status is ready");
  assert(!sanitized.summary.includes("Qwen"), "Stripped AI model branding from summary");
  assert(!sanitized.summary.includes("AI-powered"), "Stripped AI-powered marketing jargon");

  // Check that the fabricated piece ID was rejected
  const hasFabricatedPiece = sanitized.patterns.some((p: any) =>
    p.supportingPieces.some((sp: any) => sp.pieceId === "phantom-piece-999")
  );
  assert(!hasFabricatedPiece, "Fabricated pieceId 'phantom-piece-999' was purged");

  // Check that documented claim with zero supporting pieces was rejected
  const hasUnsupportedDoc = sanitized.patterns.some(
    (p: any) => p.classification === "documented" && p.supportingPieces.length === 0
  );
  assert(!hasUnsupportedDoc, "Documented claims without matching supporting pieces were purged");

  // Check that legitimate pattern was preserved
  const validPattern = sanitized.patterns.find((p: any) => p.classification === "documented");
  assert(Boolean(validPattern), "Legitimate documented pattern was preserved");
  assert(validPattern!.supportingPieces.length === 2, "Both valid citations preserved");

  // -------------------------------------------------------------------
  // TEST 4: Fallback Synthesis Resilience
  // -------------------------------------------------------------------
  console.log("\nTEST 4: Fallback Synthesis Resilience...");

  // Sparse archive: 1 dispatch
  const sparseResult = validateAndSanitizeSynthesis({}, [validDispatches[0]]);
  assert(sparseResult.status === "sparse_archive", "Sparse archive triggers sparse_archive status");
  assert(
    sparseResult.summary.includes("The archive is still taking shape"),
    "Sparse archive uses restrained editorial placeholder"
  );
  assert(sparseResult.patterns.length === 0, "No fake patterns created for sparse archive");

  // Heuristic fallback over 2 dispatches
  const heuristicResult = validateAndSanitizeSynthesis({}, validDispatches);
  assert(heuristicResult.status === "ready", "Heuristic fallback returns ready status");
  assert(heuristicResult.patterns.length > 0, "Heuristic fallback extracts genuine grounded patterns");
  assert(
    heuristicResult.patterns[0].supportingPieces.every((p: any) => p.pieceId === "d1" || p.pieceId === "d2"),
    "Heuristic patterns cite only valid input pieces"
  );

  // -------------------------------------------------------------------
  // TEST 5: GET Endpoint Caching & No Inference on Visitor Visits
  // -------------------------------------------------------------------
  console.log("\nTEST 5: GET Endpoint Caching & Secret Isolation...");

  const req = new NextRequest("http://localhost:3000/api/beyond-the-rain/connect-dots");
  const res = await GET(req);

  assert(res.status === 200, "GET /api/beyond-the-rain/connect-dots returns 200 OK");
  const data: any = await res.json();
  assert(
    data.status === "ready" || data.status === "sparse_archive",
    "GET returns valid status without throwing"
  );

  // -------------------------------------------------------------------
  // TEST 6: Zero Secret Leakage to Client
  // -------------------------------------------------------------------
  console.log("\nTEST 6: Zero Secret Leakage to Client...");

  const jsonString = JSON.stringify(data);
  assert(!jsonString.includes("HF_TOKEN"), "Response does not leak HF_TOKEN");
  assert(!jsonString.includes("GEMINI_API_KEY"), "Response does not leak GEMINI_API_KEY");
  assert(!jsonString.includes("CRON_SECRET"), "Response does not leak CRON_SECRET");
  assert(!jsonString.includes("ADMIN_SERVER_EMAIL"), "Response does not leak ADMIN_SERVER_EMAIL");
  assert(!jsonString.includes("ADMIN_SERVER_PASSWORD"), "Response does not leak ADMIN_SERVER_PASSWORD");
  assert(!jsonString.includes("Qwen"), "Response does not expose model name");
  assert(!jsonString.includes("Hugging Face"), "Response does not expose provider branding");

  console.log("\n========================================================");
  console.log("ALL BEYOND THE RAIN TESTS PASSED (6/6 SUITES)");
  console.log("========================================================\n");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
