"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateIdeas, saveIdea } from "@/lib/api";
import { toast } from "sonner";
import { getScoreColor } from "@/lib/utils";
import type { VideoIdea } from "@/lib/types";

export default function IdeasPage() {
  const [niche, setNiche] = useState("");
  const [ideas, setIdeas] = useState<VideoIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!niche.trim()) return;
    setLoading(true);
    setError(null);
    setExpandedIdx(null);
    toast.loading("AI architecting video concepts...", { id: "ideas-toast" });
    try {
      const results = await generateIdeas({ niche: niche.trim(), count: 5 });
      setIdeas(results);
      toast.success("5 production-ready ideas generated!", { id: "ideas-toast" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to generate ideas";
      setError(msg);
      toast.error(`Generation failed: ${msg}`, { id: "ideas-toast" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (idea: VideoIdea) => {
    try {
      await saveIdea({
        title: idea.title,
        hook: idea.hook,
        talking_points: idea.talking_points,
        keywords: idea.keywords,
        appeal_score: idea.appeal_score,
        monetization_angle: idea.monetization_angle,
      });
      setSavedIds((prev) => new Set(prev).add(idea.title));
      toast.success("Idea saved to Command Center");
    } catch (err) {
      toast.error("Failed to save idea.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
            Idea Generator
          </span>
        </h1>
        <p className="text-muted-foreground">
          Generate production-ready video concepts with full scripts, SEO keywords, and monetization strategies.
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleGenerate} className="flex gap-2">
        <Input
          placeholder="Enter a niche (e.g. 'minimalist home office')..."
          value={niche}
          onChange={(e) => setNiche(e.target.value)}
          disabled={loading}
          className="flex-1"
        />
        <Button type="submit" disabled={loading || !niche.trim()}>
          {loading ? "Generating..." : "Generate Ideas"}
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
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
            Generating ideas with full scripts...
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border/40 p-6 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-14 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {!loading && ideas.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{ideas.length}</span> ideas generated
          </p>
          {ideas.map((idea, i) => (
            <Card key={i} className="border-border/40 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/5">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <CardTitle className="text-base font-semibold leading-snug">
                      {idea.title}
                    </CardTitle>
                    {idea.title_alt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Alt: {idea.title_alt}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {idea.appeal_score != null && (
                      <Badge variant="outline" className={`${getScoreColor(idea.appeal_score, 10)} border-current/20`}>
                        {idea.appeal_score}/10
                      </Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSave(idea)}
                      disabled={savedIds.has(idea.title)}
                      className="text-xs"
                    >
                      {savedIds.has(idea.title) ? "✓ Saved" : "💾 Save"}
                    </Button>
                  </div>
                </div>

                {/* Hook */}
                {idea.hook && (
                  <div className="mt-2 rounded-lg bg-amber-500/5 border border-amber-500/10 p-3">
                    <p className="text-xs font-semibold text-amber-400 mb-1">🎣 Opening Hook</p>
                    <p className="text-sm italic text-muted-foreground">&ldquo;{idea.hook}&rdquo;</p>
                  </div>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Keywords */}
                {idea.keywords && idea.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {idea.keywords.map((kw, j) => (
                      <Badge key={j} variant="secondary" className="text-xs font-normal">
                        {kw}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Meta row */}
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  {idea.target_length_minutes && (
                    <span>⏱ {idea.target_length_minutes} min</span>
                  )}
                  {idea.best_upload_time && (
                    <span>📅 {idea.best_upload_time}</span>
                  )}
                  {idea.monetization_angle && (
                    <span>💰 {idea.monetization_angle}</span>
                  )}
                </div>

                {/* Thumbnail Concept */}
                {idea.thumbnail_concept && (
                  <div className="rounded-lg bg-accent/50 p-3">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">🖼 Thumbnail Concept</p>
                    <p className="text-sm text-muted-foreground">{idea.thumbnail_concept}</p>
                  </div>
                )}

                {/* Expand/Collapse Script */}
                {idea.script_outline && idea.script_outline.length > 0 && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                      className="text-xs text-purple-400 hover:text-purple-300 p-0 h-auto"
                    >
                      {expandedIdx === i ? "▼ Hide Script" : "▶ View Full Script"} ({idea.script_outline.length} segments)
                    </Button>

                    {expandedIdx === i && (
                      <div className="space-y-3 mt-2">
                        <Separator />
                        {idea.script_outline.map((seg, j) => (
                          <div key={j} className="rounded-lg border border-border/40 p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                                {seg.section}
                              </span>
                              {seg.duration_seconds && (
                                <span className="text-xs text-muted-foreground">
                                  ~{Math.round(seg.duration_seconds / 60)}:{String(seg.duration_seconds % 60).padStart(2, "0")}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">{seg.content}</p>
                            {seg.visual_notes && (
                              <p className="text-xs text-muted-foreground/70 mt-1 italic">🎥 {seg.visual_notes}</p>
                            )}
                            {seg.retention_technique && (
                              <p className="text-xs text-emerald-400/80 mt-1">🧠 {seg.retention_technique}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
