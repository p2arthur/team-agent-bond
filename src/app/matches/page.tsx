"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MatchCard } from "@/components/MatchCard";
import { RadarPing } from "@/components/RadarPing";
import { UserHeader } from "@/components/UserHeader";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Radar, Sparkles } from "lucide-react";

interface ConversationMessage {
  role: "twin_a" | "twin_b";
  speakerName: string;
  content: string;
  timestamp: number;
}
interface Candidate {
  userId: string;
  name: string;
  role: string;
  company: string | null;
  industry: string | null;
  twinSummary: string | null;
  networkingGoal: string;
  availability: string[];
  similarity: number;
}
interface SavedMatch {
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
  enrichment: {
    starters: string[];
    sharedInterests: string[];
    conversationTopics: string[];
    networkingTips: string[];
    connectionStrength: string;
  } | null;
  conversation: {
    messages: ConversationMessage[];
    verdict: { shouldMeet: boolean; reason: string };
  } | null;
}
interface CompletedMatch {
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
  conversation: {
    messages: ConversationMessage[];
    verdict: { shouldMeet: boolean; reason: string; starters?: string[] };
  };
}

interface SlotState {
  candidate: Candidate | null;
  messages: ConversationMessage[];
  verdict: { shouldMeet: boolean; reason: string; starters?: string[] } | null;
  isComplete: boolean;
  status: "idle" | "streaming" | "done";
}

const BATCH_SIZE = 5;

function createEmptySlot(candidate: Candidate | null = null): SlotState {
  return {
    candidate,
    messages: [],
    verdict: null,
    isComplete: false,
    status: candidate ? "streaming" : "idle",
  };
}

