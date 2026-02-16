"use client";

import { CareerRole } from "@/lib/types";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function CVDisplay({ roles }: { roles: CareerRole[] }) {
  const [activeRole, setActiveRole] = useState(0);
  const [copying, setCopying] = useState(false);

  const handleCopy = async () => {
    const role = roles[activeRole];
    await navigator.clipboard.writeText(role.cv);
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
  };

  const handleDownload = () => {
    const role = roles[activeRole];
    const blob = new Blob([role.cv], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CV_${role.role.replace(/\s+/g, "_")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (roles.length === 0) return null;

  const current = roles[activeRole];

  return (
    <div className="space-y-6">
      {/* Role Tabs */}
      <div className="flex flex-wrap gap-2">
        {roles.map((role, i) => (
          <button
            key={i}
            onClick={() => setActiveRole(i)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              i === activeRole
                ? "bg-emerald-400 text-gray-900"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            {role.role}
          </button>
        ))}
      </div>

      {/* Role Info */}
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white">{current.role}</h2>
            <p className="text-gray-400 mt-1">{current.description}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm transition-colors"
            >
              {copying ? (
                <>
                  <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </>
              )}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download .md
            </button>
          </div>
        </div>

        {/* Skills */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Key Skills
          </h3>
          <div className="flex flex-wrap gap-2">
            {current.skills.map((skill) => (
              <span
                key={skill}
                className="bg-emerald-400/10 text-emerald-400 px-3 py-1 rounded-full text-sm border border-emerald-400/20"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Matching Repos */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Matching Repositories ({current.matchingRepos.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {current.matchingRepos.map((repo) => (
              <a
                key={repo.id}
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 bg-gray-700/50 hover:bg-gray-700 text-gray-300 px-3 py-1 rounded-lg text-sm transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9z" />
                </svg>
                {repo.name}
              </a>
            ))}
          </div>
        </div>

        {/* CV Content */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Generated CV
            </h3>
          </div>
          <div className="prose prose-invert prose-sm max-w-none text-gray-300 leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {current.cv}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}
