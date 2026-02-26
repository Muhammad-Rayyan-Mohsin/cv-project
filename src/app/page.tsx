"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Github,
  ArrowRight,
  GitBranch,
  Layers,
  FileText,
  Sparkles,
  Terminal,
  ChevronRight,
} from "lucide-react";

// Orchestrated stagger for hero elements
const heroStagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.15 },
  },
};

const heroItem = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

const fadeInScale = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

// Pipeline steps
const PIPELINE = [
  {
    step: "01",
    icon: Github,
    title: "Connect",
    description: "Link your GitHub — we fetch repos, languages, READMEs, and topics",
    accent: "from-emerald-500/20 to-emerald-500/5",
    iconColor: "text-emerald-400",
    borderColor: "border-emerald-500/15",
  },
  {
    step: "02",
    icon: Layers,
    title: "Categorize",
    description: "AI groups your projects into distinct career roles automatically",
    accent: "from-amber-500/20 to-amber-500/5",
    iconColor: "text-amber-400",
    borderColor: "border-amber-500/15",
  },
  {
    step: "03",
    icon: Sparkles,
    title: "Generate",
    description: "Get ATS-friendly CVs tailored to each role with real project data",
    accent: "from-blue-500/20 to-blue-500/5",
    iconColor: "text-blue-400",
    borderColor: "border-blue-500/15",
  },
  {
    step: "04",
    icon: FileText,
    title: "Export",
    description: "Download as PDF in multiple templates — classic, modern, creative",
    accent: "from-rose-500/20 to-rose-500/5",
    iconColor: "text-rose-400",
    borderColor: "border-rose-500/15",
  },
];

// Fake terminal lines for the hero mockup
const TERMINAL_LINES = [
  { prefix: "$", text: "cv-tailor analyze --repos 47", delay: 0 },
  { prefix: "→", text: "Fetching repositories from GitHub...", delay: 0.3, dim: true },
  { prefix: "→", text: "Enriching with READMEs (10 batches)...", delay: 0.6, dim: true },
  { prefix: "✓", text: "Found: TypeScript, Python, Go, Rust", delay: 0.9, color: "text-emerald-400" },
  { prefix: "→", text: "Categorizing into career roles...", delay: 1.2, dim: true },
  { prefix: "✓", text: 'Role: "Full-Stack Engineer" — 12 repos', delay: 1.5, color: "text-amber-400" },
  { prefix: "✓", text: 'Role: "ML Engineer" — 8 repos', delay: 1.7, color: "text-amber-400" },
  { prefix: "✓", text: 'Role: "DevOps Engineer" — 5 repos', delay: 1.9, color: "text-amber-400" },
  { prefix: "→", text: "Generating tailored CVs...", delay: 2.2, dim: true },
  { prefix: "✓", text: "3 CVs generated in 42s", delay: 2.6, color: "text-emerald-400" },
];

