"use client";

import { useState, useEffect } from "react";
import { 
  X, 
  Shield, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  Trash2, 
  ExternalLink, 
  BookOpen, 
  Users, 
  FileText, 
  CheckSquare 
} from "lucide-react";
import { 
  EditorialWorkspace, 
  InterviewRecord, 
  InternalSource, 
  EvidenceClaim, 
  EvidenceStatus,
  getEditorialWorkspace,
  saveEditorialWorkspace,
  getWorkspaceInterviews,
  saveWorkspaceInterview,
  deleteWorkspaceInterview,
  getWorkspaceSources,
  saveWorkspaceSource,
  deleteWorkspaceSource,
  getWorkspaceClaims,
  saveWorkspaceClaim,
  deleteWorkspaceClaim
} from "@/lib/db";
import { motion, AnimatePresence } from "framer-motion";

interface EditorialWorkspaceDrawerProps {
  pieceId: string;
  isOpen: boolean;
  onClose: () => void;
  centralQuestion: string;
  onUpdateCentralQuestion?: (q: string) => void;
  onEnsureDraftExists?: () => Promise<void>;
}

const evidenceStatusBadge = (status: EvidenceStatus) => {
  switch (status) {
    case "supported_by_evidence":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 size={12} /> Supported by Evidence
        </span>
      );
    case "needs_corroboration":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <AlertCircle size={12} /> Needs Corroboration
        </span>
      );
    case "disputed":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <AlertCircle size={12} /> Disputed
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-500/10 text-gray-400 border border-gray-500/20">
          <HelpCircle size={12} /> Unverified
        </span>
      );
  }
};

