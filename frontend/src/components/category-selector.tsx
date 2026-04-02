"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PRESET_CATEGORIES = [
  "Technology",
  "Finance",
  "Health & Fitness",
  "Gaming",
  "Education",
  "Cooking",
  "Travel",
  "Music",
  "Business",
  "Entertainment",
];

interface CategorySelectorProps {
  onSelect: (category: string) => void;
  loading?: boolean;
}

export function CategorySelector({ onSelect, loading }: CategorySelectorProps) {
  const [custom, setCustom] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (custom.trim()) {
      onSelect(custom.trim());
      setCustom("");
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          placeholder="Enter a custom category..."
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          disabled={loading}
          className="flex-1"
        />
        <Button type="submit" disabled={loading || !custom.trim()}>
          {loading ? "Generating..." : "Generate"}
        </Button>
      </form>

      <div className="flex flex-wrap gap-2">
        {PRESET_CATEGORIES.map((cat) => (
          <Button
            key={cat}
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={() => onSelect(cat)}
            className="transition-colors hover:bg-purple-500/10 hover:text-purple-400 hover:border-purple-500/30"
          >
            {cat}
          </Button>
        ))}
      </div>
    </div>
  );
}
