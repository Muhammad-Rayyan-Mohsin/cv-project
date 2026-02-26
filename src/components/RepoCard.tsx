"use client";

import React from "react";
import { RepoDetail } from "@/lib/types";
import { motion } from "framer-motion";
import { Star, Lock, GitFork, Check } from "lucide-react";

const languageColors: Record<string, string> = {
  JavaScript: "#f7df1e",
  TypeScript: "#3178c6",
  Python: "#3572A5",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#178600",
  Go: "#00ADD8",
  Rust: "#dea584",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Shell: "#89e051",
  Jupyter: "#DA5B0B",
  Vue: "#41b883",
  Svelte: "#ff3e00",
  Lua: "#000080",
  Scala: "#c22d40",
  R: "#198CE7",
  Haskell: "#5e5086",
};

function RepoCard({
  repo,
  selected,
  onToggle,
}: {
  repo: RepoDetail;
  selected: boolean;
  onToggle: () => void;
}) {
  const topLanguages = Object.entries(repo.languages || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  const totalBytes = topLanguages.reduce((sum, [, bytes]) => sum + bytes, 0);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onToggle();
    }
  };

  return (
    <motion.div
      onClick={onToggle}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${repo.name}${selected ? " (selected)" : ""} — click to ${selected ? "deselect" : "select"}`}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.985 }}
      className={`relative h-full flex flex-col rounded-xl cursor-pointer transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 overflow-hidden ${
        selected
          ? "bg-amber-500/[0.04] ring-1 ring-amber-500/20"
          : "bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.05] hover:border-white/[0.09]"
      }`}
    >
      {/* Language bar at top — thin colored strip */}
      {topLanguages.length > 0 && (
        <div className="flex h-[3px] w-full">
          {topLanguages.map(([lang, bytes]) => (
            <div
              key={lang}
              className="h-full first:rounded-tl-xl last:rounded-tr-xl transition-all"
              style={{
                width: `${(bytes / totalBytes) * 100}%`,
                backgroundColor: languageColors[lang] || "#71717a",
                opacity: selected ? 0.7 : 0.35,
              }}
            />
          ))}
        </div>
      )}

      <div className="p-4 flex flex-col flex-1">
        {/* Title row */}
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-white font-medium text-[14px] tracking-[-0.01em] truncate">
              {repo.name}
            </h3>
            {repo.private && (
              <Lock className="w-3 h-3 text-zinc-600 shrink-0" strokeWidth={1.5} />
            )}
          </div>

          {/* Selection indicator */}
          <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all duration-200 ${
            selected
              ? "bg-amber-500/20 border border-amber-500/30"
              : "border border-white/[0.08] bg-white/[0.02]"
          }`}>
            {selected && <Check className="w-3 h-3 text-amber-400" strokeWidth={2.5} />}
          </div>
        </div>

        {/* Description */}
        {repo.description && (
          <p className="text-zinc-500 text-[13px] line-clamp-2 leading-relaxed mb-auto">
            {repo.description}
          </p>
        )}

        {/* Spacer */}
        {!repo.description && <div className="flex-1" />}

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.04]">
          {/* Languages as text */}
          <div className="flex items-center gap-2.5 min-w-0">
            {topLanguages.map(([lang]) => (
              <span
                key={lang}
                className="flex items-center gap-1.5 text-[12px] text-zinc-500"
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    backgroundColor: languageColors[lang] || "#71717a",
                    opacity: 0.6,
                  }}
                />
                <span className="truncate">{lang}</span>
              </span>
            ))}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-2.5 shrink-0">
            {repo.stargazers_count > 0 && (
              <span className="flex items-center gap-1 text-[12px] text-zinc-600">
                <Star className="w-3 h-3" strokeWidth={1.5} />
                {repo.stargazers_count}
              </span>
            )}
            {repo.forks_count > 0 && (
              <span className="flex items-center gap-1 text-[12px] text-zinc-600">
                <GitFork className="w-3 h-3" strokeWidth={1.5} />
                {repo.forks_count}
              </span>
            )}
          </div>
        </div>

        {/* Topics — condensed */}
        {repo.topics?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2.5">
            {repo.topics.slice(0, 4).map((topic) => (
              <span
                key={topic}
                className="text-[10px] tracking-wide text-zinc-600 bg-white/[0.03] px-1.5 py-0.5 rounded"
              >
                {topic}
              </span>
            ))}
            {repo.topics.length > 4 && (
              <span className="text-[10px] text-zinc-700 px-1">
                +{repo.topics.length - 4}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default React.memo(RepoCard);
