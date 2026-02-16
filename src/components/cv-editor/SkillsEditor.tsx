"use client";

import { SkillCategory } from "@/lib/cv-types";
import { Plus, X, Trash2 } from "lucide-react";
import { useState } from "react";

export default function SkillsEditor({
  value,
  onChange,
}: {
  value: SkillCategory[];
  onChange: (v: SkillCategory[]) => void;
}) {
  const [newItemInputs, setNewItemInputs] = useState<Record<number, string>>(
    {}
  );

  const addCategory = () => {
    onChange([...value, { category: "New Category", items: [] }]);
  };

  const removeCategory = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const updateCategoryName = (index: number, name: string) => {
    onChange(value.map((c, i) => (i === index ? { ...c, category: name } : c)));
  };

  const addItem = (catIndex: number) => {
    const input = (newItemInputs[catIndex] || "").trim();
    if (!input) return;
    onChange(
      value.map((c, i) =>
        i === catIndex ? { ...c, items: [...c.items, input] } : c
      )
    );
    setNewItemInputs((prev) => ({ ...prev, [catIndex]: "" }));
  };

  const removeItem = (catIndex: number, itemIndex: number) => {
    onChange(
      value.map((c, i) =>
        i === catIndex
          ? { ...c, items: c.items.filter((_, j) => j !== itemIndex) }
          : c
      )
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Skills
        </label>
        <button
          onClick={addCategory}
          className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 transition-colors"
        >
          <Plus className="w-3 h-3" strokeWidth={2} />
          Add Category
        </button>
      </div>

      <div className="space-y-3">
        {value.map((cat, catIndex) => (
          <div
            key={catIndex}
            className="rounded-xl bg-black/40 border border-white/[0.04] p-3"
          >
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={cat.category}
                onChange={(e) => updateCategoryName(catIndex, e.target.value)}
                className="flex-1 bg-transparent text-sm text-white font-medium focus:outline-none border-b border-transparent focus:border-orange-500/30 pb-0.5"
              />
              <button
                onClick={() => removeCategory(catIndex)}
                className="p-1 text-zinc-600 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {cat.items.map((item, itemIndex) => (
                <span
                  key={itemIndex}
                  className="flex items-center gap-1 bg-orange-500/10 text-orange-300 px-2 py-0.5 rounded-full text-xs border border-orange-500/20"
                >
                  {item}
                  <button
                    onClick={() => removeItem(catIndex, itemIndex)}
                    className="hover:text-red-400 transition-colors"
                  >
                    <X className="w-3 h-3" strokeWidth={2} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newItemInputs[catIndex] || ""}
                onChange={(e) =>
                  setNewItemInputs((prev) => ({
                    ...prev,
                    [catIndex]: e.target.value,
                  }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addItem(catIndex);
                  }
                }}
                placeholder="Type skill and press Enter"
                className="flex-1 bg-transparent border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/30"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
