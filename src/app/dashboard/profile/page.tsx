"use client";

import { useSession } from "next-auth/react";
import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { EducationEntry, ExperienceEntry } from "@/lib/cv-types";
import {
  Save,
  Plus,
  Trash2,
  User,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Globe,
  GraduationCap,
  Briefcase,
  ArrowLeft,
  Check,
  AlertCircle,
  Loader2,
  Link2,
  X,
} from "lucide-react";
import Link from "next/link";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen pt-24 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-zinc-800 border-t-orange-500 rounded-full animate-spin" />
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}

function ProfileContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [linkedIn, setLinkedIn] = useState("");
  const [website, setWebsite] = useState("");
  const [education, setEducation] = useState<EducationEntry[]>([]);
  const [workExperience, setWorkExperience] = useState<ExperienceEntry[]>([]);

  // LinkedIn integration state
  const [linkedinConfigured, setLinkedinConfigured] = useState(false);
  const [linkedinImporting, setLinkedinImporting] = useState(false);
  const [linkedinToast, setLinkedinToast] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const linkedinHandled = useRef(false);
  const profileLoaded = useRef(false);
  const pendingLinkedinImport = useRef(false);

  // Check if LinkedIn integration is configured
  useEffect(() => {
    fetch("/api/linkedin/status")
      .then((res) => res.json())
      .then((data) => setLinkedinConfigured(data.configured === true))
      .catch(() => setLinkedinConfigured(false));
  }, []);

  // Handle LinkedIn callback params
  useEffect(() => {
    if (linkedinHandled.current) return;
    const linkedinParam = searchParams.get("linkedin");
    if (!linkedinParam) return;
    linkedinHandled.current = true;

    // Clean up URL params
    router.replace("/dashboard/profile", { scroll: false });

    if (linkedinParam === "connected") {
      // If profile already loaded, import immediately; otherwise mark as pending
      if (profileLoaded.current) {
        importLinkedInData();
      } else {
        pendingLinkedinImport.current = true;
      }
    } else if (linkedinParam === "error") {
      const msg = searchParams.get("message") || "Failed to connect LinkedIn";
      showLinkedinToast("error", msg);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const showLinkedinToast = useCallback(
    (type: "success" | "error" | "info", message: string) => {
      setLinkedinToast({ type, message });
      setTimeout(() => setLinkedinToast(null), 5000);
    },
    []
  );

  const importLinkedInData = useCallback(async (existingProfile?: {
    fullName: string;
    email: string;
  }) => {
    setLinkedinImporting(true);
    try {
      const res = await fetch("/api/linkedin/profile");
      if (!res.ok) {
        throw new Error("No LinkedIn data available");
      }
      const data = await res.json();
      const p = data.profile;

      // Compare against the loaded profile data (not stale closure state)
      const currentName = existingProfile?.fullName ?? fullName;
      const currentEmail = existingProfile?.email ?? email;

      // Only fill empty fields — preserve existing manual entries
      let fieldsImported = 0;
      if (!currentName && p.fullName) {
        setFullName(p.fullName);
        fieldsImported++;
      }
      if (!currentEmail && p.email) {
        setEmail(p.email);
        fieldsImported++;
      }

      if (fieldsImported > 0) {
        showLinkedinToast(
          "success",
          `Imported ${fieldsImported} field${fieldsImported > 1 ? "s" : ""} from LinkedIn. Review and save your profile.`
        );
      } else {
        showLinkedinToast(
          "info",
          "LinkedIn connected, but all fields already have data. Your existing information was preserved."
        );
      }
    } catch (err) {
      console.error("LinkedIn import error:", err);
      showLinkedinToast("error", "Failed to import LinkedIn profile data.");
    } finally {
      setLinkedinImporting(false);
    }
  }, [fullName, email, showLinkedinToast]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchProfile();
    }
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        const p = data.profile;
        setFullName(p.fullName || "");
        setEmail(p.email || "");
        setPhone(p.phone || "");
        setLocation(p.location || "");
        setLinkedIn(p.linkedIn || "");
        setWebsite(p.website || "");
        setEducation(
          (p.education || []).map((e: EducationEntry) => ({
            ...e,
            id: e.id || crypto.randomUUID(),
          }))
        );
        setWorkExperience(
          (p.workExperience || []).map((e: ExperienceEntry) => ({
            ...e,
            id: e.id || crypto.randomUUID(),
            bullets: e.bullets || [],
            technologies: e.technologies || [],
          }))
        );

        profileLoaded.current = true;

        // If LinkedIn OAuth completed before profile loaded, import now
        if (pendingLinkedinImport.current) {
          pendingLinkedinImport.current = false;
          importLinkedInData({
            fullName: p.fullName || "",
            email: p.email || "",
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      profileLoaded.current = true;

      // Still process pending LinkedIn import even if profile fetch fails
      if (pendingLinkedinImport.current) {
        pendingLinkedinImport.current = false;
        importLinkedInData();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    // Clean up work experience before save
    const cleanedWorkExperience = workExperience
      .map((exp) => ({
        ...exp,
        bullets: exp.bullets.filter((b) => b.trim() !== ""),
        technologies: exp.technologies.filter((t) => t.trim() !== ""),
      }))
      .filter(
        (exp) =>
          // Only save if has title OR organization OR at least one bullet
          exp.title.trim() !== "" ||
          exp.organization.trim() !== "" ||
          exp.bullets.length > 0
      );

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          location,
          linkedIn,
          website,
          education,
          workExperience: cleanedWorkExperience,
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (err) {
      console.error("Failed to save profile:", err);
    } finally {
      setSaving(false);
    }
  };

  const addEducation = () => {
    setEducation((prev) => [
      ...prev,
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

  const removeEducation = (id: string) => {
    setEducation((prev) => prev.filter((e) => e.id !== id));
  };

  const updateEducation = (
    id: string,
    field: keyof EducationEntry,
    value: string
  ) => {
    setEducation((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  };

  const addWorkExperience = () => {
    setWorkExperience((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        title: "",
        organization: "",
        startDate: "",
        endDate: "",
        bullets: [],
        technologies: [],
        repoUrl: undefined,
      },
    ]);
  };

  const removeWorkExperience = (id: string) => {
    setWorkExperience((prev) => prev.filter((e) => e.id !== id));
  };

  const updateWorkExperience = (
    id: string,
    field: keyof ExperienceEntry,
    value: string | string[]
  ) => {
    setWorkExperience((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  };

  const addBullet = (expId: string) => {
    setWorkExperience((prev) =>
      prev.map((e) =>
        e.id === expId ? { ...e, bullets: [...e.bullets, ""] } : e
      )
    );
  };

  const removeBullet = (expId: string, bulletIndex: number) => {
    setWorkExperience((prev) =>
      prev.map((e) =>
        e.id === expId
          ? { ...e, bullets: e.bullets.filter((_, i) => i !== bulletIndex) }
          : e
      )
    );
  };

  const updateBullet = (expId: string, bulletIndex: number, value: string) => {
    setWorkExperience((prev) =>
      prev.map((e) =>
        e.id === expId
          ? {
              ...e,
              bullets: e.bullets.map((b, i) => (i === bulletIndex ? value : b)),
            }
          : e
      )
    );
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-800 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <p className="text-zinc-400">Please sign in to access your profile.</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen pt-24 pb-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="mb-8"
        >
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Profile Settings
          </h1>
          <p className="text-zinc-400 text-sm mt-2">
            Your personal details will be used in generated CVs.
          </p>
        </motion.div>

        {/* LinkedIn Integration Banner */}
        {linkedinConfigured && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="rounded-2xl bg-gradient-to-r from-[#0A66C2]/10 to-[#0A66C2]/5 border border-[#0A66C2]/20 p-5 mb-6"
          >
            <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#0A66C2]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Linkedin className="w-4.5 h-4.5 text-[#0A66C2]" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Import from LinkedIn
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Connect your LinkedIn account to auto-fill your name and email.
                    All imported data is fully editable.
                  </p>
                </div>
              </div>
              <a
                href="/api/linkedin/auth"
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all flex-shrink-0 ${
                  linkedinImporting
                    ? "bg-[#0A66C2]/20 text-[#0A66C2]/60 pointer-events-none"
                    : "bg-[#0A66C2] text-white hover:bg-[#094d92] active:scale-[0.97]"
                }`}
              >
                {linkedinImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                    Importing...
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4" strokeWidth={2} />
                    Connect LinkedIn
                  </>
                )}
              </a>
            </div>
          </motion.div>
        )}

        {/* LinkedIn Toast Notification */}
        <AnimatePresence>
          {linkedinToast && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`rounded-xl border p-4 mb-6 flex items-start gap-3 ${
                linkedinToast.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : linkedinToast.type === "error"
                  ? "bg-red-500/10 border-red-500/20 text-red-400"
                  : "bg-blue-500/10 border-blue-500/20 text-blue-400"
              }`}
            >
              {linkedinToast.type === "success" ? (
                <Check className="w-4 h-4 mt-0.5 flex-shrink-0" strokeWidth={2} />
              ) : linkedinToast.type === "error" ? (
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" strokeWidth={2} />
              ) : (
                <Linkedin className="w-4 h-4 mt-0.5 flex-shrink-0" strokeWidth={2} />
              )}
              <p className="text-sm flex-1">{linkedinToast.message}</p>
              <button
                onClick={() => setLinkedinToast(null)}
                className="p-0.5 hover:opacity-70 transition-opacity flex-shrink-0"
              >
                <X className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Personal Details */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="rounded-2xl bg-zinc-950 border border-white/5 p-6 mb-6"
        >
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-5">
            Contact Information
          </h2>
          <div className="space-y-4">
            <InputField
              icon={User}
              label="Full Name"
              value={fullName}
              onChange={setFullName}
              placeholder="John Doe"
            />
            <InputField
              icon={Mail}
              label="Email"
              value={email}
              onChange={setEmail}
              placeholder="john@example.com"
              type="email"
            />
            <InputField
              icon={Phone}
              label="Phone"
              value={phone}
              onChange={setPhone}
              placeholder="+1 234 567 8900"
              type="tel"
            />
            <InputField
              icon={MapPin}
              label="Location"
              value={location}
              onChange={setLocation}
              placeholder="San Francisco, CA"
            />
            <InputField
              icon={Linkedin}
              label="LinkedIn URL"
              value={linkedIn}
              onChange={setLinkedIn}
              placeholder="linkedin.com/in/johndoe"
            />
            <InputField
              icon={Globe}
              label="Portfolio Website"
              value={website}
              onChange={setWebsite}
              placeholder="johndoe.dev"
            />
          </div>
        </motion.div>

        {/* Education */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="rounded-2xl bg-zinc-950 border border-white/5 p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
              Education
            </h2>
            <button
              onClick={addEducation}
              className="flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2} />
              Add Entry
            </button>
          </div>

          {education.length === 0 ? (
            <div className="text-center py-8">
              <GraduationCap className="w-8 h-8 text-zinc-700 mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-zinc-500 text-sm">No education entries yet.</p>
              <button
                onClick={addEducation}
                className="text-orange-400 hover:text-orange-300 text-sm mt-2 transition-colors"
              >
                Add your first entry
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {education.map((edu) => (
                <div
                  key={edu.id}
                  className="rounded-xl bg-black/40 border border-white/[0.04] p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) =>
                          updateEducation(edu.id, "degree", e.target.value)
                        }
                        placeholder="BSc Computer Science"
                        className="bg-transparent border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/30"
                      />
                      <input
                        type="text"
                        value={edu.institution}
                        onChange={(e) =>
                          updateEducation(
                            edu.id,
                            "institution",
                            e.target.value
                          )
                        }
                        placeholder="University Name"
                        className="bg-transparent border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/30"
                      />
                      <input
                        type="text"
                        value={edu.startDate}
                        onChange={(e) =>
                          updateEducation(edu.id, "startDate", e.target.value)
                        }
                        placeholder="Start (e.g. 2018)"
                        className="bg-transparent border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/30"
                      />
                      <input
                        type="text"
                        value={edu.endDate}
                        onChange={(e) =>
                          updateEducation(edu.id, "endDate", e.target.value)
                        }
                        placeholder="End (e.g. 2022)"
                        className="bg-transparent border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/30"
                      />
                    </div>
                    <button
                      onClick={() => removeEducation(edu.id)}
                      className="ml-3 p-1.5 text-zinc-600 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={edu.details}
                    onChange={(e) =>
                      updateEducation(edu.id, "details", e.target.value)
                    }
                    placeholder="Details (e.g. GPA 3.8, Dean's List, Thesis topic)"
                    className="w-full bg-transparent border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/30"
                  />
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Work Experience */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="rounded-2xl bg-zinc-950 border border-white/5 p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
              Work Experience
            </h2>
            <button
              onClick={addWorkExperience}
              className="flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2} />
              Add Entry
            </button>
          </div>

          {workExperience.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className="w-8 h-8 text-zinc-700 mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-zinc-500 text-sm">No work experience entries yet.</p>
              <button
                onClick={addWorkExperience}
                className="text-orange-400 hover:text-orange-300 text-sm mt-2 transition-colors"
              >
                Add your first entry
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {workExperience.map((exp) => (
                <div
                  key={exp.id}
                  className="rounded-xl bg-black/40 border border-white/[0.04] p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={exp.title}
                        onChange={(e) =>
                          updateWorkExperience(exp.id, "title", e.target.value)
                        }
                        placeholder="Job Title"
                        className="bg-transparent border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/30"
                      />
                      <input
                        type="text"
                        value={exp.organization}
                        onChange={(e) =>
                          updateWorkExperience(
                            exp.id,
                            "organization",
                            e.target.value
                          )
                        }
                        placeholder="Company Name"
                        className="bg-transparent border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/30"
                      />
                      <input
                        type="text"
                        value={exp.startDate}
                        onChange={(e) =>
                          updateWorkExperience(exp.id, "startDate", e.target.value)
                        }
                        placeholder="Start (e.g. Jan 2022)"
                        className="bg-transparent border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/30"
                      />
                      <input
                        type="text"
                        value={exp.endDate}
                        onChange={(e) =>
                          updateWorkExperience(exp.id, "endDate", e.target.value)
                        }
                        placeholder="End (e.g. Present)"
                        className="bg-transparent border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/30"
                      />
                    </div>
                    <button
                      onClick={() => removeWorkExperience(exp.id)}
                      className="ml-3 p-1.5 text-zinc-600 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </div>

                  {/* Bullet Points */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-zinc-500">Key Responsibilities / Achievements</label>
                      <button
                        onClick={() => addBullet(exp.id)}
                        className="flex items-center gap-1 text-xs text-zinc-500 hover:text-orange-400 transition-colors"
                      >
                        <Plus className="w-3 h-3" strokeWidth={2} />
                        Add
                      </button>
                    </div>
                    {exp.bullets.map((bullet, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-zinc-600 text-xs">•</span>
                        <input
                          type="text"
                          value={bullet}
                          onChange={(e) => updateBullet(exp.id, idx, e.target.value)}
                          placeholder="e.g. Led development of microservices architecture..."
                          className="flex-1 bg-transparent border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/30"
                        />
                        <button
                          onClick={() => removeBullet(exp.id, idx)}
                          className="p-1 text-zinc-700 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Technologies */}
                  <input
                    type="text"
                    value={exp.technologies.join(", ")}
                    onChange={(e) =>
                      updateWorkExperience(
                        exp.id,
                        "technologies",
                        e.target.value
                          .split(",")
                          .map((t) => t.trim())
                          .filter(Boolean)
                      )
                    }
                    placeholder="Technologies (comma-separated, e.g. React, Node.js, AWS)"
                    className="w-full bg-transparent border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/30"
                  />
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Save Button */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp}>
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white py-3 rounded-full font-medium text-sm transition-all disabled:opacity-50"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4" strokeWidth={2} />
                Saved!
              </>
            ) : saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" strokeWidth={2} />
                Save Profile
              </>
            )}
          </motion.button>
        </motion.div>
      </div>
    </main>
  );
}

function InputField({
  icon: Icon,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div>
      <label className="flex items-center gap-2 text-xs text-zinc-500 mb-1.5">
        <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/30 transition-colors"
      />
    </div>
  );
}