export default function Home() {
  const { status } = useSession();
  const router = useRouter();

  const handleCTA = () => {
    if (status === "authenticated") {
      router.push("/dashboard");
    } else {
      signIn("github");
    }
  };

  return (
    <main className="min-h-screen bg-black overflow-hidden">
      {/* ── Background Mesh ───────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Warm gradient top-left */}
        <div className="absolute -top-[30%] -left-[20%] w-[70%] h-[70%] rounded-full bg-amber-500/[0.04] blur-[120px]" />
        {/* Cool gradient bottom-right */}
        <div className="absolute -bottom-[20%] -right-[15%] w-[50%] h-[50%] rounded-full bg-blue-500/[0.03] blur-[100px]" />
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)`,
            backgroundSize: "72px 72px",
          }}
        />
      </div>

      {/* ── Hero Section ──────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20 sm:py-0">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Copy */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={heroStagger}
            >
              {/* Heading */}
              <motion.h1
                variants={heroItem}
                className="text-[2.75rem] sm:text-6xl lg:text-[4.25rem] font-bold text-white leading-[1.05] tracking-[-0.04em] mb-6"
              >
                Your code
                <br />
                tells a story.
                <br />
                <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent">
                  We write the CV.
                </span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                variants={heroItem}
                className="text-zinc-500 text-base sm:text-lg leading-relaxed max-w-lg mb-10"
              >
                Connect your GitHub. Our AI analyzes every repository — languages,
                frameworks, READMEs — and generates role-specific CVs that actually
                reflect what you&apos;ve built.
              </motion.p>

              {/* CTA Row */}
              <motion.div variants={heroItem} className="flex items-center gap-4">
                {status === "loading" ? (
                  <div className="w-10 h-10 border-2 border-zinc-800 border-t-amber-500 rounded-full animate-spin" />
                ) : (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCTA}
                      className="group inline-flex items-center gap-2.5 bg-white text-black pl-5 pr-4 py-3 sm:pl-6 sm:pr-5 sm:py-3.5 rounded-xl font-semibold text-sm sm:text-base hover:bg-zinc-100 transition-all shadow-[0_0_40px_rgba(255,255,255,0.06)]"
                    >
                      <Github className="w-4.5 h-4.5" strokeWidth={2} />
                      {status === "authenticated" ? "Go to Dashboard" : "Sign in with GitHub"}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={2} />
                    </motion.button>
                  </>
                )}
              </motion.div>
            </motion.div>

            {/* Right: Terminal Mockup */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInScale}
              className="relative hidden lg:block"
            >
              {/* Ambient glow behind terminal */}
              <div className="absolute -inset-8 bg-gradient-to-br from-amber-500/[0.06] via-transparent to-blue-500/[0.04] rounded-3xl blur-2xl" />

              <div className="relative rounded-2xl overflow-hidden border border-white/[0.08] bg-zinc-950/90 backdrop-blur-sm shadow-[0_24px_80px_rgba(0,0,0,0.6)]">
                {/* Title bar */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <span className="text-[11px] text-zinc-600 font-mono flex items-center gap-1.5">
                      <Terminal className="w-3 h-3" strokeWidth={1.5} />
                      cv-tailor
                    </span>
                  </div>
                  <div className="w-12" />
                </div>

                {/* Terminal content */}
                <div className="p-5 font-mono text-[13px] leading-relaxed space-y-1 min-h-[320px]">
                  {TERMINAL_LINES.map((line, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + line.delay, duration: 0.4, ease: "easeOut" }}
                      className="flex items-start gap-2"
                    >
                      <span className={`shrink-0 ${
                        line.prefix === "$" ? "text-amber-400" :
                        line.prefix === "✓" ? "text-emerald-400" :
                        "text-zinc-600"
                      }`}>
                        {line.prefix}
                      </span>
                      <span className={
                        line.color ? line.color :
                        line.dim ? "text-zinc-600" :
                        "text-zinc-300"
                      }>
                        {line.text}
                      </span>
                    </motion.div>
                  ))}

                  {/* Blinking cursor at the end */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 3.6 }}
                    className="flex items-center gap-2 mt-2"
                  >
                    <span className="text-amber-400">$</span>
                    <span className="w-2 h-4 bg-amber-400/70 animate-pulse" />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Pipeline Section ───────────────────────────────────── */}
      <section className="relative py-20 sm:py-32">
        {/* Section header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 sm:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-600 mb-3">How it works</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-[-0.03em] max-w-lg">
              From repositories
              <br />
              to role-specific CVs
            </h2>
          </motion.div>
        </div>

        {/* Pipeline cards */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PIPELINE.map(({ step, icon: Icon, title, description, accent, iconColor, borderColor }, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`group relative rounded-2xl border ${borderColor} bg-zinc-950/60 p-6 sm:p-7 overflow-hidden hover:border-white/[0.12] transition-all duration-300`}
              >
                {/* Gradient bg on hover */}
                <div className={`absolute inset-0 bg-gradient-to-b ${accent} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                <div className="relative">
                  {/* Step number */}
                  <span className="text-[11px] font-mono font-medium text-zinc-700 tracking-wider">{step}</span>

                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mt-4 mb-5 group-hover:scale-105 transition-transform duration-300`}>
                    <Icon className={`w-5 h-5 ${iconColor}`} strokeWidth={1.5} />
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-semibold text-white mb-2 tracking-[-0.01em]">
                    {title}
                  </h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">
                    {description}
                  </p>
                </div>

                {/* Arrow connector (hidden on last item and mobile) */}
                {i < PIPELINE.length - 1 && (
                  <div className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 hidden lg:block">
                    <ChevronRight className="w-5 h-5 text-zinc-800" strokeWidth={1.5} />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social Proof / Stats ───────────────────────────────── */}
      <section className="relative py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border border-white/[0.06] bg-zinc-950/60 overflow-hidden"
          >
            <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-white/[0.04]">
              {[
                { value: "< 60s", label: "Analysis time", sublabel: "for 50 repos" },
                { value: "20+", label: "Languages", sublabel: "detected" },
                { value: "2-6", label: "Career roles", sublabel: "per profile" },
                { value: "Free", label: "Always", sublabel: "no limits" },
              ].map(({ value, label, sublabel }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                  className="p-6 sm:p-8 text-center"
                >
                  <p className="text-2xl sm:text-3xl font-bold text-white tracking-[-0.03em]">{value}</p>
                  <p className="text-xs text-zinc-500 mt-1.5 font-medium">{label}</p>
                  <p className="text-[11px] text-zinc-700 mt-0.5">{sublabel}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Bottom CTA ─────────────────────────────────────────── */}
      <section className="relative py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-600 mb-4">Ready?</p>
            <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-[-0.03em] mb-5">
              Let your code speak
              <br />
              <span className="text-zinc-500">for itself.</span>
            </h2>
            <p className="text-zinc-600 text-sm sm:text-base max-w-md mx-auto mb-10">
              Join developers who turned their GitHub profiles into professional,
              role-targeted CVs — in under a minute.
            </p>

            {status !== "loading" && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCTA}
                className="group inline-flex items-center gap-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-7 py-3.5 rounded-xl font-semibold text-sm sm:text-base shadow-[0_0_40px_rgba(245,158,11,0.2)] hover:shadow-[0_0_60px_rgba(245,158,11,0.3)] transition-shadow"
              >
                <GitBranch className="w-4.5 h-4.5" strokeWidth={2} />
                {status === "authenticated" ? "Go to Dashboard" : "Get Started — Free"}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={2} />
              </motion.button>
            )}
          </motion.div>
        </div>

        {/* Fade-to-black gradient at bottom */}
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="relative border-t border-white/[0.04] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                <path d="M4 4 L14 4 L20 10 L20 20 L4 20 Z" fill="white" fillOpacity="0.9" />
                <path d="M14 4 L14 10 L20 10 Z" fill="white" fillOpacity="0.45" />
              </svg>
            </div>
            <span className="text-xs text-zinc-600 font-medium">CV Tailor</span>
          </div>
          <p className="text-[11px] text-zinc-700">
            Built with Next.js, Supabase, and OpenRouter. Your data stays yours.
          </p>
        </div>
      </footer>
    </main>
  );
}
