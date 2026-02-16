"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
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
} from "lucide-react";
import Link from "next/link";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function ProfilePage() {
  const { data: session, status } = useSession();
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

  useEffect(() => {
    if (status === "authenticated") {
      fetchProfile();
    }
  }, [status]);

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
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
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
