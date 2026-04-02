"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn, formatCount, getScoreBg } from "@/lib/utils";
import type { Channel } from "@/lib/types";

interface ChannelCardProps {
  channel: Channel;
  onClick?: (channel: Channel) => void;
}

export function ChannelCard({ channel, onClick }: ChannelCardProps) {
  const hasGrowth = channel.opportunity_score != null;

  return (
    <Card
      className="group relative cursor-pointer glass-card overflow-hidden transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_-10px_rgba(6,182,212,0.2)]"
      onClick={() => onClick?.(channel)}
    >
      <CardHeader className="flex flex-row items-center gap-4 pb-4">
        {channel.thumbnail_url && (
          <div className="relative shrink-0">
            <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <img
              src={channel.thumbnail_url}
              alt={channel.title}
              className="relative h-14 w-14 rounded-full border-2 border-white/10 object-cover transition-transform duration-500 group-hover:scale-110"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <CardTitle className="text-lg font-bold tracking-tight text-white group-hover:text-cyan-400 transition-colors truncate">
            {channel.title}
          </CardTitle>
          <CardDescription className="line-clamp-1 text-xs text-muted-foreground leading-relaxed mt-0.5">
            {channel.description || "No description provided."}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Bento Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 transition-colors group-hover:bg-cyan-500/[0.03]">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Subscriber Base</span>
            <p className="font-mono text-base font-bold text-cyan-400 mt-1">
              {formatCount(channel.subscriber_count)}
            </p>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 transition-colors group-hover:bg-cyan-500/[0.03]">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Library Size</span>
            <p className="font-mono text-base font-bold text-white mt-1">
              {formatCount(channel.video_count)}
            </p>
          </div>
        </div>

        {/* Discovery & Growth Layer */}
        {hasGrowth && (
          <div className="flex flex-col gap-3 pt-2 border-t border-white/5">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className={cn("text-[10px] uppercase tracking-widest px-2", getScoreBg(channel.opportunity_score ?? 0))}>
                Velocity Grade: {channel.opportunity_score}
              </Badge>
              {channel.growth_velocity != null && (
                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                  <span className="animate-pulse">⚡</span> 
                  {formatCount(channel.growth_velocity)} / DAY
                </div>
              )}
            </div>
            
            {/* Keywords */}
            {channel.keywords && channel.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5 opacity-60 transition-opacity group-hover:opacity-100">
                {channel.keywords.slice(0, 3).map((kw, i) => (
                  <Badge key={i} variant="secondary" className="text-[9px] font-normal px-1.5 py-0 bg-white/5 border-none text-muted-foreground lowercase">
                    #{kw}
                  </Badge>
                ))}
                {channel.keywords.length > 3 && (
                  <span className="text-[9px] text-muted-foreground self-center ml-1">+{channel.keywords.length - 3}</span>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Decorative Bottom Reveal */}
      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-cyan-600/0 via-cyan-500 to-cyan-600/0 transition-transform duration-700 translate-y-full group-hover:translate-y-0" />
    </Card>
  );
}
