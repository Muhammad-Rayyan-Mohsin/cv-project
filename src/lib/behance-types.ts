/**
 * Behance integration types.
 *
 * Behance is Adobe's platform for showcasing creative work — primarily used
 * by graphic designers, UI/UX designers, illustrators, and other visual
 * creatives. Think of it as "GitHub for designers".
 *
 * NOTE: The official Behance API (v2) was deprecated by Adobe in early 2023.
 * This integration supports two data-fetching strategies:
 *   1. Legacy API key (if you still have one via `BEHANCE_API_KEY`)
 *   2. Public profile page scraping (extracts embedded __NEXT_DATA__ JSON)
 */

// ---------------------------------------------------------------------------
// Core project / portfolio types
// ---------------------------------------------------------------------------

export interface BehanceImage {
  url: string;
  width: number;
  height: number;
}

export interface BehanceCover {
  /** The primary cover image URL */
  url: string;
  /** Thumbnail size (115px) */
  url_115?: string;
  /** Small size (202px) */
  url_202?: string;
  /** Medium size (404px) */
  url_404?: string;
  /** Large size (808px) */
  url_808?: string;
}

export interface BehanceProject {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  url: string;
  covers: BehanceCover;
  fields: string[];
  tags: string[];
  tools: BehanceTool[];
  stats: BehanceProjectStats;
  published_on: number; // Unix timestamp
  modified_on: number;  // Unix timestamp
  created_on: number;   // Unix timestamp
  mature_content: boolean;
}

export interface BehanceTool {
  id: number;
  title: string;
  category: string;
  category_label: string;
  category_id: number;
  synonym?: Record<string, unknown>;
  approved?: string;
  url?: string;
}

export interface BehanceProjectStats {
  views: number;
  appreciations: number;
  comments: number;
}

// ---------------------------------------------------------------------------
// User profile
// ---------------------------------------------------------------------------

export interface BehanceUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  display_name: string;
  city: string;
  state: string;
  country: string;
  company: string;
  occupation: string;
  url: string;
  images: {
    [size: string]: string;
  };
  fields: string[];
  stats: BehanceUserStats;
  bio: string;
  created_on: number;
  website: string;
}

export interface BehanceUserStats {
  followers: number;
  following: number;
  appreciations: number;
  views: number;
  comments: number;
}

// ---------------------------------------------------------------------------
// API response shapes
// ---------------------------------------------------------------------------

export interface BehancePortfolio {
  user: BehanceUser | null;
  projects: BehanceProject[];
  /** Where the data came from */
  source: "api" | "scrape" | "manual";
}

// ---------------------------------------------------------------------------
// Simplified / normalized project for the dashboard card
// ---------------------------------------------------------------------------

export interface BehanceProjectCard {
  id: number;
  name: string;
  description: string | null;
  url: string;
  coverUrl: string | null;
  fields: string[];        // e.g. ["Graphic Design", "UI/UX"]
  tags: string[];
  tools: string[];          // tool names
  views: number;
  appreciations: number;
  publishedAt: string;      // ISO date string
}
