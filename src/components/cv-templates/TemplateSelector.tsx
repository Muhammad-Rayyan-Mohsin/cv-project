"use client";

import { TemplateId } from "@/lib/cv-types";
import { motion } from "framer-motion";

interface TemplateInfo {
  id: TemplateId;
  name: string;
  description: string;
}

const templates: TemplateInfo[] = [
  {
    id: "classic",
    name: "Classic",
    description: "Clean single-column ATS-friendly layout",
  },
  {
    id: "modern",
    name: "Modern",
    description: "Sidebar layout with skills panel",
  },
  {
    id: "professional",
    name: "Professional",
    description: "Photo support with accent styling",
  },
  {
    id: "creative",
    name: "Creative",
    description: "Colorful banner with visual tags",
  },
];

// Miniature layout wireframes
function LayoutThumbnail({ id, selected }: { id: TemplateId; selected: boolean }) {
  const accent = selected ? "bg-orange-400" : "bg-zinc-500";
  const bar = selected ? "bg-orange-400/50" : "bg-zinc-600";
  const line = selected ? "bg-orange-400/30" : "bg-zinc-700";

  if (id === "classic") {
    return (
      <div className="w-full aspect-[3/4] rounded bg-zinc-800 p-1.5 flex flex-col gap-1">
        <div className={`h-1.5 w-3/4 rounded-sm ${accent}`} />
        <div className={`h-0.5 w-full rounded-sm ${bar}`} />
        <div className="flex-1 flex flex-col gap-0.5 mt-0.5">
          <div className={`h-0.5 w-1/3 rounded-sm ${accent}`} />
          <div className={`h-0.5 w-full rounded-sm ${line}`} />
          <div className={`h-0.5 w-full rounded-sm ${line}`} />
          <div className={`h-0.5 w-1/3 rounded-sm ${accent} mt-0.5`} />
          <div className={`h-0.5 w-full rounded-sm ${line}`} />
          <div className={`h-0.5 w-4/5 rounded-sm ${line}`} />
        </div>
      </div>
    );
  }

  if (id === "modern") {
    return (
      <div className="w-full aspect-[3/4] rounded bg-zinc-800 p-0 flex overflow-hidden">
        <div className="w-[35%] bg-slate-700 p-1 flex flex-col gap-0.5">
          <div className={`h-3 w-3 rounded-full mx-auto ${selected ? "bg-orange-400" : "bg-zinc-500"}`} />
          <div className={`h-0.5 w-3/4 mx-auto rounded-sm ${accent} mt-0.5`} />
          <div className={`h-0.5 w-full rounded-sm ${line}`} />
          <div className={`h-0.5 w-full rounded-sm ${line}`} />
          <div className={`h-0.5 w-2/3 rounded-sm ${line}`} />
        </div>
        <div className="flex-1 p-1 flex flex-col gap-0.5">
          <div className={`h-0.5 w-2/3 rounded-sm ${accent}`} />
          <div className={`h-0.5 w-full rounded-sm ${line}`} />
          <div className={`h-0.5 w-full rounded-sm ${line}`} />
          <div className={`h-0.5 w-1/2 rounded-sm ${accent} mt-0.5`} />
          <div className={`h-0.5 w-full rounded-sm ${line}`} />
          <div className={`h-0.5 w-4/5 rounded-sm ${line}`} />
        </div>
      </div>
    );
  }

  if (id === "professional") {
    return (
      <div className="w-full aspect-[3/4] rounded bg-zinc-800 p-1.5 flex flex-col gap-1">
        <div className="flex gap-1.5 items-start">
          <div className={`w-3 h-3 rounded shrink-0 ${selected ? "bg-orange-400" : "bg-zinc-500"}`} />
          <div className="flex-1 flex flex-col gap-0.5">
            <div className={`h-1.5 w-full rounded-sm ${accent}`} />
            <div className={`h-0.5 w-full rounded-sm ${bar}`} />
          </div>
        </div>
        <div className={`h-[2px] w-full rounded-sm ${selected ? "bg-indigo-400" : "bg-zinc-600"}`} />
        <div className="flex-1 flex flex-col gap-0.5">
          <div className={`h-0.5 w-1/3 rounded-sm ${accent}`} />
          <div className={`h-0.5 w-full rounded-sm ${line}`} />
          <div className={`h-0.5 w-full rounded-sm ${line}`} />
          <div className={`h-0.5 w-1/3 rounded-sm ${accent} mt-0.5`} />
          <div className={`h-0.5 w-full rounded-sm ${line}`} />
        </div>
      </div>
    );
  }

  // Creative
  return (
    <div className="w-full aspect-[3/4] rounded bg-zinc-800 overflow-hidden flex flex-col">
      <div className={`h-[30%] ${selected ? "bg-emerald-600" : "bg-zinc-600"} p-1 flex items-center gap-1`}>
        <div className="w-3 h-3 rounded-full bg-white/30 shrink-0" />
        <div className="flex-1 flex flex-col gap-0.5">
          <div className="h-1 w-3/4 rounded-sm bg-white/60" />
          <div className="h-0.5 w-full rounded-sm bg-white/30" />
        </div>
      </div>
      <div className="flex-1 p-1 flex flex-col gap-0.5">
        <div className="flex flex-wrap gap-0.5">
          <div className={`h-1.5 w-4 rounded-full ${selected ? "bg-emerald-400/30" : "bg-zinc-700"}`} />
          <div className={`h-1.5 w-3 rounded-full ${selected ? "bg-emerald-400/30" : "bg-zinc-700"}`} />
          <div className={`h-1.5 w-5 rounded-full ${selected ? "bg-emerald-400/30" : "bg-zinc-700"}`} />
        </div>
        <div className={`h-0.5 w-1/2 rounded-sm ${accent} mt-0.5`} />
        <div className={`h-0.5 w-full rounded-sm ${line}`} />
        <div className={`h-0.5 w-full rounded-sm ${line}`} />
      </div>
    </div>
  );
}

export default function TemplateSelector({
  selected,
  onChange,
}: {
  selected: TemplateId;
  onChange: (id: TemplateId) => void;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 block">
        Template
      </label>
      <div className="grid grid-cols-4 gap-2">
        {templates.map((t) => (
          <motion.button
            key={t.id}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onChange(t.id)}
            className={`rounded-xl p-2 transition-all text-left ${
              selected === t.id
                ? "bg-orange-500/10 border-2 border-orange-500/40 ring-1 ring-orange-500/20"
                : "bg-black/40 border border-white/[0.06] hover:border-white/10"
            }`}
          >
            <LayoutThumbnail id={t.id} selected={selected === t.id} />
            <p
              className={`text-[10px] font-semibold mt-1.5 ${
                selected === t.id ? "text-orange-400" : "text-zinc-400"
              }`}
            >
              {t.name}
            </p>
            <p className="text-[9px] text-zinc-600 leading-tight">{t.description}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
