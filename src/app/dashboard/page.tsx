"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { RepoDetail, AnalysisResult, HistorySession, UsageStats } from "@/lib/types";
import RepoCard from "@/components/RepoCard";
import CVDisplay from "@/components/CVDisplay";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cpu,
  Check,
  AlertCircle,
  ArrowLeft,
  Zap,
  Trash2,
  BarChart3,
  History,
  Sparkles,
} from "lucide-react";

type Step = "loading" | "repos" | "analyzing" | "results";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

export default function Dashboard() {
  const { data: session, status } = useSession();

  const [step, setStep] = useState<Step>("loading");
  const [repos, setRepos] = useState<RepoDetail[]>([]);
  const [selectedRepos, setSelectedRepos] = useState<Set<number>>(new Set());
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fetchProgress, setFetchProgress] = useState("");

  // History state
  const [history, setHistory] = useState<HistorySession[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Usage state
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [showUsage, setShowUsage] = useState(false);

  const fetchRepos = useCallback(async () => {
    setStep("loading");
    setFetchProgress("Fetching your repositories from GitHub...");
    setError(null);

    try {
      const res = await fetch("/api/repos");
      if (!res.ok) throw new Error("Failed to fetch repositories");
      const data = await res.json();

      setRepos(data.repos);
      const autoSelected = new Set<number>(
        data.repos.filter((r: RepoDetail) => !r.fork).map((r: RepoDetail) => r.id)
      );
      setSelectedRepos(autoSelected);
      setStep("repos");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setStep("repos");
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/history");
      if (res.ok) {
        const data = await res.json();
        setHistory(data.sessions || []);
      }
    } catch {
      // Silently fail — history is not critical
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const fetchUsage = useCallback(async () => {
    try {
      const res = await fetch("/api/usage");
      if (res.ok) {
        const data = await res.json();
        setUsage(data);
      }
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchRepos();
      fetchHistory();
      fetchUsage();
    }
  }, [status, fetchRepos, fetchHistory, fetchUsage]);

  const toggleRepo = (id: number) => {
    setSelectedRepos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedRepos(new Set(repos.map((r) => r.id)));
  };

  const deselectAll = () => {
    setSelectedRepos(new Set());
  };

  const analyzeRepos = async () => {
    setStep("analyzing");
    setError(null);

    const selected = repos.filter((r) => selectedRepos.has(r.id));

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repos: selected,
          userName: session?.user?.name,
          userBio: "",
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Analysis failed");
      }

      const data = await res.json();
      setAnalysis(data);
      setStep("results");
      // Refresh history and usage after new analysis
      fetchHistory();
      fetchUsage();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Analysis failed");
      setStep("repos");
    }
  };

  const loadFromHistory = (historySession: HistorySession) => {
    // Convert history session data into AnalysisResult format
    const result: AnalysisResult = {
      summary: historySession.summary || "",
      sessionId: historySession.id,
      roles: historySession.generated_cvs.map((cv) => ({
        role: cv.role_title,
        description: cv.role_description || "",
        matchingRepos: (cv.matching_repos || []).map((r) => ({
          id: 0,
          name: r.name,
          full_name: r.name,
          description: null,
          html_url: r.html_url,
          language: null,
          languages_url: "",
          topics: [],
          stargazers_count: 0,
          forks_count: 0,
          created_at: "",
          updated_at: "",
          pushed_at: "",
          fork: false,
          private: false,
          size: 0,
          default_branch: "main",
          languages: {},
          readme: null,
        })),
        skills: cv.skills,
        cv: cv.cv_content,
      })),
    };
    setAnalysis(result);
    setStep("results");
    setShowHistory(false);
  };

  const deleteSession = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/history?id=${sessionId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setHistory((prev) => prev.filter((s) => s.id !== sessionId));
      }
    } catch {
      // Silently fail
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (status === "loading") {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-zinc-800 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24">
      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          {[
            { key: "repos", label: "Select Repos" },
            { key: "analyzing", label: "AI Analysis" },
            { key: "results", label: "Your CVs" },
          ].map(({ key, label }, i) => {
            const stepOrder = ["repos", "analyzing", "results"];
            const currentIndex = stepOrder.indexOf(step === "loading" ? "repos" : step);
            const thisIndex = i;
            const isActive = thisIndex <= currentIndex;
            const isCompleted = thisIndex < currentIndex;

            return (
              <div key={key} className="flex items-center gap-4">
                {i > 0 && (
                  <div
                    className={`w-12 h-0.5 rounded-full transition-colors ${
                      isActive
                        ? "bg-gradient-to-r from-purple-500 to-fuchsia-500"
                        : "bg-zinc-800"
                    }`}
                  />
                )}
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      isActive
                        ? "bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                        : "bg-zinc-900 text-zinc-600 border border-white/5"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4" strokeWidth={3} />
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium transition-colors ${
                      isActive ? "text-white" : "text-zinc-600"
                    }`}
                  >
                    {label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {/* Usage Toggle */}
          {usage && usage.totalRequests > 0 && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { setShowUsage(!showUsage); setShowHistory(false); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                showUsage
                  ? "bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.2)]"
                  : "bg-zinc-950 text-zinc-400 border border-white/5 hover:border-white/10 hover:text-white"
              }`}
            >
              <BarChart3 className="w-4 h-4" strokeWidth={1.5} />
              Usage
            </motion.button>
          )}

          {/* History Toggle */}
          {history.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { setShowHistory(!showHistory); setShowUsage(false); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                showHistory
                  ? "bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.2)]"
                  : "bg-zinc-950 text-zinc-400 border border-white/5 hover:border-white/10 hover:text-white"
              }`}
            >
              <History className="w-4 h-4" strokeWidth={1.5} />
              History ({history.length})
            </motion.button>
          )}
        </div>
      </div>

      {/* History Panel */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="mb-8 rounded-2xl bg-zinc-950 border border-white/5 overflow-hidden"
          >
            <div className="p-5 border-b border-white/5">
              <h2 className="text-lg font-bold text-white tracking-tight">Past Analyses</h2>
              <p className="text-sm text-zinc-500 mt-1">
                Click to load a previous analysis result
              </p>
            </div>
            {loadingHistory ? (
              <div className="p-8 flex justify-center">
                <div className="w-8 h-8 border-2 border-zinc-800 border-t-purple-500 rounded-full animate-spin" />
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {history.map((historySession) => (
                  <div
                    key={historySession.id}
                    className="p-4 hover:bg-white/[0.02] transition-colors flex items-center justify-between gap-4"
                  >
                    <button
                      onClick={() => loadFromHistory(historySession)}
                      className="flex-1 text-left"
                    >
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-sm text-zinc-500">
                          {formatDate(historySession.created_at)}
                        </span>
                        <span className="text-xs bg-white/5 text-zinc-400 px-2 py-0.5 rounded-full border border-white/5">
                          {historySession.generated_cvs.length} role{historySession.generated_cvs.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-300 line-clamp-1">
                        {historySession.summary || "No summary"}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {historySession.generated_cvs.map((cv) => (
                          <span
                            key={cv.id}
                            className="text-xs bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/20"
                          >
                            {cv.role_title}
                          </span>
                        ))}
                      </div>
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => deleteSession(historySession.id)}
                      className="p-2 text-zinc-600 hover:text-red-400 transition-colors flex-shrink-0"
                      title="Delete this analysis"
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                    </motion.button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Usage Panel */}
      <AnimatePresence>
        {showUsage && usage && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="mb-8 rounded-2xl bg-zinc-950 border border-white/5 overflow-hidden"
          >
            <div className="p-5 border-b border-white/5">
              <h2 className="text-lg font-bold text-white tracking-tight">LLM Token Usage</h2>
              <p className="text-sm text-zinc-500 mt-1">
                Cumulative usage across all analyses
              </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5">
              <div className="rounded-xl bg-black p-4 border border-white/5">
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Total Requests</p>
                <p className="text-2xl font-extrabold text-white mt-1 tracking-tight">{usage.totalRequests}</p>
              </div>
              <div className="rounded-xl bg-black p-4 border border-white/5">
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Total Tokens</p>
                <p className="text-2xl font-extrabold text-white mt-1 tracking-tight">
                  {usage.totalTokens.toLocaleString()}
                </p>
              </div>
              <div className="rounded-xl bg-black p-4 border border-white/5">
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Prompt / Completion</p>
                <p className="text-sm font-medium text-zinc-300 mt-2">
                  <span className="text-blue-400">{usage.totalPromptTokens.toLocaleString()}</span>
                  {" / "}
                  <span className="text-purple-400">{usage.totalCompletionTokens.toLocaleString()}</span>
                </p>
              </div>
              <div className="rounded-xl bg-black p-4 border border-white/5">
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Estimated Cost</p>
                <p className="text-2xl font-extrabold gradient-text-purple mt-1 tracking-tight">
                  ${usage.totalCostUsd.toFixed(4)}
                </p>
              </div>
            </div>

            {/* Per-request breakdown */}
            {usage.records.length > 0 && (
              <div className="border-t border-white/5">
                <div className="px-5 py-3">
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Request Log
                  </h3>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs text-zinc-600 uppercase bg-black/50 sticky top-0">
                      <tr>
                        <th className="px-5 py-2.5 text-left">Date</th>
                        <th className="px-5 py-2.5 text-left">Model</th>
                        <th className="px-5 py-2.5 text-right">Prompt</th>
                        <th className="px-5 py-2.5 text-right">Completion</th>
                        <th className="px-5 py-2.5 text-right">Total</th>
                        <th className="px-5 py-2.5 text-right">Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {usage.records.map((record) => (
                        <tr key={record.id} className="text-zinc-400 hover:bg-white/[0.02]">
                          <td className="px-5 py-2.5 text-zinc-500">
                            {formatDate(record.createdAt)}
                          </td>
                          <td className="px-5 py-2.5">
                            <span className="text-xs bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                              {record.model.split("/").pop()}
                            </span>
                          </td>
                          <td className="px-5 py-2.5 text-right text-blue-400">
                            {record.promptTokens.toLocaleString()}
                          </td>
                          <td className="px-5 py-2.5 text-right text-purple-400">
                            {record.completionTokens.toLocaleString()}
                          </td>
                          <td className="px-5 py-2.5 text-right font-medium text-white">
                            {record.totalTokens.toLocaleString()}
                          </td>
                          <td className="px-5 py-2.5 text-right">
                            ${record.costUsd.toFixed(4)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-500/5 border border-red-500/20 text-red-400 rounded-2xl p-4 mb-6"
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} />
              <span className="text-sm">{error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      {step === "loading" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-24"
        >
          <div className="relative mb-8">
            <div className="w-16 h-16 border-2 border-zinc-800 border-t-purple-500 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-purple-400" strokeWidth={1.5} />
            </div>
          </div>
          <p className="text-zinc-300 text-lg font-medium">{fetchProgress}</p>
          <p className="text-zinc-600 text-sm mt-2">
            Fetching languages and README content for each repo...
          </p>
        </motion.div>
      )}

      {/* Repo Selection */}
      {step === "repos" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">
                Your Repositories
              </h1>
              <p className="text-zinc-500 mt-1.5 text-sm">
                {repos.length} repos found — {selectedRepos.size} selected for
                analysis
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={selectAll}
                className="text-sm text-zinc-500 hover:text-white transition-colors"
              >
                Select All
              </button>
              <span className="text-zinc-800">|</span>
              <button
                onClick={deselectAll}
                className="text-sm text-zinc-500 hover:text-white transition-colors"
              >
                Deselect All
              </button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={analyzeRepos}
                disabled={selectedRepos.size === 0}
                className="ml-4 bg-gradient-to-r from-purple-500 to-fuchsia-500 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-600 text-white px-6 py-2.5 rounded-full font-semibold transition-all flex items-center gap-2 shadow-[0_0_30px_rgba(168,85,247,0.15)] disabled:shadow-none text-sm"
              >
                <Cpu className="w-4 h-4" strokeWidth={2} />
                Analyze with AI ({selectedRepos.size})
              </motion.button>
            </div>
          </div>

          <motion.div
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            {repos.map((repo) => (
              <motion.div key={repo.id} variants={fadeUp}>
                <RepoCard
                  repo={repo}
                  selected={selectedRepos.has(repo.id)}
                  onToggle={() => toggleRepo(repo.id)}
                />
              </motion.div>
            ))}
          </motion.div>

          {repos.length === 0 && !error && (
            <div className="text-center py-24">
              <div className="w-16 h-16 rounded-2xl bg-zinc-950 border border-white/5 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-zinc-600" strokeWidth={1.5} />
              </div>
              <p className="text-zinc-400 text-lg font-medium">
                No repositories found
              </p>
              <p className="text-zinc-600 text-sm mt-2">
                Make sure your GitHub account has repositories.
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Analyzing State */}
      {step === "analyzing" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-24"
        >
          <div className="relative mb-10">
            {/* Outer glow ring */}
            <div className="absolute inset-0 rounded-full bg-purple-500/20 blur-xl animate-pulse" />
            <div className="relative w-24 h-24 border-2 border-zinc-800 border-t-purple-500 border-r-fuchsia-500 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Cpu className="w-8 h-8 text-purple-400" strokeWidth={1.5} />
            </div>
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-3 tracking-tight">
            AI Agent is Analyzing...
          </h2>
          <p className="text-zinc-500 text-center max-w-md text-sm leading-relaxed">
            Gemini 3 Flash is reviewing your {selectedRepos.size} repositories,
            identifying career roles, and generating tailored CVs. This may take
            a minute.
          </p>
          <div className="flex items-center gap-2.5 mt-8 text-sm text-zinc-600">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
            Processing with OpenRouter AI
          </div>
        </motion.div>
      )}

      {/* Results */}
      {step === "results" && analysis && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">
                Your Tailored CVs
              </h1>
              <p className="text-zinc-500 mt-1.5 text-sm">{analysis.summary}</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setStep("repos")}
              className="text-sm text-zinc-500 hover:text-white transition-colors flex items-center gap-2 px-4 py-2 rounded-full border border-white/5 hover:border-white/10 bg-zinc-950"
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
              Back to repos
            </motion.button>
          </div>

          {/* Token usage for this analysis */}
          {analysis.tokenUsage && (
            <div className="mb-6 flex items-center gap-4 text-xs text-zinc-600">
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>
                  {analysis.tokenUsage.totalTokens.toLocaleString()} tokens
                </span>
              </div>
              <span className="text-zinc-800">|</span>
              <span>
                <span className="text-blue-400/70">{analysis.tokenUsage.promptTokens.toLocaleString()}</span> in /
                {" "}
                <span className="text-purple-400/70">{analysis.tokenUsage.completionTokens.toLocaleString()}</span> out
              </span>
              <span className="text-zinc-800">|</span>
              <span>{analysis.tokenUsage.model.split("/").pop()}</span>
            </div>
          )}

          <CVDisplay roles={analysis.roles} />
        </motion.div>
      )}
    </main>
  );
}
