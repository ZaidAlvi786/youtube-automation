// Shared TypeScript interfaces — synced with backend Pydantic schemas

// ==================== NICHES ====================

export interface Niche {
  id?: string;
  category: string;
  name: string;
  description?: string;
  competition_level?: "low" | "medium" | "high";
  score: number;
  monetization_score: number;
  trends_score: number;
  target_audience?: string;
  content_format?: string;
  example_titles?: string[];
  growth_strategy?: string;
  created_at?: string;
}

export interface NicheGenerateRequest {
  category: string;
  count?: number;
}

// ==================== CHANNELS ====================

export interface Channel {
  id?: string;
  youtube_id: string;
  niche_id?: string;
  title: string;
  description?: string;
  subscriber_count?: number;
  video_count?: number;
  view_count?: number;
  views_per_video?: number;
  upload_frequency?: number;
  growth_velocity?: number;
  opportunity_score?: number;
  trends_multiplier?: number;
  keywords?: string[];
  thumbnail_url?: string;
  cache_expires_at?: string;
  fetched_at?: string;
}

// ==================== VIDEOS ====================

export interface Video {
  id?: string;
  youtube_id: string;
  channel_id?: string;
  title: string;
  view_count?: number;
  like_count?: number;
  published_at?: string;
  thumbnail_url?: string;
  video_analysis?: VideoAnalysis;
  fetched_at?: string;
}

// ==================== VIDEO ANALYSIS ====================

export interface EmotionTrigger {
  emotion: string;
  technique: string;
  intensity?: number;
}

export interface VideoStructure {
  type: string;
  estimated_segments: { name: string; purpose: string }[];
  pacing: "fast" | "medium" | "slow";
}

export interface ViralFactors {
  primary_reason: string;
  shareability_score?: number;
  rewatchability_score?: number;
  algorithm_signals: string[];
}

export interface VideoAnalysis {
  hook_type: string;
  hook_analysis: string;
  structure?: VideoStructure;
  emotion_triggers: EmotionTrigger[];
  viral_factors?: ViralFactors;
  improvement_suggestions: string[];
  overall_score?: number;
}

export interface VideoAnalyzeRequest {
  title: string;
  description?: string;
  view_count?: number;
  like_count?: number;
  channel_name?: string;
  niche?: string;
  video_id?: string;
}

// ==================== IDEAS ====================

export interface ScriptSegment {
  section: string;
  duration_seconds?: number;
  content: string;
  visual_notes?: string;
  retention_technique?: string;
}

export interface VideoIdea {
  id?: string;
  niche_id?: string;
  source_video_id?: string;
  title: string;
  title_alt?: string;
  hook?: string;
  thumbnail_concept?: string;
  script_outline?: ScriptSegment[];
  talking_points: string[];
  keywords?: string[];
  target_length_minutes?: number;
  best_upload_time?: string;
  appeal_score?: number;
  monetization_angle?: string;
  created_at?: string;
}

export interface IdeaGenerateRequest {
  niche: string;
  niche_id?: string;
  reference_videos?: string[];
  count?: number;
  audience_level?: "beginner" | "intermediate" | "advanced";
}

export interface SaveIdeaRequest {
  niche_id?: string;
  source_video_id?: string;
  title: string;
  title_alt?: string;
  hook?: string;
  talking_points?: string[];
  keywords?: string[];
  appeal_score?: number;
  monetization_angle?: string;
}

// ==================== DISCOVERY ====================

export interface DiscoveryStats {
  total_scanned: number;
  rejected_age: number;
  rejected_videos: number;
  rejected_performance: number;
  already_known: number;
  status?: string;
}

// ==================== API RESPONSE ====================

export interface APIResponse<T = unknown> {
  success: boolean;
  data: T;
  error?: string;
  count?: number;
  meta?: any;
}
