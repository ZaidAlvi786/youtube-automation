/**
 * API client — typed fetch wrapper for the unified backend endpoints.
 *
 * All responses use the APIResponse<T> envelope:
 *   { success: boolean, data: T, error?: string, count?: number }
 */

import type {
  APIResponse,
  Niche,
  NicheGenerateRequest,
  Channel,
  DiscoveryStats,
  Video,
  VideoIdea,
  VideoAnalysis,
  VideoAnalyzeRequest,
  IdeaGenerateRequest,
  SaveIdeaRequest,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ---------- Core request helper ----------

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<APIResponse<T>> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`API error ${res.status}: ${text}`);
  }

  const json: APIResponse<T> = await res.json();

  if (!json.success && json.error) {
    throw new Error(json.error);
  }

  return json;
}

// ---------- 1. Niches ----------

export async function generateNiches(
  data: NicheGenerateRequest
): Promise<Niche[]> {
  const res = await request<Niche[]>("/api/generate-niches", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data ?? [];
}

// ---------- 2. Channels ----------

export async function getChannels(params: {
  query: string;
  max_results?: number;
  min_subs?: number;
  max_subs?: number;
  max_videos?: number;
  niche_id?: string;
  discover?: boolean;
  max_age_days?: number;
}): Promise<{ data: Channel[]; meta?: DiscoveryStats }> {
  const sp = new URLSearchParams();
  sp.set("query", params.query);
  if (params.max_results) sp.set("max_results", String(params.max_results));
  if (params.min_subs) sp.set("min_subs", String(params.min_subs));
  if (params.max_subs) sp.set("max_subs", String(params.max_subs));
  if (params.max_videos) sp.set("max_videos", String(params.max_videos));
  if (params.niche_id) sp.set("niche_id", params.niche_id);
  if (params.discover) sp.set("discover", "true");
  if (params.max_age_days) sp.set("max_age_days", String(params.max_age_days));
  else if (params.discover) sp.set("max_age_days", "120"); // Default for discovery

  const res = await request<Channel[]>(`/api/get-channels?${sp.toString()}`);
  return { data: res.data ?? [], meta: res.meta };
}

// ---------- 3. Videos ----------

export async function getVideos(params: {
  channel_id: string;
  max_results?: number;
  order?: string;
}): Promise<Video[]> {
  const sp = new URLSearchParams();
  sp.set("channel_id", params.channel_id);
  if (params.max_results) sp.set("max_results", String(params.max_results));
  if (params.order) sp.set("order", params.order);

  const res = await request<Video[]>(`/api/get-videos?${sp.toString()}`);
  return res.data ?? [];
}

// ---------- 4. Video Analysis ----------

export async function analyzeVideo(
  data: VideoAnalyzeRequest
): Promise<VideoAnalysis> {
  const res = await request<VideoAnalysis>("/api/analyze-video", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data;
}

// ---------- 5. Ideas ----------

export async function generateIdeas(
  data: IdeaGenerateRequest
): Promise<VideoIdea[]> {
  const res = await request<VideoIdea[]>("/api/generate-idea", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data ?? [];
}

export async function saveIdea(
  data: SaveIdeaRequest
): Promise<VideoIdea> {
  const res = await request<VideoIdea>("/api/save-idea", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data;
}
