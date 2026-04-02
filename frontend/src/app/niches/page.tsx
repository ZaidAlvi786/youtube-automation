"use client";

import { useState, useEffect } from "react";
import { CategorySelector } from "@/components/category-selector";
import { NicheCard } from "@/components/niche-card";
import { ChannelCard } from "@/components/channel-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn, formatCount } from "@/lib/utils";
import { generateNiches, getChannels } from "@/lib/api";
import type { Niche, Channel, DiscoveryStats } from "@/lib/types";

export default function NichesPage() {
  const [niches, setNiches] = useState<Niche[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedNiche, setSelectedNiche] = useState<Niche | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [discoveryStats, setDiscoveryStats] = useState<DiscoveryStats | null>(null);
  const [channelsLoading, setChannelsLoading] = useState(false);
  const [isRelaxed, setIsRelaxed] = useState(false);

  const handleGenerate = async (category: string) => {
    setLoading(true);
    setError(null);
    setSelectedCategory(category);
    setSelectedNiche(null);
    setDiscoveryStats(null);
    setIsRelaxed(false);
    try {
      const results = await generateNiches({ category, count: 30 });
      setNiches(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate niches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedNiche) {
      setIsRelaxed(false);
      setDiscoveryStats(null);
      fetchRisingStars(selectedNiche.name, false);
    }
  }, [selectedNiche]);

  const fetchRisingStars = async (nicheName: string, relaxed: boolean = false) => {
    setChannelsLoading(true);
    if (relaxed) setIsRelaxed(true);
    try {
      const response = await getChannels({
        query: nicheName,
        discover: true,
        max_results: 15,
        max_age_days: relaxed ? 365 : 180,
        min_subs: 2000,
        max_videos: relaxed ? 50 : 20, // 50 vs 20 videos
      });
      setChannels(response.data);
      if (response.meta) {
        setDiscoveryStats(response.meta);
      }
    } catch (err) {
      console.error("Failed to fetch rising stars:", err);
    } finally {
      setChannelsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          <span className="bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
            Niche Explorer
          </span>
        </h1>
        <p className="text-muted-foreground">
          Pick a category to discover 30+ profitable YouTube sub-niches ranked by viability, monetization, and competition level.
        </p>
      </div>

      {/* Category Input */}
      <CategorySelector onSelect={handleGenerate} loading={loading} />

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
            Generating niches for &quot;{selectedCategory}&quot;...
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border/40 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && niches.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Niche List */}
          <div className={cn(
            "space-y-4 transition-all duration-500",
            selectedNiche ? "lg:col-span-4" : "lg:col-span-12"
          )}>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground font-mono tracking-tight uppercase opacity-50">
                <span className="text-white font-bold">{niches.length}</span> Niches Analyzed
              </p>
            </div>
            <div className={cn(
              "grid gap-4",
              selectedNiche 
                ? "grid-cols-1" 
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            )}>
              {niches.map((niche, i) => (
                <NicheCard 
                  key={niche.id ?? i} 
                  niche={niche} 
                  isSelected={selectedNiche?.name === niche.name}
                  onClick={() => setSelectedNiche(niche)}
                />
              ))}
            </div>
          </div>

          {/* Niche Detail Panel */}
          {selectedNiche && (
            <div className="lg:col-span-8 animate-in slide-in-from-right-10 duration-500">
              <div className="sticky top-10 space-y-8 glass-card border-purple-500/20 p-8 rounded-3xl overflow-hidden shadow-2xl">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                
                {/* Header */}
                <div className="relative flex items-start justify-between">
                  <div className="space-y-1">
                     <Badge variant="outline" className="mb-2 border-purple-500/50 text-purple-400 font-mono tracking-tighter">
                        Niche Intelligence Report
                     </Badge>
                    <h2 className="text-4xl font-black tracking-tighter text-white">
                      {selectedNiche.name}
                    </h2>
                    <p className="text-muted-foreground text-sm max-w-xl">
                      {selectedNiche.description}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedNiche(null)}
                    className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10"
                  >
                    ✕
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Viability Score</span>
                    <div className="text-3xl font-mono font-black text-purple-400">{selectedNiche.score}<span className="text-sm opacity-50">/100</span></div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Monetization Potential</span>
                    <div className="text-3xl font-mono font-black text-emerald-400">{selectedNiche.monetization_score}<span className="text-sm opacity-50">/100</span></div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Trends Index</span>
                    <div className="text-3xl font-mono font-black text-cyan-400">×{selectedNiche.trends_score}</div>
                  </div>
                </div>

                <Separator className="bg-white/5" />

                {/* Discovery Section */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                      Rising Star Competitors 
                      <Badge variant="secondary" className={cn(
                        "border-none px-2 py-0 h-5",
                        isRelaxed ? "bg-amber-500/10 text-amber-400" : "bg-cyan-500/10 text-cyan-400"
                      )}>
                        {isRelaxed ? "RELAXED FILTERS" : "STRICT FILTERS"}
                      </Badge>
                    </h3>
                    <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-50">
                      {isRelaxed ? "Under 1 Year • Max 50 Videos" : "Under 6 Mo • Max 20 Videos • 200k+ Views"}
                    </div>
                  </div>

                  {channelsLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 rounded-2xl bg-white/[0.02] border border-dashed border-white/10 space-y-4">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
                      <div className="text-center">
                        <p className="text-sm font-bold text-white uppercase tracking-widest">Deep Signal Scan Active</p>
                        <p className="text-[10px] text-muted-foreground mt-1">Analyzing 150+ potential rising star channels...</p>
                      </div>
                    </div>
                  ) : channels.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {channels.map((channel) => (
                        <ChannelCard key={channel.id} channel={channel} />
                      ))}
                    </div>
                  ) : discoveryStats?.status === "started" ? (
                    <div className="py-12 text-center rounded-2xl bg-cyan-500/5 border border-dashed border-cyan-500/20">
                      <div className="text-3xl mb-3 animate-pulse">📡</div>
                      <p className="text-sm font-bold text-cyan-400 uppercase tracking-widest">Discovery Task Started</p>
                      <p className="text-[10px] text-muted-foreground mt-2 max-w-[250px] mx-auto">
                        We're scanning YouTube for new channels. <span className="text-white">Wait 15s and click this niche again</span> to see results.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="py-12 text-center rounded-2xl bg-white/[0.02] border border-dashed border-white/10">
                        <div className="text-3xl mb-2 opacity-20">📡</div>
                        <p className="text-sm text-muted-foreground">No rising stars found meeting exact criteria.</p>
                        <p className="text-[10px] text-muted-foreground/50 mt-1 uppercase tracking-widest">Deep Signal Search found 0 matches.</p>
                      </div>

                      {discoveryStats && discoveryStats.total_scanned > 0 && (
                        <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 space-y-4">
                           <div className="flex items-center justify-between border-b border-white/5 pb-2">
                              <span className="text-xs font-bold uppercase tracking-widest text-white">Discovery Filter Analysis</span>
                              <span className="text-[10px] font-mono text-muted-foreground">{discoveryStats.total_scanned} Candidates Scanned</span>
                           </div>
                           
                           <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                              <div className="space-y-1">
                                 <div className="text-xl font-mono font-bold text-rose-400">{discoveryStats.rejected_age}</div>
                                 <div className="text-[9px] uppercase tracking-tighter text-muted-foreground leading-none">Established<br/>({">"} {isRelaxed ? '1y' : '6mo'})</div>
                              </div>
                              <div className="space-y-1">
                                 <div className="text-xl font-mono font-bold text-rose-400">{discoveryStats.rejected_videos}</div>
                                 <div className="text-[9px] uppercase tracking-tighter text-muted-foreground leading-none">High Volume<br/>({">"} {isRelaxed ? '50' : '20'} Vids)</div>
                              </div>
                              <div className="space-y-1">
                                 <div className="text-xl font-mono font-bold text-rose-400">{discoveryStats.rejected_performance}</div>
                                 <div className="text-[9px] uppercase tracking-tighter text-muted-foreground leading-none">Low Velocity<br/>({"<"} 200k Views)</div>
                              </div>
                              <div className="space-y-1">
                                 <div className="text-xl font-mono font-bold text-cyan-400">{discoveryStats.already_known}</div>
                                 <div className="text-[9px] uppercase tracking-tighter text-muted-foreground leading-none">Known Entities<br/>(Already Tracked)</div>
                              </div>
                           </div>

                           {!isRelaxed && (
                              <Button 
                                onClick={() => fetchRisingStars(selectedNiche.name, true)}
                                className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold uppercase tracking-widest rounded-xl py-6"
                              >
                                ⚡ Broaden Search to 1 Year / 50 Videos
                              </Button>
                           )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Additional Strategy (if available) */}
                {selectedNiche.growth_strategy && (
                  <div className="p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 space-y-3">
                    <h4 className="text-sm font-bold uppercase tracking-widest text-indigo-400">Launch Roadmap</h4>
                    <p className="text-sm leading-relaxed text-indigo-100/70 italic">
                      &quot;{selectedNiche.growth_strategy}&quot;
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
