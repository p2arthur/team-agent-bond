"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "./LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Bookmark,
  Calendar,
  Lightbulb,
  MessageSquare,
  Sparkles,
  Target,
  Users,
  Zap,
  Coffee,
  Sun,
  Moon,
} from "lucide-react";

const PERIOD_CONFIG: Record<string, { label: string; Icon: typeof Coffee; color: string }> = {
  morning: { label: "Morning", Icon: Coffee, color: "text-amber-300 border-amber-400/25 bg-amber-400/10" },
  afternoon: { label: "Afternoon", Icon: Sun, color: "text-sky-300 border-sky-400/25 bg-sky-400/10" },
  evening: { label: "Evening", Icon: Moon, color: "text-purple-300 border-purple-400/25 bg-purple-400/10" },
};

interface Enrichment {
  starters: string[];
  sharedInterests: string[];
  conversationTopics: string[];
  networkingTips: string[];
  connectionStrength: string;
}

interface MatchData {
  id: string;
  user: {
    id: string;
    name: string;
    role: string;
    company: string | null;
    industry: string | null;
    skills: string[];
    interests: string[];
    twinSummary: string | null;
    availability?: string[];
  };
  score: number;
  reason: string;
  starters: string[];
  enrichment: Enrichment | null;
  conversation: {
    messages: Array<{ role: string; speakerName: string; content: string }>;
    verdict: { shouldMeet: boolean; reason: string };
  } | null;
}

