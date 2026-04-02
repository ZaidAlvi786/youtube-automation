"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChannelCard } from "@/components/channel-card";
import { getChannels } from "@/lib/api";
import type { Channel } from "@/lib/types";

export default function ChannelsPage() {
  const [query, setQuery] = useState("");
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"search" | "discover">("search");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const results = await getChannels({
        query: query.trim(),
        discover: mode === "discover",
        max_results: mode === "discover" ? 50 : 10,
      });
      setChannels(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to search channels");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Channel Intelligence
          </span>
        </h1>
        <p className="text-muted-foreground">
          Search YouTube channels or discover rising stars with growth velocity analysis.
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2">
        <Button
          variant={mode === "search" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("search")}
          className={mode === "search" ? "bg-blue-600 hover:bg-blue-500" : ""}
        >
          🔍 Search
        </Button>
        <Button
          variant={mode === "discover" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("discover")}
          className={mode === "discover" ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500" : ""}
        >
          🚀 Discover Rising Stars
        </Button>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          placeholder={mode === "discover" ? "Enter niche to find rising stars..." : "Search channels (e.g. 'budget cooking')..."}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={loading}
          className="flex-1"
        />
        <Button type="submit" disabled={loading || !query.trim()}>
          {loading ? "Searching..." : mode === "discover" ? "Discover" : "Search"}
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
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            {mode === "discover" ? "Discovering rising stars..." : "Searching channels..."}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border/40 p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Skeleton className="h-8" />
                  <Skeleton className="h-8" />
                  <Skeleton className="h-8" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Discovery empty state */}
      {!loading && channels.length === 0 && mode === "discover" && query && (
        <div className="rounded-xl border border-border/40 bg-card/50 p-8 text-center">
          <span className="text-4xl">🚀</span>
          <p className="mt-3 font-semibold">Discovery in Progress</p>
          <p className="text-sm text-muted-foreground mt-1">
            Background discovery has been started. Refresh in a minute to see results.
          </p>
        </div>
      )}

      {/* Results */}
      {!loading && channels.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{channels.length}</span> channels found
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {channels.map((channel, i) => (
              <ChannelCard key={channel.youtube_id ?? i} channel={channel} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
