"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  getDeskPieces, 
  unpublishPiece, 
  archivePiece, 
  deletePieceWithWorkspace,
  savePiece, 
  getPoemById, 
  generatePieceId, 
  assertPieceDraftExists,
  Piece, 
  EditorialMode 
} from "@/lib/db";
import { 
  parseContentToBlocks, 
  serializeBlocksToContent, 
  StudioBlock 
} from "@/lib/studioBlocks";
import { 
  ArrowLeft, 
  Settings, 
  Eye, 
  Send, 
  Check, 
  Clock, 
  AlertCircle,
  Heading2, 
  Heading3, 
  Bold, 
  Italic, 
  Quote, 
  List, 
  Minus, 
  Link as LinkIcon,
  Shield,
  RotateCw,
  RotateCcw,
  Maximize2,
  Minimize2,
  Share2,
  Feather
} from "lucide-react";
import WritingDeskDashboard from "@/components/WritingDeskDashboard";
import PieceSettingsDrawer from "@/components/PieceSettingsDrawer";
import PiecePreviewModal from "@/components/PiecePreviewModal";
import PublishConfirmationModal from "@/components/PublishConfirmationModal";
import EditorialWorkspaceDrawer from "@/components/EditorialWorkspaceDrawer";
import AdminAccountModal from "@/components/AdminAccountModal";
import { BlockCanvas } from "@/components/studio/BlockCanvas";
import { SocialPreviewModal } from "@/components/studio/SocialPreviewModal";

const SINGLE_ADMIN_UID = "54WZPYBFR8VIPv9qpIDn1FI0bcz1";

function WritingDeskContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPieceIdFromUrl = searchParams.get("id");

  // Invariant: ONE ADMIN UID -> ALL EDITORIAL AUTHORITY
  const isAdmin = user?.uid === SINGLE_ADMIN_UID;
  const userDisplayName = user?.displayName || (user?.email ? user.email.split("@")[0] : "Author");

  // Admin Account Modal State
  const [isAdminAccountModalOpen, setIsAdminAccountModalOpen] = useState(false);

  // Dashboard Data State
  const [deskData, setDeskData] = useState<{ drafts: Piece[]; published: Piece[]; archived: Piece[]; scheduled: Piece[] }>({
    drafts: [],
    published: [],
    archived: [],
    scheduled: [],
  });
  const [isDeskLoading, setIsDeskLoading] = useState(true);

  // Active Piece Editor State
  const [activePieceId, setActivePieceId] = useState<string | null>(currentPieceIdFromUrl);
  const [mode, setMode] = useState<EditorialMode>("poetry");
  const [status, setStatus] = useState<"draft" | "published" | "archived" | "scheduled">("draft");
  const [scheduledAt, setScheduledAt] = useState<string | null>(null);
  const [publishedAt, setPublishedAt] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [content, setContent] = useState("");
  const [blocks, setBlocks] = useState<StudioBlock[]>([]);
  const [location, setLocation] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [coverImagePrompt, setCoverImagePrompt] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);

  // Zen Mode (Distraction-free)
  const [isZenMode, setIsZenMode] = useState(false);

  // Mode Specific Fields
  const [epigraph, setEpigraph] = useState("");
  const [dedication, setDedication] = useState("");
  const [footnote, setFootnote] = useState("");
  const [afterword, setAfterword] = useState("");
  const [isVaulted, setIsVaulted] = useState(false);
  const [passphrase, setPassphrase] = useState("");
  const [centralQuestion, setCentralQuestion] = useState("");
  const [methodology, setMethodology] = useState("");
  const [limitations, setLimitations] = useState("");
  const [observationDate, setObservationDate] = useState(new Date().toISOString().split("T")[0]);
  const [datasetName, setDatasetName] = useState("");
  const [dataSource, setDataSource] = useState("");
  const [dataUnits, setDataUnits] = useState("");
  const [dataTimeframe, setDataTimeframe] = useState("");

  // UI Modals & Drawers
  const [isSettingsDrawerOpen, setIsSettingsDrawerOpen] = useState(false);
  const [isWorkspaceDrawerOpen, setIsWorkspaceDrawerOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isSocialPreviewOpen, setIsSocialPreviewOpen] = useState(false);

  // Autosave & Persistence State
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved" | "error">("saved");
  const [lastSavedTime, setLastSavedTime] = useState<string>("");
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasPendingChangesRef = useRef(false);

  // Auth gate
  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push("/home");
    }
  }, [user, loading, isAdmin, router]);

  // Load Dashboard Pieces
  const refreshDeskData = useCallback(async () => {
    if (!user) return;
    setIsDeskLoading(true);
    try {
      const data = await getDeskPieces(user.uid, Boolean(isAdmin));
      setDeskData({
        drafts: data.drafts || [],
        published: data.published || [],
        archived: data.archived || [],
        scheduled: data.scheduled || [],
      });
    } catch (err) {
      console.error("Failed to load desk data:", err);
    } finally {
      setIsDeskLoading(false);
    }
  }, [user, isAdmin]);

  useEffect(() => {
    if (user && isAdmin) {
      refreshDeskData();
    }
  }, [user, isAdmin, refreshDeskData]);

  // Keep activePieceId in sync with URL
  useEffect(() => {
    if (currentPieceIdFromUrl && currentPieceIdFromUrl !== activePieceId) {
      setActivePieceId(currentPieceIdFromUrl);
    } else if (!currentPieceIdFromUrl && activePieceId) {
      setActivePieceId(null);
    }
  }, [currentPieceIdFromUrl, activePieceId]);

  // Load Piece Data when activePieceId changes
  useEffect(() => {
    if (!activePieceId) return;

    let isMounted = true;
    getPoemById(activePieceId, true).then((piece) => {
      if (!isMounted || !piece) return;
      const pieceMode = piece.mode || "poetry";
      const rawContent = piece.content || "";

      setTitle(piece.title || "");
      setSubtitle(piece.subtitle || "");
      setContent(rawContent);
      setBlocks(parseContentToBlocks(rawContent, pieceMode));
      setMode(pieceMode);
      setStatus(piece.status || "draft");
      setScheduledAt(piece.scheduledAt || null);
      setPublishedAt(piece.publishedAt || null);
      setLocation(piece.location || "");
      setTagsInput(piece.tags?.join(", ") || "");
      setCoverImage(piece.coverImage || "");
      setCoverImagePrompt(piece.coverImagePrompt || "");
      setIsFeatured(Boolean((piece as any).isFeatured));
      setEpigraph(piece.epigraph || "");
      setDedication(piece.dedication || "");
      setFootnote(piece.footnote || "");
      setAfterword(piece.afterword || "");
      setIsVaulted(Boolean(piece.isVaulted));
      setPassphrase(piece.passphrase || "");
      setCentralQuestion(piece.centralQuestion || "");
      setMethodology(piece.methodology || "");
      setLimitations(piece.limitations || "");
      setObservationDate(piece.dateObserved || new Date().toISOString().split("T")[0]);
      setDatasetName(piece.datasetName || "");
      setDataSource(piece.dataSource || "");
      setDataUnits(piece.dataUnits || "");
      setDataTimeframe(piece.dataTimeframe || "");
      setSaveStatus("saved");
      hasPendingChangesRef.current = false;
    });

    return () => {
      isMounted = false;
    };
  }, [activePieceId]);

  // Construct current Piece object snapshot
  const getCurrentPieceSnapshot = useCallback((): Partial<Piece> => {
    const tags = tagsInput.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
    return {
      id: activePieceId || undefined,
      title,
      subtitle,
      content,
      mode,
      status,
      scheduledAt: scheduledAt || null,
      publishedAt: publishedAt || null,
      location,
      tags,
      coverImage,
      coverImagePrompt: coverImagePrompt.trim() || undefined,
      isVaulted,
      passphrase: isVaulted ? passphrase.trim() : "",
      epigraph,
      dedication,
      footnote,
      afterword,
      centralQuestion,
      methodology,
      limitations,
      dateObserved: observationDate,
      datasetName,
      dataSource,
      dataUnits,
      dataTimeframe,
      authorId: user?.uid || "anonymous",
      authorName: userDisplayName,
      ...(isFeatured ? { isFeatured: true } : { isFeatured: false }),
    } as any;
  }, [
    activePieceId, title, subtitle, content, mode, status, scheduledAt, publishedAt,
    location, tagsInput, coverImage, coverImagePrompt, isVaulted, passphrase, epigraph, dedication,
    footnote, afterword, centralQuestion, methodology, limitations, observationDate,
    datasetName, dataSource, dataUnits, dataTimeframe, user, userDisplayName, isFeatured
  ]);

  // Core Persistent Save Implementation
  const performSave = useCallback(async (
    customStatus?: "draft" | "published" | "archived" | "scheduled",
    customScheduledAt?: string
  ) => {
    if (!activePieceId || !user) return;
    setSaveStatus("saving");
    try {
      const snapshot = getCurrentPieceSnapshot();
      if (customStatus) {
        snapshot.status = customStatus;
      }
      if (customScheduledAt !== undefined) {
        snapshot.scheduledAt = customScheduledAt;
      }
      await savePiece(activePieceId, snapshot);
      hasPendingChangesRef.current = false;
      setSaveStatus("saved");
      const now = new Date();
      setLastSavedTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      if (customStatus) {
        setStatus(customStatus);
      }
      if (customScheduledAt !== undefined) {
        setScheduledAt(customScheduledAt);
      }
    } catch (err) {
      console.error("Autosave failed:", err);
      setSaveStatus("error");
    }
  }, [activePieceId, user, getCurrentPieceSnapshot]);

  // Debounced Autosave Trigger (1500ms)
  const triggerAutosave = useCallback(() => {
    hasPendingChangesRef.current = true;
    setSaveStatus("unsaved");
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }
    autosaveTimeoutRef.current = setTimeout(() => {
      performSave();
    }, 1500);
  }, [performSave]);

  // Handle Block Changes from Studio Canvas
  const handleBlocksChange = (newBlocks: StudioBlock[]) => {
    setBlocks(newBlocks);
    const serialized = serializeBlocksToContent(newBlocks, mode);
    setContent(serialized);
    triggerAutosave();
  };

  // Warn on page unload if changes are pending
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasPendingChangesRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + S: Force immediate save
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s" && !e.shiftKey) {
        e.preventDefault();
        if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);
        performSave();
        return;
      }

      // Cmd/Ctrl + P: Toggle Reader Preview
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "p" && !e.shiftKey) {
        e.preventDefault();
        setIsPreviewModalOpen((prev) => !prev);
        return;
      }

      // Cmd/Ctrl + Shift + F: Toggle Zen Mode
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setIsZenMode((prev) => !prev);
        return;
      }

      // Escape: Exit Zen mode if active
      if (e.key === "Escape" && isZenMode) {
        setIsZenMode(false);
        return;
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isZenMode, performSave]);

  // Escape Path: Navigating back to Writing Desk safely
  const handleReturnToDesk = async () => {
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }
    if (hasPendingChangesRef.current) {
      setSaveStatus("saving");
      await performSave();
    }
    setActivePieceId(null);
    setIsZenMode(false);
    window.history.pushState(null, "", "/write");
    refreshDeskData();
  };

  // Open a piece from the dashboard
  const handleOpenPiece = (pieceId: string) => {
    setActivePieceId(pieceId);
    window.history.pushState(null, "", `/write?id=${pieceId}`);
  };

  // Delete draft with workspace cascade
  const handleDeleteDraft = async (pieceId: string) => {
    if (!confirm("Permanently delete this draft and any associated private workspace materials? This cannot be undone.")) {
      return;
    }
    try {
      await deletePieceWithWorkspace(pieceId);
      if (activePieceId === pieceId) {
        setActivePieceId(null);
        window.history.pushState(null, "", "/write");
      }
      refreshDeskData();
    } catch (err) {
      console.error("Failed to delete draft:", err);
      alert("Error deleting draft.");
    }
  };

  // Unpublish a piece back to draft
  const handleUnpublishPiece = async (pieceId: string) => {
    if (!confirm("Unpublish this piece? It will be returned to your private drafts and will no longer be visible to public readers.")) {
      return;
    }
    try {
      await unpublishPiece(pieceId);
      if (activePieceId === pieceId) {
        setStatus("draft");
      }
      refreshDeskData();
    } catch (err) {
      console.error("Failed to unpublish piece:", err);
      alert("Error unpublishing piece.");
    }
  };

  // Archive a piece
  const handleArchivePiece = async (pieceId: string) => {
    try {
      await archivePiece(pieceId);
      if (activePieceId === pieceId) {
        setStatus("archived");
      }
      refreshDeskData();
    } catch (err) {
      console.error("Failed to archive piece:", err);
      alert("Error archiving piece.");
    }
  };

  // Publishing Confirmation Workflow
  const handleConfirmPublish = async (options?: { scheduledAt?: string }) => {
    if (!title.trim() || !content.trim()) {
      alert("Please provide both a title and content before publishing.");
      return;
    }
    if (isVaulted && !passphrase.trim()) {
      alert("Please provide a passphrase for the vaulted piece.");
      return;
    }

    if (options?.scheduledAt) {
      await performSave("scheduled", options.scheduledAt);
      setIsPublishModalOpen(false);
      refreshDeskData();
      alert(`Piece scheduled for publication on ${new Date(options.scheduledAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}.`);
    } else {
      await performSave("published");
      setIsPublishModalOpen(false);
      refreshDeskData();
      alert("Piece published successfully across Marrgin.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-serif text-neutral-400">
        Loading Writer Desk...
      </div>
    );
  }

  if (!isAdmin) return null;

  // -------------------------------------------------------------------------
  // VIEW 1: THE WRITING DESK (DASHBOARD)
  // -------------------------------------------------------------------------
  if (!activePieceId) {
    const previewSnapshot: Piece = {
      id: "preview",
      title: title || "Untitled Piece",
      subtitle,
      content,
      mode,
      status: "draft",
      authorId: user?.uid || "anonymous",
      authorName: userDisplayName,
      createdAt: new Date(),
      likesCount: 0,
      readsCount: 0,
      totalReadTime: 0,
      completionsCount: 0,
      location,
      tags: tagsInput.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean),
      coverImage,
      epigraph,
      dedication,
      footnote,
      afterword,
      centralQuestion,
      methodology,
      limitations,
    };

    return (
      <>
        <WritingDeskDashboard
          drafts={deskData.drafts}
          published={deskData.published}
          archived={deskData.archived}
          scheduled={deskData.scheduled}
          isLoading={isDeskLoading}
          onOpenPiece={handleOpenPiece}
          onDeleteDraft={handleDeleteDraft}
          onUnpublishPiece={handleUnpublishPiece}
          onArchivePiece={handleArchivePiece}
          onPreviewPiece={(piece) => {
            setTitle(piece.title || "");
            setSubtitle(piece.subtitle || "");
            setContent(piece.content || "");
            setMode(piece.mode || "poetry");
            setLocation(piece.location || "");
            setEpigraph(piece.epigraph || "");
            setDedication(piece.dedication || "");
            setFootnote(piece.footnote || "");
            setAfterword(piece.afterword || "");
            setCentralQuestion(piece.centralQuestion || "");
            setMethodology(piece.methodology || "");
            setLimitations(piece.limitations || "");
            setIsPreviewModalOpen(true);
          }}
          onOpenAdminAccount={() => setIsAdminAccountModalOpen(true)}
          userDisplayName={userDisplayName}
        />
        {user && (
          <AdminAccountModal
            isOpen={isAdminAccountModalOpen}
            onClose={() => setIsAdminAccountModalOpen(false)}
            user={user}
          />
        )}
        <PiecePreviewModal
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          piece={previewSnapshot}
        />
      </>
    );
  }

  // -------------------------------------------------------------------------
  // VIEW 2: MARRGIN AUTHORING STUDIO
  // -------------------------------------------------------------------------
  const pieceSnapshot = getCurrentPieceSnapshot() as Piece;

  return (
    <div className={`min-h-screen flex flex-col bg-background text-neutral-900 dark:text-neutral-100 transition-colors ${
      isZenMode ? "fixed inset-0 z-50 overflow-y-auto bg-white dark:bg-neutral-950" : ""
    }`}>
      {/* Top Action Bar (Hidden or floating in Zen Mode) */}
      {!isZenMode ? (
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-gray-200/80 dark:border-gray-800/80 px-6 sm:px-10 py-3 flex items-center justify-between">
          {/* Left: Escape Path back to Desk */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleReturnToDesk}
              className="inline-flex items-center gap-2 text-xs font-sans text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Writing Desk</span>
            </button>

            {/* Status indicator badge */}
            <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
              status === "published"
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                : status === "scheduled"
                ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border-neutral-200 dark:border-neutral-700"
            }`}>
              {status}
            </span>
          </div>

          {/* Center: Save State Indicator */}
          <div className="flex items-center gap-1.5 text-xs font-sans text-neutral-400">
            {saveStatus === "saving" && (
              <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400">
                <RotateCw size={11} className="animate-spin" /> Saving...
              </span>
            )}
            {saveStatus === "saved" && (
              <button
                type="button"
                onClick={() => performSave()}
                title="Click to force save (Ctrl+S)"
                className="flex items-center gap-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
              >
                <Check size={12} className="text-emerald-500" />
                <span>{lastSavedTime ? `Saved at ${lastSavedTime}` : "Saved just now"}</span>
              </button>
            )}
            {saveStatus === "unsaved" && (
              <span className="flex items-center gap-1 text-neutral-400">
                <Clock size={11} /> Unsaved changes...
              </span>
            )}
            {saveStatus === "error" && (
              <button
                onClick={() => performSave()}
                className="flex items-center gap-1 text-rose-500 hover:underline"
              >
                <AlertCircle size={11} /> Failed to save · Click to retry
              </button>
            )}
          </div>

          {/* Right: Actions (Zen, Social Preview, Settings, Preview, Publish) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsZenMode(true)}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-full border border-gray-200 dark:border-gray-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 text-xs font-sans font-medium transition-colors flex items-center gap-1"
              title="Zen Mode (Ctrl+Shift+F)"
            >
              <Maximize2 size={13} />
              <span className="hidden sm:inline">Zen</span>
            </button>

            <button
              onClick={() => setIsSocialPreviewOpen(true)}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-full border border-gray-200 dark:border-gray-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 text-xs font-sans font-medium transition-colors flex items-center gap-1"
              title="Preview Social & OpenGraph Cards"
            >
              <Share2 size={13} />
              <span className="hidden sm:inline">Social</span>
            </button>

            {mode === "investigation" && (
              <button
                onClick={() => setIsWorkspaceDrawerOpen(true)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-400 text-xs font-sans font-medium hover:bg-amber-500/20 transition-colors"
              >
                <Shield size={13} />
                <span>Workspace</span>
              </button>
            )}

            <button
              onClick={() => setIsSettingsDrawerOpen(true)}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-full border border-gray-200 dark:border-gray-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 text-xs font-sans font-medium transition-colors flex items-center gap-1.5"
              title="Piece Settings"
            >
              <Settings size={14} />
              <span className="hidden sm:inline">Settings</span>
            </button>

            <button
              onClick={() => setIsPreviewModalOpen(true)}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-full border border-gray-200 dark:border-gray-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 text-xs font-sans font-medium transition-colors flex items-center gap-1.5"
              title="Preview reading layout (Ctrl+P)"
            >
              <Eye size={14} />
              <span className="hidden sm:inline">Preview</span>
            </button>

            {status === "published" && activePieceId && (
              <button
                type="button"
                onClick={() => handleUnpublishPiece(activePieceId)}
                className="px-3 py-1.5 rounded-full border border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 text-xs font-sans font-medium transition-colors flex items-center gap-1.5"
                title="Unpublish this piece back to draft"
              >
                <RotateCcw size={12} />
                <span>Unpublish</span>
              </button>
            )}

            <button
              onClick={() => {
                if (status === "published") {
                  performSave("published");
                } else {
                  setIsPublishModalOpen(true);
                }
              }}
              className="px-4 py-1.5 rounded-full bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-xs font-sans font-medium transition-colors flex items-center gap-1.5 shadow-sm"
            >
              {status === "published" ? (
                <>
                  <Check size={12} />
                  <span>Save Changes</span>
                </>
              ) : status === "scheduled" ? (
                <>
                  <Clock size={12} />
                  <span>Scheduled</span>
                </>
              ) : (
                <>
                  <Send size={12} />
                  <span>Publish</span>
                </>
              )}
            </button>
          </div>
        </header>
      ) : (
        /* Floating Zen Mode exit bar */
        <div className="fixed top-4 right-6 z-40 flex items-center gap-2 bg-neutral-900/80 text-white dark:bg-neutral-100/90 dark:text-neutral-900 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-sans shadow-lg transition-all opacity-40 hover:opacity-100">
          <span>Zen Mode</span>
          <span className="text-[10px] opacity-60">(Esc)</span>
          <button
            type="button"
            onClick={() => setIsZenMode(false)}
            className="p-1 hover:opacity-80 transition-opacity"
            title="Exit Zen Mode (Esc)"
          >
            <Minimize2 size={13} />
          </button>
        </div>
      )}

      {/* Main Distraction-Free Authoring Studio Canvas */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 sm:px-8 py-14 flex flex-col">
        {/* Title Input */}
        <input
          type="text"
          placeholder={mode === "poetry" ? "Poem Title..." : "Title..."}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            triggerAutosave();
          }}
          className="w-full bg-transparent font-serif text-4xl sm:text-5xl lg:text-6xl text-neutral-900 dark:text-neutral-100 outline-none placeholder:text-neutral-300 dark:placeholder:text-neutral-700 mb-4 leading-tight tracking-tight"
        />

        {/* Subtitle / Dek Input (For non-poetry modes) */}
        {mode !== "poetry" && (
          <input
            type="text"
            placeholder="Subtitle or dek (one clear, compelling sentence)..."
            value={subtitle}
            onChange={(e) => {
              setSubtitle(e.target.value);
              triggerAutosave();
            }}
            className="w-full bg-transparent font-serif italic text-xl sm:text-2xl text-neutral-500 dark:text-neutral-400 outline-none placeholder:text-neutral-400 dark:placeholder:text-neutral-600 mb-8 border-b border-gray-100 dark:border-gray-900 pb-3"
          />
        )}

        {/* Studio Block Canvas (Replacing plain textarea) */}
        <BlockCanvas
          blocks={blocks}
          mode={mode}
          onChange={handleBlocksChange}
        />
      </main>

      {/* Slide-out Piece Settings Drawer */}
      <PieceSettingsDrawer
        isOpen={isSettingsDrawerOpen}
        onClose={() => setIsSettingsDrawerOpen(false)}
        mode={mode}
        onModeChange={(newMode) => {
          setMode(newMode);
          // If switching to/from poetry, adjust blocks model
          const reParsed = parseContentToBlocks(content, newMode);
          setBlocks(reParsed);
          triggerAutosave();
        }}
        location={location}
        onLocationChange={(val) => {
          setLocation(val);
          triggerAutosave();
        }}
        tagsInput={tagsInput}
        onTagsInputChange={(val) => {
          setTagsInput(val);
          triggerAutosave();
        }}
        coverImage={coverImage}
        onCoverImageChange={(val) => {
          setCoverImage(val);
          triggerAutosave();
        }}
        isFeatured={isFeatured}
        onIsFeaturedChange={(val) => {
          setIsFeatured(val);
          triggerAutosave();
        }}
        epigraph={epigraph}
        onEpigraphChange={(val) => {
          setEpigraph(val);
          triggerAutosave();
        }}
        dedication={dedication}
        onDedicationChange={(val) => {
          setDedication(val);
          triggerAutosave();
        }}
        footnote={footnote}
        onFootnoteChange={(val) => {
          setFootnote(val);
          triggerAutosave();
        }}
        afterword={afterword}
        onAfterwordChange={(val) => {
          setAfterword(val);
          triggerAutosave();
        }}
        isVaulted={isVaulted}
        onIsVaultedChange={(val) => {
          setIsVaulted(val);
          triggerAutosave();
        }}
        passphrase={passphrase}
        onPassphraseChange={(val) => {
          setPassphrase(val);
          triggerAutosave();
        }}
        centralQuestion={centralQuestion}
        onCentralQuestionChange={(val) => {
          setCentralQuestion(val);
          triggerAutosave();
        }}
        methodology={methodology}
        onMethodologyChange={(val) => {
          setMethodology(val);
          triggerAutosave();
        }}
        limitations={limitations}
        onLimitationsChange={(val) => {
          setLimitations(val);
          triggerAutosave();
        }}
        onOpenEditorialWorkspace={() => setIsWorkspaceDrawerOpen(true)}
        observationDate={observationDate}
        onObservationDateChange={(val) => {
          setObservationDate(val);
          triggerAutosave();
        }}
        datasetName={datasetName}
        onDatasetNameChange={(val) => {
          setDatasetName(val);
          triggerAutosave();
        }}
        dataSource={dataSource}
        onDataSourceChange={(val) => {
          setDataSource(val);
          triggerAutosave();
        }}
        dataUnits={dataUnits}
        onDataUnitsChange={(val) => {
          setDataUnits(val);
          triggerAutosave();
        }}
        dataTimeframe={dataTimeframe}
        onDataTimeframeChange={(val) => {
          setDataTimeframe(val);
          triggerAutosave();
        }}
        coverImagePrompt={coverImagePrompt}
        onCoverImagePromptChange={(val) => {
          setCoverImagePrompt(val);
          triggerAutosave();
        }}
        pieceId={activePieceId || undefined}
        pieceTitle={title}
      />

      {/* Private Editorial Workspace Drawer (Investigations) */}
      <EditorialWorkspaceDrawer
        pieceId={activePieceId}
        isOpen={isWorkspaceDrawerOpen}
        onClose={() => setIsWorkspaceDrawerOpen(false)}
        centralQuestion={centralQuestion}
        onUpdateCentralQuestion={(q) => {
          setCentralQuestion(q);
          triggerAutosave();
        }}
        onEnsureDraftExists={async () => {
          await assertPieceDraftExists(activePieceId, "investigation", user?.uid, userDisplayName);
        }}
      />

      {/* High-Fidelity Reader Preview Modal */}
      <PiecePreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        piece={pieceSnapshot}
      />

      {/* Deliberate Publishing Confirmation Modal */}
      <PublishConfirmationModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        onConfirmPublish={handleConfirmPublish}
        onUnpublish={async () => {
          await handleUnpublishPiece(activePieceId);
          setIsPublishModalOpen(false);
        }}
        onOpenSocialPreview={() => setIsSocialPreviewOpen(true)}
        piece={pieceSnapshot}
        isPublishing={saveStatus === "saving"}
        isAlreadyPublished={status === "published"}
      />

      {/* Accurate Social Metadata Preview Modal */}
      <SocialPreviewModal
        isOpen={isSocialPreviewOpen}
        onClose={() => setIsSocialPreviewOpen(false)}
        piece={pieceSnapshot}
        coverImage={coverImage}
      />

      {/* Admin Credentials & Publisher Security Modal */}
      {user && (
        <AdminAccountModal
          isOpen={isAdminAccountModalOpen}
          onClose={() => setIsAdminAccountModalOpen(false)}
          user={user}
        />
      )}
    </div>
  );
}

export default function WriteStudio() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center font-serif text-neutral-400">
          Loading Writing Desk...
        </div>
      }
    >
      <WritingDeskContent />
    </Suspense>
  );
}
