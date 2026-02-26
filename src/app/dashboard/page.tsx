"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { RepoDetail, AnalysisResult, HistorySession, UsageStats, CategorizationResult } from "@/lib/types";
import RepoCard from "@/components/RepoCard";
import RepoCategoryGroup from "@/components/RepoCategoryGroup";
import CVDisplay from "@/components/CVDisplay";
import { motion, AnimatePresence } from "framer-motion";
import { fadeUp, staggerContainer } from "@/lib/animations";
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
  RefreshCw,
  FileText,
  Layers,
} from "lucide-react";
import { toast } from "sonner";

type Step = "loading" | "repos" | "categorizing" | "categorized" | "analyzing" | "results";

// Step indicator config
const STEPS = [
  { key: "repos", label: "Fetch", icon: RefreshCw },
  { key: "categorized", label: "Categorize", icon: Layers },
  { key: "analyzing", label: "Generate", icon: Cpu },
  { key: "results", label: "Results", icon: FileText },
] as const;

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

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Categorization state
  const [categorization, setCategorization] = useState<CategorizationResult | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<Map<string, Set<number>>>(new Map());

  const fetchRepos = useCallback(async (forceRefresh = false) => {
    setStep("loading");
    setFetchProgress(
      forceRefresh
        ? "Refreshing repositories from GitHub..."
        : "Fetching your repositories from GitHub..."
    );
    setError(null);
    if (forceRefresh) setIsRefreshing(true);

    try {
      const url = forceRefresh ? "/api/repos?fresh=1" : "/api/repos";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch repositories");
      const data = await res.json();

      setRepos(data.repos);
      const autoSelected = new Set<number>(
        data.repos.filter((r: RepoDetail) => !r.fork).map((r: RepoDetail) => r.id)
      );
      setSelectedRepos(autoSelected);
      categorizeRepos(data.repos, forceRefresh);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setStep("repos");
    } finally {
      setIsRefreshing(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      // Silently fail
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
    const MAX_REPOS = 50;
    setSelectedRepos(new Set(repos.slice(0, MAX_REPOS).map((r) => r.id)));
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

        if (errData.errorType === "NO_CREDITS") {
          toast.error("Sorry, we're out of credits :(", {
            description: "The service has run out of API credits. Please try again later.",
            duration: 5000,
          });
          setError(errData.message || "Out of credits");
          setStep("repos");
          return;
        }

        if (errData.errorType === "RATE_LIMIT") {
          toast.error("Rate Limited", {
            description: errData.message || "Too many requests. Please wait a moment and try again.",
            duration: 5000,
          });
          setError(errData.message || "Rate limited");
          setStep("repos");
          return;
        }

        toast.error("Analysis Failed", {
          description: errData.message || "Something went wrong. Please try again.",
          duration: 4000,
        });
        throw new Error(errData.error || "Analysis failed");
      }

      const data = await res.json();
      setAnalysis(data);
      setStep("results");
      toast.success("Analysis Complete!", {
        description: `Generated ${data.roles?.length || 0} tailored CVs for different roles.`,
        duration: 3000,
      });
      fetchHistory();
      fetchUsage();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Analysis failed");
      setStep("repos");
    }
  };

  const applyCategorization = useCallback((data: CategorizationResult, repoList: RepoDetail[]) => {
    const repoMap = new Map(repoList.map(r => [r.name, r]));
    const initialSelections = new Map<string, Set<number>>();

    for (const role of data.roles || []) {
      const roleRepoIds = new Set(
        (role.repos as string[])
          .map(name => repoMap.get(name)?.id)
          .filter((id): id is number => id !== undefined)
      );
      initialSelections.set(role.title, roleRepoIds);
    }

    setCategorization({
      summary: data.summary,
      roles: data.roles,
      categorizationId: data.categorizationId,
      tokenUsage: data.tokenUsage,
    });
    setSelectedCategories(initialSelections);
    setStep("categorized");
  }, []);

  const categorizeRepos = useCallback(async (repoList: RepoDetail[], force = false) => {
    setStep("categorizing");
    setError(null);

    try {
      if (!force) {
        const cacheRes = await fetch("/api/categorize");
        if (cacheRes.ok) {
          const cached = await cacheRes.json();
          applyCategorization(cached, repoList);
          return;
        }
      }

      const nonForkRepos = repoList.filter(r => !r.fork);
      const res = await fetch("/api/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repos: nonForkRepos.slice(0, 50),
          userName: session?.user?.name,
          userBio: "",
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Categorization failed");
      }

      const data = await res.json();
      applyCategorization(data, repoList);
      toast.success("Repositories categorized!", {
        description: `Found ${data.roles?.length || 0} career roles.`,
      });
    } catch (err) {
      console.error("Categorization failed:", err);
      toast.error("Categorization failed", {
        description: "Showing repos in flat view. You can still select and generate CVs.",
      });
      setStep("repos");
    }
  }, [session, applyCategorization]);

  const toggleCategory = useCallback((title: string) => {
    setSelectedCategories(prev => {
      const next = new Map(prev);
      const current = next.get(title) || new Set<number>();
      const categoryRepos = categorization?.roles.find(c => c.title === title)?.repos || [];
      const repoIds = categoryRepos
        .map(name => repos.find(r => r.name === name)?.id)
        .filter((id): id is number => id !== undefined);

      if (current.size === repoIds.length && repoIds.length > 0) {
        next.set(title, new Set());
      } else {
        next.set(title, new Set(repoIds));
      }
      return next;
    });
  }, [categorization, repos]);

  const toggleRepoInCategory = useCallback((title: string, repoId: number) => {
    setSelectedCategories(prev => {
      const next = new Map(prev);
      const current = new Set(next.get(title) || []);
      if (current.has(repoId)) current.delete(repoId);
      else current.add(repoId);
      next.set(title, current);
      return next;
    });
  }, []);

  // Computed values
  const totalSelectedCount = Array.from(selectedCategories.values()).reduce((sum, set) => sum + set.size, 0);
  const selectedCategoryCount = Array.from(selectedCategories.entries()).filter(([, set]) => set.size > 0).length;

  const generateCVs = async () => {
    if (!categorization) return;
    setStep("analyzing");
    setError(null);

    const selectedCats = categorization.roles
      .filter(role => {
        const selected = selectedCategories.get(role.title);
        return selected && selected.size > 0;
      })
      .map(role => {
        const selectedIds = selectedCategories.get(role.title)!;
        const selectedRepoNames = role.repos.filter(name => {
          const repo = repos.find(r => r.name === name);
          return repo && selectedIds.has(repo.id);
        });
        return {
          title: role.title,
          description: role.description,
          repoNames: selectedRepoNames,
          skills: role.skills,
        };
      });

    const allSelectedRepoNames = selectedCats.flatMap(c => c.repoNames);
    const selectedReposList = repos.filter(r => allSelectedRepoNames.includes(r.name));

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categories: selectedCats,
          repos: selectedReposList,
          userName: session?.user?.name,
          userBio: "",
          categorizationId: categorization.categorizationId,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        if (errData.code === "RATE_LIMIT") {
          toast.error("Rate limit reached", { description: errData.error });
          setStep("categorized");
          return;
        }
        throw new Error(errData.error || "CV generation failed");
      }

      const data = await res.json();
      setAnalysis(data);
      setStep("results");
      toast.success("CVs Generated!", { description: `Generated ${data.roles?.length || 0} tailored CVs.` });
      fetchHistory();
      fetchUsage();
    } catch (err) {
      console.error("CV generation failed:", err);
      toast.error("CV generation failed", { description: err instanceof Error ? err.message : "Unknown error" });
      setStep("categorized");
    }
  };

  const loadFromHistory = (historySession: HistorySession) => {
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
        structuredCv: cv.structured_cv || undefined,
      })),
      cvIds: historySession.generated_cvs.map((cv) => cv.id),
    };
    setAnalysis(result);
    setStep("results");
    setShowHistory(false);
  };

  const deleteSession = async (sessionId: string) => {
    if (!window.confirm("Delete this analysis? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/history?id=${sessionId}`, { method: "DELETE" });
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
        <div className="w-12 h-12 border-2 border-zinc-800 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <p className="text-zinc-400">Please sign in to access the dashboard.</p>
      </div>
    );
  }

  // Derive step index for the indicator
  const stepOrder = ["repos", "categorized", "analyzing", "results"];
  const mappedStep = step === "loading" ? "repos" : step === "categorizing" ? "categorized" : step;
  const currentStepIndex = stepOrder.indexOf(mappedStep);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-20">
      {/* ── Step Indicator ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 sm:mb-10"
      >
        <div className="flex items-center gap-1">
          {STEPS.map(({ key, label, icon: Icon }, i) => {
            const isActive = i <= currentStepIndex;
            const isCompleted = i < currentStepIndex;
            const isCurrent = i === currentStepIndex;

            return (
              <div key={key} className="flex items-center">
                {i > 0 && (
                  <div className={`w-8 sm:w-14 h-px mx-1 transition-colors duration-500 ${
                    isActive ? "bg-amber-500/40" : "bg-white/[0.06]"
                  }`} />
                )}
                <div className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all duration-300 ${
                  isCurrent ? "bg-white/[0.05]" : ""
                }`}>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
                    isCompleted
                      ? "bg-amber-500/15 text-amber-400"
                      : isActive
                        ? "bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-[0_0_16px_rgba(245,158,11,0.25)]"
                        : "bg-white/[0.04] text-zinc-600 border border-white/[0.06]"
                  }`}>
                    {isCompleted ? (
                      <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                    ) : (
                      <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                    )}
                  </div>
                  <span className={`text-xs font-medium transition-colors hidden sm:block ${
                    isActive ? "text-zinc-300" : "text-zinc-600"
                  }`}>
                    {label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {usage && usage.totalRequests > 0 && (
            <button
              onClick={() => { setShowUsage(!showUsage); setShowHistory(false); }}
              aria-label="Toggle usage statistics"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                showUsage
                  ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                  : "bg-white/[0.03] text-zinc-500 border border-white/[0.06] hover:border-white/[0.1] hover:text-zinc-300"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span className="hidden sm:inline">Usage</span>
            </button>
          )}

          {history.length > 0 && (
            <button
              onClick={() => { setShowHistory(!showHistory); setShowUsage(false); }}
              aria-label="Toggle analysis history"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                showHistory
                  ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                  : "bg-white/[0.03] text-zinc-500 border border-white/[0.06] hover:border-white/[0.1] hover:text-zinc-300"
              }`}
            >
              <History className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span className="hidden sm:inline">History ({history.length})</span>
              <span className="sm:hidden">{history.length}</span>
            </button>
          )}
        </div>
      </motion.div>

      {/* ── History Panel ──────────────────────────────────────── */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            className="mb-8 rounded-2xl bg-zinc-950/80 border border-white/[0.06] overflow-hidden backdrop-blur-sm"
          >
            <div className="p-5 border-b border-white/[0.05]">
              <h2 className="text-base font-semibold text-white tracking-[-0.01em]">Past Analyses</h2>
              <p className="text-sm text-zinc-600 mt-0.5">
                Click to load a previous analysis result
              </p>
            </div>
            {loadingHistory ? (
              <div className="p-8 flex justify-center">
                <div className="w-8 h-8 border-2 border-zinc-800 border-t-amber-500 rounded-full animate-spin" />
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
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
                        <span className="text-xs font-mono text-zinc-600">
                          {formatDate(historySession.created_at)}
                        </span>
                        <span className="text-[11px] bg-white/[0.04] text-zinc-500 px-2 py-0.5 rounded-md border border-white/[0.05]">
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
                            className="text-[11px] bg-amber-500/8 text-amber-400/80 px-2 py-0.5 rounded-md border border-amber-500/15"
                          >
                            {cv.role_title}
                          </span>
                        ))}
                      </div>
                    </button>
                    <button
                      onClick={() => deleteSession(historySession.id)}
                      className="p-2 text-zinc-700 hover:text-red-400 transition-colors flex-shrink-0 rounded-lg hover:bg-red-500/5"
                      aria-label={`Delete analysis from ${formatDate(historySession.created_at)}`}
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Usage Panel ────────────────────────────────────────── */}
      <AnimatePresence>
        {showUsage && usage && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            className="mb-8 rounded-2xl bg-zinc-950/80 border border-white/[0.06] overflow-hidden backdrop-blur-sm"
          >
            <div className="p-5 border-b border-white/[0.05]">
              <h2 className="text-base font-semibold text-white tracking-[-0.01em]">Token Usage</h2>
              <p className="text-sm text-zinc-600 mt-0.5">
                Cumulative usage across all analyses
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5">
              {[
                { label: "Requests", value: usage.totalRequests.toString() },
                { label: "Tokens", value: usage.totalTokens.toLocaleString() },
                { label: "In / Out", value: `${usage.totalPromptTokens.toLocaleString()} / ${usage.totalCompletionTokens.toLocaleString()}`, small: true },
                { label: "Cost", value: `$${usage.totalCostUsd.toFixed(4)}`, highlight: true },
              ].map(({ label, value, small, highlight }) => (
                <div key={label} className="rounded-xl bg-white/[0.02] p-4 border border-white/[0.04]">
                  <p className="text-[11px] text-zinc-600 uppercase tracking-wider font-medium">{label}</p>
                  <p className={`mt-1.5 font-semibold tracking-tight ${
                    highlight ? "text-amber-400 text-xl" : small ? "text-sm text-zinc-400" : "text-xl text-white"
                  }`}>
                    {value}
                  </p>
                </div>
              ))}
            </div>

            {usage.records.length > 0 && (
              <div className="border-t border-white/[0.04]">
                <div className="px-5 py-3">
                  <h3 className="text-[11px] font-medium text-zinc-600 uppercase tracking-wider">
                    Request Log
                  </h3>
                </div>
                <div className="max-h-60 overflow-auto">
                  <table className="w-full text-sm min-w-[600px]">
                    <thead className="text-[11px] text-zinc-600 uppercase bg-black/30 sticky top-0">
                      <tr>
                        <th className="px-5 py-2.5 text-left font-medium">Date</th>
                        <th className="px-5 py-2.5 text-left font-medium">Model</th>
                        <th className="px-5 py-2.5 text-right font-medium">Prompt</th>
                        <th className="px-5 py-2.5 text-right font-medium">Completion</th>
                        <th className="px-5 py-2.5 text-right font-medium">Total</th>
                        <th className="px-5 py-2.5 text-right font-medium">Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                      {usage.records.map((record) => (
                        <tr key={record.id} className="text-zinc-400 hover:bg-white/[0.015]">
                          <td className="px-5 py-2.5 text-zinc-600 whitespace-nowrap font-mono text-xs">
                            {formatDate(record.createdAt)}
                          </td>
                          <td className="px-5 py-2.5">
                            <span className="text-xs bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.05]">
                              {record.model.split("/").pop()}
                            </span>
                          </td>
                          <td className="px-5 py-2.5 text-right text-blue-400/70 font-mono text-xs">
                            {record.promptTokens.toLocaleString()}
                          </td>
                          <td className="px-5 py-2.5 text-right text-amber-400/70 font-mono text-xs">
                            {record.completionTokens.toLocaleString()}
                          </td>
                          <td className="px-5 py-2.5 text-right font-medium text-white font-mono text-xs">
                            {record.totalTokens.toLocaleString()}
                          </td>
                          <td className="px-5 py-2.5 text-right font-mono text-xs">
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

      {/* ── Error Display ──────────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-red-500/[0.06] border border-red-500/15 text-red-400 rounded-xl p-4 mb-6"
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
              <span className="text-sm">{error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Loading State ──────────────────────────────────────── */}
      {step === "loading" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-28"
        >
          <div className="relative mb-8">
            <div className="w-14 h-14 border-2 border-zinc-800/60 border-t-amber-500 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-400/80" strokeWidth={1.5} />
            </div>
          </div>
          <p className="text-zinc-300 text-base font-medium tracking-[-0.01em]">{fetchProgress}</p>
          <p className="text-zinc-600 text-sm mt-2">This usually takes just a moment...</p>
        </motion.div>
      )}

      {/* ── Categorizing State ─────────────────────────────────── */}
      {step === "categorizing" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-28"
        >
          <div className="relative mb-8">
            {/* Pulsing ambient ring */}
            <div className="absolute -inset-4 rounded-full bg-amber-500/[0.08] blur-2xl animate-pulse" />
            <div className="relative w-16 h-16 border-2 border-zinc-800/40 border-t-amber-500 border-r-orange-400 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Layers className="w-6 h-6 text-amber-400" strokeWidth={1.5} />
            </div>
          </div>
          <p className="text-zinc-200 text-lg font-semibold tracking-[-0.02em]">Analyzing your projects...</p>
          <p className="text-zinc-600 text-sm mt-2 text-center max-w-sm">
            AI is reviewing your code, READMEs, and tech stacks to group them into career roles
          </p>
          <div className="flex items-center gap-2 mt-8">
            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
            <span className="text-xs text-zinc-600 font-medium">Processing</span>
          </div>
        </motion.div>
      )}

      {/* ── Categorized View ───────────────────────────────────── */}
      {step === "categorized" && categorization && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-[-0.03em]">
                  Your Portfolio
                </h2>
                <p className="text-sm text-zinc-500 mt-2 max-w-2xl leading-relaxed">
                  {categorization.summary}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => categorizeRepos(repos, true)}
                  className="px-3.5 py-2 text-xs font-medium rounded-xl bg-white/[0.04] text-zinc-500 border border-white/[0.06] hover:text-zinc-300 hover:border-white/[0.1] transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5 inline mr-1.5" strokeWidth={1.5} />
                  Re-categorize
                </button>
              </div>
            </div>
          </motion.div>

          {/* Category groups */}
          {categorization.roles.map((role, index) => {
            const roleRepos = role.repos
              .map(name => repos.find(r => r.name === name))
              .filter((r): r is RepoDetail => r !== undefined);
            const selectedIds = selectedCategories.get(role.title) || new Set<number>();
            const allSelected = roleRepos.length > 0 && selectedIds.size === roleRepos.length;

            return (
              <RepoCategoryGroup
                key={role.title}
                title={role.title}
                description={role.description}
                skills={role.skills}
                repos={roleRepos}
                selectedRepoIds={selectedIds}
                allSelected={allSelected}
                onToggleCategory={() => toggleCategory(role.title)}
                onToggleRepo={(id) => toggleRepoInCategory(role.title, id)}
                defaultExpanded={index < 3}
                index={index}
              />
            );
          })}

          {/* Uncategorized repos */}
          {(() => {
            const categorizedNames = new Set(categorization.roles.flatMap(r => r.repos));
            const uncategorized = repos.filter(r => !categorizedNames.has(r.name) && !r.fork);
            if (uncategorized.length === 0) return null;

            const uncatSelectedIds = selectedCategories.get("__uncategorized__") || new Set<number>();
            return (
              <RepoCategoryGroup
                title="Other Repositories"
                description="Repositories not assigned to a specific career role"
                skills={[]}
                repos={uncategorized}
                selectedRepoIds={uncatSelectedIds}
                allSelected={uncategorized.length > 0 && uncatSelectedIds.size === uncategorized.length}
                onToggleCategory={() => toggleCategory("__uncategorized__")}
                onToggleRepo={(id) => toggleRepoInCategory("__uncategorized__", id)}
                defaultExpanded={false}
                index={categorization.roles.length}
              />
            );
          })()}

          {/* ── Sticky Generate Bar ──────────────────────────────── */}
          <AnimatePresence>
            {totalSelectedCount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="sticky bottom-6 z-40 flex justify-center mt-8 pointer-events-none"
              >
                <div className="pointer-events-auto flex items-center gap-4 pl-5 pr-2 py-2 rounded-2xl bg-zinc-900/95 border border-white/[0.08] backdrop-blur-xl shadow-[0_8px_40px_rgba(0,0,0,0.5)]">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-white">{totalSelectedCount}</span>
                      <span className="text-sm text-zinc-500">repos</span>
                    </div>
                    <div className="w-px h-4 bg-white/[0.08]" />
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-amber-400">{selectedCategoryCount}</span>
                      <span className="text-sm text-zinc-500">{selectedCategoryCount === 1 ? "role" : "roles"}</span>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={generateCVs}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold shadow-[0_0_24px_rgba(245,158,11,0.2)] hover:shadow-[0_0_32px_rgba(245,158,11,0.3)] transition-shadow"
                  >
                    <Sparkles className="w-4 h-4" strokeWidth={2} />
                    Generate CVs
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Repo Selection (flat fallback) ─────────────────────── */}
      {step === "repos" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-[-0.03em]">
                Your Repositories
              </h1>
              <p className="text-zinc-500 mt-1.5 text-sm">
                {repos.length} repos found — {selectedRepos.size} selected for analysis
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchRepos(true)}
                disabled={isRefreshing}
                className="text-xs text-zinc-500 hover:text-amber-400 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                aria-label="Refresh repositories from GitHub"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} strokeWidth={1.5} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <span className="text-zinc-800">|</span>
              <button onClick={selectAll} className="text-xs text-zinc-500 hover:text-white transition-colors">
                Select All
              </button>
              <span className="text-zinc-800">|</span>
              <button onClick={deselectAll} className="text-xs text-zinc-500 hover:text-white transition-colors">
                Deselect All
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={analyzeRepos}
                disabled={selectedRepos.size === 0}
                className="ml-2 sm:ml-4 bg-gradient-to-r from-amber-500 to-orange-500 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-600 text-white px-5 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 shadow-[0_0_24px_rgba(245,158,11,0.15)] disabled:shadow-none text-sm"
              >
                <Cpu className="w-4 h-4" strokeWidth={1.5} />
                <span className="hidden sm:inline">Analyze ({selectedRepos.size})</span>
                <span className="sm:hidden">({selectedRepos.size})</span>
              </motion.button>
            </div>
          </div>

          <motion.div
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            {repos.map((repo) => (
              <motion.div key={repo.id} variants={fadeUp} className="h-full">
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
              <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-5">
                <Sparkles className="w-6 h-6 text-zinc-600" strokeWidth={1.5} />
              </div>
              <p className="text-zinc-400 text-base font-medium">No repositories found</p>
              <p className="text-zinc-600 text-sm mt-1.5">Make sure your GitHub account has repositories.</p>
            </div>
          )}
        </motion.div>
      )}

      {/* ── Analyzing State ────────────────────────────────────── */}
      {step === "analyzing" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-28"
        >
          <div className="relative mb-10">
            <div className="absolute -inset-6 rounded-full bg-amber-500/[0.08] blur-3xl animate-pulse" />
            <div className="relative w-20 h-20 border-2 border-zinc-800/40 border-t-amber-500 border-r-orange-400 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Cpu className="w-7 h-7 text-amber-400" strokeWidth={1.5} />
            </div>
          </div>
          <h2 className="text-xl font-bold text-white mb-2 tracking-[-0.02em]">
            Generating your CVs...
          </h2>
          <p className="text-zinc-500 text-center max-w-sm text-sm leading-relaxed">
            AI is writing tailored CVs for {categorization ? totalSelectedCount : selectedRepos.size} repositories
            {categorization ? ` across ${selectedCategoryCount} role${selectedCategoryCount !== 1 ? "s" : ""}` : ""}
          </p>
          <div className="flex items-center gap-2 mt-8">
            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
            <span className="text-xs text-zinc-600 font-medium">Processing with AI</span>
          </div>
        </motion.div>
      )}

      {/* ── Results ────────────────────────────────────────────── */}
      {step === "results" && analysis && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-[-0.03em]">
                Your Tailored CVs
              </h1>
              <p className="text-zinc-500 mt-1.5 text-sm">{analysis.summary}</p>
            </div>
            <button
              onClick={() => setStep(categorization ? "categorized" : "repos")}
              className="self-start text-xs text-zinc-500 hover:text-white transition-colors flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/[0.06] hover:border-white/[0.1] bg-white/[0.02] shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
              {categorization ? "Back to roles" : "Back to repos"}
            </button>
          </div>

          {analysis.tokenUsage && (
            <div className="mb-6 flex flex-wrap items-center gap-3 text-xs text-zinc-600">
              <div className="flex items-center gap-1.5">
                <Zap className="w-3 h-3" strokeWidth={1.5} />
                <span className="font-mono">{analysis.tokenUsage.totalTokens.toLocaleString()} tokens</span>
              </div>
              <span className="text-zinc-800">|</span>
              <span className="font-mono">
                <span className="text-blue-400/60">{analysis.tokenUsage.promptTokens.toLocaleString()}</span>
                {" / "}
                <span className="text-amber-400/60">{analysis.tokenUsage.completionTokens.toLocaleString()}</span>
              </span>
              <span className="text-zinc-800">|</span>
              <span className="font-mono">{analysis.tokenUsage.model.split("/").pop()}</span>
            </div>
          )}

          <CVDisplay roles={analysis.roles} cvIds={analysis.cvIds} />
        </motion.div>
      )}
    </main>
  );
}
