"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const QUICK_ACTIONS = [
  {
    title: "Niche Engine",
    description: "Discover 50+ untapped sub-niches from any YouTube category.",
    href: "/niches",
    icon: "🎯",
    accent: "from-indigo-600 to-purple-600",
    shadow: "shadow-indigo-500/20",
    badge: "High Velocity",
    grid: "md:col-span-2",
  },
  {
    title: "Rising Stars",
    description: "Find high-growth channels under 90 days old with viral metrics.",
    href: "/channels",
    icon: "🚀",
    accent: "from-cyan-600 to-blue-600",
    shadow: "shadow-cyan-500/20",
    badge: "Real-time",
    grid: "md:col-span-1",
  },
  {
    title: "Content Forensics",
    description: "Reverse-engineer viral formulas with forensic AI analysis.",
    href: "/videos",
    icon: "🔬",
    accent: "from-rose-600 to-orange-600",
    shadow: "shadow-rose-500/20",
    badge: "Forensics",
    grid: "md:col-span-1",
  },
  {
    title: "Script Architect",
    description: "Generate full production scripts, hooks, and SEO thumbnail concepts.",
    href: "/ideas",
    icon: "💡",
    accent: "from-amber-600 to-orange-500",
    shadow: "shadow-amber-500/20",
    badge: "AI Studio",
    grid: "md:col-span-2",
  },
];

const ANALYTICS_CARDS = [
  { label: "AI Jobs", value: "24 / hr", sub: "Pipeline capacity" },
  { label: "Data Quota", value: "92%", sub: "YouTube API unit status" },
  { label: "Niches Tracked", value: "1,248", sub: "Total database scope" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-12 pb-20">
      {/* Hero / Header Section */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          Intelligence Terminal Active
        </div>
        <h1 className="text-4xl font-extrabold tracking-tighter text-white sm:text-6xl">
          Command <span className="text-gradient-primary">Center</span>
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground leading-relaxed">
           Welcome back. Your discovery pipeline is currently processing <span className="text-white font-semibold">42 niches</span> across the Entertainment and Tech sectors.
        </p>
      </div>

      {/* Analytics Mini-Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
         {ANALYTICS_CARDS.map((stat, i) => (
            <div key={i} className="glass-card flex flex-col gap-1 p-5 border-white/5">
               <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</span>
               <p className="text-2xl font-mono font-bold text-white tracking-tighter">{stat.value}</p>
               <p className="text-[10px] text-muted-foreground mt-1">{stat.sub}</p>
            </div>
         ))}
      </div>

      {/* Main Bento Action Grid */}
      <div className="space-y-6">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50 border-b border-white/5 pb-4">
          Core Velocity Modules
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {QUICK_ACTIONS.map((action) => (
            <Link 
              key={action.href} 
              href={action.href}
              className={cn("group relative", action.grid)}
            >
              <Card className="h-full glass-card border-white/5 transition-all duration-500 hover:shadow-2xl hover:shadow-white/[0.02] hover:-translate-y-1 overflow-hidden">
                <div className={cn("absolute -right-12 -top-12 h-32 w-32 rounded-full blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity bg-gradient-to-br", action.accent)} />
                
                <CardHeader className="relative z-10 p-8 pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-3xl shadow-xl transition-transform group-hover:scale-110">
                      {action.icon}
                    </div>
                    <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-tighter text-muted-foreground">
                       {action.badge}
                    </span>
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold tracking-tight text-white group-hover:text-primary transition-colors">
                      {action.title}
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed mt-2 text-muted-foreground group-hover:text-white/60 transition-colors">
                      {action.description}
                    </CardDescription>
                  </div>
                </CardHeader>
                
                <CardContent className="relative z-10 px-8 pb-8 flex items-center justify-between group-hover:translate-x-2 transition-transform duration-500">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white group-hover:opacity-100 opacity-50">
                    Initialize Module →
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Background Glow Decorations */}
      <div className="fixed bottom-0 right-0 z-[-1] h-96 w-96 rounded-full bg-indigo-600/10 blur-[120px]" />
    </div>
  );
}
