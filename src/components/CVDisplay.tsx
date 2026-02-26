"use client";

import { CareerRole } from "@/lib/types";
import { StructuredCV, EducationEntry, ExperienceEntry } from "@/lib/cv-types";
import { mergeProfileIntoCv, createEmptyPersonalDetails } from "@/lib/cv-utils";
import { useState, useEffect, useMemo } from "react";
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
  Layout,
  Eye,
  FileText,
} from "lucide-react";
import CVEditor from "./cv-editor/CVEditor";
import CVPreview from "./cv-editor/CVPreview";
import PDFDownloadButton from "./cv-pdf/PDFDownloadButton";
import { TemplateId } from "@/lib/cv-types";

interface ProfileData {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedIn: string;
  github: string;
  website: string;
  education: EducationEntry[];
  workExperience?: ExperienceEntry[];
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
  const [profileLoading, setProfileLoading] = useState(true);
  const [templateOverrides, setTemplateOverrides] = useState<Record<number, TemplateId>>({});
  const [showPreview, setShowPreview] = useState(false);

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
    } finally {
      setProfileLoading(false);
    }
  };

  const handleCopy = async () => {
    const role = roles[activeRole];
    try {
      await navigator.clipboard.writeText(role.cv);
      setCopying(true);
      setTimeout(() => setCopying(false), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
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

  const current = roles[activeRole];

  const mergedCv = useMemo((): StructuredCV | null => {
    if (!current?.structuredCv) return null;
    const override = templateOverrides[activeRole];
    let cv: StructuredCV;
    if (profile) {
      cv = mergeProfileIntoCv(current.structuredCv, profile);
    } else {
      cv = {
        ...current.structuredCv,
        personalDetails:
          current.structuredCv.personalDetails?.fullName
            ? current.structuredCv.personalDetails
            : createEmptyPersonalDetails(),
      };
    }
    if (override) {
      cv = { ...cv, templateId: override };
    }
    return cv;
  }, [current, profile, activeRole, templateOverrides]);

  const handleTemplateChange = async (templateId: TemplateId) => {
    setTemplateOverrides((prev) => ({ ...prev, [activeRole]: templateId }));

    const cvId = cvIds?.[activeRole];
    if (cvId && mergedCv) {
      try {
        await fetch(`/api/cv/${cvId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            structuredCv: { ...mergedCv, templateId },
          }),
        });
      } catch {
        // Template change is still reflected in UI even if save fails
      }
    }
  };

  if (roles.length === 0) return null;

  const hasStructured = !!current.structuredCv;
  const templateIds: TemplateId[] = ["classic", "modern", "professional", "creative", "executive"];

  // Editing mode
  if (editing && mergedCv) {
    return (
      <div className="space-y-6">
        {/* Role Tabs */}
        <div className="flex flex-wrap gap-2">
          {roles.map((role, i) => (
            <button
              key={i}
              onClick={() => {
                setActiveRole(i);
                setEditing(!!roles[i].structuredCv);
              }}
              className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                i === activeRole
                  ? "bg-amber-500/15 text-amber-400 border border-amber-500/25"
                  : "bg-white/[0.03] text-zinc-500 border border-white/[0.06] hover:text-zinc-300 hover:border-white/[0.1]"
              }`}
            >
              {role.role}
            </button>
          ))}
        </div>

        <CVEditor
          key={activeRole}
          initialData={mergedCv}
          cvId={cvIds?.[activeRole]}
          roleName={current.role}
          onBack={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Role Tabs ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 -mb-1 scrollbar-none">
          {roles.map((role, i) => (
            <button
              key={i}
              onClick={() => setActiveRole(i)}
              className={`relative px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap rounded-lg ${
                i === activeRole
                  ? "text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {role.role}
              {/* Active underline */}
              {i === activeRole && (
                <motion.div
                  layoutId="cv-role-indicator"
                  className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                  transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="lg:hidden flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white px-3 py-2 rounded-xl border border-white/[0.06] hover:border-white/[0.1] bg-white/[0.02] transition-all shrink-0"
        >
          {showPreview ? (
            <>
              <FileText className="w-3.5 h-3.5" strokeWidth={1.5} />
              Details
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5" strokeWidth={1.5} />
              Preview
            </>
          )}
        </button>
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      {/* Profile loading indicator */}
      {profileLoading && (
        <div className="flex items-center gap-2 text-xs text-zinc-600">
          <div className="w-3 h-3 border border-zinc-700 border-t-amber-500 rounded-full animate-spin" />
          Loading profile data...
        </div>
      )}

      {/* ── Two-column layout ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5 lg:gap-6">
        {/* LEFT: Controls panel */}
        <div className={`${showPreview ? "hidden lg:block" : ""}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeRole}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              {/* Role info card */}
              <div className="rounded-2xl border border-white/[0.06] bg-zinc-950/80 overflow-hidden">
                {/* Header */}
                <div className="p-5">
                  <h2 className="text-lg font-bold text-white tracking-[-0.02em]">
                    {current.role}
                  </h2>
                  <p className="text-zinc-500 text-[13px] mt-1.5 leading-relaxed line-clamp-3">
                    {current.description}
                  </p>
                </div>

                {/* Divider */}
                <div className="h-px bg-white/[0.04] mx-5" />

                {/* Action Buttons */}
                <div className="px-5 py-4 flex flex-wrap gap-2">
                  {hasStructured && (
                    <button
                      onClick={() => setEditing(true)}
                      className="flex items-center gap-1.5 bg-white/[0.04] hover:bg-white/[0.07] text-zinc-400 hover:text-white px-3.5 py-2 rounded-xl text-xs font-medium transition-all border border-white/[0.06] hover:border-white/[0.1]"
                    >
                      <Pencil className="w-3 h-3" strokeWidth={1.5} />
                      Edit CV
                    </button>
                  )}
                  <button
                    onClick={handleCopy}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all border ${
                      copying
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        : "bg-white/[0.04] hover:bg-white/[0.07] text-zinc-400 hover:text-white border-white/[0.06] hover:border-white/[0.1]"
                    }`}
                  >
                    {copying ? (
                      <>
                        <Check className="w-3 h-3" strokeWidth={2} />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" strokeWidth={1.5} />
                        Copy
                      </>
                    )}
                  </button>
                  {hasStructured && mergedCv ? (
                    <PDFDownloadButton cv={mergedCv} roleName={current.role} />
                  ) : (
                    <button
                      onClick={handleDownloadMd}
                      className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-[0_0_16px_rgba(245,158,11,0.15)] hover:shadow-[0_0_24px_rgba(245,158,11,0.2)] transition-shadow"
                    >
                      <Download className="w-3 h-3" strokeWidth={2} />
                      Download
                    </button>
                  )}
                </div>
              </div>

              {/* Template Selector */}
              {hasStructured && mergedCv && (
                <div className="rounded-2xl border border-white/[0.06] bg-zinc-950/80 p-5">
                  <h3 className="text-[11px] font-medium text-zinc-600 uppercase tracking-[0.08em] mb-3 flex items-center gap-1.5">
                    <Layout className="w-3 h-3" strokeWidth={1.5} />
                    Template
                  </h3>
                  <div className="grid grid-cols-5 gap-1.5">
                    {templateIds.map((tid) => {
                      const isActive = (mergedCv.templateId || "classic") === tid;
                      return (
                        <button
                          key={tid}
                          onClick={() => handleTemplateChange(tid)}
                          className={`px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                            isActive
                              ? "bg-amber-500/15 text-amber-400 border border-amber-500/25 shadow-[0_0_8px_rgba(245,158,11,0.08)]"
                              : "text-zinc-600 hover:text-zinc-400 border border-white/[0.04] hover:border-white/[0.08] bg-white/[0.02]"
                          }`}
                        >
                          {tid.charAt(0).toUpperCase() + tid.slice(1)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Skills */}
              <div className="rounded-2xl border border-white/[0.06] bg-zinc-950/80 p-5">
                <h3 className="text-[11px] font-medium text-zinc-600 uppercase tracking-[0.08em] mb-3">
                  Key Skills
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {current.skills.map((skill) => (
                    <span
                      key={skill}
                      className="text-[11px] font-medium tracking-wide uppercase px-2.5 py-1 rounded-lg bg-amber-500/[0.06] text-amber-400/80 border border-amber-500/10"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Matching Repos */}
              <div className="rounded-2xl border border-white/[0.06] bg-zinc-950/80 p-5">
                <h3 className="text-[11px] font-medium text-zinc-600 uppercase tracking-[0.08em] mb-3">
                  Repositories ({current.matchingRepos.length})
                </h3>
                <div className="space-y-1.5">
                  {current.matchingRepos.map((repo) => (
                    <a
                      key={repo.id}
                      href={repo.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-2 py-1.5 px-2.5 -mx-2.5 rounded-lg hover:bg-white/[0.03] transition-colors"
                    >
                      <BookOpen className="w-3 h-3 text-zinc-600 group-hover:text-zinc-400 shrink-0" strokeWidth={1.5} />
                      <span className="text-[13px] text-zinc-400 group-hover:text-zinc-200 transition-colors truncate">
                        {repo.name}
                      </span>
                      <ExternalLink className="w-2.5 h-2.5 text-zinc-700 group-hover:text-zinc-500 ml-auto shrink-0 transition-colors" strokeWidth={1.5} />
                    </a>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* RIGHT: Sticky CV Preview */}
        <div className={`${showPreview ? "" : "hidden lg:block"} lg:sticky lg:top-6 lg:self-start`}>
          <div className="rounded-2xl border border-white/[0.06] bg-zinc-950/80 overflow-hidden">
            {/* Preview header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.04]">
              <h3 className="text-[11px] font-medium text-zinc-600 uppercase tracking-[0.08em] flex items-center gap-1.5">
                <Eye className="w-3 h-3" strokeWidth={1.5} />
                Preview
              </h3>
              {hasStructured && mergedCv && (
                <span className="text-[10px] text-zinc-700 font-mono">
                  {(mergedCv.templateId || "classic")}
                </span>
              )}
            </div>

            {/* Preview content */}
            <div className="p-5 overflow-auto max-h-[calc(100vh-6rem)]" data-lenis-prevent>
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${activeRole}-${mergedCv?.templateId || "md"}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {hasStructured && mergedCv ? (
                    <CVPreview cv={mergedCv} />
                  ) : (
                    <div className="prose-premium prose prose-sm max-w-none leading-relaxed">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {current.cv}
                      </ReactMarkdown>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
