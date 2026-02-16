"use client";

import { RepoDetail } from "@/lib/types";
import { motion } from "framer-motion";
import { Star, Lock, Check } from "lucide-react";

const languageColors: Record<string, string> = {
  JavaScript: "bg-yellow-400",
  TypeScript: "bg-blue-500",
  Python: "bg-green-500",
  Java: "bg-orange-500",
  "C++": "bg-pink-500",
  C: "bg-gray-500",
  "C#": "bg-purple-600",
  Go: "bg-cyan-400",
  Rust: "bg-orange-700",
  Ruby: "bg-red-500",
  PHP: "bg-indigo-400",
  Swift: "bg-orange-400",
  Kotlin: "bg-purple-400",
  Dart: "bg-blue-400",
  HTML: "bg-red-400",
  CSS: "bg-blue-300",
  Shell: "bg-green-400",
  Jupyter: "bg-orange-300",
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
    .slice(0, 5);
  const totalBytes = topLanguages.reduce((sum, [, bytes]) => sum + bytes, 0);

  return (
    <motion.div
      onClick={onToggle}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`relative p-5 rounded-2xl cursor-pointer transition-all duration-200 card-shimmer ${
        selected
          ? "border border-orange-500/40 bg-orange-500/5 shadow-[0_0_30px_rgba(249,115,22,0.08)]"
          : "border border-white/5 bg-zinc-950 hover:border-white/10"
      }`}
    >
      {/* Checkbox */}
      <div className="absolute top-4 right-4">
        <div
          className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
            selected
              ? "bg-gradient-to-br from-orange-500 to-amber-500"
              : "border border-white/10 bg-zinc-900"
          }`}
        >
          {selected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
        </div>
      </div>

      <div className="pr-8">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-white font-semibold text-base tracking-tight">{repo.name}</h3>
          {repo.private && (
            <span className="flex items-center gap-1 text-[10px] bg-white/5 text-zinc-500 px-2 py-0.5 rounded-full border border-white/5">
              <Lock className="w-2.5 h-2.5" strokeWidth={2} />
              Private
            </span>
          )}
        </div>

        <p className="text-zinc-500 text-sm mb-3 line-clamp-2 leading-relaxed">
          {repo.description || "No description"}
        </p>

        {topLanguages.length > 0 && (
          <div className="mb-3">
            <div className="flex h-1.5 rounded-full overflow-hidden gap-0.5">
              {topLanguages.map(([lang, bytes]) => (
                <div
                  key={lang}
                  className={`${languageColors[lang] || "bg-zinc-500"} rounded-full opacity-80`}
                  style={{ width: `${(bytes / totalBytes) * 100}%` }}
                  title={`${lang}: ${((bytes / totalBytes) * 100).toFixed(1)}%`}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {topLanguages.map(([lang]) => (
                <span
                  key={lang}
                  className="flex items-center gap-1.5 text-xs text-zinc-500"
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      languageColors[lang] || "bg-zinc-500"
                    }`}
                  />
                  {lang}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 text-xs text-zinc-600">
          {repo.topics?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {repo.topics.slice(0, 3).map((topic) => (
                <span
                  key={topic}
                  className="bg-white/5 text-zinc-500 px-2 py-0.5 rounded-full border border-white/5"
                >
                  {topic}
                </span>
              ))}
            </div>
          )}
          <span className="flex items-center gap-1 text-zinc-500">
            <Star className="w-3 h-3" strokeWidth={1.5} />
            {repo.stargazers_count}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
