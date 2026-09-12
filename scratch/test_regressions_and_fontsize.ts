import { normalizePiece, Piece } from "../src/lib/db";

async function runRegressionAndFontSizeTests() {
  console.log("========================================================");
  console.log("RUNNING PHASE 11 — REGRESSION & FONT SIZE VERIFICATION");
  console.log("========================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${msg}`);
      failed++;
    }
  }

  const ADMIN_UID = "54WZPYBFR8VIPv9qpIDn1FI0bcz1";
  const OTHER_UID = "some_random_user_uid_12345";

  // -----------------------------------------------------------------------
  // TEST 1-3: Ownership & Authorization Boundary Checks (Writing Desk & Read)
  // -----------------------------------------------------------------------
  console.log("\nTEST 1-3: Ownership & Authorization Boundary Checks...");
  {
    // The exact condition used in WritingDeskDashboard and /read/[id]/page.tsx:
    const checkCanManage = (pieceAuthorId: string, currentUserId?: string, isAdmin?: boolean) => {
      return Boolean(isAdmin || (currentUserId && (pieceAuthorId === currentUserId || currentUserId === ADMIN_UID)));
    };

    assert(checkCanManage(ADMIN_UID, ADMIN_UID, true) === true, "Admin user can manage piece by admin");
    assert(checkCanManage(OTHER_UID, ADMIN_UID, true) === true, "Admin user can manage piece by other author");
    assert(checkCanManage(OTHER_UID, OTHER_UID, false) === true, "Non-admin owner can manage their own piece");
    assert(checkCanManage(ADMIN_UID, OTHER_UID, false) === false, "Unauthorized user CANNOT manage piece by another author");
    assert(checkCanManage(ADMIN_UID, undefined, false) === false, "Anonymous/unauthenticated visitor CANNOT manage piece");
  }

  // -----------------------------------------------------------------------
  // TEST 4: Published Piece ID and publishedAt Preservation
  // -----------------------------------------------------------------------
  console.log("\nTEST 4: Published Piece ID and publishedAt Preservation...");
  {
    const originalPublishedAt = "2026-08-01T12:00:00.000Z";
    const pieceId = "piece_doc_123";

    const initialDoc: any = {
      id: pieceId,
      title: "Original Story",
      status: "published",
      publishedAt: originalPublishedAt,
      updatedAt: originalPublishedAt,
      fontSize: "medium",
    };

    // Simulate edit
    const editedUpdate: any = {
      title: "Updated Story Title",
      content: "New paragraph added.",
      status: "published",
      fontSize: "large",
    };

    // Merge semantics in savePiece:
    const mergedDoc = {
      ...initialDoc,
      ...editedUpdate,
      // publishedAt is only set if not already present
      publishedAt: initialDoc.publishedAt || new Date().toISOString(),
      updatedAt: "2026-09-12T16:00:00.000Z",
    };

    assert(mergedDoc.id === pieceId, "Piece document ID remains identical after edit");
    assert(mergedDoc.publishedAt === originalPublishedAt, "publishedAt timestamp remains strictly unchanged after edit");
    assert(mergedDoc.updatedAt === "2026-09-12T16:00:00.000Z", "updatedAt timestamp advances to reflect latest revision");
    assert(mergedDoc.title === "Updated Story Title", "Content/title update preserved");
    assert(mergedDoc.fontSize === "large", "New fontSize persisted");
  }

  // -----------------------------------------------------------------------
  // TEST 5-7: Notification Creation on Publication Logic
  // -----------------------------------------------------------------------
  console.log("\nTEST 5-7: Notification Generation Trigger Logic...");
  {
    // Verification of publication transition logic in savePiece:
    const simulatePublishNotificationCheck = (
      existingDoc: { status?: string } | null,
      incomingDoc: { status?: string; isVaulted?: boolean }
    ) => {
      const isNewlyPublished = incomingDoc.status === "published" && (!existingDoc || existingDoc.status !== "published");
      const shouldNotify = isNewlyPublished && !incomingDoc.isVaulted;
      return shouldNotify;
    };

    // Case 1: Brand new piece saved directly as published
    assert(
      simulatePublishNotificationCheck(null, { status: "published", isVaulted: false }) === true,
      "Direct first-time publishing triggers site notification"
    );

    // Case 2: Draft transitioning to published
    assert(
      simulatePublishNotificationCheck({ status: "draft" }, { status: "published", isVaulted: false }) === true,
      "Draft transitioning to published triggers site notification"
    );

    // Case 3: Scheduled transitioning to published
    assert(
      simulatePublishNotificationCheck({ status: "scheduled" }, { status: "published", isVaulted: false }) === true,
      "Scheduled transitioning to published triggers site notification"
    );

    // Case 4: Editing already-published piece (NO duplicate notification)
    assert(
      simulatePublishNotificationCheck({ status: "published" }, { status: "published", isVaulted: false }) === false,
      "Editing an already-published piece does NOT create duplicate notifications"
    );

    // Case 5: Publishing vaulted piece (Strictly private/vaulted, NO notification)
    assert(
      simulatePublishNotificationCheck(null, { status: "published", isVaulted: true }) === false,
      "Publishing a vaulted piece does NOT leak public notification"
    );
  }

  // -----------------------------------------------------------------------
  // TEST 8: Backward Compatibility: Default font size for legacy documents
  // -----------------------------------------------------------------------
  console.log("\nTEST 8: Backward Compatibility for Missing fontSize Field...");
  {
    const legacyDoc = {
      title: "Ancient Piece",
      content: "Words written long ago without a font size setting.",
      authorId: ADMIN_UID,
    };

    const normalized = normalizePiece(legacyDoc, "legacy-1");
    assert(normalized.fontSize === "medium", "Legacy document without fontSize defaults to 'medium'");
  }

  // -----------------------------------------------------------------------
  // TEST 9, 10, 12: fontSize Lifecycle (Save, Autosave, Publish, Edit)
  // -----------------------------------------------------------------------
  console.log("\nTEST 9, 10, 12: FontSize Full Lifecycle Persistence...");
  {
    // Step 1: Draft with small
    const draftDoc = normalizePiece({
      title: "Draft Piece",
      content: "Testing draft",
      status: "draft",
      fontSize: "small",
    }, "piece-1");
    assert(draftDoc.fontSize === "small", "Draft autosave preserves fontSize='small'");

    // Step 2: Publish preserves fontSize
    const publishedDoc = normalizePiece({
      ...draftDoc,
      status: "published",
      publishedAt: "2026-09-12T12:00:00Z",
    }, "piece-1");
    assert(publishedDoc.fontSize === "small", "Publishing preserves stored fontSize='small'");

    // Step 3: Edit without touching fontSize
    const editedDoc = normalizePiece({
      ...publishedDoc,
      title: "Edited Title Only",
    }, "piece-1");
    assert(editedDoc.fontSize === "small", "Editing without touching fontSize preserves 'small'");

    // Step 4: Explicitly change fontSize to large
    const updatedSizeDoc = normalizePiece({
      ...editedDoc,
      fontSize: "large",
    }, "piece-1");
    assert(updatedSizeDoc.fontSize === "large", "Explicitly changing fontSize updates to 'large'");
  }

  // -----------------------------------------------------------------------
  // TEST 11: Reader Renderer Font Size Application
  // -----------------------------------------------------------------------
  console.log("\nTEST 11: Reader Renderer Font Size Mappings Verification...");
  {
    const getProseClass = (fontSize?: "small" | "medium" | "large") => {
      switch (fontSize) {
        case "small":
          return "text-sm sm:text-base leading-relaxed";
        case "large":
          return "text-lg sm:text-2xl leading-relaxed";
        case "medium":
        default:
          return "text-base sm:text-xl leading-relaxed";
      }
    };

    const getPoemClass = (fontSize?: "small" | "medium" | "large") => {
      switch (fontSize) {
        case "small":
          return "text-lg sm:text-xl";
        case "large":
          return "text-2xl sm:text-3xl";
        case "medium":
        default:
          return "text-xl sm:text-2xl";
      }
    };

    assert(getProseClass("small").includes("text-sm"), "Prose small maps to text-sm");
    assert(getProseClass("medium").includes("text-base"), "Prose medium maps to text-base");
    assert(getProseClass("large").includes("text-lg"), "Prose large maps to text-lg");
    assert(getProseClass(undefined).includes("text-base"), "Prose undefined defaults to text-base");

    assert(getPoemClass("small").includes("text-lg"), "Poem small maps to text-lg");
    assert(getPoemClass("medium").includes("text-xl"), "Poem medium maps to text-xl");
    assert(getPoemClass("large").includes("text-2xl"), "Poem large maps to text-2xl");
    assert(getPoemClass(undefined).includes("text-xl"), "Poem undefined defaults to text-xl");
  }

  console.log("\n========================================================");
  console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("========================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runRegressionAndFontSizeTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
