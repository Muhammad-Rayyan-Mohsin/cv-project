"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";

export default function CertificationsEditor({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [input, setInput] = useState("");

  const addCert = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onChange([...value, trimmed]);
    setInput("");
  };

  const removeCert = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 block">
        Certifications
      </label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {value.map((cert, i) => (
          <span
            key={i}
            className="flex items-center gap-1.5 bg-white/5 text-zinc-300 px-2.5 py-1 rounded-full text-xs border border-white/5"
          >
            {cert}
            <button
              onClick={() => removeCert(i)}
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
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCert();
            }
          }}
          placeholder="Type certification and press Enter"
          className="flex-1 bg-transparent border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/30"
        />
        <button
          onClick={addCert}
          className="p-1.5 text-orange-400 hover:text-orange-300 transition-colors"
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
