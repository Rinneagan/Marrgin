import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { getAdminIdToken, SINGLE_ADMIN_UID } from "@/lib/serverFirestoreRest";

// Verify admin identity from Bearer token via Firebase Identity Toolkit
async function verifyAdminFromHeader(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return false;
  }
  const token = authHeader.substring(7).trim();
  if (!token) return false;

  try {
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCIm6bpU3B6wFYKgQdA1L86Pi9l18ObJEU";
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: token }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    const verifiedUid = data.users?.[0]?.localId;
    return verifiedUid === SINGLE_ADMIN_UID;
  } catch (err) {
    console.error("Admin verification error in generate-cover:", err);
    return false;
  }
}

// POST /api/generate-cover
export async function POST(req: NextRequest) {
  try {
    // 1. Authoritative Admin Security Gate
    const isAdmin = await verifyAdminFromHeader(req);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized. Editorial cover generation requires authoritative admin privileges." },
        { status: 403 }
      );
    }

    // 2. Validate Server Environment (Strict server-side GEMINI_API_KEY)
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey || geminiApiKey.trim() === "" || geminiApiKey.includes("your-gemini-api-key")) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured on the server. Please add your key to environment variables." },
        { status: 500 }
      );
    }

    // 3. Parse Request & Prioritized Prompt Construction
    const body = await req.json().catch(() => ({}));
    const { pieceId, prompt, title, mode, contentSnippet } = body;

    // Hierarchy: 1. Explicit prompt > 2. Title > 3. Editorial mode > 4. Short content context
    let visualSubject = "";
    if (prompt && typeof prompt === "string" && prompt.trim()) {
      visualSubject = prompt.trim();
    } else if (title && typeof title === "string" && title.trim()) {
      visualSubject = `Visual metaphor evoking the piece titled "${title.trim()}"`;
    } else {
      visualSubject = `Atmospheric editorial visual metaphor for a literary ${mode || "piece"}`;
    }

    let contextualNotes = "";
    if (title && typeof title === "string" && title.trim() && prompt && prompt.trim()) {
      contextualNotes += ` Context title: "${title.trim()}".`;
    }
    if (mode && typeof mode === "string") {
      contextualNotes += ` Editorial mode: ${mode}.`;
    }
    if (contentSnippet && typeof contentSnippet === "string" && contentSnippet.trim()) {
      const cleanSnippet = contentSnippet.trim().replace(/\s+/g, " ").slice(0, 250);
      contextualNotes += ` Conceptual tone & context: "${cleanSnippet}".`;
    }

    // Marrgin visual identity: fine-art editorial photography, quiet contemplative mood,
    // natural textures, thoughtful use of negative space, cinematic but believable lighting.
    // Strictly NO text, NO typography, NO letters, NO words, NO logos, NO watermarks, NO decorative clutter.
    // Only introduce Ghanaian imagery if explicitly supported by prompt/metadata.
    const literaryPrompt = `A fine-art editorial photograph for a prestigious literary publication. Subject: ${visualSubject}.${contextualNotes} Style: rich analog medium-format film grain, quiet contemplative mood, natural lighting, restrained composition, authentic physical texture, generous negative space suitable for publication layout. Strictly NO text, NO typography, NO letters, NO words, NO logos, NO watermarks. Avoid generic CGI, digital 3D rendering, cheesy stock-photo aesthetics, or artificial decorative clutter.`;

    // 4. Call Google Gemini Native Image Generation via ai.interactions.create
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

    const primaryModel = process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image";
    const modelsToTry = [
      primaryModel,
      "gemini-2.5-flash-image",
    ].filter((m, idx, arr): m is string => Boolean(m) && arr.indexOf(m) === idx);

    let imageBase64: string | null = null;
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        const interaction = await ai.interactions.create({
          model: modelName,
          input: literaryPrompt,
          response_format: {
            type: "image",
            aspect_ratio: "3:2",
          },
        });

        // Check direct SDK output_image field
        if (interaction.output_image?.data) {
          imageBase64 = interaction.output_image.data;
          break;
        }

        // Check steps / content blocks if output_image is nested
        if ((interaction as any).steps) {
          for (const step of (interaction as any).steps) {
            if (step.type === "model_output" && Array.isArray(step.content)) {
              for (const contentBlock of step.content) {
                if (contentBlock.type === "image" && contentBlock.data) {
                  imageBase64 = contentBlock.data;
                  break;
                }
              }
            }
            if (imageBase64) break;
          }
        }

        if (imageBase64) break;
      } catch (genErr: any) {
        lastError = genErr;
        console.error(`Gemini image generation with ${modelName} failed:`, genErr?.message || genErr);
      }
    }

    if (!imageBase64) {
      const rawMsg = lastError?.message || "No image data returned from Gemini API.";
      // Sanitize any potential sensitive credentials in error messages
      const sanitizedMsg = String(rawMsg).replace(/AIza[0-9A-Za-z-_]{35}/g, "[REDACTED]");
      return NextResponse.json(
        { error: `Gemini image generation error: ${sanitizedMsg}` },
        { status: 502 }
      );
    }

    const imageBuffer = Buffer.from(imageBase64, "base64");

    // 5. Server uploads image to Firebase Storage at covers/{pieceId}/{timestamp}.png
    const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "friday-pages-web.firebasestorage.app";
    const cleanPieceId = (pieceId || "piece").replace(/[^a-zA-Z0-9_-]/g, "");
    const fileName = `covers/${cleanPieceId}/${Date.now()}.png`;

    let permanentUrl: string | null = null;

    try {
      const adminToken = await getAdminIdToken();
      const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o?uploadType=media&name=${encodeURIComponent(fileName)}`;

      const storageRes = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "Content-Type": "image/png",
          Authorization: `Bearer ${adminToken}`,
        },
        body: new Uint8Array(imageBuffer),
      });

      if (storageRes.ok) {
        const storageData = await storageRes.json();
        const tokenParam = storageData.downloadTokens ? `&token=${storageData.downloadTokens}` : "";
        permanentUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(fileName)}?alt=media${tokenParam}`;
      } else {
        const storageErr = await storageRes.text().catch(() => "");
        console.error(`Firebase Storage upload returned ${storageRes.status}:`, storageErr);
        return NextResponse.json(
          { error: `Firebase Storage upload failed with status ${storageRes.status}. Please check storage bucket and permissions.` },
          { status: 502 }
        );
      }
    } catch (storageException: any) {
      console.error("Firebase Storage exception during cover upload:", storageException);
      return NextResponse.json(
        { error: `Firebase Storage upload error: ${storageException.message || "Failed to persist to storage"}` },
        { status: 502 }
      );
    }

    if (!permanentUrl) {
      return NextResponse.json(
        { error: "Failed to obtain permanent download URL from Firebase Storage." },
        { status: 500 }
      );
    }

    // 6. Return persistent download URL to client
    return NextResponse.json({ coverImage: permanentUrl });
  } catch (err: any) {
    console.error("Generate cover route error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
