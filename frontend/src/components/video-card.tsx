"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCount, formatDate, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { Video } from "@/lib/types";

interface VideoCardProps {
  video: Video;
  onClick?: (video: Video) => void;
  active?: boolean;
}

export function VideoCard({ video, onClick, active }: VideoCardProps) {
  const hasAnalysis = video.video_analysis != null;
  const hookType = video.video_analysis?.hook_type;

  return (
    <Card
      className={cn(
        "group relative cursor-pointer glass-card overflow-hidden transition-all duration-500 border-white/5",
        active 
          ? "ring-2 ring-rose-500/50 shadow-2xl shadow-rose-500/10 border-rose-500/20" 
          : "hover:-translate-y-1.5 hover:shadow-[0_20px_50px_-10px_rgba(244,63,94,0.2)] hover:border-rose-500/30"
      )}
      onClick={() => onClick?.(video)}
    >
      {/* Thumbnail Layer */}
      {video.thumbnail_url && (
        <div className="relative aspect-video overflow-hidden">
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className={cn(
              "h-full w-full object-cover transition-all duration-700",
              "group-hover:scale-110 group-hover:brightness-50",
              active && "brightness-50 grayscale-[0.5]"
            )}
          />
          
          {/* Top-Right Metrics Overlay */}
          <div className="absolute right-2 top-2 z-20 flex flex-col items-end gap-1 px-2 py-1 text-[10px] font-bold text-white transition-opacity group-hover:opacity-0">
             <div className="rounded bg-black/60 px-1.5 py-0.5 backdrop-blur-md border border-white/10 shadow-lg">
                {formatCount(video.view_count)} VIEWS
             </div>
          </div>

          {/* Hover Forensic Overlay */}
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
             <div className="h-10 w-10 flex items-center justify-center rounded-full bg-rose-500/20 border border-rose-500/30 backdrop-blur-xl mb-3 shadow-[0_0_20px_rgba(244,63,94,0.2)]">
                <span className="text-xl">🔬</span>
             </div>
             <p className="text-[10px] font-bold uppercase tracking-widest text-white shadow-sm">
                Forensic Analysis
             </p>
             {hookType && (
                <Badge variant="outline" className="mt-2 bg-rose-500/10 text-rose-400 border-rose-500/20">
                   Hook: {hookType}
                </Badge>
             )}
          </div>
          
          {/* Active Status Badge */}
          {active && (
            <div className="absolute inset-x-0 bottom-3 z-40 flex justify-center">
              <span className="rounded-full bg-rose-500 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow-lg animate-pulse">
                Analyzing Live
              </span>
            </div>
          )}
        </div>
      )}

      {/* Content Layer */}
      <CardHeader className="pb-3 px-5 pt-4">
        <CardTitle className="text-sm font-bold leading-relaxed line-clamp-2 text-white group-hover:text-rose-400 transition-colors">
          {video.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <div className="flex items-center gap-4 text-[10px] font-bold tracking-widest text-muted-foreground uppercase opacity-60">
          <span className="flex items-center gap-1">
             <span className="text-emerald-400">🔥</span> 
             {formatCount(video.like_count)} LIKES
          </span>
          <span className="flex-1 text-right">{formatDate(video.published_at)}</span>
        </div>
      </CardContent>

      {/* Interactive Bottom Reveal */}
      <div className={cn(
        "absolute bottom-0 inset-x-0 h-1 bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)] transition-all duration-500",
        active ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0 group-hover:opacity-100 group-hover:scale-x-100"
      )} />
    </Card>
  );
}
