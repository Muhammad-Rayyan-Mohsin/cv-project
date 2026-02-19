"use client";

import { BehanceProjectCard } from "@/lib/behance-types";
import { motion } from "framer-motion";
import { Eye, Heart, Check } from "lucide-react";

export default function BehanceCard({
  project,
  selected,
  onToggle,
}: {
  project: BehanceProjectCard;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.div
      onClick={onToggle}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.99 }}
      className={`relative h-full flex flex-col rounded-2xl cursor-pointer transition-all duration-200 overflow-hidden ${
        selected
          ? "ring-1 ring-blue-500/30 bg-blue-500/[0.03]"
          : "border border-white/[0.06] bg-zinc-950 hover:border-white/10"
      }`}
    >
      {/* Cover image */}
      {project.coverUrl && (
        <div className="relative w-full aspect-[16/10] overflow-hidden bg-zinc-900">
          <img
            src={project.coverUrl}
            alt={project.name}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            loading="lazy"
          />
          {/* Gradient overlay at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-zinc-950/80 to-transparent" />
        </div>
      )}

      {/* Selection indicator */}
      {selected && (
        <div className="absolute top-3 right-3 z-10">
          <div className="w-6 h-6 rounded-full bg-blue-500/20 backdrop-blur-sm flex items-center justify-center border border-blue-500/30">
            <Check className="w-3.5 h-3.5 text-blue-400" strokeWidth={2.5} />
          </div>
        </div>
      )}

      <div className="flex flex-col flex-1 p-4">
        {/* Title */}
        <h3 className="text-white font-medium text-[15px] tracking-tight line-clamp-1 mb-1">
          {project.name}
        </h3>

        {/* Description */}
        {project.description && (
          <p className="text-zinc-500 text-sm line-clamp-2 leading-relaxed mb-2">
            {project.description}
          </p>
        )}

        {/* Fields / categories */}
        {project.fields.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {project.fields.slice(0, 3).map((field) => (
              <span
                key={field}
                className="text-[11px] bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/15"
              >
                {field}
              </span>
            ))}
          </div>
        )}

        {/* Tools used */}
        {project.tools.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {project.tools.slice(0, 4).map((tool) => (
              <span
                key={tool}
                className="text-[11px] bg-white/[0.04] text-zinc-500 px-2 py-0.5 rounded-full border border-white/[0.06]"
              >
                {tool}
              </span>
            ))}
            {project.tools.length > 4 && (
              <span className="text-[11px] text-zinc-600">
                +{project.tools.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Footer with stats */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.04]">
          <div className="flex items-center gap-3">
            {project.views > 0 && (
              <span className="flex items-center gap-1 text-xs text-zinc-500">
                <Eye className="w-3.5 h-3.5" strokeWidth={1.5} />
                {formatCount(project.views)}
              </span>
            )}
            {project.appreciations > 0 && (
              <span className="flex items-center gap-1 text-xs text-zinc-500">
                <Heart className="w-3.5 h-3.5" strokeWidth={1.5} />
                {formatCount(project.appreciations)}
              </span>
            )}
          </div>

          {/* Published date */}
          <span className="text-[11px] text-zinc-600">
            {new Date(project.publishedAt).toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}
