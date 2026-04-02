"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { VideoIdea } from "@/lib/types";

interface IdeaCardProps {
  idea: VideoIdea;
}

export function IdeaCard({ idea }: IdeaCardProps) {
  return (
    <Card className="transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/5 hover:border-amber-500/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base font-semibold leading-snug">
            {idea.title}
          </CardTitle>
          {idea.appeal_score != null && (
            <Badge
              variant="outline"
              className="shrink-0 bg-amber-500/10 text-amber-400 border-amber-500/20"
            >
              {idea.appeal_score}/10
            </Badge>
          )}
        </div>
        {idea.hook && (
          <CardDescription className="text-sm italic">
            &ldquo;{idea.hook}&rdquo;
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {idea.talking_points.length > 0 && (
          <ul className="space-y-1 text-sm text-muted-foreground">
            {idea.talking_points.map((point, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-400" />
                {point}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
