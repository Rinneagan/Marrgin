import { CURATED_PSEUDONYMS } from "@/lib/seedCommentNames";

const SINGLE_ADMIN_UID = "54WZPYBFR8VIPv9qpIDn1FI0bcz1";
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "friday-pages-web";
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCIm6bpU3B6wFYKgQdA1L86Pi9l18ObJEU";

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getAdminIdToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60000) {
    return cachedToken.token;
  }

  const email = process.env.ADMIN_SERVER_EMAIL;
  if (!email) {
    throw new Error("Missing ADMIN_SERVER_EMAIL in environment variables");
  }

  const password = process.env.ADMIN_SERVER_PASSWORD;
  if (!password) {
    throw new Error("Missing ADMIN_SERVER_PASSWORD in environment variables");
  }

  // Support seamless transition: try configured ADMIN_SERVER_EMAIL first,
  // fallback to initial admin account if email verification is still pending in inbox
  const emailsToTry = [email];
  if (email !== "admin@marrgin.com") {
    emailsToTry.push("admin@marrgin.com");
  }

  let data: any = null;
  let lastError: any = null;

  for (const currentEmail of emailsToTry) {
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: currentEmail, password, returnSecureToken: true }),
    });

    if (res.ok) {
      data = await res.json();
      break;
    } else {
      lastError = await res.json();
    }
  }

  if (!data) {
    throw new Error(`Admin Auth failed: ${JSON.stringify(lastError)}`);
  }

  if (data.localId !== SINGLE_ADMIN_UID) {
    throw new Error(`Admin UID mismatch: expected ${SINGLE_ADMIN_UID}, got ${data.localId}`);
  }

  const expiresInMs = (parseInt(data.expiresIn, 10) || 3600) * 1000;
  cachedToken = {
    token: data.idToken,
    expiresAt: now + expiresInMs,
  };

  return data.idToken;
}

// Convert Firestore REST document to JS object
function parseFirestoreFields(fields: any): any {
  if (!fields) return {};
  const obj: any = {};
  for (const [key, valueObj] of Object.entries<any>(fields)) {
    if ("stringValue" in valueObj) obj[key] = valueObj.stringValue;
    else if ("integerValue" in valueObj) obj[key] = parseInt(valueObj.integerValue, 10);
    else if ("booleanValue" in valueObj) obj[key] = valueObj.booleanValue;
    else if ("timestampValue" in valueObj) obj[key] = new Date(valueObj.timestampValue).getTime();
    else if ("nullValue" in valueObj) obj[key] = null;
  }
  return obj;
}

const FS_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

export async function restGetPiece(pieceId: string): Promise<{ exists: boolean; data?: any }> {
  const token = await getAdminIdToken();
  const url = `${FS_BASE}/poems/${pieceId}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 404) {
    return { exists: false };
  }
  if (!res.ok) {
    return { exists: false };
  }

  const json = await res.json();
  return { exists: true, data: parseFirestoreFields(json.fields) };
}

export async function restGetRateLimit(visitorHash: string): Promise<{ exists: boolean; countInWindow: number; lastCommentAtMs: number }> {
  const token = await getAdminIdToken();
  const url = `${FS_BASE}/rateLimits/${visitorHash}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    return { exists: false, countInWindow: 0, lastCommentAtMs: 0 };
  }

  const json = await res.json();
  const parsed = parseFirestoreFields(json.fields);
  return {
    exists: true,
    countInWindow: parsed.countInWindow || 0,
    lastCommentAtMs: parsed.lastCommentAt || 0,
  };
}

export async function restSetRateLimit(visitorHash: string, countInWindow: number) {
  const token = await getAdminIdToken();
  const url = `${FS_BASE}/rateLimits/${visitorHash}`;
  await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      fields: {
        countInWindow: { integerValue: countInWindow.toString() },
        lastCommentAt: { timestampValue: new Date().toISOString() },
      },
    }),
  });
}

