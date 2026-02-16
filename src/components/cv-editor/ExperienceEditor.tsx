"use client";

import { ExperienceEntry } from "@/lib/cv-types";
import { Plus, Trash2, X, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

export default function ExperienceEditor({
  value,
  onChange,
}: {
  value: ExperienceEntry[];
  onChange: (v: ExperienceEntry[]) => void;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set(value.map((e) => e.id))
  );

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addEntry = () => {
    const id = crypto.randomUUID();
    onChange([
      ...value,
      {
        id,
        title: "",
        organization: "Personal Project",
        startDate: "",
        endDate: "",
        bullets: [""],
        technologies: [],
        repoUrl: "",
      },
    ]);
    setExpanded((prev) => new Set(prev).add(id));
  };

  const removeEntry = (id: string) => {
    onChange(value.filter((e) => e.id !== id));
  };

  const updateField = (
    id: string,
    field: keyof ExperienceEntry,
    val: string | string[]
  ) => {
    onChange(value.map((e) => (e.id === id ? { ...e, [field]: val } : e)));
  };

  const addBullet = (id: string) => {
    onChange(
      value.map((e) =>
        e.id === id ? { ...e, bullets: [...e.bullets, ""] } : e
      )
    );
  };

  const updateBullet = (id: string, bulletIndex: number, text: string) => {
    onChange(
      value.map((e) =>
        e.id === id
          ? {
              ...e,
              bullets: e.bullets.map((b, i) => (i === bulletIndex ? text : b)),
            }
          : e
      )
    );
  };

  const removeBullet = (id: string, bulletIndex: number) => {
    onChange(
      value.map((e) =>
        e.id === id
          ? { ...e, bullets: e.bullets.filter((_, i) => i !== bulletIndex) }
          : e
      )
    );
  };

  const [techInputs, setTechInputs] = useState<Record<string, string>>({});

  const addTech = (id: string) => {
    const input = (techInputs[id] || "").trim();
    if (!input) return;
    onChange(
      value.map((e) =>
        e.id === id
          ? { ...e, technologies: [...e.technologies, input] }
          : e
      )
    );
    setTechInputs((prev) => ({ ...prev, [id]: "" }));
  };

  const removeTech = (id: string, techIndex: number) => {
    onChange(
      value.map((e) =>
        e.id === id
          ? {
              ...e,
              technologies: e.technologies.filter((_, i) => i !== techIndex),
            }
          : e
      )
    );
  };

  const moveEntry = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= value.length) return;
    const updated = [...value];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    onChange(updated);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Experience
        </label>
        <button
          onClick={addEntry}
          className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 transition-colors"
        >
          <Plus className="w-3 h-3" strokeWidth={2} />
          Add Entry
        </button>
      </div>

      <div className="space-y-3">
        {value.map((entry, index) => (
          <div
            key={entry.id}
            className="rounded-xl bg-black/40 border border-white/[0.04] overflow-hidden"
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-white/[0.02]"
              onClick={() => toggleExpand(entry.id)}
            >
              <span className="text-sm text-white font-medium truncate">
                {entry.title || "Untitled Entry"}
              </span>
              <div className="flex items-center gap-1">
                {index > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveEntry(index, -1);
                    }}
                    className="p-1 text-zinc-600 hover:text-white transition-colors"
                  >
                    <ChevronUp className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </button>
                )}
                {index < value.length - 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveEntry(index, 1);
                    }}
                    className="p-1 text-zinc-600 hover:text-white transition-colors"
                  >
                    <ChevronDown className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeEntry(entry.id);
                  }}
                  className="p-1 text-zinc-600 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
              </div>
            </div>

            {/* Expanded Content */}
            {expanded.has(entry.id) && (
              <div className="px-3 pb-3 space-y-3 border-t border-white/[0.04]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3">
                  <input
                    type="text"
                    value={entry.title}
                    onChange={(e) =>
                      updateField(entry.id, "title", e.target.value)
                    }
                    placeholder="Project / Role Title"
                    className="bg-transparent border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/30"
                  />
                  <input
                    type="text"
                    value={entry.organization}
                    onChange={(e) =>
                      updateField(entry.id, "organization", e.target.value)
                    }
                    placeholder="Organization"
                    className="bg-transparent border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/30"
                  />
                  <input
                    type="text"
                    value={entry.startDate}
                    onChange={(e) =>
                      updateField(entry.id, "startDate", e.target.value)
                    }
                    placeholder="Start date"
                    className="bg-transparent border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/30"
                  />
                  <input
                    type="text"
                    value={entry.endDate}
                    onChange={(e) =>
                      updateField(entry.id, "endDate", e.target.value)
                    }
                    placeholder="End date"
                    className="bg-transparent border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/30"
                  />
                </div>

                {/* Bullets */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-zinc-500">
                      Achievements
                    </span>
                    <button
                      onClick={() => addBullet(entry.id)}
                      className="text-[11px] text-orange-400 hover:text-orange-300"
                    >
                      + Add bullet
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {entry.bullets.map((bullet, bi) => (
                      <div key={bi} className="flex items-start gap-1.5">
                        <span className="text-zinc-600 text-xs mt-1.5">
                          •
                        </span>
                        <input
                          type="text"
                          value={bullet}
                          onChange={(e) =>
                            updateBullet(entry.id, bi, e.target.value)
                          }
                          placeholder="Achievement or responsibility..."
                          className="flex-1 bg-transparent border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/30"
                        />
                        {entry.bullets.length > 1 && (
                          <button
                            onClick={() => removeBullet(entry.id, bi)}
                            className="p-1 text-zinc-600 hover:text-red-400 mt-0.5"
                          >
                            <X className="w-3 h-3" strokeWidth={2} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Technologies */}
                <div>
                  <span className="text-[11px] text-zinc-500 mb-1.5 block">
                    Technologies
                  </span>
                  <div className="flex flex-wrap gap-1 mb-1.5">
                    {entry.technologies.map((tech, ti) => (
                      <span
                        key={ti}
                        className="flex items-center gap-1 bg-white/5 text-zinc-400 px-2 py-0.5 rounded-full text-[11px] border border-white/5"
                      >
                        {tech}
                        <button
                          onClick={() => removeTech(entry.id, ti)}
                          className="hover:text-red-400"
                        >
                          <X className="w-2.5 h-2.5" strokeWidth={2} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={techInputs[entry.id] || ""}
                    onChange={(e) =>
                      setTechInputs((prev) => ({
                        ...prev,
                        [entry.id]: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTech(entry.id);
                      }
                    }}
                    placeholder="Type tech and press Enter"
                    className="w-full bg-transparent border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-[11px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/30"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
