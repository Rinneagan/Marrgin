import React from "react";
import { Database, Calendar, BarChart3, Ruler, Layers } from "lucide-react";

interface DataStoryMetadataProps {
  datasetName?: string;
  dataSource?: string;
  dataTimeframe?: string;
  dataUnits?: string;
  dataConfig?: string;
}

export default function DataStoryMetadata({
  datasetName,
  dataSource,
  dataTimeframe,
  dataUnits,
  dataConfig,
}: DataStoryMetadataProps) {
  const hasMetadata = Boolean(datasetName || dataSource || dataTimeframe || dataUnits);

  return (
    <div className="my-8 font-sans">
      {hasMetadata && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5 rounded-2xl bg-white/[0.02] dark:bg-white/[0.01] border border-gray-200/80 dark:border-gray-800/80 mb-8">
          {datasetName && (
            <div className="space-y-1">
              <span className="flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-gray-400">
                <Database size={12} className="text-accent" /> Dataset
              </span>
              <p className="font-serif text-sm md:text-base font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                {datasetName}
              </p>
            </div>
          )}

          {dataSource && (
            <div className="space-y-1">
              <span className="flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-gray-400">
                <Layers size={12} className="text-accent" /> Source
              </span>
              <p className="font-serif text-sm md:text-base font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                {dataSource}
              </p>
            </div>
          )}

          {dataTimeframe && (
            <div className="space-y-1">
              <span className="flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-gray-400">
                <Calendar size={12} className="text-accent" /> Timeframe
              </span>
              <p className="font-serif text-sm md:text-base font-medium text-gray-900 dark:text-gray-100">
                {dataTimeframe}
              </p>
            </div>
          )}

          {dataUnits && (
            <div className="space-y-1">
              <span className="flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-gray-400">
                <Ruler size={12} className="text-accent" /> Units
              </span>
              <p className="font-serif text-sm md:text-base font-medium text-gray-900 dark:text-gray-100">
                {dataUnits}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Clean Analytical Visualization Slot (Placeholder for Phase 7 infrastructure) */}
      <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-800/90 p-8 text-center bg-black/[0.01] dark:bg-white/[0.01]">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 text-accent mb-3">
          <BarChart3 size={22} />
        </div>
        <h4 className="font-serif text-lg text-gray-800 dark:text-gray-200">
          Analytical Visualization Slot
        </h4>
        <p className="text-xs text-gray-500 font-sans mt-1 max-w-md mx-auto">
          Interactive map and charting engine will be mounted here in Phase 7. The underlying data schema and units are anchored above.
        </p>
      </div>
    </div>
  );
}
