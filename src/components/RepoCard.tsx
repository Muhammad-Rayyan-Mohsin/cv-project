"use client";

import { RepoDetail } from "@/lib/types";

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
    <div
      onClick={onToggle}
      className={`relative p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
        selected
          ? "border-emerald-400 bg-emerald-400/5 shadow-lg shadow-emerald-400/10"
          : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
      }`}
    >
      <div className="absolute top-4 right-4">
        <div
          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
            selected
              ? "bg-emerald-400 border-emerald-400"
              : "border-gray-600"
          }`}
        >
          {selected && (
            <svg className="w-3 h-3 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>

      <div className="pr-8">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-white font-semibold text-lg">{repo.name}</h3>
          {repo.private && (
            <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">
              Private
            </span>
          )}
        </div>

        <p className="text-gray-400 text-sm mb-3 line-clamp-2">
          {repo.description || "No description"}
        </p>

        {topLanguages.length > 0 && (
          <div className="mb-3">
            <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
              {topLanguages.map(([lang, bytes]) => (
                <div
                  key={lang}
                  className={`${languageColors[lang] || "bg-gray-500"} rounded-full`}
                  style={{ width: `${(bytes / totalBytes) * 100}%` }}
                  title={`${lang}: ${((bytes / totalBytes) * 100).toFixed(1)}%`}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {topLanguages.map(([lang]) => (
                <span
                  key={lang}
                  className="flex items-center gap-1 text-xs text-gray-400"
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      languageColors[lang] || "bg-gray-500"
                    }`}
                  />
                  {lang}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 text-xs text-gray-500">
          {repo.topics?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {repo.topics.slice(0, 3).map((topic) => (
                <span
                  key={topic}
                  className="bg-gray-700/50 text-gray-400 px-2 py-0.5 rounded-full"
                >
                  {topic}
                </span>
              ))}
            </div>
          )}
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z" />
            </svg>
            {repo.stargazers_count}
          </span>
        </div>
      </div>
    </div>
  );
}
