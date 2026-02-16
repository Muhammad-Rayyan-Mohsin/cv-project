"use client";

import { RepoDetail } from "@/lib/types";
import { motion } from "framer-motion";
import { Star, Lock, Check } from "lucide-react";

const languageColors: Record<string, string> = {
  JavaScript: "bg-yellow-400",
  TypeScript: "bg-blue-400",
  Python: "bg-green-400",
  Java: "bg-orange-400",
  "C++": "bg-pink-400",
  C: "bg-zinc-400",
  "C#": "bg-purple-400",
  Go: "bg-cyan-400",
  Rust: "bg-orange-600",
  Ruby: "bg-red-400",
  PHP: "bg-indigo-400",
  Swift: "bg-orange-300",
  Kotlin: "bg-purple-300",
  Dart: "bg-blue-300",
  HTML: "bg-red-300",
  CSS: "bg-blue-200",
  Shell: "bg-green-300",
  Jupyter: "bg-orange-200",
};

export default function RepoCard({
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

  return (
    <motion.div
      onClick={onToggle}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.99 }}
      className={`relative p-5 rounded-2xl cursor-pointer transition-all duration-200 ${
        selected
          ? "ring-1 ring-orange-500/30 bg-orange-500/[0.03]"
          : "border border-white/[0.06] bg-zinc-950 hover:border-white/10"
      }`}
    >
      {/* Selection indicator - minimal check */}
      {selected && (
        <div className="absolute top-4 right-4">
          <div className="w-5 h-5 rounded-full bg-orange-500/15 flex items-center justify-center">
            <Check className="w-3 h-3 text-orange-400" strokeWidth={2.5} />
          </div>
        </div>
      )}

      <div className={selected ? "pr-8" : ""}>
        {/* Title row */}
        <div className="flex items-center gap-2 mb-1.5">
          <h3 className="text-white font-medium text-[15px] tracking-tight">
            {repo.name}
          </h3>
          {repo.private && (
            <Lock className="w-3 h-3 text-zinc-600" strokeWidth={1.5} />
          )}
        </div>

        {/* Description - only render if exists */}
        {repo.description && (
          <p className="text-zinc-500 text-sm mb-3 line-clamp-2 leading-relaxed">
            {repo.description}
          </p>
        )}

        {/* Footer: languages + stars */}
        <div className="flex items-center justify-between mt-3">
          {/* Languages as subtle dot + text */}
          <div className="flex items-center gap-3">
            {topLanguages.map(([lang]) => (
              <span
                key={lang}
                className="flex items-center gap-1.5 text-xs text-zinc-500"
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    languageColors[lang] || "bg-zinc-500"
                  } opacity-70`}
                />
                {lang}
              </span>
            ))}
          </div>

          {/* Stars */}
          {repo.stargazers_count > 0 && (
            <span className="flex items-center gap-1 text-xs text-zinc-600">
              <Star className="w-3 h-3" strokeWidth={1.5} />
              {repo.stargazers_count}
            </span>
          )}
        </div>

        {/* Topics - only if present, very subtle */}
        {repo.topics?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {repo.topics.slice(0, 3).map((topic) => (
              <span
                key={topic}
                className="text-[11px] text-zinc-600 bg-white/[0.03] px-2 py-0.5 rounded-full"
              >
                {topic}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
