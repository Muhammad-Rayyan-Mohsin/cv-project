"use client";

import { useState, useCallback } from "react";
import { BehanceProjectCard } from "@/lib/behance-types";
import BehanceCard from "@/components/BehanceCard";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  RefreshCw,
  Check,
  AlertCircle,
  Palette,
  ExternalLink,
} from "lucide-react";

interface BehanceUser {
  display_name: string;
  occupation: string;
  city: string;
  country: string;
  bio: string;
  fields: string[];
  stats: {
    followers: number;
    following: number;
    appreciations: number;
    views: number;
  };
  url: string;
  images: Record<string, string>;
}

interface BehancePanelProps {
  /** Callback when user selects projects for analysis */
  onProjectsSelected?: (projects: BehanceProjectCard[]) => void;
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function BehancePanel({ onProjectsSelected }: BehancePanelProps) {
  const [username, setUsername] = useState("");
  const [projects, setProjects] = useState<BehanceProjectCard[]>([]);
  const [user, setUser] = useState<BehanceUser | null>(null);
  const [selectedProjects, setSelectedProjects] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);
  const [source, setSource] = useState<string>("");

  const fetchPortfolio = useCallback(
    async (forceRefresh = false) => {
      if (!username.trim()) return;

      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ username: username.trim() });
        if (forceRefresh) params.set("fresh", "1");

        const res = await fetch(`/api/behance?${params}`);

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to fetch Behance portfolio");
        }

        const data = await res.json();
        setProjects(data.projects ?? []);
        setUser(data.portfolio?.user ?? null);
        setSource(data.portfolio?.source ?? "");
        setFetched(true);

        // Auto-select all projects
        const allIds = new Set<number>(
          (data.projects ?? []).map((p: BehanceProjectCard) => p.id)
        );
        setSelectedProjects(allIds);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch portfolio"
        );
      } finally {
        setLoading(false);
      }
    },
    [username]
  );

  const toggleProject = (id: number) => {
    setSelectedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () =>
    setSelectedProjects(new Set(projects.map((p) => p.id)));
  const deselectAll = () => setSelectedProjects(new Set());

  const handleSubmitSelected = () => {
    const selected = projects.filter((p) => selectedProjects.has(p.id));
    onProjectsSelected?.(selected);
  };

  const avatarUrl =
    user?.images?.["276"] ??
    user?.images?.["138"] ??
    user?.images?.["100"] ??
    Object.values(user?.images ?? {})[0] ??
    null;

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Palette
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"
            strokeWidth={1.5}
          />
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchPortfolio()}
            placeholder="Enter Behance username..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-white/[0.06] text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/30 focus:ring-1 focus:ring-blue-500/20 transition-all"
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => fetchPortfolio()}
          disabled={loading || !username.trim()}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-semibold disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-600 transition-all shadow-[0_0_20px_rgba(59,130,246,0.15)] disabled:shadow-none"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" strokeWidth={2} />
          ) : (
            <Search className="w-4 h-4" strokeWidth={2} />
          )}
          {loading ? "Fetching..." : "Fetch Portfolio"}
        </motion.button>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-500/5 border border-red-500/20 text-red-400 rounded-xl p-3"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
              <span className="text-sm">{error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User profile card */}
      <AnimatePresence>
        {user && fetched && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl bg-zinc-950 border border-white/[0.06] p-5"
          >
            <div className="flex items-start gap-4">
              {avatarUrl && (
                <img
                  src={avatarUrl}
                  alt={user.display_name}
                  className="w-14 h-14 rounded-full object-cover border border-white/10"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-white font-semibold text-lg tracking-tight">
                    {user.display_name}
                  </h3>
                  <a
                    href={user.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-500 hover:text-blue-400 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </a>
                </div>
                {user.occupation && (
                  <p className="text-zinc-400 text-sm">{user.occupation}</p>
                )}
                {(user.city || user.country) && (
                  <p className="text-zinc-600 text-xs mt-0.5">
                    {[user.city, user.country].filter(Boolean).join(", ")}
                  </p>
                )}
                {user.fields.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {user.fields.map((f) => (
                      <span
                        key={f}
                        className="text-[11px] bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/15"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {/* Stats */}
              <div className="hidden sm:flex items-center gap-4 text-center flex-shrink-0">
                <div>
                  <p className="text-white font-bold text-sm">
                    {formatCount(user.stats.views)}
                  </p>
                  <p className="text-zinc-600 text-[10px] uppercase tracking-wider">
                    Views
                  </p>
                </div>
                <div>
                  <p className="text-white font-bold text-sm">
                    {formatCount(user.stats.appreciations)}
                  </p>
                  <p className="text-zinc-600 text-[10px] uppercase tracking-wider">
                    Likes
                  </p>
                </div>
                <div>
                  <p className="text-white font-bold text-sm">
                    {formatCount(user.stats.followers)}
                  </p>
                  <p className="text-zinc-600 text-[10px] uppercase tracking-wider">
                    Followers
                  </p>
                </div>
              </div>
            </div>
            {user.bio && (
              <p className="text-zinc-500 text-sm mt-3 line-clamp-2 leading-relaxed">
                {user.bio}
              </p>
            )}
            {source && (
              <p className="text-zinc-700 text-[10px] mt-2 uppercase tracking-wider">
                Data source: {source}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Projects grid */}
      {fetched && projects.length > 0 && (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Portfolio Projects
              </h3>
              <p className="text-zinc-500 text-sm mt-0.5">
                {projects.length} project{projects.length !== 1 ? "s" : ""} —{" "}
                {selectedProjects.size} selected
              </p>
            </div>
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => fetchPortfolio(true)}
                disabled={loading}
                className="text-sm text-zinc-500 hover:text-blue-400 transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
                  strokeWidth={2}
                />
                <span className="hidden sm:inline">Refresh</span>
              </motion.button>
              <span className="text-zinc-800">|</span>
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
              {onProjectsSelected && (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSubmitSelected}
                  disabled={selectedProjects.size === 0}
                  className="ml-2 sm:ml-4 bg-gradient-to-r from-blue-600 to-cyan-500 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-600 text-white px-4 sm:px-5 py-2 rounded-full font-semibold transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.15)] disabled:shadow-none text-sm"
                >
                  <Check className="w-4 h-4" strokeWidth={2} />
                  <span className="hidden sm:inline">
                    Use in Analysis ({selectedProjects.size})
                  </span>
                  <span className="sm:hidden">{selectedProjects.size}</span>
                </motion.button>
              )}
            </div>
          </div>

          <motion.div
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            {projects.map((project) => (
              <motion.div key={project.id} variants={fadeUp} className="h-full">
                <BehanceCard
                  project={project}
                  selected={selectedProjects.has(project.id)}
                  onToggle={() => toggleProject(project.id)}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}

      {/* No projects found */}
      {fetched && projects.length === 0 && !error && !loading && (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-zinc-950 border border-white/5 flex items-center justify-center mx-auto mb-4">
            <Palette className="w-7 h-7 text-zinc-600" strokeWidth={1.5} />
          </div>
          <p className="text-zinc-400 text-base font-medium">
            No projects found
          </p>
          <p className="text-zinc-600 text-sm mt-1">
            This Behance profile doesn&apos;t have any public projects, or we
            couldn&apos;t parse the data.
          </p>
        </div>
      )}
    </div>
  );
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}
