"use client";

export default function SummaryEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 block">
        Professional Summary
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder="A 2-3 sentence summary highlighting your key strengths and experience..."
        className="w-full bg-transparent border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/30 transition-colors resize-none leading-relaxed"
      />
      <p className="text-[11px] text-zinc-600 mt-1">
        {value.length} characters
      </p>
    </div>
  );
}
