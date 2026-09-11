"use client";

export interface PublicComment {
  id: string;
  pieceId: string;
  body: string;
  displayName: string;
  createdAt: number;
  status: "approved" | "pending" | "hidden";
}

export function getVisitorToken(): string {
  if (typeof window === "undefined") return "";
  let token = localStorage.getItem("marrgin_visitor_token");
  if (!token) {
    // Generate secure random continuity token
    const arr = new Uint8Array(24);
    window.crypto.getRandomValues(arr);
    token = Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem("marrgin_visitor_token", token);
  }
  return token;
}

export async function fetchCommentsForPiece(pieceId: string, idToken?: string): Promise<PublicComment[]> {
  try {
    const headers: Record<string, string> = {};
    if (idToken) {
      headers["Authorization"] = `Bearer ${idToken}`;
    }
    const res = await fetch(`/api/comments?pieceId=${encodeURIComponent(pieceId)}${idToken ? "&includeAll=true" : ""}`, {
      headers,
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch comments: ${res.statusText}`);
    }
    const data = await res.json();
    return data.comments || [];
  } catch (err) {
    console.error("fetchCommentsForPiece error:", err);
    return [];
  }
}

export async function submitComment(pieceId: string, body: string): Promise<PublicComment> {
  const visitorToken = getVisitorToken();
  const res = await fetch("/api/comments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      pieceId,
      body,
      visitorToken,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to post comment");
  }

  return data.comment;
}

export async function moderateComment(
  commentId: string, 
  statusOrAction: { status?: "approved" | "hidden"; action?: "delete" }, 
  idToken: string
): Promise<void> {
  const res = await fetch("/api/comments", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      commentId,
      ...statusOrAction,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to moderate comment");
  }
}