export default function EditorialWorkspaceDrawer({
  pieceId,
  isOpen,
  onClose,
  centralQuestion,
  onUpdateCentralQuestion,
  onEnsureDraftExists,
}: EditorialWorkspaceDrawerProps) {
  const [activeTab, setActiveTab] = useState<"hypothesis" | "interviews" | "sources" | "claims">("hypothesis");
  const [loading, setLoading] = useState(false);
  const [savingStatus, setSavingStatus] = useState<string>("");

  // Workspace Root State
  const [workingHypothesis, setWorkingHypothesis] = useState("");
  const [counterarguments, setCounterarguments] = useState("");
  const [reportingTargets, setReportingTargets] = useState("");

  // Subcollections State
  const [interviews, setInterviews] = useState<InterviewRecord[]>([]);
  const [sources, setSources] = useState<InternalSource[]>([]);
  const [claims, setClaims] = useState<EvidenceClaim[]>([]);

  // Modals / Forms
  const [isAddingInterview, setIsAddingInterview] = useState(false);
  const [newInterview, setNewInterview] = useState<Partial<InterviewRecord>>({
    nameOrIdentifier: "",
    role: "",
    date: new Date().toISOString().split("T")[0],
    contactInfo: "",
    notes: "",
    keyClaims: [],
    evidenceStatus: "unverified",
    consentGiven: true,
  });
  const [keyClaimsInput, setKeyClaimsInput] = useState("");

  const [isAddingSource, setIsAddingSource] = useState(false);
  const [newSource, setNewSource] = useState<Partial<InternalSource>>({
    title: "",
    sourceType: "government_document",
    url: "",
    publisherOrOrg: "",
    publicationDate: "",
    accessDate: new Date().toISOString().split("T")[0],
    claimSupported: "",
    notes: "",
    evidenceStatus: "supported_by_evidence",
    isPubliclyVisible: false,
  });

  const [isAddingClaim, setIsAddingClaim] = useState(false);
  const [newClaim, setNewClaim] = useState<Partial<EvidenceClaim>>({
    claimText: "",
    evidenceStatus: "unverified",
    primarySourceRef: "",
    notes: "",
  });

  // Load workspace on demand when drawer opens
  useEffect(() => {
    if (!isOpen || !pieceId) return;

    if (onEnsureDraftExists) {
      onEnsureDraftExists().catch(console.error);
    }

    let isMounted = true;
    setLoading(true);

    Promise.all([
      getEditorialWorkspace(pieceId),
      getWorkspaceInterviews(pieceId),
      getWorkspaceSources(pieceId),
      getWorkspaceClaims(pieceId),
    ])
      .then(([ws, intList, srcList, clmList]) => {
        if (!isMounted) return;
        if (ws) {
          setWorkingHypothesis(ws.workingHypothesis || "");
          setCounterarguments(ws.counterargumentsInvestigated || "");
          setReportingTargets(ws.reportingTargets?.join("\n") || "");
        }
        setInterviews(intList);
        setSources(srcList);
        setClaims(clmList);
      })
      .catch((err) => {
        console.error("Error loading editorial workspace:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, pieceId]);

  // Save workspace root fields
  const handleSaveRootWorkspace = async () => {
    if (!pieceId) return;
    setSavingStatus("Saving...");
    try {
      if (onEnsureDraftExists) {
        await onEnsureDraftExists();
      }
      await saveEditorialWorkspace(pieceId, {
        workingHypothesis,
        counterargumentsInvestigated: counterarguments,
        reportingTargets: reportingTargets.split("\n").filter((t) => t.trim()),
      });
      setSavingStatus("Saved");
      setTimeout(() => setSavingStatus(""), 2000);
    } catch (err) {
      console.error(err);
      setSavingStatus("Failed to save");
    }
  };

  // Add Interview
  const handleCreateInterview = async () => {
    if (!newInterview.nameOrIdentifier?.trim() || !pieceId) return;
    try {
      if (onEnsureDraftExists) {
        await onEnsureDraftExists();
      }
      const claimsArray = keyClaimsInput
        .split("\n")
        .map((c) => c.trim())
        .filter(Boolean);

      const id = await saveWorkspaceInterview(pieceId, {
        nameOrIdentifier: newInterview.nameOrIdentifier || "Anonymous",
        role: newInterview.role || "",
        date: newInterview.date || "",
        contactInfo: newInterview.contactInfo || "",
        notes: newInterview.notes || "",
        keyClaims: claimsArray,
        evidenceStatus: newInterview.evidenceStatus || "unverified",
        consentGiven: Boolean(newInterview.consentGiven),
      });

      const updated = await getWorkspaceInterviews(pieceId);
      setInterviews(updated);
      setIsAddingInterview(false);
      setNewInterview({
        nameOrIdentifier: "",
        role: "",
        date: new Date().toISOString().split("T")[0],
        contactInfo: "",
        notes: "",
        keyClaims: [],
        evidenceStatus: "unverified",
        consentGiven: true,
      });
      setKeyClaimsInput("");
    } catch (err) {
      console.error("Failed to add interview:", err);
    }
  };

  const handleDeleteInterview = async (interviewId: string) => {
    if (!confirm("Remove this interview record?")) return;
    try {
      await deleteWorkspaceInterview(pieceId, interviewId);
      setInterviews((prev) => prev.filter((i) => i.id !== interviewId));
    } catch (err) {
      console.error(err);
    }
  };

  // Add Source
  const handleCreateSource = async () => {
    if (!newSource.title?.trim() || !pieceId) return;
    try {
      if (onEnsureDraftExists) {
        await onEnsureDraftExists();
      }
      await saveWorkspaceSource(pieceId, {
        title: newSource.title,
        sourceType: newSource.sourceType || "government_document",
        url: newSource.url || "",
        publisherOrOrg: newSource.publisherOrOrg || "",
        publicationDate: newSource.publicationDate || "",
        accessDate: newSource.accessDate || new Date().toISOString().split("T")[0],
        claimSupported: newSource.claimSupported || "",
        notes: newSource.notes || "",
        evidenceStatus: newSource.evidenceStatus || "supported_by_evidence",
        isPubliclyVisible: Boolean(newSource.isPubliclyVisible),
      });

      const updated = await getWorkspaceSources(pieceId);
      setSources(updated);
      setIsAddingSource(false);
      setNewSource({
        title: "",
        sourceType: "government_document",
        url: "",
        publisherOrOrg: "",
        publicationDate: "",
        accessDate: new Date().toISOString().split("T")[0],
        claimSupported: "",
        notes: "",
        evidenceStatus: "supported_by_evidence",
        isPubliclyVisible: false,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSource = async (sourceId: string) => {
    if (!confirm("Delete source record?")) return;
    try {
      await deleteWorkspaceSource(pieceId, sourceId);
      setSources((prev) => prev.filter((s) => s.id !== sourceId));
    } catch (err) {
      console.error(err);
    }
  };

  // Add Claim
  const handleCreateClaim = async () => {
    if (!newClaim.claimText?.trim() || !pieceId) return;
    try {
      if (onEnsureDraftExists) {
        await onEnsureDraftExists();
      }
      await saveWorkspaceClaim(pieceId, {
        claimText: newClaim.claimText,
        evidenceStatus: newClaim.evidenceStatus || "unverified",
        primarySourceRef: newClaim.primarySourceRef || "",
        notes: newClaim.notes || "",
      });

      const updated = await getWorkspaceClaims(pieceId);
      setClaims(updated);
      setIsAddingClaim(false);
      setNewClaim({
        claimText: "",
        evidenceStatus: "unverified",
        primarySourceRef: "",
        notes: "",
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteClaim = async (claimId: string) => {
    if (!confirm("Remove this evidence claim?")) return;
    try {
      await deleteWorkspaceClaim(pieceId, claimId);
      setClaims((prev) => prev.filter((c) => c.id !== claimId));
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex justify-end bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 260 }}
          className="w-full max-w-2xl h-full bg-[#111113] text-gray-100 border-l border-white/10 flex flex-col shadow-2xl overflow-hidden font-serif"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
                <Shield size={18} />
              </div>
              <div>
                <h2 className="text-xl tracking-wide font-medium flex items-center gap-2">
                  Editorial Workspace
                  <span className="text-xs font-mono font-normal tracking-normal px-2 py-0.5 rounded bg-white/5 text-gray-400 border border-white/10">
                    Private
                  </span>
                </h2>
                <p className="text-xs text-gray-400 font-sans tracking-wide">
                  Sensitive investigative notes & evidence. Never delivered to public readers.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {savingStatus && (
                <span className="text-xs text-accent font-sans animate-pulse">{savingStatus}</span>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                title="Close Drawer"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Sub Navigation */}
          <div className="flex items-center gap-2 px-6 py-3 border-b border-white/10 bg-black/30 font-sans text-xs">
            <button
              onClick={() => setActiveTab("hypothesis")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${
                activeTab === "hypothesis"
                  ? "bg-white/15 text-white font-medium"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <FileText size={14} /> Question & Hypothesis
            </button>
            <button
              onClick={() => setActiveTab("interviews")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${
                activeTab === "interviews"
                  ? "bg-white/15 text-white font-medium"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Users size={14} /> Interviews ({interviews.length})
            </button>
            <button
              onClick={() => setActiveTab("sources")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${
                activeTab === "sources"
                  ? "bg-white/15 text-white font-medium"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <BookOpen size={14} /> Sources ({sources.length})
            </button>
            <button
              onClick={() => setActiveTab("claims")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${
                activeTab === "claims"
                  ? "bg-white/15 text-white font-medium"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <CheckSquare size={14} /> Claims ({claims.length})
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {loading ? (
              <div className="flex justify-center items-center h-48">
                <div className="w-7 h-7 border-2 border-white/20 border-t-accent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* TAB 1: QUESTION & HYPOTHESIS */}
                {activeTab === "hypothesis" && (
                  <div className="space-y-6">
                    <div className="bg-black/30 border border-white/10 rounded-xl p-5 space-y-2">
                      <label className="text-xs uppercase tracking-widest text-accent font-sans font-semibold">
                        Central Story Question
                      </label>
                      <p className="text-xs text-gray-400 font-sans mb-2">
                        The sharpest single-sentence question this investigation answers.
                      </p>
                      <input
                        type="text"
                        value={centralQuestion}
                        onChange={(e) => onUpdateCentralQuestion?.(e.target.value)}
                        placeholder="e.g. Why does this neighborhood continue to flood despite repeated drainage projects?"
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-lg outline-none focus:border-accent text-white placeholder:text-gray-500"
                      />
                    </div>

                    <div className="bg-black/30 border border-white/10 rounded-xl p-5 space-y-2">
                      <label className="text-xs uppercase tracking-widest text-gray-300 font-sans font-semibold">
                        Working Hypothesis
                      </label>
                      <p className="text-xs text-gray-400 font-sans mb-2">
                        What do we currently suspect based on early indicators? (Treat as provisional).
                      </p>
                      <textarea
                        rows={3}
                        value={workingHypothesis}
                        onChange={(e) => setWorkingHypothesis(e.target.value)}
                        onBlur={handleSaveRootWorkspace}
                        placeholder="Provisional explanation..."
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-base outline-none focus:border-accent text-gray-200 placeholder:text-gray-500 resize-none font-sans"
                      />
                    </div>

                    <div className="bg-black/30 border border-white/10 rounded-xl p-5 space-y-2">
                      <label className="text-xs uppercase tracking-widest text-rose-400 font-sans font-semibold">
                        Counterarguments & Disconfirming Evidence
                      </label>
                      <p className="text-xs text-gray-400 font-sans mb-2">
                        What evidence would challenge this conclusion, and how will we test it?
                      </p>
                      <textarea
                        rows={3}
                        value={counterarguments}
                        onChange={(e) => setCounterarguments(e.target.value)}
                        onBlur={handleSaveRootWorkspace}
                        placeholder="Alternative explanations or authorities' counter-positions..."
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-base outline-none focus:border-accent text-gray-200 placeholder:text-gray-500 resize-none font-sans"
                      />
                    </div>

                    <div className="bg-black/30 border border-white/10 rounded-xl p-5 space-y-2">
                      <label className="text-xs uppercase tracking-widest text-gray-300 font-sans font-semibold">
                        Reporting Targets & Scope
                      </label>
                      <p className="text-xs text-gray-400 font-sans mb-2">
                        Specific locations, ministries, records, or communities to examine. (One per line).
                      </p>
                      <textarea
                        rows={3}
                        value={reportingTargets}
                        onChange={(e) => setReportingTargets(e.target.value)}
                        onBlur={handleSaveRootWorkspace}
                        placeholder="Hydrological Services Department&#10;Glefe culvert survey&#10;Assembly Member records"
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm outline-none focus:border-accent text-gray-200 placeholder:text-gray-500 resize-none font-sans"
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={handleSaveRootWorkspace}
                        className="px-5 py-2 rounded-full bg-accent text-white font-sans text-xs tracking-wider uppercase font-medium hover:bg-accent/90 transition-colors"
                      >
                        Save Hypothesis Notes
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 2: INTERVIEWS */}
                {activeTab === "interviews" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-400 font-sans">
                        Record interviews, source claims, and consent status.
                      </p>
                      <button
                        onClick={() => setIsAddingInterview(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-sans font-medium transition-colors"
                      >
                        <Plus size={14} /> Add Interview
                      </button>
                    </div>

                    {/* New Interview Form */}
                    {isAddingInterview && (
                      <div className="bg-black/40 border border-accent/30 rounded-xl p-5 space-y-4">
                        <h4 className="text-sm font-sans font-semibold text-accent uppercase tracking-wider">
                          New Interview Record
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-sans text-xs">
                          <div>
                            <label className="text-gray-400 block mb-1">Name / Identifier</label>
                            <input
                              type="text"
                              value={newInterview.nameOrIdentifier}
                              onChange={(e) =>
                                setNewInterview({ ...newInterview, nameOrIdentifier: e.target.value })
                              }
                              placeholder="e.g. Kwesi Mensah or Resident, Glefe"
                              className="w-full bg-white/5 border border-white/10 rounded p-2 text-white outline-none focus:border-accent"
                            />
                          </div>
                          <div>
                            <label className="text-gray-400 block mb-1">Role / Position</label>
                            <input
                              type="text"
                              value={newInterview.role}
                              onChange={(e) =>
                                setNewInterview({ ...newInterview, role: e.target.value })
                              }
                              placeholder="e.g. Drainage engineer, elder, trader"
                              className="w-full bg-white/5 border border-white/10 rounded p-2 text-white outline-none focus:border-accent"
                            />
                          </div>
                          <div>
                            <label className="text-gray-400 block mb-1">Date</label>
                            <input
                              type="date"
                              value={newInterview.date}
                              onChange={(e) =>
                                setNewInterview({ ...newInterview, date: e.target.value })
                              }
                              className="w-full bg-white/5 border border-white/10 rounded p-2 text-white outline-none focus:border-accent"
                            />
                          </div>
                          <div>
                            <label className="text-gray-400 block mb-1">Evidence Status</label>
                            <select
                              value={newInterview.evidenceStatus}
                              onChange={(e) =>
                                setNewInterview({
                                  ...newInterview,
                                  evidenceStatus: e.target.value as EvidenceStatus,
                                })
                              }
                              className="w-full bg-white/5 border border-white/10 rounded p-2 text-white outline-none focus:border-accent"
                            >
                              <option value="unverified">Unverified</option>
                              <option value="needs_corroboration">Needs Corroboration</option>
                              <option value="supported_by_evidence">Supported by Evidence</option>
                              <option value="disputed">Disputed</option>
                            </select>
                          </div>
                        </div>

                        <div className="font-sans text-xs">
                          <label className="text-gray-400 block mb-1">
                            Private Contact Info (Not for publication)
                          </label>
                          <input
                            type="text"
                            value={newInterview.contactInfo}
                            onChange={(e) =>
                              setNewInterview({ ...newInterview, contactInfo: e.target.value })
                            }
                            placeholder="Phone, email, or meeting location"
                            className="w-full bg-white/5 border border-white/10 rounded p-2 text-white outline-none focus:border-accent"
                          />
                        </div>

                        <div className="font-sans text-xs">
                          <label className="text-gray-400 block mb-1">
                            Key Claims (One per line)
                          </label>
                          <textarea
                            rows={2}
                            value={keyClaimsInput}
                            onChange={(e) => setKeyClaimsInput(e.target.value)}
                            placeholder="Claim 1: Drains haven't been cleared since 2022&#10;Claim 2: Sea defense wall stopped water exit"
                            className="w-full bg-white/5 border border-white/10 rounded p-2 text-white outline-none focus:border-accent resize-none"
                          />
                        </div>

                        <div className="font-sans text-xs">
                          <label className="text-gray-400 block mb-1">Detailed Interview Notes</label>
                          <textarea
                            rows={3}
                            value={newInterview.notes}
                            onChange={(e) =>
                              setNewInterview({ ...newInterview, notes: e.target.value })
                            }
                            placeholder="Observations, direct quotes, tone, contradictions..."
                            className="w-full bg-white/5 border border-white/10 rounded p-2 text-white outline-none focus:border-accent resize-none"
                          />
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <label className="flex items-center gap-2 text-xs font-sans text-gray-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={newInterview.consentGiven}
                              onChange={(e) =>
                                setNewInterview({ ...newInterview, consentGiven: e.target.checked })
                              }
                              className="rounded border-white/20"
                            />
                            Informed consent obtained
                          </label>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setIsAddingInterview(false)}
                              className="px-4 py-1.5 rounded-full border border-white/10 hover:bg-white/5 font-sans text-xs text-gray-400"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleCreateInterview}
                              disabled={!newInterview.nameOrIdentifier?.trim()}
                              className="px-4 py-1.5 rounded-full bg-accent text-white font-sans text-xs font-medium hover:bg-accent/90 disabled:opacity-50"
                            >
                              Save Interview
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Interview Records List */}
                    {interviews.length === 0 && !isAddingInterview ? (
                      <div className="text-center py-12 text-gray-500 font-sans text-sm">
                        No interviews recorded yet. Click "Add Interview" to log primary testimony.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {interviews.map((item) => (
                          <div
                            key={item.id}
                            className="bg-black/30 border border-white/10 rounded-xl p-4 space-y-3 hover:border-white/20 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="text-base font-medium text-white">
                                  {item.nameOrIdentifier}
                                </h4>
                                <p className="text-xs text-gray-400 font-sans">
                                  {item.role || "No role specified"} • {item.date}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {evidenceStatusBadge(item.evidenceStatus)}
                                <button
                                  onClick={() => handleDeleteInterview(item.id)}
                                  className="p-1 rounded text-gray-500 hover:text-rose-400 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>

                            {item.keyClaims?.length > 0 && (
                              <div className="bg-white/5 rounded-lg p-3 space-y-1">
                                <p className="text-xs font-sans text-gray-400 uppercase tracking-wider font-semibold">
                                  Key Claims:
                                </p>
                                <ul className="list-disc list-inside text-xs font-sans text-gray-200 space-y-0.5">
                                  {item.keyClaims.map((claim: string, ci: number) => (
                                  <li key={ci}>{claim}</li>
                                ))}
                                </ul>
                              </div>
                            )}

                            {item.notes && (
                              <p className="text-sm text-gray-300 font-sans leading-relaxed whitespace-pre-wrap">
                                {item.notes}
                              </p>
                            )}

                            {item.contactInfo && (
                              <p className="text-xs font-mono text-gray-500 pt-1 border-t border-white/5">
                                Confidential: {item.contactInfo}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: SOURCES */}
                {activeTab === "sources" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-400 font-sans">
                        Internal document and public record repository.
                      </p>
                      <button
                        onClick={() => setIsAddingSource(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-sans font-medium transition-colors"
                      >
                        <Plus size={14} /> Add Source
                      </button>
                    </div>

                    {isAddingSource && (
                      <div className="bg-black/40 border border-accent/30 rounded-xl p-5 space-y-4 font-sans text-xs">
                        <h4 className="text-sm font-sans font-semibold text-accent uppercase tracking-wider">
                          New Source Document
                        </h4>
                        <div>
                          <label className="text-gray-400 block mb-1">Source Title / Document Name</label>
                          <input
                            type="text"
                            value={newSource.title}
                            onChange={(e) => setNewSource({ ...newSource, title: e.target.value })}
                            placeholder="e.g. Greater Accra Resilient and Integrated Development Project (GARID) Report"
                            className="w-full bg-white/5 border border-white/10 rounded p-2 text-white outline-none focus:border-accent"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-gray-400 block mb-1">Source Type</label>
                            <select
                              value={newSource.sourceType}
                              onChange={(e) => setNewSource({ ...newSource, sourceType: e.target.value as any })}
                              className="w-full bg-white/5 border border-white/10 rounded p-2 text-white outline-none focus:border-accent"
                            >
                              <option value="government_document">Government Document</option>
                              <option value="academic_paper">Academic Paper</option>
                              <option value="dataset">Dataset / Spreadsheet</option>
                              <option value="interview">Interview</option>
                              <option value="official_statement">Official Statement</option>
                              <option value="observation">Field Observation</option>
                              <option value="archive">Historical Archive</option>
                              <option value="news_report">News Report</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-gray-400 block mb-1">Publisher / Organization</label>
                            <input
                              type="text"
                              value={newSource.publisherOrOrg}
                              onChange={(e) => setNewSource({ ...newSource, publisherOrOrg: e.target.value })}
                              placeholder="e.g. Ministry of Works and Housing"
                              className="w-full bg-white/5 border border-white/10 rounded p-2 text-white outline-none focus:border-accent"
                            />
                          </div>
                          <div>
                            <label className="text-gray-400 block mb-1">Document URL / File Link</label>
                            <input
                              type="text"
                              value={newSource.url}
                              onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
                              placeholder="https://..."
                              className="w-full bg-white/5 border border-white/10 rounded p-2 text-white outline-none focus:border-accent"
                            />
                          </div>
                          <div>
                            <label className="text-gray-400 block mb-1">Evidence Status</label>
                            <select
                              value={newSource.evidenceStatus}
                              onChange={(e) =>
                                setNewSource({ ...newSource, evidenceStatus: e.target.value as EvidenceStatus })
                              }
                              className="w-full bg-white/5 border border-white/10 rounded p-2 text-white outline-none focus:border-accent"
                            >
                              <option value="supported_by_evidence">Supported by Evidence</option>
                              <option value="needs_corroboration">Needs Corroboration</option>
                              <option value="unverified">Unverified</option>
                              <option value="disputed">Disputed</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="text-gray-400 block mb-1">Claim Supported</label>
                          <input
                            type="text"
                            value={newSource.claimSupported}
                            onChange={(e) => setNewSource({ ...newSource, claimSupported: e.target.value })}
                            placeholder="What claim in the story does this substantiate?"
                            className="w-full bg-white/5 border border-white/10 rounded p-2 text-white outline-none focus:border-accent"
                          />
                        </div>

                        <div>
                          <label className="text-gray-400 block mb-1">Source Notes & Caveats</label>
                          <textarea
                            rows={2}
                            value={newSource.notes}
                            onChange={(e) => setNewSource({ ...newSource, notes: e.target.value })}
                            placeholder="Methodological limitations, baseline years, missing coverage..."
                            className="w-full bg-white/5 border border-white/10 rounded p-2 text-white outline-none focus:border-accent resize-none"
                          />
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                            <input
                              type="checkbox"
                              checked={newSource.isPubliclyVisible}
                              onChange={(e) =>
                                setNewSource({ ...newSource, isPubliclyVisible: e.target.checked })
                              }
                              className="rounded border-white/20"
                            />
                            Include in public article bibliography
                          </label>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setIsAddingSource(false)}
                              className="px-4 py-1.5 rounded-full border border-white/10 hover:bg-white/5 text-gray-400"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleCreateSource}
                              disabled={!newSource.title?.trim()}
                              className="px-4 py-1.5 rounded-full bg-accent text-white font-medium hover:bg-accent/90 disabled:opacity-50"
                            >
                              Save Source
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {sources.length === 0 && !isAddingSource ? (
                      <div className="text-center py-12 text-gray-500 font-sans text-sm">
                        No sources archived yet. Click "Add Source" to register primary documents.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {sources.map((item) => (
                          <div
                            key={item.id}
                            className="bg-black/30 border border-white/10 rounded-xl p-4 space-y-2 hover:border-white/20 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="text-base font-medium text-white flex items-center gap-2">
                                  {item.title}
                                  {item.url && (
                                    <a
                                      href={item.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-accent hover:underline inline-flex items-center"
                                    >
                                      <ExternalLink size={12} />
                                    </a>
                                  )}
                                </h4>
                                <p className="text-xs text-gray-400 font-sans">
                                  {item.publisherOrOrg || "Unknown publisher"} • Type: {item.sourceType}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {evidenceStatusBadge(item.evidenceStatus)}
                                <button
                                  onClick={() => handleDeleteSource(item.id)}
                                  className="p-1 rounded text-gray-500 hover:text-rose-400 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>

                            {item.claimSupported && (
                              <p className="text-xs font-sans text-gray-300">
                                <span className="text-accent font-medium">Substantiates:</span> {item.claimSupported}
                              </p>
                            )}

                            {item.notes && (
                              <p className="text-xs font-sans text-gray-400 italic">
                                Note: {item.notes}
                              </p>
                            )}

                            <div className="flex items-center justify-between text-[11px] font-sans text-gray-500 pt-1 border-t border-white/5">
                              <span>Accessed: {item.accessDate}</span>
                              <span className={item.isPubliclyVisible ? "text-emerald-400" : "text-gray-500"}>
                                {item.isPubliclyVisible ? "Visible in public bibliography" : "Internal only"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: CLAIMS CHECKLIST */}
                {activeTab === "claims" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-400 font-sans">
                        Fact-check checklist. Verify every major factual assertion before publishing.
                      </p>
                      <button
                        onClick={() => setIsAddingClaim(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-sans font-medium transition-colors"
                      >
                        <Plus size={14} /> Add Claim
                      </button>
                    </div>

                    {isAddingClaim && (
                      <div className="bg-black/40 border border-accent/30 rounded-xl p-5 space-y-4 font-sans text-xs">
                        <h4 className="text-sm font-sans font-semibold text-accent uppercase tracking-wider">
                          New Factual Claim
                        </h4>
                        <div>
                          <label className="text-gray-400 block mb-1">Claim Statement</label>
                          <textarea
                            rows={2}
                            value={newClaim.claimText}
                            onChange={(e) => setNewClaim({ ...newClaim, claimText: e.target.value })}
                            placeholder="e.g. Over $200M was disbursed for Odaw basin dredging between 2019 and 2023."
                            className="w-full bg-white/5 border border-white/10 rounded p-2 text-white outline-none focus:border-accent resize-none"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-gray-400 block mb-1">Evidence Status</label>
                            <select
                              value={newClaim.evidenceStatus}
                              onChange={(e) =>
                                setNewClaim({ ...newClaim, evidenceStatus: e.target.value as EvidenceStatus })
                              }
                              className="w-full bg-white/5 border border-white/10 rounded p-2 text-white outline-none focus:border-accent"
                            >
                              <option value="unverified">Unverified</option>
                              <option value="needs_corroboration">Needs Corroboration</option>
                              <option value="supported_by_evidence">Supported by Evidence</option>
                              <option value="disputed">Disputed</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-gray-400 block mb-1">Primary Source Reference</label>
                            <input
                              type="text"
                              value={newClaim.primarySourceRef}
                              onChange={(e) => setNewClaim({ ...newClaim, primarySourceRef: e.target.value })}
                              placeholder="Document name, page, or interview identifier"
                              className="w-full bg-white/5 border border-white/10 rounded p-2 text-white outline-none focus:border-accent"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-gray-400 block mb-1">Verification Notes</label>
                          <input
                            type="text"
                            value={newClaim.notes}
                            onChange={(e) => setNewClaim({ ...newClaim, notes: e.target.value })}
                            placeholder="How was this confirmed or what remains uncorroborated?"
                            className="w-full bg-white/5 border border-white/10 rounded p-2 text-white outline-none focus:border-accent"
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            onClick={() => setIsAddingClaim(false)}
                            className="px-4 py-1.5 rounded-full border border-white/10 hover:bg-white/5 text-gray-400"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleCreateClaim}
                            disabled={!newClaim.claimText?.trim()}
                            className="px-4 py-1.5 rounded-full bg-accent text-white font-medium hover:bg-accent/90 disabled:opacity-50"
                          >
                            Save Claim
                          </button>
                        </div>
                      </div>
                    )}

                    {claims.length === 0 && !isAddingClaim ? (
                      <div className="text-center py-12 text-gray-500 font-sans text-sm">
                        No claims in evidence checklist yet. Add major assertions to track verification.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {claims.map((item) => (
                          <div
                            key={item.id}
                            className="bg-black/30 border border-white/10 rounded-xl p-4 space-y-2 hover:border-white/20 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <p className="text-base text-gray-100 font-serif leading-relaxed">
                                "{item.claimText}"
                              </p>
                              <div className="flex items-center gap-2 ml-4 shrink-0">
                                {evidenceStatusBadge(item.evidenceStatus)}
                                <button
                                  onClick={() => handleDeleteClaim(item.id)}
                                  className="p-1 rounded text-gray-500 hover:text-rose-400 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>

                            {item.primarySourceRef && (
                              <p className="text-xs font-sans text-gray-400">
                                <span className="text-accent font-medium">Source Ref:</span> {item.primarySourceRef}
                              </p>
                            )}

                            {item.notes && (
                              <p className="text-xs font-sans text-gray-400 italic">
                                Note: {item.notes}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
