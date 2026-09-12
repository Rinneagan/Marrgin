import { initializeApp } from "firebase/app";
import { 
  initializeFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  addDoc, 
  collection, 
  deleteDoc,
  query,
  where,
  getDocs
} from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import fs from "fs";
import path from "path";

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

const SINGLE_ADMIN_UID = "54WZPYBFR8VIPv9qpIDn1FI0bcz1";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, { experimentalForceLongPolling: true });
const auth = getAuth(app);

const API_BASE = "http://localhost:3000/api/comments";

async function runTests() {
  console.log("================================================================");
  console.log("PHASE 7 SECURITY INVARIANTS & VERIFICATION SUITE");
  console.log("Target Project:", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
  console.log("Single Authoritative Admin UID:", SINGLE_ADMIN_UID);
  console.log("================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: any) {
    if (condition) {
      console.log(`✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`, detail || "");
      failed++;
    }
  }

  // -------------------------------------------------------------
  // TEST GROUP 1: LIVE FIRESTORE RULES BOUNDARIES (UNAUTHENTICATED)
  // -------------------------------------------------------------
  console.log("--- TEST GROUP 1: DIRECT FIRESTORE SECURITY RULES (UNAUTHENTICATED) ---");

  // 1. Direct write to /comments must fail
  try {
    await setDoc(doc(db, "comments", "unauthorized-comment-test"), {
      pieceId: "some-piece",
      body: "Direct client write bypass attempt",
      status: "approved"
    });
    assert(false, "Direct client write to /comments blocked");
  } catch (err: any) {
    assert(err.code === "permission-denied" || err.message?.includes("Missing or insufficient permissions"), 
      "Direct client write to /comments blocked at database level");
  }

  // 2. Direct read of private /anonymousVisitors must fail
  try {
    await getDoc(doc(db, "anonymousVisitors", "some-visitor-hash"));
    assert(false, "Private /anonymousVisitors access blocked");
  } catch (err: any) {
    assert(err.code === "permission-denied" || err.message?.includes("Missing or insufficient permissions"), 
      "Direct read of /anonymousVisitors blocked at database level");
  }

  // 3. Direct read of private /rateLimits must fail
  try {
    await getDoc(doc(db, "rateLimits", "some-rate-limit-hash"));
    assert(false, "Private /rateLimits access blocked");
  } catch (err: any) {
    assert(err.code === "permission-denied" || err.message?.includes("Missing or insufficient permissions"), 
      "Direct read of /rateLimits blocked at database level");
  }

  // 4. Direct read of private /adminConfig must fail
  try {
    await getDoc(doc(db, "adminConfig", "publisher"));
    assert(false, "Private /adminConfig access blocked");
  } catch (err: any) {
    assert(err.code === "permission-denied" || err.message?.includes("Missing or insufficient permissions"), 
      "Direct read of /adminConfig blocked at database level");
  }

  // 5. Direct write to /poems must fail
  try {
    await setDoc(doc(db, "poems", "unauthorized-poem-test"), {
      title: "Hacked Poem",
      status: "published"
    });
    assert(false, "Direct client piece creation blocked");
  } catch (err: any) {
    assert(err.code === "permission-denied" || err.message?.includes("Missing or insufficient permissions"), 
      "Direct client piece creation on /poems blocked at database level");
  }

  // 6. Direct read of private /editorialWorkspaces must fail
  try {
    await getDoc(doc(db, "editorialWorkspaces", "some-piece-id"));
    assert(false, "Private /editorialWorkspaces access blocked");
  } catch (err: any) {
    assert(err.code === "permission-denied" || err.message?.includes("Missing or insufficient permissions"), 
      "Direct read of /editorialWorkspaces blocked at database level");
  }

  // -------------------------------------------------------------
  // TEST GROUP 2: AUTHENTICATE SINGLE ADMIN UID
  // -------------------------------------------------------------
  console.log("\n--- TEST GROUP 2: SINGLE ADMIN UID VERIFICATION ---");
  let adminIdToken = "";
  try {
    const adminEmail = process.env.ADMIN_SERVER_EMAIL || "admin@marrgin.com";
    const adminPassword = process.env.ADMIN_SERVER_PASSWORD || "";
    
    // Try sign in with configured server email, or admin@marrgin.com fallback if email verification pending
    let user: any = null;
    try {
      const cred = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
      user = cred.user;
    } catch {
      const fallbackCred = await signInWithEmailAndPassword(auth, "admin@marrgin.com", adminPassword);
      user = fallbackCred.user;
    }

    assert(user.uid === SINGLE_ADMIN_UID, `Authenticated UID matches SINGLE_ADMIN_UID (${SINGLE_ADMIN_UID})`);
    adminIdToken = await user.getIdToken();
    assert(Boolean(adminIdToken), "Obtained valid Firebase Auth ID token for admin");
  } catch (err: any) {
    console.error("Admin authentication failed:", err);
    assert(false, "Admin sign-in with single UID");
  }

  // -------------------------------------------------------------
  // TEST GROUP 3: /api/comments SECURITY BOUNDARY ENFORCEMENT
  // -------------------------------------------------------------
  console.log("\n--- TEST GROUP 3: /api/comments SECURITY BOUNDARY ENFORCEMENT ---");

  // Get a published piece to test on
  let testPieceId = "ve78bHc1ozlRXYIZNS4a"; // known legacy published piece

  // 1. Rejects invalid pieceId
  const resBadPiece = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pieceId: "", body: "Valid comment text", visitorToken: "test-token-123456" }),
  });
  assert(resBadPiece.status === 400, "Rejects empty pieceId with 400");

  // 2. Rejects non-existent piece
  const resNonExistent = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pieceId: "completely-non-existent-piece-9999", body: "Valid comment text", visitorToken: "test-token-123456" }),
  });
  assert(resNonExistent.status === 404, "Rejects non-existent piece with 404");

  // 3. Rejects comment body < 3 characters
  const resShort = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pieceId: testPieceId, body: "hi", visitorToken: "test-token-123456" }),
  });
  assert(resShort.status === 400, "Rejects comment body under 3 chars with 400");

  // 4. Rejects comment body > 1000 characters
  const longBody = "a".repeat(1005);
  const resLong = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pieceId: testPieceId, body: longBody, visitorToken: "test-token-123456" }),
  });
  assert(resLong.status === 400, "Rejects comment body over 1000 chars with 400");

  // 5. Rejects invalid visitorToken (too short)
  const resBadToken = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pieceId: testPieceId, body: "Valid comment text", visitorToken: "abc" }),
  });
  assert(resBadToken.status === 400, "Rejects invalid visitor token (<8 chars) with 400");

  // 6. Valid submission ignores client forgery (displayName, status, createdAt)
  const uniqueVisitorToken = "visitor-token-" + Date.now() + "-" + Math.random().toString(36).substring(2, 10);
  const resValid = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pieceId: testPieceId,
      body: "A profound literary observation on the quiet cadence of twilight.",
      visitorToken: uniqueVisitorToken,
      // Attempt client forgery:
      displayName: "FORGED_NAME",
      status: "super_admin_approved",
      createdAt: 0
    }),
  });
  const validJson = await resValid.json();
  assert(resValid.status === 200 && validJson.success === true, "Valid comment successfully created through API");
  assert(validJson.comment?.displayName !== "FORGED_NAME", "Client forged displayName is strictly ignored");
  assert(validJson.comment?.status === "approved", "Server-authoritative status is set to approved");
  assert(typeof validJson.comment?.displayName === "string" && validJson.comment?.displayName.length > 3, 
    `Assigned literary pseudonym: "${validJson.comment?.displayName}"`);

  const createdCommentId = validJson.comment?.id;

  // 7. Same visitor token receives the exact same pseudonym on second comment
  const resSecond = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pieceId: testPieceId,
      body: "A second observation from the same thoughtful reader.",
      visitorToken: uniqueVisitorToken,
    }),
  });
  const secondJson = await resSecond.json();
  assert(resSecond.status === 200, "Second comment from same visitor succeeds");
  assert(secondJson.comment?.displayName === validJson.comment?.displayName, 
    `Pseudonym persistence verified: "${secondJson.comment?.displayName}" === "${validJson.comment?.displayName}"`);

  // -------------------------------------------------------------
  // TEST GROUP 4: PERSISTENT RATE LIMITING (FIRESTORE-BACKED)
  // -------------------------------------------------------------
  console.log("\n--- TEST GROUP 4: PERSISTENT RATE LIMITING ---");

  // Third comment in rapid succession
  await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pieceId: testPieceId,
      body: "A third rapid observation from the reader.",
      visitorToken: uniqueVisitorToken,
    }),
  });

  // Fourth comment should exceed the 3 comments / minute window
  const resRateLimited = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pieceId: testPieceId,
      body: "A fourth comment that triggers abuse prevention.",
      visitorToken: uniqueVisitorToken,
    }),
  });
  assert(resRateLimited.status === 429, "Persistent rate limiting triggers 429 on abuse");

  // -------------------------------------------------------------
  // TEST GROUP 5: PLAIN TEXT ENFORCEMENT
  // -------------------------------------------------------------
  console.log("\n--- TEST GROUP 5: PLAIN TEXT ENFORCEMENT ---");
  const htmlVisitorToken = "visitor-token-html-" + Date.now();
  const scriptAttempt = "<script>alert('xss')</script><b>Bold observation</b> & test \"quote\"";
  const resHtml = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pieceId: testPieceId,
      body: scriptAttempt,
      visitorToken: htmlVisitorToken,
    }),
  });
  const htmlJson = await resHtml.json();
  assert(resHtml.status === 200, "HTML input stored as plain text");
  assert(htmlJson.comment?.body === scriptAttempt, "Stored raw string without HTML interpretation");

  // -------------------------------------------------------------
  // TEST GROUP 6: ADMIN MODERATION ENDPOINT
  // -------------------------------------------------------------
  console.log("\n--- TEST GROUP 6: ADMIN MODERATION ENDPOINT ---");

  // 1. Unauthorized PATCH must be rejected
  const resUnauthPatch = await fetch(API_BASE, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      commentId: createdCommentId,
      status: "hidden"
    }),
  });
  assert(resUnauthPatch.status === 403, "Unauthenticated PATCH rejected with 403");

  // 2. Authorized Admin PATCH (Hide)
  const resAdminHide = await fetch(API_BASE, {
    method: "PATCH",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${adminIdToken}`
    },
    body: JSON.stringify({
      commentId: createdCommentId,
      status: "hidden"
    }),
  });
  const hideJson = await resAdminHide.json();
  assert(resAdminHide.status === 200 && hideJson.success === true, "Admin successfully hid comment");

  // 3. Public GET only returns approved comments (hidden comment must not be in public list)
  const resPublicGet = await fetch(`${API_BASE}?pieceId=${testPieceId}`);
  const publicGetJson = await resPublicGet.json();
  const foundHiddenInPublic = publicGetJson.comments?.some((c: any) => c.id === createdCommentId);
  assert(!foundHiddenInPublic, "Hidden comment is excluded from public reader stream");

  // 4. Admin GET includes hidden comments for moderation
  const resAdminGet = await fetch(`${API_BASE}?pieceId=${testPieceId}&includeAll=true`, {
    headers: { "Authorization": `Bearer ${adminIdToken}` }
  });
  const adminGetJson = await resAdminGet.json();
  const foundHiddenInAdmin = adminGetJson.comments?.some((c: any) => c.id === createdCommentId && c.status === "hidden");
  assert(foundHiddenInAdmin, "Admin can retrieve all comments including hidden for moderation");

  // 5. Admin Delete comment
  const resAdminDelete = await fetch(API_BASE, {
    method: "PATCH",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${adminIdToken}`
    },
    body: JSON.stringify({
      commentId: createdCommentId,
      action: "delete"
    }),
  });
  assert(resAdminDelete.status === 200, "Admin can permanently delete comment");

  // Clean up HTML comment as well
  if (htmlJson.comment?.id) {
    await fetch(API_BASE, {
      method: "PATCH",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${adminIdToken}`
      },
      body: JSON.stringify({
        commentId: htmlJson.comment.id,
        action: "delete"
      }),
    });
  }

  console.log("\n================================================================");
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED.`);
  console.log("================================================================");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
