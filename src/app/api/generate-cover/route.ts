import { NextRequest, NextResponse } from "next/server";
import { getAdminIdToken, SINGLE_ADMIN_UID } from "@/lib/serverFirestoreRest";
import fs from "fs";
import path from "path";

// Verify admin identity from Bearer token
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

    // 2. Validate API Key
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured on the server. Please add it to your environment variables." },
        { status: 500 }
      );
    }

    // 3. Parse and construct literary prompt
    const body = await req.json().catch(() => ({}));
    const { pieceId, prompt, title, mode } = body;

    let literaryPrompt = "";
    if (prompt && prompt.trim()) {
      literaryPrompt = `An atmospheric, high-end editorial photograph for a prestigious literary publication. Subject: ${prompt.trim()}. Style: rich analog film grain, subtle natural chiaroscuro lighting, contemplative and melancholic mood, authentic Ghanaian texture and environmental reality. Thoughtful negative space suitable for an editorial magazine header. Strictly NO text, NO typography, NO letters, NO words, NO logos, NO watermarks.`;
    } else {
      const modeLabel = mode || "essay";
      const titleLabel = title ? `titled "${title.trim()}"` : "untitled";
      literaryPrompt = `A metaphorical and evocative fine-art editorial photograph for a literary ${modeLabel} ${titleLabel}. Poetic framing, natural earth tones, analog medium-format film grain, quiet emotional resonance, authentic Ghanaian atmosphere. Strictly NO text, NO typography, NO letters, NO words, NO logos, NO watermarks.`;
    }

    // 4. Call OpenAI Images API with verified model
    const openaiRes = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-image-2.5-sunburst",
        prompt: literaryPrompt,
        size: "1536x1024",
        quality: "high",
      }),
    });

    if (!openaiRes.ok) {
      const errJson = await openaiRes.json().catch(() => ({}));
      const errMsg = errJson.error?.message || `OpenAI returned status ${openaiRes.status}`;
      console.error("OpenAI generation failed:", errMsg);
      return NextResponse.json({ error: `Image generation failed: ${errMsg}` }, { status: 502 });
    }

    const openaiData = await openaiRes.json();
    const b64Json = openaiData.data?.[0]?.b64_json;
    const directUrl = openaiData.data?.[0]?.url;

    if (!b64Json && !directUrl) {
      return NextResponse.json({ error: "No image data returned from provider." }, { status: 502 });
    }

    let imageBuffer: Buffer;
    if (b64Json) {
      imageBuffer = Buffer.from(b64Json, "base64");
    } else {
      const imgFetch = await fetch(directUrl);
      const arr = await imgFetch.arrayBuffer();
      imageBuffer = Buffer.from(arr);
    }

    // 5. Server uploads to Firebase Storage
    const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "friday-pages-web.firebasestorage.app";
    const cleanPieceId = (pieceId || "piece").replace(/[^a-zA-Z0-9_-]/g, "");
    const fileName = `covers/${cleanPieceId}_${Date.now()}.png`;

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
        console.warn(`Firebase Storage returned status ${storageRes.status}`);
      }
    } catch (storageErr) {
      console.warn("Firebase Storage upload exception:", storageErr);
    }

    // Resilient fallback: if Firebase Storage bucket is not yet provisioned in console
    if (!permanentUrl) {
      try {
        const publicCoversDir = path.join(process.cwd(), "public", "covers");
        if (!fs.existsSync(publicCoversDir)) {
          fs.mkdirSync(publicCoversDir, { recursive: true });
        }
        const localFileName = `${cleanPieceId}_${Date.now()}.png`;
        const localFilePath = path.join(publicCoversDir, localFileName);
        fs.writeFileSync(localFilePath, imageBuffer);
        permanentUrl = `/covers/${localFileName}`;
      } catch (localSaveErr) {
        console.error("Local cover save error:", localSaveErr);
      }
    }

    if (!permanentUrl) {
      return NextResponse.json({ error: "Failed to persist generated cover image." }, { status: 500 });
    }

    return NextResponse.json({ coverImage: permanentUrl });
  } catch (err: any) {
    console.error("Generate cover route error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
