"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, Layers } from "lucide-react";
import RepoCard from "./RepoCard";
import type { RepoDetail } from "@/lib/types";

interface RepoCategoryGroupProps {
  title: string;
  description: string;
  skills: string[];
  repos: RepoDetail[];
  selectedRepoIds: Set<number>;
  onToggleCategory: () => void;
  onToggleRepo: (repoId: number) => void;
  allSelected: boolean;
  defaultExpanded?: boolean;
  index?: number;
}

export default function RepoCategoryGroup({
  title,
  description,
  skills,
  repos,
  selectedRepoIds,
  onToggleCategory,
  onToggleRepo,
  allSelected,
  defaultExpanded = true,
  index = 0,
}: RepoCategoryGroupProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const selectedCount = repos.filter((r) => selectedRepoIds.has(r.id)).length;
  const selectionRatio = repos.length > 0 ? selectedCount / repos.length : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="group mb-5 relative"
    >
      {/* Ambient glow when category is fully selected */}
      {allSelected && (
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent blur-sm pointer-events-none" />
      )}

      <div className={`relative rounded-2xl overflow-hidden border transition-all duration-300 ${
        allSelected
          ? "border-amber-500/20 bg-gradient-to-b from-amber-500/[0.04] to-transparent"
          : "border-white/[0.06] bg-zinc-950/80 hover:border-white/[0.1]"
      }`}>
        {/* Category Header */}
        <div
          className="flex items-start gap-4 p-5 cursor-pointer transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          {/* Left: Icon + expand indicator */}
          <div className="relative mt-0.5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
              allSelected
                ? "bg-gradient-to-br from-amber-500/20 to-orange-500/10 shadow-[0_0_20px_rgba(245,158,11,0.1)]"
                : "bg-white/[0.04] group-hover:bg-white/[0.06]"
            }`}>
              <Layers className={`w-4.5 h-4.5 transition-colors ${
                allSelected ? "text-amber-400" : "text-zinc-500"
              }`} strokeWidth={1.5} />
            </div>
            {/* Selection progress ring */}
            <svg className="absolute -inset-0.5 w-[calc(100%+4px)] h-[calc(100%+4px)]" viewBox="0 0 44 44">
              <circle
                cx="22" cy="22" r="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeDasharray={`${selectionRatio * 125.6} 125.6`}
                strokeLinecap="round"
                className={`transition-all duration-500 ${allSelected ? "text-amber-500/60" : "text-white/10"}`}
                transform="rotate(-90 22 22)"
              />
            </svg>
          </div>

          {/* Center: Title, description, skills */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-[17px] font-semibold text-white tracking-[-0.01em]">
                {title}
              </h3>
              <span className={`text-xs font-mono px-2 py-0.5 rounded-md transition-colors ${
                allSelected
                  ? "text-amber-400/90 bg-amber-500/10"
                  : "text-zinc-600 bg-white/[0.03]"
              }`}>
                {selectedCount}/{repos.length}
              </span>
            </div>
            <p className="text-sm text-zinc-500 leading-relaxed line-clamp-2">
              {description}
            </p>

            {/* Skill badges — refined pill style */}
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {skills.slice(0, 6).map((skill) => (
                  <span
                    key={skill}
                    className="text-[11px] font-medium tracking-wide uppercase px-2.5 py-1 rounded-lg bg-white/[0.03] text-zinc-500 border border-white/[0.04] transition-colors hover:text-zinc-400 hover:border-white/[0.08]"
                  >
                    {skill}
                  </span>
                ))}
                {skills.length > 6 && (
                  <span className="text-[11px] text-zinc-600 px-2 py-1">
                    +{skills.length - 6}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Select All toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleCategory();
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                allSelected
                  ? "bg-amber-500/15 text-amber-400 border border-amber-500/25 shadow-[0_0_12px_rgba(245,158,11,0.08)]"
                  : "bg-white/[0.04] text-zinc-500 border border-white/[0.06] hover:text-zinc-300 hover:border-white/[0.1] hover:bg-white/[0.06]"
              }`}
              aria-label={
                allSelected
                  ? `Deselect all repos in ${title}`
                  : `Select all repos in ${title}`
              }
            >
              {allSelected && <Check className="w-3 h-3" strokeWidth={2.5} />}
              {allSelected ? "All" : "Select"}
            </button>

            {/* Chevron */}
            <motion.div
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-zinc-600"
            >
              <ChevronDown className="w-4 h-4" strokeWidth={1.5} />
            </motion.div>
          </div>
        </div>

        {/* Expandable Repo Grid */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="overflow-hidden"
            >
              <div className="mx-5 mb-5 pt-0">
                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent mb-4" />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {repos.map((repo, i) => (
                    <motion.div
                      key={repo.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.03 }}
                    >
                      <RepoCard
                        repo={repo}
                        selected={selectedRepoIds.has(repo.id)}
                        onToggle={() => onToggleRepo(repo.id)}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
