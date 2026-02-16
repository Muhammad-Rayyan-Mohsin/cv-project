"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { RepoDetail, AnalysisResult, HistorySession } from "@/lib/types";
import RepoCard from "@/components/RepoCard";
import CVDisplay from "@/components/CVDisplay";

type Step = "loading" | "repos" | "analyzing" | "results";

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

  useEffect(() => {
    if (status === "authenticated") {
      fetchRepos();
      fetchHistory();
    }
  }, [status, fetchRepos, fetchHistory]);

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
      // Refresh history after new analysis
      fetchHistory();
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
        <div className="w-12 h-12 border-4 border-gray-700 border-t-emerald-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-8">
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

            return (
              <div key={key} className="flex items-center gap-4">
                {i > 0 && (
                  <div
                    className={`w-12 h-0.5 ${
                      isActive ? "bg-emerald-400" : "bg-gray-700"
                    }`}
                  />
                )}
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      isActive
                        ? "bg-emerald-400 text-gray-900"
                        : "bg-gray-800 text-gray-500"
                    }`}
                  >
                    {thisIndex < currentIndex ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      isActive ? "text-white" : "text-gray-500"
                    }`}
                  >
                    {label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* History Toggle */}
        {history.length > 0 && (
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              showHistory
                ? "bg-emerald-400 text-gray-900"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            History ({history.length})
          </button>
        )}
      </div>

      {/* History Panel */}
      {showHistory && (
        <div className="mb-8 bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-white">Past Analyses</h2>
            <p className="text-sm text-gray-400 mt-1">
              Click to load a previous analysis result
            </p>
          </div>
          {loadingHistory ? (
            <div className="p-8 flex justify-center">
              <div className="w-8 h-8 border-4 border-gray-700 border-t-emerald-400 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="divide-y divide-gray-700/50">
              {history.map((historySession) => (
                <div
                  key={historySession.id}
                  className="p-4 hover:bg-gray-700/30 transition-colors flex items-center justify-between gap-4"
                >
                  <button
                    onClick={() => loadFromHistory(historySession)}
                    className="flex-1 text-left"
                  >
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-sm text-gray-400">
                        {formatDate(historySession.created_at)}
                      </span>
                      <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">
                        {historySession.generated_cvs.length} role{historySession.generated_cvs.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 line-clamp-1">
                      {historySession.summary || "No summary"}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {historySession.generated_cvs.map((cv) => (
                        <span
                          key={cv.id}
                          className="text-xs bg-emerald-400/10 text-emerald-400 px-2 py-0.5 rounded-full"
                        >
                          {cv.role_title}
                        </span>
                      ))}
                    </div>
                  </button>
                  <button
                    onClick={() => deleteSession(historySession.id)}
                    className="p-2 text-gray-500 hover:text-red-400 transition-colors flex-shrink-0"
                    title="Delete this analysis"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Loading State */}
      {step === "loading" && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 border-4 border-gray-700 border-t-emerald-400 rounded-full animate-spin mb-6" />
          <p className="text-gray-400 text-lg">{fetchProgress}</p>
          <p className="text-gray-500 text-sm mt-2">
            Fetching languages and README content for each repo...
          </p>
        </div>
      )}

      {/* Repo Selection */}
      {step === "repos" && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white">
                Your Repositories
              </h1>
              <p className="text-gray-400 mt-1">
                {repos.length} repos found — {selectedRepos.size} selected for
                analysis
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={selectAll}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Select All
              </button>
              <span className="text-gray-600">|</span>
              <button
                onClick={deselectAll}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Deselect All
              </button>
              <button
                onClick={analyzeRepos}
                disabled={selectedRepos.size === 0}
                className="ml-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-700 disabled:text-gray-500 text-white px-6 py-2.5 rounded-xl font-semibold transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Analyze with AI ({selectedRepos.size})
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {repos.map((repo) => (
              <RepoCard
                key={repo.id}
                repo={repo}
                selected={selectedRepos.has(repo.id)}
                onToggle={() => toggleRepo(repo.id)}
              />
            ))}
          </div>

          {repos.length === 0 && !error && (
            <div className="text-center py-20">
              <p className="text-gray-400 text-lg">
                No repositories found. Make sure your GitHub account has
                repositories.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Analyzing State */}
      {step === "analyzing" && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="relative mb-8">
            <div className="w-20 h-20 border-4 border-gray-700 border-t-emerald-400 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            AI Agent is Analyzing...
          </h2>
          <p className="text-gray-400 text-center max-w-md">
            Gemini 3 Flash is reviewing your {selectedRepos.size} repositories,
            identifying career roles, and generating tailored CVs. This may take
            a minute.
          </p>
          <div className="flex items-center gap-2 mt-6 text-sm text-gray-500">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            Processing with OpenRouter AI
          </div>
        </div>
      )}

      {/* Results */}
      {step === "results" && analysis && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white">
                Your Tailored CVs
              </h1>
              <p className="text-gray-400 mt-1">{analysis.summary}</p>
            </div>
            <button
              onClick={() => setStep("repos")}
              className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to repos
            </button>
          </div>

          <CVDisplay roles={analysis.roles} />
        </div>
      )}
    </main>
  );
}
