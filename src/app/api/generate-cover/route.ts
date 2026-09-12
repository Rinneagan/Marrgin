import { NextRequest, NextResponse } from "next/server";
import { HfInference } from "@huggingface/inference";
import { GoogleGenAI, Modality } from "@google/genai";
import { getAdminIdToken, SINGLE_ADMIN_UID } from "@/lib/serverFirestoreRest";
import sharp from "sharp";

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

    // 2. Validate Server Environment: Hugging Face (Free, No Billing) or Gemini or Pollinations fallback
    const hfToken = process.env.HF_TOKEN || process.env.HUGGINGFACE_TOKEN;
    const hasValidHfToken = Boolean(hfToken && !hfToken.includes("your-huggingface-token") && hfToken.trim());

    const geminiApiKey = process.env.GEMINI_API_KEY;
    const hasValidGeminiKey = Boolean(geminiApiKey && !geminiApiKey.includes("your-gemini-api-key") && geminiApiKey.trim());

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

    let imageBuffer: Buffer | null = null;
    let lastError: any = null;

    // 4A. Strategy 1: Hugging Face Inference API (Free, No Billing / No Credit Card Required)
    if (hasValidHfToken && hfToken) {
      try {
        const hf = new HfInference(hfToken.trim());
        const hfModels = [
          process.env.HF_IMAGE_MODEL || "black-forest-labs/FLUX.1-schnell",
          "stabilityai/stable-diffusion-xl-base-1.0",
        ];

        for (const model of hfModels) {
          try {
            const res: any = await hf.textToImage({
              model,
              inputs: literaryPrompt,
            });

            if (res && typeof res.arrayBuffer === "function") {
              const arrayBuffer = await res.arrayBuffer();
              imageBuffer = Buffer.from(arrayBuffer);
            } else if (typeof res === "string") {
              const b64Data = res.includes(",") ? res.split(",")[1] : res;
              imageBuffer = Buffer.from(b64Data, "base64");
            }

            if (imageBuffer) break;
          } catch (modelErr: any) {
            lastError = modelErr;
            console.warn(`Hugging Face model ${model} generation attempt failed:`, modelErr?.message || modelErr);
          }
        }
      } catch (hfErr: any) {
        lastError = hfErr;
        console.error("Hugging Face inference error:", hfErr?.message || hfErr);
      }
    }

    // 4B. Strategy 2: Google Gemini Native API (if HF token not configured or failed, and Gemini key present)
    if (!imageBuffer && hasValidGeminiKey && geminiApiKey) {
      const ai = new GoogleGenAI({ apiKey: geminiApiKey.trim() });
      const geminiModels = [
        process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image",
        "gemini-2.5-flash-image",
      ].filter((m, idx, arr): m is string => Boolean(m) && arr.indexOf(m) === idx);

      let imageBase64: string | null = null;

      // Try interactions API
      for (const modelName of geminiModels) {
        try {
          const interaction = await ai.interactions.create({
            model: modelName,
            input: literaryPrompt,
            response_format: {
              type: "image",
              aspect_ratio: "3:2",
            },
          });

          if (interaction.output_image?.data) {
            imageBase64 = interaction.output_image.data;
            break;
          }

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
        }
      }

      // Fallback to generateContent with image modality
      if (!imageBase64) {
        for (const modelName of geminiModels) {
          try {
            const genRes = await ai.models.generateContent({
              model: modelName,
              contents: literaryPrompt,
              config: {
                responseModalities: [Modality.IMAGE],
              },
            });

            for (const part of genRes.candidates?.[0]?.content?.parts || []) {
              if (part.inlineData?.data) {
                imageBase64 = part.inlineData.data;
                break;
              }
            }

            if (imageBase64) break;
          } catch (contentErr: any) {
            lastError = contentErr;
          }
        }
      }

      if (imageBase64) {
        imageBuffer = Buffer.from(imageBase64, "base64");
      }
    }

    // 4C. Strategy 3: Universal Free Fallback (Pollinations.ai — Zero billing, Zero API keys required)
    if (!imageBuffer) {
      try {
        const seed = Math.floor(Math.random() * 999999);
        const pollUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(literaryPrompt)}?seed=${seed}&width=1200&height=800&nologo=true`;
        const pollRes = await fetch(pollUrl);
        if (pollRes.ok) {
          const arr = await pollRes.arrayBuffer();
          imageBuffer = Buffer.from(arr);
        }
      } catch (pollErr: any) {
        lastError = pollErr;
        console.warn("Pollinations generation fallback failed:", pollErr?.message || pollErr);
      }
    }

    if (!imageBuffer) {
      let detailedMsg = "";
      if (lastError?.body) {
        try {
          const parsed = typeof lastError.body === "string" ? JSON.parse(lastError.body) : lastError.body;
          const firstErr = Array.isArray(parsed) ? parsed[0]?.error : parsed?.error;
          if (firstErr?.message) {
            detailedMsg = firstErr.message;
          }
        } catch {}
      }
      if (!detailedMsg && lastError?.error?.message) {
        detailedMsg = lastError.error.message;
      }
      let rawMsg = detailedMsg || lastError?.message || "No image data returned from AI provider.";

      let userFriendlyMsg = rawMsg;
      if (rawMsg.includes("You exceeded your current quota") || rawMsg.includes("RESOURCE_EXHAUSTED") || rawMsg.includes("free_tier_requests, limit: 0")) {
        userFriendlyMsg = "Google Gemini quota exceeded: Google's image models require a billing-enabled project (free tier limit is 0). To generate completely free with no billing, add a free Hugging Face token (HF_TOKEN) from https://huggingface.co/settings/tokens to .env.local.";
      } else if (rawMsg.includes("Authorization header") || rawMsg.includes("Unauthorized") || rawMsg.includes("401")) {
        userFriendlyMsg = "Hugging Face authentication required: Please add a free personal access token (HF_TOKEN) from https://huggingface.co/settings/tokens to .env.local (free account, no credit card required).";
      }

      const sanitizedMsg = String(userFriendlyMsg).replace(/AIza[0-9A-Za-z-_]{35}|hf_[0-9A-Za-z]{34}/g, "[REDACTED]");
      return NextResponse.json(
        { error: sanitizedMsg },
        { status: 502 }
      );
    }

    // 5. Optimize image buffer with sharp (WebP, max 1200x800, quality 80)
    let optimizedBuffer: Buffer = imageBuffer;
    try {
      optimizedBuffer = await sharp(imageBuffer)
        .resize(1200, 800, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
    } catch (sharpErr) {
      console.warn("Sharp optimization fallback to raw buffer:", sharpErr);
    }

    // 6. Persistence: Try Firebase Storage first (if provisioned)
    const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "friday-pages-web.firebasestorage.app";
    const cleanPieceId = (pieceId || "piece").replace(/[^a-zA-Z0-9_-]/g, "");
    const fileName = `covers/${cleanPieceId}/${Date.now()}.webp`;

    let permanentUrl: string | null = null;

    try {
      const adminToken = await getAdminIdToken();
      const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o?uploadType=media&name=${encodeURIComponent(fileName)}`;

      const storageRes = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "Content-Type": "image/webp",
          Authorization: `Bearer ${adminToken}`,
        },
        body: new Uint8Array(optimizedBuffer),
      });

      if (storageRes.ok) {
        const storageData = await storageRes.json();
        const tokenParam = storageData.downloadTokens ? `&token=${storageData.downloadTokens}` : "";
        permanentUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(fileName)}?alt=media${tokenParam}`;
      } else {
        console.warn(`Firebase Storage upload returned ${storageRes.status} for bucket "${bucket}". Falling back to Option A (optimized WebP Data URL).`);
      }
    } catch (storageException: any) {
      console.warn("Firebase Storage unavailable. Falling back to Option A (optimized WebP Data URL):", storageException?.message);
    }

    // 7. Option A Fallback: When Firebase Storage bucket requires Blaze plan upgrade or is not provisioned,
    // persist as an optimized WebP Data URL directly into Firestore.
    // Compressed size is typically ~50-80 KB, well within Firestore's 1MB document limit,
    // requires 0 billing, 0 credit cards, and 0 external storage configuration.
    if (!permanentUrl && optimizedBuffer) {
      permanentUrl = `data:image/webp;base64,${optimizedBuffer.toString("base64")}`;
    }

    if (!permanentUrl) {
      return NextResponse.json(
        { error: "Failed to persist cover image." },
        { status: 500 }
      );
    }

    // 8. Return persistent image URL to client
    return NextResponse.json({ coverImage: permanentUrl });
  } catch (err: any) {
    console.error("Generate cover route error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
