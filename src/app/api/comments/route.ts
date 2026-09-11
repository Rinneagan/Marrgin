import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { 
  restGetPiece, 
  restGetRateLimit, 
  restSetRateLimit, 
  restGetVisitorDisplayName, 
  restCreateComment, 
  restGetComments, 
  restModerateComment 
} from "@/lib/serverFirestoreRest";

const SINGLE_ADMIN_UID = "O0ePpSc6JTUrMKZ0cLZ2FM7eGPh2";

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex").slice(0, 32);
}

// Helper to verify admin identity from Authorization header
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
    console.error("Token verification error:", err);
    return false;
  }
}

// GET /api/comments?pieceId=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pieceId = searchParams.get("pieceId");
    if (!pieceId) {
      return NextResponse.json({ error: "pieceId is required" }, { status: 400 });
    }

    const isAdmin = await verifyAdminFromHeader(req);
    const comments = await restGetComments(pieceId, isAdmin);

    return NextResponse.json({ comments });
  } catch (err: any) {
    console.error("Failed to fetch comments:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/comments
export async function POST(req: NextRequest) {
  try {
    const bodyJson = await req.json();
    const { pieceId, body, visitorToken } = bodyJson;

    // 1. Validate Input Structure
    if (!pieceId || typeof pieceId !== "string" || pieceId.length > 100) {
      return NextResponse.json({ error: "Invalid pieceId" }, { status: 400 });
    }

    if (!body || typeof body !== "string") {
      return NextResponse.json({ error: "Comment text is required" }, { status: 400 });
    }

    // Plain text sanitization (strip control characters / null bytes)
    const cleanBody = body.replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\uD800-\uDFFF]/g, "").trim();
    if (cleanBody.length < 3) {
      return NextResponse.json({ error: "Comment must be at least 3 characters" }, { status: 400 });
    }

    if (cleanBody.length > 1000) {
      return NextResponse.json({ error: "Comment cannot exceed 1000 characters" }, { status: 400 });
    }

    if (!visitorToken || typeof visitorToken !== "string" || visitorToken.trim().length < 8 || visitorToken.length > 128) {
      return NextResponse.json({ error: "Invalid visitor token" }, { status: 400 });
    }

    // 2. Validate Target Piece is Published and Not Vaulted
    const pieceCheck = await restGetPiece(pieceId);
    if (!pieceCheck.exists) {
      return NextResponse.json({ error: "Piece not found" }, { status: 404 });
    }

    const pieceData = pieceCheck.data;
    if (pieceData.isVaulted === true) {
      return NextResponse.json({ error: "Comments are disabled on vaulted pieces" }, { status: 403 });
    }

    // Piece status must be published (supporting backward-compatible untagged published pieces)
    const isPublished = pieceData.status === "published" || (!pieceData.status && (pieceData.title || pieceData.content));
    if (!isPublished) {
      return NextResponse.json({ error: "Cannot comment on unpublished pieces" }, { status: 403 });
    }

    // 3. Persistent Rate Limiting (Survives Server Restarts)
    const visitorHash = hashToken(visitorToken);
    const rl = await restGetRateLimit(visitorHash);
    const nowMs = Date.now();

    if (rl.exists) {
      // Window: 60 seconds, max 3 comments per window
      if (nowMs - rl.lastCommentAtMs < 60000) {
        if (rl.countInWindow >= 3) {
          return NextResponse.json(
            { error: "Please wait a moment before posting another comment." },
            { status: 429 }
          );
        }
        await restSetRateLimit(visitorHash, rl.countInWindow + 1);
      } else {
        await restSetRateLimit(visitorHash, 1);
      }
    } else {
      await restSetRateLimit(visitorHash, 1);
    }

    // 4. Server-Authoritative Pseudonym Resolution
    const displayName = await restGetVisitorDisplayName(visitorHash);

    // 5. Authoritative Comment Insertion (Stored strictly as plain text)
    const created = await restCreateComment({
      pieceId,
      body: cleanBody,
      displayName, // Server-assigned only
      anonymousVisitorId: visitorHash, // Hashed token
    });

    return NextResponse.json({
      success: true,
      comment: {
        id: created.id,
        pieceId,
        body: cleanBody,
        displayName,
        status: "approved",
        createdAt: created.createdAt,
      },
    });
  } catch (err: any) {
    console.error("Comment submission error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/comments (Admin moderation only)
export async function PATCH(req: NextRequest) {
  const isAdmin = await verifyAdminFromHeader(req);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 403 });
  }

  try {
    const { commentId, status, action } = await req.json();
    if (!commentId || typeof commentId !== "string") {
      return NextResponse.json({ error: "commentId is required" }, { status: 400 });
    }

    const success = await restModerateComment(commentId, action, status);
    if (success) {
      return NextResponse.json({ success: true, message: action === "delete" ? "Comment deleted" : `Comment status updated to ${status}` });
    }

    return NextResponse.json({ error: "Failed to update comment" }, { status: 400 });
  } catch (err: any) {
    console.error("Comment moderation error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