export async function restGetVisitorDisplayName(visitorHash: string): Promise<string> {
  const token = await getAdminIdToken();
  const url = `${FS_BASE}/anonymousVisitors/${visitorHash}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.ok) {
    const json = await res.json();
    const parsed = parseFirestoreFields(json.fields);
    if (parsed.displayName) return parsed.displayName;
  }

  // Resolve new from pool
  const poolIndex = Math.abs(parseInt(visitorHash.slice(0, 8), 16)) % CURATED_PSEUDONYMS.length;
  const displayName = CURATED_PSEUDONYMS[poolIndex];

  await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      fields: {
        displayName: { stringValue: displayName },
        createdAt: { timestampValue: new Date().toISOString() },
      },
    }),
  });

  return displayName;
}

export async function restCreateComment(comment: {
  pieceId: string;
  body: string;
  displayName: string;
  anonymousVisitorId: string;
}): Promise<{ id: string; createdAt: number }> {
  const token = await getAdminIdToken();
  const url = `${FS_BASE}/comments`;
  const now = new Date();

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      fields: {
        pieceId: { stringValue: comment.pieceId },
        body: { stringValue: comment.body },
        displayName: { stringValue: comment.displayName },
        anonymousVisitorId: { stringValue: comment.anonymousVisitorId },
        status: { stringValue: "approved" },
        createdAt: { timestampValue: now.toISOString() },
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Failed to create comment: ${JSON.stringify(err)}`);
  }

  const json = await res.json();
  const nameParts = json.name.split("/");
  const docId = nameParts[nameParts.length - 1];

  return { id: docId, createdAt: now.getTime() };
}

export async function restGetComments(pieceId: string, isAdmin: boolean): Promise<any[]> {
  const token = await getAdminIdToken();
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`;

  const queryPayload: any = {
    structuredQuery: {
      from: [{ collectionId: "comments" }],
      where: {
        fieldFilter: {
          field: { fieldPath: "pieceId" },
          op: "EQUAL",
          value: { stringValue: pieceId },
        },
      },
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(queryPayload),
  });

  if (!res.ok) {
    return [];
  }

  const results = await res.json();
  const list: any[] = [];

  for (const item of results) {
    if (!item.document) continue;
    const parsed = parseFirestoreFields(item.document.fields);
    const nameParts = item.document.name.split("/");
    const id = nameParts[nameParts.length - 1];

    if (!isAdmin && parsed.status !== "approved") {
      continue;
    }

    list.push({
      id,
      pieceId: parsed.pieceId,
      body: parsed.body,
      displayName: parsed.displayName,
      status: parsed.status || "approved",
      createdAt: parsed.createdAt || Date.now(),
    });
  }

  list.sort((a, b) => a.createdAt - b.createdAt);
  return list;
}

export async function restModerateComment(commentId: string, action?: string, status?: string) {
  const token = await getAdminIdToken();
  const url = `${FS_BASE}/comments/${commentId}`;

  if (action === "delete") {
    const res = await fetch(url, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  }

  if (status) {
    const res = await fetch(`${url}?updateMask.fieldPaths=status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        fields: {
          status: { stringValue: status },
        },
      }),
    });
    return res.ok;
  }

  return false;
}

export async function restProcessScheduledPublications(): Promise<{
  processed: number;
  published: Array<{ id: string; title: string; scheduledAt: string }>;
}> {
  const token = await getAdminIdToken();
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`;

  const queryPayload: any = {
    structuredQuery: {
      from: [{ collectionId: "poems" }],
      where: {
        fieldFilter: {
          field: { fieldPath: "status" },
          op: "EQUAL",
          value: { stringValue: "scheduled" },
        },
      },
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(queryPayload),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Failed to query scheduled pieces: ${JSON.stringify(err)}`);
  }

  const results = await res.json();
  const nowMs = Date.now();
  const published: Array<{ id: string; title: string; scheduledAt: string }> = [];

  for (const item of results) {
    if (!item.document) continue;
    const parsed = parseFirestoreFields(item.document.fields);
    const nameParts = item.document.name.split("/");
    const id = nameParts[nameParts.length - 1];

    // Security invariant: must belong to the single admin UID
    if (parsed.authorId && parsed.authorId !== SINGLE_ADMIN_UID) {
      console.warn(`Skipping scheduled piece ${id}: authorId does not match admin UID`);
      continue;
    }

    const scheduledAtRaw = parsed.scheduledAt;
    if (!scheduledAtRaw) continue;

    const scheduledAtMs = typeof scheduledAtRaw === "number" 
      ? scheduledAtRaw 
      : new Date(scheduledAtRaw).getTime();

    // Only transition if the scheduled time has arrived
    if (scheduledAtMs <= nowMs) {
      const scheduledIso = new Date(scheduledAtMs).toISOString();
      const patchUrl = `${FS_BASE}/poems/${id}?updateMask.fieldPaths=status&updateMask.fieldPaths=publishedAt&updateMask.fieldPaths=updatedAt`;
      
      const patchRes = await fetch(patchUrl, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fields: {
            status: { stringValue: "published" },
            publishedAt: { timestampValue: scheduledIso },
            updatedAt: { timestampValue: new Date().toISOString() },
          },
        }),
      });

      if (patchRes.ok) {
        published.push({
          id,
          title: parsed.title || "Untitled",
          scheduledAt: scheduledIso,
        });
      }
    }
  }

  return {
    processed: results.length,
    published,
  };
}
