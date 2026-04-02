"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Niche } from "@/lib/types";

const competitionColors: Record<string, string> = {
  low: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  medium: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  high: "text-rose-400 bg-rose-500/10 border-rose-500/20",
};

interface NicheCardProps {
  niche: Niche;
  isSelected?: boolean;
  onClick?: () => void;
}

export function NicheCard({ niche, isSelected, onClick }: NicheCardProps) {
  const level = niche.competition_level ?? "medium";
  const badgeStyle = competitionColors[level] ?? competitionColors.medium;

  return (
    <Card
      className={cn(
        "group relative cursor-pointer glass-card p-6 overflow-hidden transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_-10px_rgba(139,92,246,0.3)] hover:border-primary/50",
        isSelected && "border-purple-500 bg-purple-500/5 ring-1 ring-purple-500"
      )}
      onClick={onClick}
    >
      {/* Background Accent Glow */}
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/10 blur-3xl transition-opacity group-hover:opacity-50" />

      <CardHeader className="p-0 mb-6 flex-row items-start justify-between gap-4">
        <div className="space-y-1.5 flex-1 min-w-0">
          <CardTitle className="text-xl font-bold tracking-tight text-white group-hover:text-primary-foreground transition-colors truncate">
            {niche.name}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {niche.description}
          </CardDescription>
        </div>
        <Badge variant="outline" className={cn("shrink-0 font-mono text-[10px] uppercase tracking-widest px-2 py-0.5", badgeStyle)}>
          {level}
        </Badge>
      </CardHeader>

      <CardContent className="p-0 space-y-6">
        {/* Score Breakdown Section */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Viability</span>
              <span className="font-mono text-xs font-bold text-emerald-400">{niche.score.toFixed(0)}%</span>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all duration-1000 ease-out" 
                style={{ width: `${niche.score}%` }} 
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Profit</span>
              <span className="font-mono text-xs font-bold text-amber-400">{niche.monetization_score.toFixed(0)}%</span>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-500 transition-all duration-1000 ease-out delay-100" 
                style={{ width: `${niche.monetization_score}%` }} 
              />
            </div>
          </div>
        </div>

        {/* Tags Section */}
        <div className="flex flex-wrap gap-2 pt-2">
          {niche.target_audience && (
            <div className="flex items-center gap-1.5 rounded-full bg-white/5 border border-white/5 px-2.5 py-1">
              <span className="text-[10px]">🎯</span>
              <span className="text-[10px] font-medium text-muted-foreground">{niche.target_audience}</span>
            </div>
          )}
          {niche.content_format && (
            <div className="flex items-center gap-1.5 rounded-full bg-white/5 border border-white/5 px-2.5 py-1">
              <span className="text-[10px]">🎬</span>
              <span className="text-[10px] font-medium text-muted-foreground">{niche.content_format}</span>
            </div>
          )}
        </div>
      </CardContent>

      {/* Interactive Bottom Accent */}
      <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-gradient-to-r from-primary to-cyan-400 transition-all duration-500 group-hover:w-full" />
    </Card>
  );
}
