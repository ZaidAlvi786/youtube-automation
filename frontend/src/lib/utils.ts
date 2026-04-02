import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCount(num?: number): string {
  if (!num) return "0";
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

export function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getScoreColor(score: number, max: number = 100): string {
  const pct = score / max;
  if (pct >= 0.7) return "text-emerald-400";
  if (pct >= 0.4) return "text-amber-400";
  return "text-rose-400";
}

export function getScoreBg(score: number, max: number = 100): string {
  const pct = score / max;
  if (pct >= 0.7) return "bg-emerald-500/10 border-emerald-500/20";
  if (pct >= 0.4) return "bg-amber-500/10 border-amber-500/20";
  return "bg-rose-500/10 border-rose-500/20";
}
