"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VideoCard } from "@/components/video-card";
import { getVideos, analyzeVideo } from "@/lib/api";
import { toast } from "sonner";
import { getScoreColor } from "@/lib/utils";
import type { Video, VideoAnalysis } from "@/lib/types";

export default function VideosPage() {
  const [channelId, setChannelId] = useState("");
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Analysis state
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [analysis, setAnalysis] = useState<VideoAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelId.trim()) return;
    setLoading(true);
    setError(null);
    setSelectedVideo(null);
    setAnalysis(null);
    try {
      const results = await getVideos({ channel_id: channelId.trim() });
      setVideos(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch videos");
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async (video: Video) => {
    setSelectedVideo(video);
    setAnalyzing(true);
    setAnalysis(null);
    toast.loading("Forensic engine analyzing video...", { id: "analysis-toast" });
    try {
      const result = await analyzeVideo({
        title: video.title,
        view_count: video.view_count,
        like_count: video.like_count,
        video_id: video.youtube_id,
      });
      setAnalysis(result);
      toast.success("Forensic analysis complete!", { id: "analysis-toast" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Analysis failed";
      setError(msg);
      toast.error(`Analysis failed: ${msg}`, { id: "analysis-toast" });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          <span className="bg-gradient-to-r from-rose-400 to-orange-400 bg-clip-text text-transparent">
            Video Explorer & Analyzer
          </span>
        </h1>
        <p className="text-muted-foreground">
          Browse channel videos and run AI-powered forensic analysis on any video.
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleFetch} className="flex gap-2">
        <Input
          placeholder="YouTube Channel ID (e.g. UCxxxxxx)..."
          value={channelId}
          onChange={(e) => setChannelId(e.target.value)}
          disabled={loading}
          className="flex-1"
        />
        <Button type="submit" disabled={loading || !channelId.trim()}>
          {loading ? "Loading..." : "Fetch Videos"}
        </Button>
      </form>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
            Fetching videos...
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border/40 overflow-hidden">
                <Skeleton className="aspect-video w-full" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Video Grid + Analysis Panel */}
      {!loading && videos.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Video Grid */}
          <div className="lg:col-span-3 space-y-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{videos.length}</span> videos — click to analyze
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {videos.map((video, i) => (
                <VideoCard
                  key={video.youtube_id ?? i}
                  video={video}
                  onClick={handleAnalyze}
                  active={selectedVideo?.youtube_id === video.youtube_id}
                />
              ))}
            </div>
          </div>

          {/* Analysis Panel */}
          <div className="lg:col-span-2">
            {analyzing && (
              <Card className="border-border/40 sticky top-8">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
                    Analyzing...
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            )}

            {!analyzing && analysis && (
              <Card className="border-border/40 sticky top-8">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">🔬 AI Analysis</CardTitle>
                    {analysis.overall_score != null && (
                      <Badge variant="outline" className={`${getScoreColor(analysis.overall_score)} border-current/20`}>
                        {analysis.overall_score}/100
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">{selectedVideo?.title}</p>
                </CardHeader>
                <CardContent className="space-y-5 text-sm">
                  {/* Hook */}
                  <div>
                    <p className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-1">Hook Type</p>
                    <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                      {analysis.hook_type}
                    </Badge>
                    <p className="mt-2 text-muted-foreground leading-relaxed">{analysis.hook_analysis}</p>
                  </div>

                  {/* Emotions */}
                  {analysis.emotion_triggers.length > 0 && (
                    <div>
                      <p className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-2">Emotion Triggers</p>
                      <div className="space-y-2">
                        {analysis.emotion_triggers.map((et, i) => (
                          <div key={i} className="flex items-center justify-between rounded-lg bg-accent/50 px-3 py-2">
                            <div>
                              <span className="font-medium capitalize">{et.emotion}</span>
                              <p className="text-xs text-muted-foreground">{et.technique}</p>
                            </div>
                            {et.intensity && (
                              <span className={`text-xs font-mono font-bold ${getScoreColor(et.intensity, 10)}`}>
                                {et.intensity}/10
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Viral Factors */}
                  {analysis.viral_factors && (
                    <div>
                      <p className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-1">Why It Went Viral</p>
                      <p className="text-muted-foreground leading-relaxed">{analysis.viral_factors.primary_reason}</p>
                      <div className="flex gap-4 mt-2">
                        {analysis.viral_factors.shareability_score != null && (
                          <div className="text-center">
                            <p className={`text-lg font-bold ${getScoreColor(analysis.viral_factors.shareability_score, 10)}`}>
                              {analysis.viral_factors.shareability_score}
                            </p>
                            <p className="text-xs text-muted-foreground">Share</p>
                          </div>
                        )}
                        {analysis.viral_factors.rewatchability_score != null && (
                          <div className="text-center">
                            <p className={`text-lg font-bold ${getScoreColor(analysis.viral_factors.rewatchability_score, 10)}`}>
                              {analysis.viral_factors.rewatchability_score}
                            </p>
                            <p className="text-xs text-muted-foreground">Rewatch</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Improvements */}
                  {analysis.improvement_suggestions.length > 0 && (
                    <div>
                      <p className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-2">Improvements</p>
                      <ul className="space-y-1.5">
                        {analysis.improvement_suggestions.map((tip, i) => (
                          <li key={i} className="flex items-start gap-2 text-muted-foreground">
                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {!analyzing && !analysis && (
              <Card className="border-border/40 border-dashed sticky top-8">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <span className="text-4xl mb-3">🔬</span>
                  <p className="font-medium">Select a video to analyze</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Click any video to run AI forensic analysis
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
