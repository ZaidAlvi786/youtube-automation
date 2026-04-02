import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    title: "Niche Explorer",
    description: "Discover 30+ profitable YouTube sub-niches ranked by viability and monetization.",
    href: "/niches",
    icon: "🎯",
    gradient: "from-indigo-600/30 to-transparent",
    border: "group-hover:border-indigo-500/30",
    shadow: "group-hover:shadow-indigo-500/10",
  },
  {
    title: "Rising Stars",
    description: "Track high-growth channels under 90 days old with velocity scoring.",
    href: "/channels",
    icon: "🚀",
    gradient: "from-cyan-600/30 to-transparent",
    border: "group-hover:border-cyan-500/30",
    shadow: "group-hover:shadow-cyan-500/10",
  },
  {
    title: "Video Forensics",
    description: "Reverse-engineer viral formulas with hook-type and emotion-trigger analysis.",
    href: "/videos",
    icon: "🔬",
    gradient: "from-rose-600/30 to-transparent",
    border: "group-hover:border-rose-500/30",
    shadow: "group-hover:shadow-rose-500/10",
  },
  {
    title: "Script Studio",
    description: "Full production-ready video scripts, hooks, and keywords powered by AI.",
    href: "/ideas",
    icon: "💡",
    gradient: "from-amber-600/30 to-transparent",
    border: "group-hover:border-amber-500/30",
    shadow: "group-hover:shadow-amber-500/10",
  },
];

export default function LandingPage() {
  return (
    <div className="space-y-24 py-10">
      {/* Hero Section */}
      <div className="relative isolate text-center">
        {/* Glow Effects */}
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-indigo-500 to-cyan-500 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
        </div>

        <div className="mx-auto max-w-4xl pt-12">
          <div className="mb-8 flex justify-center">
            <div className="relative rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground ring-1 ring-white/10 hover:ring-white/20 transition-all backdrop-blur-xl">
              NicheScope Engine v0.1 Is Now Live
            </div>
          </div>
          
          <h1 className="text-6xl font-extrabold tracking-tighter text-white sm:text-8xl">
            YouTube <span className="text-gradient-primary">Intelligence</span> Terminal
          </h1>
          
          <p className="mt-8 text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto tracking-tight">
            The ultimate high-velocity discovery engine. Find niches, analyze competitors, 
            and architect winning video strategies with production-grade AI forensics.
          </p>
          
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link href="/dashboard">
              <Button size="lg" className="rounded-full bg-white text-black hover:bg-white/90 px-8 py-6 text-base font-bold tracking-tight shadow-2xl shadow-indigo-500/20">
                Launch Dashboard
              </Button>
            </Link>
            <Link href="/niches">
              <span className="text-sm font-bold leading-6 text-white group cursor-pointer tracking-wider">
                Explore Niches <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Feature Bento Grid */}
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <Link key={feature.title} href={feature.href} className="group">
              <Card className={cn(
                "h-full glass-card border-white/5 transition-all duration-500 overflow-hidden",
                feature.border,
                feature.shadow,
                "group-hover:-translate-y-2"
              )}>
                <div className={cn("absolute inset-x-0 -top-24 h-48 bg-gradient-to-b opacity-0 group-hover:opacity-10 transition-opacity", feature.gradient)} />
                
                <CardHeader className="relative p-6 px-7 pb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-2xl transition-transform group-hover:scale-110 mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl font-bold tracking-tight text-white group-hover:text-primary-foreground transition-colors">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="relative px-7 pb-6">
                  <CardDescription className="text-xs leading-relaxed text-muted-foreground group-hover:text-white transition-colors">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="mx-auto max-w-6xl py-12 border-t border-white/5">
         <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
               { label: "Data Velocity", value: "82 GB/hr" },
               { label: "AI Latency", value: "< 1.2s" },
               { label: "Niche Scope", value: "1M+ Segments" },
               { label: "System Uptime", value: "99.98%" }
            ].map((stat, i) => (
               <div key={i} className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">{stat.label}</span>
                  <span className="text-2xl font-mono font-extrabold text-white">{stat.value}</span>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
}
