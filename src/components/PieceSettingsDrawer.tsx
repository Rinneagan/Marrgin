"use client";

import React, { useState, useEffect } from "react";
import { EditorialMode, Piece } from "@/lib/db";
import { auth } from "@/lib/firebase";
import { 
  X, 
  Settings, 
  MapPin, 
  Tag, 
  Shield, 
  Lock, 
  Calendar, 
  FileText, 
  BookOpen, 
  BarChart2, 
  Star, 
  Image as ImageIcon,
  Wand2,
  Loader2,
  CloudRain,
  Type
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PieceSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  mode: EditorialMode;
  onModeChange: (newMode: EditorialMode) => void;
  fontSize?: "small" | "medium" | "large";
  onFontSizeChange?: (val: "small" | "medium" | "large") => void;
  location: string;
  onLocationChange: (val: string) => void;
  tagsInput: string;
  onTagsInputChange: (val: string) => void;
  coverImage: string;
  onCoverImageChange: (val: string) => void;
  coverImagePrompt?: string;
  onCoverImagePromptChange?: (val: string) => void;
  pieceId?: string;
  pieceTitle?: string;
  contentSnippet?: string;
  isFeatured: boolean;
  onIsFeaturedChange: (val: boolean) => void;
  chapter?: string;
  onChapterChange?: (val: string) => void;
  
  // Poetry / Essay
  epigraph: string;
  onEpigraphChange: (val: string) => void;
  dedication: string;
  onDedicationChange: (val: string) => void;
  footnote: string;
  onFootnoteChange: (val: string) => void;
  afterword: string;
  onAfterwordChange: (val: string) => void;
  isVaulted: boolean;
  onIsVaultedChange: (val: boolean) => void;
  passphrase: string;
  onPassphraseChange: (val: string) => void;

  // Investigation
  centralQuestion: string;
  onCentralQuestionChange: (val: string) => void;
  methodology: string;
  onMethodologyChange: (val: string) => void;
  limitations: string;
  onLimitationsChange: (val: string) => void;
  onOpenEditorialWorkspace: () => void;

  // Field Note
  observationDate: string;
  onObservationDateChange: (val: string) => void;

  // Data Story
  datasetName: string;
  onDatasetNameChange: (val: string) => void;
  dataSource: string;
  onDataSourceChange: (val: string) => void;
  dataUnits: string;
  onDataUnitsChange: (val: string) => void;
  dataTimeframe: string;
  onDataTimeframeChange: (val: string) => void;
}

const MODES: { id: EditorialMode; label: string }[] = [
  { id: "poetry", label: "Poetry" },
  { id: "essay", label: "Essay" },
  { id: "investigation", label: "Investigation" },
  { id: "field-note", label: "Field Note" },
  { id: "data-story", label: "Data Story" },
];

