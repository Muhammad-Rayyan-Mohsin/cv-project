"use client";

import { EducationEntry } from "@/lib/cv-types";
import { Plus, Trash2 } from "lucide-react";

export default function EducationEditor({
  value,
  onChange,
}: {
  value: EducationEntry[];
  onChange: (v: EducationEntry[]) => void;
}) {
  const addEntry = () => {
    onChange([
      ...value,
      {
        id: crypto.randomUUID(),
        institution: "",
        degree: "",
        startDate: "",
        endDate: "",
        details: "",
      },
    ]);
  };

  const removeEntry = (id: string) => {
    onChange(value.filter((e) => e.id !== id));
  };

  const updateField = (id: string, field: keyof EducationEntry, val: string) => {
    onChange(value.map((e) => (e.id === id ? { ...e, [field]: val } : e)));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Education
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
        {value.map((edu) => (
          <div
            key={edu.id}
            className="rounded-xl bg-black/40 border border-white/[0.04] p-3 space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={edu.degree}
                  onChange={(e) => updateField(edu.id, "degree", e.target.value)}
                  placeholder="Degree (e.g. BSc CS)"
                  className="bg-transparent border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/30"
                />
                <input
                  type="text"
                  value={edu.institution}
                  onChange={(e) =>
                    updateField(edu.id, "institution", e.target.value)
                  }
                  placeholder="University"
                  className="bg-transparent border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/30"
                />
                <input
                  type="text"
                  value={edu.startDate}
                  onChange={(e) =>
                    updateField(edu.id, "startDate", e.target.value)
                  }
                  placeholder="Start"
                  className="bg-transparent border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/30"
                />
                <input
                  type="text"
                  value={edu.endDate}
                  onChange={(e) =>
                    updateField(edu.id, "endDate", e.target.value)
                  }
                  placeholder="End"
                  className="bg-transparent border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/30"
                />
              </div>
              <button
                onClick={() => removeEntry(edu.id)}
                className="p-1 text-zinc-600 hover:text-red-400 transition-colors mt-1"
              >
                <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
            </div>
            <input
              type="text"
              value={edu.details}
              onChange={(e) => updateField(edu.id, "details", e.target.value)}
              placeholder="Details (GPA, honors, thesis)"
              className="w-full bg-transparent border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/30"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
