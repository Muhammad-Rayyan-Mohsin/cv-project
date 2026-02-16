"use client";

import { CareerRole } from "@/lib/types";
import { StructuredCV } from "@/lib/cv-types";
import { mergeProfileIntoCv, createEmptyPersonalDetails } from "@/lib/cv-utils";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Copy,
  Check,
  Download,
  BookOpen,
  ExternalLink,
  Pencil,
} from "lucide-react";
import CVEditor from "./cv-editor/CVEditor";
import CVPreview from "./cv-editor/CVPreview";
import PDFDownloadButton from "./cv-pdf/PDFDownloadButton";

interface ProfileData {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedIn: string;
  github: string;
  website: string;
  education: any[];
  avatarUrl?: string;
}

export default function CVDisplay({
  roles,
  cvIds,
}: {
  roles: CareerRole[];
  cvIds?: string[];
}) {
  const [activeRole, setActiveRole] = useState(0);
  const [copying, setCopying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
      }
    } catch {
      // Profile not critical for display
    }
  };

  const handleCopy = async () => {
    const role = roles[activeRole];
    await navigator.clipboard.writeText(role.cv);
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
  };

  const handleDownloadMd = () => {
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
  const hasStructured = !!current.structuredCv;

  // Merge profile data into structured CV for preview/PDF
  const getMergedCv = (): StructuredCV | null => {
    if (!current.structuredCv) return null;
    if (profile) {
      return mergeProfileIntoCv(current.structuredCv, profile);
    }
    return {
      ...current.structuredCv,
      personalDetails:
        current.structuredCv.personalDetails?.fullName
          ? current.structuredCv.personalDetails
          : createEmptyPersonalDetails(),
    };
  };

  const mergedCv = getMergedCv();

  // Editing mode
  if (editing && mergedCv) {
    return (
      <div className="space-y-6">
        {/* Role Tabs */}
        <div className="flex flex-wrap gap-2">
          {roles.map((role, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setActiveRole(i);
                setEditing(!!roles[i].structuredCv);
              }}
              className={`px-4 py-2 rounded-full font-medium text-sm transition-all ${
                i === activeRole
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.2)]"
                  : "bg-zinc-950 text-zinc-400 border border-white/5 hover:border-white/10 hover:text-white"
              }`}
            >
              {role.role}
            </motion.button>
          ))}
        </div>

        <CVEditor
          initialData={mergedCv}
          cvId={cvIds?.[activeRole]}
          roleName={current.role}
          onBack={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Role Tabs */}
      <div className="flex flex-wrap gap-2">
        {roles.map((role, i) => (
          <motion.button
            key={i}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveRole(i)}
            className={`px-4 py-2 rounded-full font-medium text-sm transition-all ${
              i === activeRole
                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.2)]"
                : "bg-zinc-950 text-zinc-400 border border-white/5 hover:border-white/10 hover:text-white"
            }`}
          >
            {role.role}
          </motion.button>
        ))}
      </div>

      {/* Role Info */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeRole}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="rounded-2xl bg-zinc-950 border border-white/5 overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-white/5">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  {current.role}
                </h2>
                <p className="text-zinc-400 text-sm mt-1 leading-relaxed">
                  {current.description}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                {hasStructured && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-zinc-300 px-3 py-2 rounded-full text-sm transition-colors border border-white/5"
                  >
                    <Pencil className="w-3.5 h-3.5" strokeWidth={2} />
                    Edit
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCopy}
                  className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-zinc-300 px-3 py-2 rounded-full text-sm transition-colors border border-white/5"
                >
                  {copying ? (
                    <>
                      <Check
                        className="w-3.5 h-3.5 text-emerald-400"
                        strokeWidth={2}
                      />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" strokeWidth={2} />
                      Copy
                    </>
                  )}
                </motion.button>
                {hasStructured && mergedCv ? (
                  <PDFDownloadButton cv={mergedCv} roleName={current.role} />
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDownloadMd}
                    className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-3 py-2 rounded-full text-sm font-medium transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" strokeWidth={2} />
                    Download
                  </motion.button>
                )}
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-white/5">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
              Key Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {current.skills.map((skill) => (
                <span
                  key={skill}
                  className="bg-orange-500/10 text-orange-300 px-3 py-1 rounded-full text-xs font-medium border border-orange-500/20"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Matching Repos */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-white/5">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
              Matching Repositories ({current.matchingRepos.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {current.matchingRepos.map((repo) => (
                <a
                  key={repo.id}
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white px-3 py-1.5 rounded-full text-xs transition-colors border border-white/5"
                >
                  <BookOpen className="w-3 h-3" strokeWidth={1.5} />
                  {repo.name}
                  <ExternalLink
                    className="w-2.5 h-2.5 opacity-50"
                    strokeWidth={2}
                  />
                </a>
              ))}
            </div>
          </div>

          {/* CV Content */}
          <div className="p-4 sm:p-6">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
              Generated CV
            </h3>
            {hasStructured && mergedCv ? (
              <CVPreview cv={mergedCv} />
            ) : (
              <div className="prose-premium prose prose-sm max-w-none leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {current.cv}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
