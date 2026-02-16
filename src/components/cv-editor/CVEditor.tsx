"use client";

import { StructuredCV } from "@/lib/cv-types";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Check, Eye, Pencil } from "lucide-react";
import SummaryEditor from "./SummaryEditor";
import SkillsEditor from "./SkillsEditor";
import ExperienceEditor from "./ExperienceEditor";
import EducationEditor from "./EducationEditor";
import CertificationsEditor from "./CertificationsEditor";
import CVPreview from "./CVPreview";

export default function CVEditor({
  initialData,
  cvId,
  roleName,
  onBack,
}: {
  initialData: StructuredCV;
  cvId?: string;
  roleName: string;
  onBack: () => void;
}) {
  const [cvData, setCvData] = useState<StructuredCV>(initialData);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    setHasChanges(true);
    setSaved(false);
  }, [cvData]);

  // Don't mark as changed on initial render
  useEffect(() => {
    setHasChanges(false);
  }, []);

  const handleSave = async () => {
    if (!cvId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/cv/${cvId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ structuredCv: cvData }),
      });
      if (res.ok) {
        setSaved(true);
        setHasChanges(false);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (err) {
      console.error("Failed to save CV:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
          Back to results
        </button>
        <div className="flex items-center gap-2">
          {/* Mobile preview toggle */}
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="lg:hidden flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white px-3 py-1.5 rounded-full border border-white/[0.06] transition-colors"
          >
            {showPreview ? (
              <>
                <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />
                Edit
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" strokeWidth={1.5} />
                Preview
              </>
            )}
          </button>
          {cvId && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2 rounded-full text-sm font-medium transition-all disabled:opacity-40"
            >
              {saved ? (
                <>
                  <Check className="w-3.5 h-3.5" strokeWidth={2} />
                  Saved
                </>
              ) : saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" strokeWidth={2} />
                  Save
                  {hasChanges && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </>
              )}
            </motion.button>
          )}
        </div>
      </div>

      <p className="text-xs text-zinc-500">
        Editing CV for <span className="text-orange-400">{roleName}</span>
      </p>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor (left) */}
        <div className={`space-y-5 ${showPreview ? "hidden lg:block" : ""}`}>
          {/* Personal Details (read-only reminder) */}
          <div className="rounded-xl bg-black/40 border border-white/[0.04] px-3 py-2.5">
            <p className="text-[11px] text-zinc-500">
              Contact details come from your{" "}
              <a
                href="/dashboard/profile"
                className="text-orange-400 hover:text-orange-300"
              >
                Profile Settings
              </a>
              .
            </p>
          </div>

          <SummaryEditor
            value={cvData.summary}
            onChange={(summary) => setCvData((prev) => ({ ...prev, summary }))}
          />
          <SkillsEditor
            value={cvData.skills}
            onChange={(skills) => setCvData((prev) => ({ ...prev, skills }))}
          />
          <ExperienceEditor
            value={cvData.experience}
            onChange={(experience) =>
              setCvData((prev) => ({ ...prev, experience }))
            }
          />
          <EducationEditor
            value={cvData.education}
            onChange={(education) =>
              setCvData((prev) => ({ ...prev, education }))
            }
          />
          <CertificationsEditor
            value={cvData.certifications}
            onChange={(certifications) =>
              setCvData((prev) => ({ ...prev, certifications }))
            }
          />
        </div>

        {/* Preview (right) */}
        <div
          className={`${showPreview ? "" : "hidden lg:block"} lg:sticky lg:top-20 lg:self-start`}
        >
          <div className="rounded-2xl bg-zinc-950 border border-white/5 p-4 overflow-auto max-h-[calc(100vh-6rem)]">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
              Live Preview
            </h3>
            <CVPreview cv={cvData} />
          </div>
        </div>
      </div>
    </div>
  );
}