export function MatchDetail({ matchId }: { matchId: string }) {
  const router = useRouter();
  const [match, setMatch] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      router.push("/profile");
      return;
    }
    fetch(`/api/match/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const found = data.matches.find((m: MatchData) => m.id === matchId);
          if (found) setMatch(found);
          else router.push("/matches");
        } else {
          router.push("/matches");
        }
      })
      .catch(() => router.push("/matches"))
      .finally(() => setLoading(false));
  }, [matchId, router]);

  const handleBookMeeting = async () => {
    if (!match) return;
    const title = encodeURIComponent(`Meet ${match.user.name} — Web Summit`);
    const details = encodeURIComponent(
      `AI-suggested connection at Web Summit 2025.\n\n${match.reason}`,
    );
    window.open(
      `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}`,
      "_blank",
    );
  };

  if (loading) return <LoadingSpinner message="Loading match details..." />;
  if (!match) return null;

  const enrichment = match.enrichment;
  const starters = enrichment?.starters || match.starters || [];

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 md:px-8 xl:px-10">
      <button
        onClick={() => router.push("/matches")}
        className="mb-6 inline-flex cursor-pointer items-center gap-1.5 font-mono text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Back to matches
      </button>

      {/* Profile header */}
      <div className="pressable-card dev-panel mb-6 rounded-lg p-6">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-5">
            <div className="size-14 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
              <span className="font-mono text-xl font-black text-accent">
                {match.user.name.charAt(0)}
              </span>
            </div>
            <div>
              <h2 className="font-display text-2xl font-black text-foreground">
                {match.user.name}
              </h2>
              <p className="text-sm text-muted-foreground">
                {match.user.role}
                {match.user.company && (
                  <span className="text-foreground/40">
                    {" "}
                    at {match.user.company}
                  </span>
                )}
              </p>
              {match.user.industry && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {match.user.industry}
                </p>
              )}
              {match.user.availability && match.user.availability.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {match.user.availability.map((period) => {
                    const config = PERIOD_CONFIG[period];
                    if (!config) return null;
                    const { Icon, label, color } = config;
                    return (
                      <span key={period} className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 font-mono text-[10px] font-bold ${color}`}>
                        <Icon className="size-3" />
                        {label}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <span className="rounded border border-accent/25 bg-accent/10 px-3 py-1.5 font-mono text-sm font-black text-accent">
            {Math.round(match.score)}%
          </span>
        </div>

        {/* Why you should meet */}
        <div className="mb-5 rounded-lg border border-primary/25 bg-primary/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="size-3.5 text-primary" />
            <span className="mono-label text-primary">Why you should meet</span>
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            {enrichment?.connectionStrength || match.reason}
          </p>
        </div>

        {/* Skills */}
        <div className="flex flex-wrap gap-1.5">
          {match.user.skills.map((skill) => (
            <Badge
              key={skill}
              variant="secondary"
              className="rounded border border-accent/25 bg-accent/10 px-2.5 py-1 font-mono text-xs text-accent tag-hover"
            >
              {skill}
            </Badge>
          ))}
        </div>
      </div>

      {/* Ice Breakers — hero section */}
      {starters.length > 0 && (
        <div className="mb-6 rounded-xl overflow-hidden border border-amber-400/30 bg-gradient-to-br from-amber-400/8 via-background to-amber-400/3 shadow-[0_0_40px_rgba(251,191,36,0.06)]">
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-center gap-3 mb-1">
              <div className="size-9 rounded-lg bg-amber-400/15 border border-amber-400/25 flex items-center justify-center">
                <Lightbulb className="size-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-display text-lg font-black text-amber-300">Ice Breakers</h3>
                <p className="text-xs text-muted-foreground">
                  Open with one of these when you meet {match.user.name.split(" ")[0]}
                </p>
              </div>
            </div>
          </div>
          <div className="px-6 pb-6 flex flex-col gap-3">
            {starters.map((starter, i) => (
              <div
                key={i}
                className="group flex items-start gap-4 rounded-lg border border-amber-400/15 bg-card/60 p-4 transition-all hover:border-amber-400/30 hover:bg-amber-400/5"
              >
                <span className="mt-0.5 size-7 shrink-0 rounded-full bg-amber-400/15 border border-amber-400/25 flex items-center justify-center font-mono text-xs font-black text-amber-300">
                  {i + 1}
                </span>
                <p className="text-sm text-foreground leading-relaxed font-medium">
                  &ldquo;{starter}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shared interests & topics grid */}
      {enrichment && (
        <div className="grid gap-4 md:grid-cols-2 mb-6">
          {enrichment.sharedInterests?.length > 0 && (
            <div className="pressable-card dev-panel rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <Users className="size-4 text-green-400" />
                <span className="mono-label text-green-300">Shared Interests</span>
              </div>
              <ul className="flex flex-col gap-2">
                {enrichment.sharedInterests.map((interest, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-green-400" />
                    {interest}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {enrichment.conversationTopics?.length > 0 && (
            <div className="pressable-card dev-panel rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <Target className="size-4 text-amber-400" />
                <span className="mono-label text-amber-300">Topics to Discuss</span>
              </div>
              <ul className="flex flex-col gap-2">
                {enrichment.conversationTopics.map((topic, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-400" />
                    {topic}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {enrichment.networkingTips?.length > 0 && (
            <div className="pressable-card dev-panel rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="size-4 text-sky-400" />
                <span className="mono-label text-sky-300">Networking Tips</span>
              </div>
              <ul className="flex flex-col gap-2">
                {enrichment.networkingTips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-sky-400" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Twin conversation */}
      {match.conversation && (
        <div className="pressable-card dev-panel rounded-lg p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="size-4 text-muted-foreground" />
            <span className="mono-label text-muted-foreground">Twin Conversation</span>
          </div>
          <div className="flex flex-col gap-2.5">
            {match.conversation.messages.map((msg, i) => (
              <div
                key={i}
                className={`rounded-md border p-3 text-sm ${
                  msg.role === "twin_a"
                    ? "border-accent/20 bg-accent/5"
                    : "border-sky-400/20 bg-sky-400/5"
                }`}
              >
                <span className="font-mono text-xs font-bold text-muted-foreground">
                  {msg.speakerName}
                </span>
                <p className="mt-1 text-foreground leading-relaxed">
                  {msg.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          onClick={handleBookMeeting}
          className="pressable-accent h-12 flex-1 bg-accent font-mono text-sm font-black text-primary-foreground hover:bg-primary/90 border-0 cursor-pointer"
        >
          <Calendar className="size-4 mr-2" />
          Schedule Meeting
        </Button>
        <Button
          onClick={() => {
            const saved = JSON.parse(localStorage.getItem("favorites") || "[]");
            if (!saved.includes(matchId)) {
              saved.push(matchId);
              localStorage.setItem("favorites", JSON.stringify(saved));
            }
            alert("Saved!");
          }}
          variant="secondary"
          className="pressable h-12 border border-border bg-muted px-6 text-sm font-bold cursor-pointer"
        >
          <Bookmark className="size-4 mr-2" />
          Save
        </Button>
      </div>
    </div>
  );
}