export default function MatchesPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<
    "idle" | "loading-matches" | "conversations" | "results"
  >("idle");
  const [savedMatches, setSavedMatches] = useState<SavedMatch[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [batchStart, setBatchStart] = useState(0);
  const [slots, setSlots] = useState<SlotState[]>([]);
  const [completedMatches, setCompletedMatches] = useState<CompletedMatch[]>(
    [],
  );
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const userIdRef = useRef<string | null>(null);
  const completedMatchesRef = useRef<CompletedMatch[]>([]);
  const controllersRef = useRef<AbortController[]>([]);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    userIdRef.current = userId;
    if (!userId) {
      router.push("/");
      return;
    }
    // Verify user exists before loading matches
    fetch(`/api/profile?userId=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          loadSavedMatches(userId);
        } else {
          // Stale userId — clear and redirect
          localStorage.removeItem("userId");
          localStorage.removeItem("userName");
          router.push("/profile");
        }
      })
      .catch(() => {
        localStorage.removeItem("userId");
        localStorage.removeItem("userName");
        router.push("/profile");
      });
  }, [router]);

  const loadSavedMatches = async (userId: string) => {
    setPhase("loading-matches");
    try {
      const res = await fetch(`/api/match/${userId}`);
      const data = await res.json();
      if (data.success && data.matches) {
        setSavedMatches(data.matches);
      }
    } catch {}
    setPhase("idle");
  };

  const handleStartScan = async () => {
    const userId = userIdRef.current;
    if (!userId) return;
    setPhase("conversations");
    setCompletedMatches([]);
    completedMatchesRef.current = [];
    setTotalCompleted(0);
    setBatchStart(0);
    setError(null);

    // Verify user profile exists before scanning
    try {
      const profileRes = await fetch(`/api/profile?userId=${userId}`);
      const profileData = await profileRes.json();
      if (!profileData.success) {
        localStorage.removeItem("userId");
        localStorage.removeItem("userName");
        router.push("/profile");
        return;
      }
      // Update availability from profile if user hasn't set it on this page
    } catch {}

    try {
      await fetch("/api/match/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
    } catch {}
    await loadCandidates(userId);
  };

  const loadCandidates = async (userId: string) => {
    try {
      const res = await fetch("/api/match/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.success && data.candidates.length > 0) {
        setCandidates(data.candidates);
      } else {
        setError("No candidates found.");
        setPhase("results");
      }
    } catch {
      setError("Failed to load candidates");
      setPhase("results");
    }
  };

  const saveMatches = async () => {
    const userId = userIdRef.current;
    const matches = completedMatchesRef.current;
    if (!userId || matches.length === 0) return;
    try {
      await fetch("/api/match/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, matches }),
      });
    } catch (err) {
      console.error("Failed to save matches:", err);
    }
  };

  const updateSlot = useCallback(
    (index: number, updater: (prev: SlotState) => SlotState) => {
      setSlots((prev) => {
        const next = [...prev];
        next[index] = updater(next[index]);
        return next;
      });
    },
    [],
  );

  const startBatch = useCallback(
    (startIdx: number, allCandidates: Candidate[]) => {
      const userId = userIdRef.current;
      if (!userId) return;

      controllersRef.current.forEach((c) => c.abort());
      controllersRef.current = [];

      const batch = allCandidates.slice(startIdx, startIdx + BATCH_SIZE);
      const newSlots: SlotState[] = batch.map((c) => createEmptySlot(c));
      setSlots(newSlots);

      batch.forEach((candidate, slotIdx) => {
        const controller = new AbortController();
        controllersRef.current.push(controller);

        const stream = async () => {
          try {
            const res = await fetch("/api/twin-conversation", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId,
                candidateUserId: candidate.userId,
              }),
              signal: controller.signal,
            });
            if (!res.ok) throw new Error("Failed");
            const reader = res.body?.getReader();
            if (!reader) return;
            const decoder = new TextDecoder();
            let buffer = "";
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() || "";
              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  try {
                    const d = JSON.parse(line.slice(6));
                    if (d.type === "message") {
                      updateSlot(slotIdx, (prev) => ({
                        ...prev,
                        messages: [
                          ...prev.messages,
                          {
                            role: d.role,
                            speakerName: d.speakerName,
                            content: d.content,
                            timestamp: d.timestamp,
                          },
                        ],
                      }));
                    } else if (d.type === "verdict") {
                      updateSlot(slotIdx, (prev) => ({
                        ...prev,
                        verdict: {
                          shouldMeet: d.shouldMeet,
                          reason: d.reason,
                          starters: d.starters || [],
                        },
                      }));
                    } else if (d.type === "complete") {
                      updateSlot(slotIdx, (prev) => ({
                        ...prev,
                        isComplete: true,
                        status: "done",
                      }));
                    }
                  } catch {}
                }
              }
            }
          } catch (err: any) {
            if (err.name !== "AbortError") {
              console.error(err);
              updateSlot(slotIdx, (prev) => ({
                ...prev,
                isComplete: true,
                status: "done",
              }));
            }
          }
        };
        stream();
      });
    },
    [updateSlot],
  );

  useEffect(() => {
    if (phase !== "conversations" || candidates.length === 0) return;
    if (batchStart >= candidates.length) {
      saveMatches().then(async () => {
        const userId = userIdRef.current;
        if (userId) await loadSavedMatches(userId);
        setPhase("results");
      });
      return;
    }
    startBatch(batchStart, candidates);
  }, [phase, batchStart, candidates, startBatch]);

  useEffect(() => {
    if (phase !== "conversations" || slots.length === 0) return;
    const allDone = slots.every((s) => s.isComplete);
    if (!allDone) return;

    const newMatches: CompletedMatch[] = [];
    slots.forEach((slot) => {
      if (!slot.candidate) return;
      setTotalCompleted((p) => p + 1);
      if (slot.verdict?.shouldMeet) {
        newMatches.push({
          id: `temp-${slot.candidate.userId}`,
          user: {
            id: slot.candidate.userId,
            name: slot.candidate.name,
            role: slot.candidate.role,
            company: slot.candidate.company,
            industry: slot.candidate.industry,
            skills: [],
            interests: [],
            twinSummary: slot.candidate.twinSummary,
            availability: slot.candidate.availability,
          },
          score: slot.candidate.similarity,
          reason: slot.verdict.reason,
          starters: slot.verdict.starters || [],
          conversation: {
            messages: slot.messages,
            verdict: slot.verdict,
          },
        });
      }
    });

    if (newMatches.length > 0) {
      setCompletedMatches((p) => {
        const updated = [...p, ...newMatches];
        completedMatchesRef.current = updated;
        return updated;
      });
    }

    const timer = setTimeout(
      () => setBatchStart((p) => p + BATCH_SIZE),
      2000,
    );
    return () => clearTimeout(timer);
  }, [slots, phase, candidates]);

  // Scanning phase
  if (phase === "conversations") {
    const batchNum = Math.floor(batchStart / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(candidates.length / BATCH_SIZE);

    return (
      <div className="relative min-h-full px-5 py-8 md:px-8 xl:px-10">
        <RadarPing />
        <div className="mx-auto max-w-7xl">
          <UserHeader />

          <div className="mb-8 text-center">
            <span className="mono-label text-primary">
              Scanning event attendees
            </span>
            <h2 className="mt-3 font-display text-4xl font-black text-foreground">
              Finding Your Matches
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your twin is meeting {BATCH_SIZE} attendees at once to find the
              best connections for you...
            </p>
          </div>

          <div className="dev-panel-soft mb-8 rounded-lg p-5">
            <div className="flex justify-between mb-2">
              <span className="mono-label text-muted-foreground">Progress</span>
              <span className="font-mono text-xs font-black text-accent">
                {totalCompleted}/{candidates.length} conversations
              </span>
            </div>
            <Progress
              value={(totalCompleted / candidates.length) * 100}
              className="h-2"
            />
            <div className="flex justify-between mt-2">
              <span className="font-mono text-[11px] text-muted-foreground">
                Batch {batchNum}/{totalBatches}
              </span>
              <span className="font-mono text-[11px] text-muted-foreground">
                {completedMatches.length} match
                {completedMatches.length !== 1 ? "es" : ""} found
              </span>
            </div>
          </div>

          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {slots.map((slot, idx) => (
              <div
                key={slot.candidate?.userId || idx}
                className="animate-fade-in-up"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <ConversationSlot slot={slot} />
              </div>
            ))}
          </div>

          {completedMatches.length > 0 && (
            <div className="mt-8 text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-green-400/30 bg-green-400/10 px-4 py-2">
                <span className="size-2 rounded-full bg-green-400" />
                <span className="font-mono text-xs font-black text-green-300">
                  {completedMatches.length} match
                  {completedMatches.length !== 1 ? "es" : ""} found so far
                </span>
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Results / idle phase — show existing matches + scan CTA
  // After scan completes, always use savedMatches (real DB IDs) for display
  const displayMatches =
    phase === "results" ? savedMatches : (completedMatches.length > 0 ? completedMatches : savedMatches);

  return (
    <div className="relative min-h-full px-5 py-8 md:px-8 xl:px-10">
      <RadarPing />
      <div className="mx-auto max-w-6xl">
        <UserHeader />

        <div className="mb-10 text-center">
          <span className="mono-label text-primary">
            AI-powered event networking
          </span>
          <h2 className="mt-3 font-display text-5xl font-black text-foreground">
            Your Connections
          </h2>
          <p className="mt-3 max-w-xl mx-auto text-muted-foreground">
            Agent Bond breaks the ice for you — our AI twins meet other
            attendees, find shared interests, and surface the connections worth
            making at this event.
          </p>
          <div className="mt-7 flex justify-center gap-3">
            <Button
              onClick={handleStartScan}
              disabled={phase === "loading-matches"}
              className="pressable-accent h-12 px-8 font-mono text-sm font-black bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer disabled:opacity-50"
            >
              <Radar className="size-4 mr-2" />
              Scan Event Attendees
            </Button>
            {displayMatches.length > 0 && (
              <Button
                onClick={() => router.push("/")}
                variant="secondary"
                className="pressable h-12 px-6 text-sm bg-muted border border-border cursor-pointer"
              >
                Back to Board
              </Button>
            )}
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/5 mb-6 text-center">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {displayMatches.length > 0 && (
          <>
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-amber-400" />
                <span className="mono-label text-muted-foreground">
                  {displayMatches.length} match
                  {displayMatches.length !== 1 ? "es" : ""}
                </span>
              </div>
              {phase === "results" && completedMatches.length > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-green-400/30 bg-green-400/10 px-3 py-1">
                  <span className="size-1.5 rounded-full bg-green-400" />
                  <span className="font-mono text-[10px] font-bold text-green-300">
                    Fresh scan
                  </span>
                </span>
              )}
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {displayMatches.map((match, i) => (
                <div
                  key={match.id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <MatchCard match={match} />
                </div>
              ))}
            </div>
          </>
        )}

        {displayMatches.length === 0 && !error && phase === "idle" && (
          <div className="text-center py-16">
            <div className="mx-auto mb-4 size-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Radar className="size-7 text-primary" />
            </div>
            <p className="font-display text-lg font-black text-foreground mb-2">
              No matches yet
            </p>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Click &quot;Scan Event Attendees&quot; to let your AI twin meet
              other attendees and find your best connections.
            </p>
          </div>
        )}

        {displayMatches.length === 0 && !error && phase === "results" && (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">
              No strong matches found this scan.
            </p>
            <Button
              onClick={handleStartScan}
              className="pressable-accent h-11 px-6 font-mono text-xs font-black bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
            >
              <Radar className="size-3.5 mr-1.5" />
              Try Again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function ConversationSlot({ slot }: { slot: SlotState }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [slot.messages]);

  if (!slot.candidate) return null;
  const c = slot.candidate;

  return (
    <div className="dev-panel-soft rounded-lg overflow-hidden flex flex-col h-[420px]">
      <div className="p-3 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="size-8 rounded-md bg-amber-400/10 border border-amber-400/30 flex items-center justify-center">
            <span className="font-mono font-black text-amber-300 text-xs">
              {c.name.charAt(0)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-xs font-black text-foreground truncate">
              {c.name}
            </h3>
            <p className="text-[10px] text-muted-foreground truncate">
              {c.role}
              {c.company && ` at ${c.company}`}
            </p>
          </div>
          <span className="rounded border border-accent/25 bg-accent/10 px-2 py-0.5 font-mono text-[10px] font-black text-accent">
            {c.similarity}%
          </span>
        </div>
        {c.availability && c.availability.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {c.availability.map((period) => {
              const config: Record<string, { label: string; color: string }> = {
                morning: { label: "AM", color: "text-amber-300 border-amber-400/25 bg-amber-400/10" },
                afternoon: { label: "PM", color: "text-sky-300 border-sky-400/25 bg-sky-400/10" },
                evening: { label: "EVE", color: "text-purple-300 border-purple-400/25 bg-purple-400/10" },
              };
              const c2 = config[period];
              if (!c2) return null;
              return (
                <span key={period} className={`rounded border px-1.5 py-0 font-mono text-[8px] font-bold ${c2.color}`}>
                  {c2.label}
                </span>
              );
            })}
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <span
            className={`size-1.5 rounded-full ${
              slot.status === "streaming"
                ? "bg-primary animate-pulse"
                : slot.verdict?.shouldMeet
                  ? "bg-green-400"
                  : "bg-muted-foreground"
            }`}
          />
          <span className="font-mono text-[10px] text-muted-foreground">
            {slot.status === "streaming"
              ? "Twins talking..."
              : slot.verdict?.shouldMeet
                ? "Match!"
                : "No match"}
          </span>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 min-h-0">
        <div className="flex flex-col gap-2">
          {slot.messages.map((msg, i) => (
            <div
              key={i}
              className={`${msg.role === "twin_a" ? "pr-2" : "pl-2"}`}
            >
              <div
                className={`rounded-md border px-2.5 py-1.5 text-[11px] ${
                  msg.role === "twin_a"
                    ? "border-border bg-muted"
                    : "border-accent/20 bg-accent/10"
                }`}
              >
                <p className="mb-0.5 font-mono text-[9px] font-bold text-muted-foreground">
                  {msg.speakerName}
                </p>
                <p className="text-foreground leading-snug">{msg.content}</p>
              </div>
            </div>
          ))}
          {slot.status === "streaming" && slot.messages.length === 0 && (
            <div className="text-center py-6">
              <div className="radar-spinner mx-auto mb-2" />
              <p className="text-[10px] text-muted-foreground animate-pulse">
                Starting conversation...
              </p>
            </div>
          )}
        </div>
      </div>

      {slot.verdict && (
        <div
          className={`flex-shrink-0 border-t px-3 py-2 ${
            slot.verdict.shouldMeet
              ? "border-green-400/30 bg-green-400/5"
              : "border-border bg-muted/50"
          }`}
        >
          <p className="font-mono text-[10px] font-bold text-foreground truncate">
            {slot.verdict.shouldMeet ? "Match Recommended" : "No Match"}
          </p>
          <p className="text-[9px] text-muted-foreground line-clamp-2">
            {slot.verdict.reason}
          </p>
        </div>
      )}
    </div>
  );
}