export default function PieceSettingsDrawer({
  isOpen,
  onClose,
  mode,
  onModeChange,
  fontSize = "medium",
  onFontSizeChange,
  location,
  onLocationChange,
  tagsInput,
  onTagsInputChange,
  coverImage,
  onCoverImageChange,
  isFeatured,
  onIsFeaturedChange,
  epigraph,
  onEpigraphChange,
  dedication,
  onDedicationChange,
  footnote,
  onFootnoteChange,
  afterword,
  onAfterwordChange,
  isVaulted,
  onIsVaultedChange,
  passphrase,
  onPassphraseChange,
  centralQuestion,
  onCentralQuestionChange,
  methodology,
  onMethodologyChange,
  limitations,
  onLimitationsChange,
  onOpenEditorialWorkspace,
  observationDate,
  onObservationDateChange,
  datasetName,
  onDatasetNameChange,
  dataSource,
  onDataSourceChange,
  dataUnits,
  onDataUnitsChange,
  dataTimeframe,
  onDataTimeframeChange,
  coverImagePrompt = "",
  onCoverImagePromptChange,
  chapter = "",
  onChapterChange,
  pieceId,
  pieceTitle,
  contentSnippet,
}: PieceSettingsDrawerProps) {
  // ---------------------------------------------------------------------------
  // AI Cover Generation via authenticated /api/generate-cover (Gemini backend)
  // ---------------------------------------------------------------------------
  const [internalPrompt, setInternalPrompt] = useState(coverImagePrompt);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generateError, setGenerateError] = useState("");

  useEffect(() => {
    setInternalPrompt(coverImagePrompt || "");
  }, [coverImagePrompt]);

  const handlePromptChange = (val: string) => {
    setInternalPrompt(val);
    onCoverImagePromptChange?.(val);
  };

  const handleGenerateCover = async () => {
    if (isGeneratingImage) return;
    setIsGeneratingImage(true);
    setGenerateError("");

    try {
      // Obtain Firebase Auth ID token for admin authorization
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error("Authentication required. Please ensure you are logged in as admin.");
      }

      const res = await fetch("/api/generate-cover", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pieceId,
          prompt: internalPrompt.trim(),
          title: pieceTitle,
          mode,
          contentSnippet,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Generation failed with status ${res.status}`);
      }

      const data = await res.json();
      if (!data.coverImage) {
        throw new Error("No cover image returned from server.");
      }

      // Update cover image; never destroys existing image if generation fails
      onCoverImageChange(data.coverImage);
    } catch (e: any) {
      console.error("Cover generation error:", e);
      setGenerateError(e.message || "Failed to generate cover image. Please try again.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-neutral-950 border-l border-gray-200 dark:border-gray-800 shadow-2xl flex flex-col z-10"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings size={16} className="text-amber-800 dark:text-amber-400" />
                <h3 className="font-serif text-xl text-neutral-900 dark:text-neutral-100">
                  Piece Settings
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Form */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs font-sans">
              {/* 1. Mode Switcher */}
              <div className="space-y-1.5">
                <label className="font-mono uppercase tracking-widest text-neutral-400 block">
                  Editorial Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {MODES.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => onModeChange(m.id)}
                      className={`p-2 rounded-xl text-xs font-medium border text-left transition-colors ${
                        mode === m.id
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-300"
                          : "border-gray-200 dark:border-gray-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reading Font Size */}
              <div className="space-y-1.5">
                <label className="font-mono uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
                  <Type size={12} /> Reading Font Size
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["small", "medium", "large"] as const).map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => onFontSizeChange?.(size)}
                      className={`py-2 px-3 rounded-xl border text-xs font-sans capitalize transition-colors text-center ${
                        fontSize === size
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-300 font-medium"
                          : "border-gray-200 dark:border-gray-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-neutral-400">
                  Sets the reading scale in the studio preview and on the published reading page.
                </p>
              </div>

              {/* 2. Geography / Location */}
              <div className="space-y-1.5">
                <label className="font-mono uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
                  <MapPin size={12} /> Geographic Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Jamestown, Accra or Weija Hills"
                  value={location}
                  onChange={(e) => onLocationChange(e.target.value)}
                  className="w-full bg-neutral-50 dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-neutral-800 dark:text-neutral-200 outline-none focus:border-amber-500"
                />
                <p className="text-[11px] text-neutral-400">
                  Anchors the piece in real Ghanaian geography on the homepage and Explore map.
                </p>
              </div>

              {/* 3. Tags & Topics */}
              <div className="space-y-1.5">
                <label className="font-mono uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
                  <Tag size={12} /> Tags & Topics
                </label>
                <input
                  type="text"
                  placeholder="e.g. flooding, drainage, coastal, korle"
                  value={tagsInput}
                  onChange={(e) => onTagsInputChange(e.target.value)}
                  className="w-full bg-neutral-50 dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-neutral-800 dark:text-neutral-200 outline-none focus:border-amber-500"
                />
                <p className="text-[11px] text-neutral-400">Separate with commas.</p>
              </div>

              {/* Chapter Association */}
              <div className="space-y-1.5">
                <label className="font-mono uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
                  <BookOpen size={12} /> Beyond the Rain Chapter
                </label>
                <select
                  value={chapter || ""}
                  onChange={(e) => onChapterChange?.(e.target.value)}
                  className="w-full bg-neutral-50 dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-neutral-800 dark:text-neutral-200 text-sm outline-none focus:border-amber-500"
                >
                  <option value="">None</option>
                  <option value="beyond-the-rain">Beyond the Rain in Ghana</option>
                </select>
              </div>

              {/* 4. Cover Image */}
              <div className="space-y-3">
                <label className="font-mono uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
                  <ImageIcon size={12} /> Cover Image
                </label>

                {/* Manual URL input */}
                <input
                  type="text"
                  placeholder="https://... (paste a photograph or graphic URL)"
                  value={coverImage}
                  onChange={(e) => onCoverImageChange(e.target.value)}
                  className="w-full bg-neutral-50 dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-neutral-800 dark:text-neutral-200 outline-none focus:border-amber-500"
                />

                {/* Divider */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-gray-100 dark:bg-gray-900" />
                  <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">or generate with AI</span>
                  <div className="flex-1 h-px bg-gray-100 dark:bg-gray-900" />
                </div>

                {/* AI prompt + button */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. A weathered pink concrete wall, Kumasi dusk"
                    value={internalPrompt}
                    onChange={(e) => handlePromptChange(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleGenerateCover(); } }}
                    disabled={isGeneratingImage}
                    className="flex-1 bg-neutral-50 dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-neutral-800 dark:text-neutral-200 outline-none focus:border-amber-500 disabled:opacity-50 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateCover}
                    disabled={isGeneratingImage}
                    className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-medium hover:bg-neutral-700 dark:hover:bg-neutral-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Generate AI cover image with Gemini"
                  >
                    {isGeneratingImage
                      ? <Loader2 size={13} className="animate-spin" />
                      : <Wand2 size={13} />}
                    <span className="hidden sm:inline">
                      {isGeneratingImage ? "Generating…" : coverImage ? "Regenerate" : "Generate"}
                    </span>
                  </button>
                </div>

                {/* Error state */}
                {generateError && (
                  <p className="text-[11px] text-rose-500 font-sans">{generateError}</p>
                )}

                {/* Thumbnail preview */}
                {coverImage && (
                  <div className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 aspect-[3/2] bg-neutral-100 dark:bg-neutral-900">
                    <img
                      src={coverImage}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                    <button
                      type="button"
                      onClick={() => onCoverImageChange("")}
                      className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                      title="Remove cover image"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>

              {/* 5. Featured Story Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-800">
                <div className="space-y-0.5">
                  <span className="font-medium text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                    <Star size={13} className={isFeatured ? "text-amber-500 fill-amber-500" : "text-neutral-400"} />
                    Feature as Lead Story
                  </span>
                  <p className="text-[11px] text-neutral-400">
                    Displays prominently in the Phase 5 homepage lead position.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => onIsFeaturedChange(e.target.checked)}
                  className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 h-4 w-4"
                />
              </div>

              {/* ------------------------------------------------------------- */}
              {/* MODE SPECIFIC: INVESTIGATION                                  */}
              {/* ------------------------------------------------------------- */}
              {mode === "investigation" && (
                <div className="pt-4 border-t border-gray-100 dark:border-gray-900 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono uppercase tracking-widest text-amber-800 dark:text-amber-400 font-medium flex items-center gap-1.5">
                      <Shield size={13} /> Investigative Standards
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-neutral-500 block">Central Story Question</label>
                    <input
                      type="text"
                      placeholder="e.g. Why did the Odaw drain dredging fail to prevent 2024 flooding?"
                      value={centralQuestion}
                      onChange={(e) => onCentralQuestionChange(e.target.value)}
                      className="w-full bg-neutral-50 dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-neutral-800 dark:text-neutral-200 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-neutral-500 block">Reporting Methodology</label>
                    <textarea
                      rows={3}
                      placeholder="How this reporting was conducted (e.g. 14 in-person interviews, municipal documents examined)..."
                      value={methodology}
                      onChange={(e) => onMethodologyChange(e.target.value)}
                      className="w-full bg-neutral-50 dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-neutral-800 dark:text-neutral-200 outline-none resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-neutral-500 block">Known Limitations</label>
                    <textarea
                      rows={3}
                      placeholder="What the evidence could not establish (e.g. unreturned official comments, missing hydrologic gauges)..."
                      value={limitations}
                      onChange={(e) => onLimitationsChange(e.target.value)}
                      className="w-full bg-neutral-50 dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-neutral-800 dark:text-neutral-200 outline-none resize-none"
                    />
                  </div>

                  {/* Private Editorial Workspace CTA */}
                  <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 space-y-2">
                    <h4 className="font-serif text-sm font-medium text-amber-900 dark:text-amber-300">
                      Private Editorial Workspace
                    </h4>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      Access private source notes, confidential interview logs, and evidence claims protected by server-enforced rules.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenEditorialWorkspace();
                      }}
                      className="w-full mt-2 py-2 px-3 rounded-xl bg-amber-900 text-white dark:bg-amber-400 dark:text-neutral-950 font-medium text-xs hover:opacity-90 transition-opacity"
                    >
                      Open Private Workspace →
                    </button>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* MODE SPECIFIC: FIELD NOTE                                     */}
              {/* ------------------------------------------------------------- */}
              {mode === "field-note" && (
                <div className="pt-4 border-t border-gray-100 dark:border-gray-900 space-y-4">
                  <span className="font-mono uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
                    <Calendar size={13} /> Field Dispatch Metadata
                  </span>
                  <div className="space-y-1.5">
                    <label className="text-neutral-500 block">Observation Date</label>
                    <input
                      type="date"
                      value={observationDate}
                      onChange={(e) => onObservationDateChange(e.target.value)}
                      className="w-full bg-neutral-50 dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-neutral-800 dark:text-neutral-200 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* MODE SPECIFIC: DATA STORY                                     */}
              {/* ------------------------------------------------------------- */}
              {mode === "data-story" && (
                <div className="pt-4 border-t border-gray-100 dark:border-gray-900 space-y-4">
                  <span className="font-mono uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
                    <BarChart2 size={13} /> Dataset Provenance
                  </span>
                  <div className="space-y-1.5">
                    <label className="text-neutral-500 block">Dataset Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Greater Accra Rainfall & Gauge Discharges"
                      value={datasetName}
                      onChange={(e) => onDatasetNameChange(e.target.value)}
                      className="w-full bg-neutral-50 dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-neutral-800 dark:text-neutral-200 outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-neutral-500 block">Data Source / Origin</label>
                    <input
                      type="text"
                      placeholder="e.g. Ghana Meteorological Agency (GMet)"
                      value={dataSource}
                      onChange={(e) => onDataSourceChange(e.target.value)}
                      className="w-full bg-neutral-50 dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-neutral-800 dark:text-neutral-200 outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-neutral-500 block">Units</label>
                      <input
                        type="text"
                        placeholder="e.g. mm / 24h"
                        value={dataUnits}
                        onChange={(e) => onDataUnitsChange(e.target.value)}
                        className="w-full bg-neutral-50 dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-neutral-800 dark:text-neutral-200 outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-neutral-500 block">Timeframe</label>
                      <input
                        type="text"
                        placeholder="e.g. 2014 - 2024"
                        value={dataTimeframe}
                        onChange={(e) => onDataTimeframeChange(e.target.value)}
                        className="w-full bg-neutral-50 dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-neutral-800 dark:text-neutral-200 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* MODE SPECIFIC: POETRY / ESSAY                                 */}
              {/* ------------------------------------------------------------- */}
              {(mode === "poetry" || mode === "essay") && (
                <div className="pt-4 border-t border-gray-100 dark:border-gray-900 space-y-4">
                  <span className="font-mono uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
                    <BookOpen size={13} /> Context & Ephemera
                  </span>
                  <div className="space-y-1.5">
                    <label className="text-neutral-500 block">Epigraph (Opening quotation)</label>
                    <input
                      type="text"
                      placeholder="e.g. 'The sea has neither meaning nor pity.'"
                      value={epigraph}
                      onChange={(e) => onEpigraphChange(e.target.value)}
                      className="w-full bg-neutral-50 dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-neutral-800 dark:text-neutral-200 outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-neutral-500 block">Dedication</label>
                    <input
                      type="text"
                      placeholder="e.g. For E."
                      value={dedication}
                      onChange={(e) => onDedicationChange(e.target.value)}
                      className="w-full bg-neutral-50 dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-neutral-800 dark:text-neutral-200 outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-neutral-500 block">Footnote</label>
                    <input
                      type="text"
                      placeholder="Contextual footnote"
                      value={footnote}
                      onChange={(e) => onFootnoteChange(e.target.value)}
                      className="w-full bg-neutral-50 dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-neutral-800 dark:text-neutral-200 outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-neutral-500 block">Earned Afterword</label>
                    <input
                      type="text"
                      placeholder="Note unlocked after reading completion"
                      value={afterword}
                      onChange={(e) => onAfterwordChange(e.target.value)}
                      className="w-full bg-neutral-50 dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-neutral-800 dark:text-neutral-200 outline-none"
                    />
                  </div>

                  {/* Vault Lock for Poetry */}
                  {mode === "poetry" && (
                    <div className="p-3.5 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                          <Lock size={13} className={isVaulted ? "text-amber-500" : "text-neutral-400"} />
                          Vaulted Piece
                        </span>
                        <input
                          type="checkbox"
                          checked={isVaulted}
                          onChange={(e) => onIsVaultedChange(e.target.checked)}
                          className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 h-4 w-4"
                        />
                      </div>
                      {isVaulted && (
                        <input
                          type="text"
                          placeholder="Secret Passphrase (e.g. 'rain-over-lagoon')"
                          value={passphrase}
                          onChange={(e) => onPassphraseChange(e.target.value)}
                          className="w-full bg-neutral-50 dark:bg-neutral-900 border border-amber-300 dark:border-amber-900/60 rounded-xl px-3 py-2 text-neutral-800 dark:text-neutral-200 outline-none"
                        />
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
