"use client";

import { useSession, signIn } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Github,
  Cpu,
  FileText,
  Sparkles,
  ArrowRight,
  Zap,
  Shield,
  Clock,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

export default function Home() {
  const { status } = useSession();

  return (
    <main className="min-h-screen pt-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="ambient-glow ambient-glow-purple w-[600px] h-[600px] -top-40 -left-40" />
        <div className="ambient-glow ambient-glow-blue w-[500px] h-[500px] top-20 right-0" />
        <div className="ambient-glow ambient-glow-orange w-[300px] h-[300px] bottom-0 left-1/3" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32">
          <motion.div
            className="text-center max-w-4xl mx-auto"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            {/* Badge */}
            <motion.div variants={fadeUp} className="mb-8">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-1.5 text-xs font-medium text-zinc-400">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" strokeWidth={2} />
                Powered by AI + GitHub
              </span>
            </motion.div>

            {/* Heading */}
            <motion.h1
              variants={fadeUp}
              className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-none tracking-tight mb-6"
            >
              Turn Your GitHub Into{" "}
              <span className="gradient-text-purple">Career-Ready CVs</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={fadeUp}
              className="text-lg sm:text-xl text-zinc-400 font-normal leading-relaxed max-w-2xl mx-auto mb-12"
            >
              Connect your GitHub account, and our AI agent analyzes every
              project — identifying skills, patterns, and expertise to generate
              tailored CVs for each career role.
            </motion.p>

            {/* CTA */}
            <motion.div variants={fadeUp}>
              {status === "loading" ? (
                <div className="inline-block w-10 h-10 border-2 border-zinc-800 border-t-purple-500 rounded-full animate-spin" />
              ) : (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => signIn("github")}
                  className="group inline-flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full font-semibold text-lg hover:bg-zinc-100 transition-all shadow-[0_0_60px_rgba(168,85,247,0.15)]"
                >
                  <Github className="w-5 h-5" strokeWidth={2} />
                  Sign in with GitHub
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={2} />
                </motion.button>
              )}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Bento Grid Features */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          {/* Card 1 - Large */}
          <motion.div
            variants={fadeUp}
            className="relative overflow-hidden rounded-2xl bg-zinc-950 border border-white/5 p-8 md:col-span-2 group card-shimmer"
          >
            <div className="ambient-glow ambient-glow-purple w-[200px] h-[200px] -top-20 -right-20 opacity-10" />
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6">
                <Github className="w-6 h-6 text-purple-400" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
                Deep GitHub Integration
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed max-w-md">
                Securely connect your GitHub and fetch all repositories including
                languages, topics, and README content for comprehensive analysis.
                Works with both public and private repos.
              </p>
            </div>
          </motion.div>

          {/* Card 2 */}
          <motion.div
            variants={fadeUp}
            className="relative overflow-hidden rounded-2xl bg-zinc-950 border border-white/5 p-8 group card-shimmer"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6">
              <Cpu className="w-6 h-6 text-blue-400" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
              AI-Powered Analysis
            </h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Gemini 3 Flash intelligently categorizes your projects into career
              roles like ML Engineer, Full-Stack, DevOps, and more.
            </p>
          </motion.div>

          {/* Card 3 */}
          <motion.div
            variants={fadeUp}
            className="relative overflow-hidden rounded-2xl bg-zinc-950 border border-white/5 p-8 group card-shimmer"
          >
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-6">
              <FileText className="w-6 h-6 text-orange-400" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
              Tailored CVs
            </h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Get professionally written, role-specific CVs highlighting the
              right projects, skills, and experience for each career path.
            </p>
          </motion.div>

          {/* Card 4 */}
          <motion.div
            variants={fadeUp}
            className="relative overflow-hidden rounded-2xl bg-zinc-950 border border-white/5 p-8 group card-shimmer"
          >
            <div className="w-12 h-12 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center mb-6">
              <Zap className="w-6 h-6 text-fuchsia-400" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
              Blazing Fast
            </h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Analyze dozens of repositories and generate multiple CVs in under
              a minute with our optimized AI pipeline.
            </p>
          </motion.div>

          {/* Card 5 - Large */}
          <motion.div
            variants={fadeUp}
            className="relative overflow-hidden rounded-2xl bg-zinc-950 border border-white/5 p-8 md:col-span-2 lg:col-span-1 group card-shimmer"
          >
            <div className="flex gap-6">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
                  <Shield className="w-6 h-6 text-emerald-400" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
                  Secure & Private
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Your data is processed securely. We only read repo metadata —
                  no code is stored or shared.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          {[
            { label: "Response Time", value: "<60s", icon: Clock },
            { label: "Languages", value: "20+", icon: Cpu },
            { label: "Career Roles", value: "Auto", icon: FileText },
            { label: "Cost", value: "Free", icon: Sparkles },
          ].map(({ label, value, icon: Icon }) => (
            <motion.div
              key={label}
              variants={fadeUp}
              className="text-center p-6 rounded-2xl border border-white/5 bg-zinc-950"
            >
              <Icon className="w-5 h-5 text-zinc-500 mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-2xl font-extrabold text-white tracking-tight">{value}</p>
              <p className="text-xs text-zinc-500 mt-1 font-medium uppercase tracking-wider">
                {label}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </main>
  );
}
