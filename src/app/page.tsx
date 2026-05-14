"use client";

import Link from "next/link";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OnboardingModal } from "@/components/OnboardingModal";
import { UserHeader } from "@/components/UserHeader";
import { seedAttendees } from "@/lib/seed-data";
import { ArrowRight,
  Calendar,
  CheckCircle2,
  CircleDot,
  Eye,
  Lightbulb,
  Search,
  SlidersHorizontal,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { ConnectedCircles } from "@/components/ConnectedCircles";

interface KanbanMatch {
  id: string;
  name: string;
  role: string;
  company: string | null;
  industry: string | null;
  score: number;
  reason: string;
  skills: string[];
  twinSummary: string | null;
  starters?: string[];
  enrichment?: {
    starters: string[];
    sharedInterests: string[];
    conversationTopics: string[];
    networkingTips: string[];
    connectionStrength: string;
  } | null;
  isMock?: boolean;
}

export default function Home() {
  const router = useRouter();
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);

  const [potential, setPotential] = useState<KanbanMatch[]>([]);
  const [matches, setMatches] = useState<KanbanMatch[]>([]);
  const [networked, setNetworked] = useState<KanbanMatch[]>([]);

  const mockAttendees: KanbanMatch[] = useMemo(
    () =>
      seedAttendees.map((a, i) => ({
        id: `mock-${i}`,
        name: a.name,
        role: a.role,
        company: a.company,
        industry: a.industry,
        score: 0,
        reason: a.networkingGoal,
        skills: a.skills,
        twinSummary: null,
        isMock: true,
      })),
    [],
  );

  const saveKanban = useCallback((net: KanbanMatch[]) => {
    try {
      localStorage.setItem(
        "agent-bond-kanban",
        JSON.stringify({ networked: net }),
      );
    } catch {}
  }, []);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      setHasProfile(false);
      setLoading(false);
      return;
    }
    setHasProfile(true);
    try {
      const saved = localStorage.getItem("agent-bond-kanban");
      if (saved) {
        const data = JSON.parse(saved);
        setNetworked(data.networked || []);
      }
    } catch {}

    fetch(`/api/match/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.matches) {
          setMatches(
            data.matches.map((m: any) => ({
              id: m.id,
              name: m.user.name,
              role: m.user.role,
              company: m.user.company,
              industry: m.user.industry,
              score: m.score,
              reason: m.reason,
              skills: m.user.skills || [],
              twinSummary: m.user.twinSummary,
              starters: m.starters || [],
              enrichment: m.enrichment || null,
            })),
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleScan = () => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;
    router.push("/matches");
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setHasProfile(true);
    router.push("/schedule");
  };

  const moveTo = (
    match: KanbanMatch,
    from: "potential" | "matches" | "networked",
    to: "potential" | "matches" | "networked",
  ) => {
    if (from === to) return;
    let np = [...potential],
      nm = [...matches],
      nn = [...networked];
    if (from === "potential") np = np.filter((m) => m.id !== match.id);
    else if (from === "matches") nm = nm.filter((m) => m.id !== match.id);
    else nn = nn.filter((m) => m.id !== match.id);
    if (to === "potential") np.push(match);
    else if (to === "matches") nm.push(match);
    else nn.push(match);
    setPotential(np);
    setMatches(nm);
    setNetworked(nn);
    saveKanban(nn);
  };

  const handleScheduleMeeting = async (
    match: KanbanMatch,
    from: "potential" | "matches" | "networked",
  ) => {
    const title = encodeURIComponent(`Meet ${match.name} — Web Summit`);
    const details = encodeURIComponent(
      `AI-suggested connection at Web Summit 2025.\n\nRole: ${match.role}${match.company ? ` at ${match.company}` : ""}\n\n${match.reason}`,
    );
    window.open(
      `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}`,
      "_blank",
    );
    moveTo(match, from, "networked");
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="radar-spinner mx-auto mb-4" />
          <p className="text-base text-muted-foreground">Loading board...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      <OnboardingModal
        open={showOnboarding}
        onComplete={handleOnboardingComplete}
      />

      <div className="relative shrink-0 px-5 pt-5 md:px-8 md:pt-7 xl:px-10">
        <UserHeader />
        <ConnectedCircles />
        <div className="dev-panel overflow-hidden rounded-lg">
          <div className="flex flex-col gap-8 p-7 md:p-8 lg:flex-row lg:items-center lg:justify-between xl:p-10">
            <div className="max-w-3xl">
              <div className="mb-6 inline-flex rounded border border-primary/30 bg-primary/10 px-3.5 py-1.5">
                <span className="mono-label text-primary">AI event networking</span>
              </div>
              <h1 className="max-w-2xl font-display text-4xl font-black leading-[1.04] text-foreground md:text-5xl xl:text-[3.45rem]">
                Stop awkward intros.{" "}
                <span className="text-primary">Start real connections.</span>
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                Agent Bond breaks the ice before you even walk in. Our AI twins meet other
                attendees, find shared interests, and hand you the connections worth making — with
                conversation starters ready to go.
              </p>
              <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2.5">
                  <Users className="size-4 text-primary" />
                  {potential.length || mockAttendees.length} candidates
                </span>
                <span className="inline-flex items-center gap-2.5">
                  <Sparkles className="size-4 text-amber-400" />
                  {matches.length} matches
                </span>
                <span className="inline-flex items-center gap-2.5">
                  <CheckCircle2 className="size-4 text-green-400" />
                  {networked.length} connected
                </span>
              </div>
            </div>
              <div className="flex min-w-[260px] flex-col gap-3 lg:self-center">
                {!hasProfile && (
                  <Button
                    onClick={() => setShowOnboarding(true)}
                    className="pressable-accent h-14 rounded-md bg-primary px-7 font-mono text-sm font-black text-primary-foreground hover:bg-primary/90"
                  >
                    <Sparkles className="size-5" />
                    Create Twin
                  </Button>
                )}
                {hasProfile && (
                  <Button
                    onClick={handleScan}
                    className="pressable-accent h-14 rounded-md bg-primary px-7 font-mono text-sm font-black text-primary-foreground hover:bg-primary/90"
                  >
                    <Zap className="size-5" />
                    Scan Event
                  </Button>
                )}
                <span className="text-center font-mono text-xs text-muted-foreground">
                  Your AI twin handles the icebreakers
                </span>
              </div>
          </div>
        </div>
      </div>

      <div className="shrink-0 px-5 py-5 md:px-8 xl:px-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="inline-flex w-fit rounded-lg border border-border bg-card/75 p-1.5">
            <button className="rounded-md bg-muted px-4 py-2.5 text-sm font-bold text-foreground">
              Connections
            </button>
            <button className="rounded-md px-4 py-2.5 text-sm font-bold text-muted-foreground">
              Twin Logs
            </button>
          </div>
          <div className="flex flex-1 flex-col gap-3 lg:max-w-4xl lg:flex-row">
            <div className="flex h-12 min-w-0 flex-1 items-center gap-3 rounded-md border border-border bg-card/75 px-4 text-muted-foreground">
              <Search className="size-4" />
              <span className="truncate font-mono text-sm">
                Search people, role, company, or reason...
              </span>
            </div>
            <div className="flex h-12 items-center gap-2.5 rounded-md border border-border bg-card/75 px-4">
              <SlidersHorizontal className="size-4 text-muted-foreground" />
              <span className="mono-label text-muted-foreground">Status:</span>
              <span className="font-mono text-sm font-bold text-foreground">All</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex min-h-[520px] flex-1 gap-6 overflow-x-auto px-5 pb-8 md:px-8 xl:px-10">
        <KanbanColumn
          title="Event Attendees"
          color="orange"
          count={potential.length || mockAttendees.length}
          emptyText={
            !hasProfile
              ? "Create your twin to discover attendees"
              : "Scan the event to find attendees with shared interests"
          }
        >
          {(potential.length > 0 ? potential : mockAttendees).map((m) => (
            <KanbanCard
              key={m.id}
              match={m}
              disabled={!hasProfile || m.isMock}
              actions={
                !m.isMock ? (
                <div className="flex flex-wrap gap-2">
                  <MoveBtn color="green" onClick={() => handleScheduleMeeting(m, "potential")}>
                    <Calendar className="size-3" />
                    Schedule Meeting
                  </MoveBtn>
                </div>
                ) : null
              }
            />
          ))}
        </KanbanColumn>

        <KanbanColumn
          title="Matches"
          color="amber"
          count={matches.length}
          emptyText="Scan the event to find your top matches"
        >
          {matches.map((m) => (
            <KanbanCard
              key={m.id}
              match={m}
              actions={
                <div className="flex flex-wrap gap-2">
                  <MoveBtn
                    color="green"
                    onClick={() => handleScheduleMeeting(m, "matches")}
                  >
                    <Calendar className="size-3" />
                    Schedule Meeting
                  </MoveBtn>
                  <MoveBtn
                    color="orange"
                    onClick={() => moveTo(m, "matches", "potential")}
                  >
                    Back
                  </MoveBtn>
                </div>
              }
            />
          ))}
        </KanbanColumn>

        <KanbanColumn
          title="Connected"
          color="green"
          count={networked.length}
          emptyText="Move connections here after you've met at the event"
        >
          {networked.map((m) => (
            <KanbanCard
              key={m.id}
              match={m}
              actions={
                <div className="flex flex-wrap gap-2">
                  <MoveBtn
                    color="orange"
                    onClick={() => moveTo(m, "networked", "potential")}
                  >
                    Back
                  </MoveBtn>
                </div>
              }
            />
          ))}
        </KanbanColumn>
      </div>
    </div>
  );
}

const colorMap = {
  orange: {
    dot: "bg-primary",
    header: "kanban-header-orange",
    text: "text-primary",
    border: "border-primary/35",
    badge: "border-primary/30 bg-primary/10 text-primary",
    icon: CircleDot,
  },
  amber: {
    dot: "bg-amber-400",
    header: "kanban-header-amber",
    text: "text-amber-300",
    border: "border-amber-400/35",
    badge: "border-amber-400/30 bg-amber-400/10 text-amber-300",
    icon: Sparkles,
  },
  green: {
    dot: "bg-green-400",
    header: "kanban-header-emerald",
    text: "text-green-300",
    border: "border-green-400/35",
    badge: "border-green-400/30 bg-green-400/10 text-green-300",
    icon: CheckCircle2,
  },
};

function KanbanColumn({
  title,
  color,
  count,
  emptyText,
  children,
}: {
  title: string;
  color: "orange" | "amber" | "green";
  count: number;
  emptyText: string;
  children: React.ReactNode;
}) {
  const c = colorMap[color];
  const Icon = c.icon;
  return (
    <div className={`dev-panel flex min-w-[350px] flex-1 flex-col overflow-hidden rounded-lg ${c.border}`}>
      <div
        className={`flex shrink-0 items-center justify-between border-b px-5 py-5 ${c.header}`}
      >
        <div className="flex items-center gap-2.5">
          <Icon className={`size-4 ${c.text}`} />
          <span className={`font-mono text-base font-black ${c.text}`}>
            {title}
          </span>
        </div>
        <span
          className={`rounded-full border px-2.5 py-0.5 font-mono text-sm font-black ${c.badge}`}
        >
          {count}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
        {count === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <p className="text-center font-mono text-sm text-muted-foreground">
              {emptyText}
            </p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

function KanbanCard({
  match,
  actions,
  disabled,
}: {
  match: KanbanMatch;
  actions: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <div
      className={`pressable-card group rounded-lg border border-border bg-card/80 p-5 transition-opacity ${
        disabled ? "opacity-50 grayscale pointer-events-none" : ""
      }`}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3.5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-md border border-primary/25 bg-primary/10">
            <span className="font-mono text-base font-black text-primary">
              {match.name.charAt(0)}
            </span>
          </div>
          <div className="min-w-0">
            <p className="mb-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              {match.company || match.industry || "Attendee"}
            </p>
            <h4 className="truncate font-display text-base font-black text-foreground">
              {match.name}
            </h4>
            <p className="text-sm text-muted-foreground truncate">
              {match.role}
              {match.company && (
                <span className="text-foreground/50"> at {match.company}</span>
              )}
            </p>
          </div>
        </div>
        {match.score > 0 && (
          <span className="shrink-0 rounded border border-primary/25 bg-primary/10 px-2.5 py-1 font-mono text-xs font-black text-primary">
            {Math.round(match.score)}%
          </span>
        )}
      </div>
      <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
        {match.reason}
      </p>
      {match.skills.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {match.skills.slice(0, 3).map((s) => (
            <Badge
              key={s}
              variant="secondary"
              className="rounded border border-border bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground"
            >
              {s}
            </Badge>
          ))}
          {match.skills.length > 3 && (
            <span className="text-sm text-muted-foreground">
              +{match.skills.length - 3}
            </span>
          )}
        </div>
      )}
      {(() => {
        const allStarters = (match.enrichment?.starters?.length ? match.enrichment.starters : match.starters) || [];
        if (allStarters.length === 0) return null;
        return (
          <div className="mb-3 rounded-md border border-amber-400/20 bg-amber-400/5 px-3 py-2">
            <p className="flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-wider text-amber-400 mb-1.5">
              <Lightbulb className="size-2.5" />
              Ice Breakers
            </p>
            {allStarters.slice(0, 2).map((starter, i) => (
              <p key={i} className="text-[11px] text-foreground leading-snug line-clamp-1 mb-0.5">
                &ldquo;{starter}&rdquo;
              </p>
            ))}
            {allStarters.length > 2 && (
              <p className="text-[10px] text-muted-foreground">+{allStarters.length - 2} more</p>
            )}
          </div>
        );
      })()}
      {actions && (
        <div className="border-t border-border pt-4">
          {actions}
        </div>
      )}
      {!match.isMock && match.score > 0 && (
        <Link
          href={`/matches/${match.id}`}
          className="mt-3 flex items-center justify-center gap-2 rounded border border-border bg-muted/50 px-3 py-2 font-mono text-xs font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Eye className="size-3.5" />
          View Match
        </Link>
      )}
    </div>
  );
}

function MoveBtn({
  color,
  onClick,
  children,
}: {
  color: "orange" | "amber" | "green";
  onClick: () => void;
  children: React.ReactNode;
}) {
  const styles = {
    orange: "text-primary border-primary/30 hover:bg-primary/10",
    amber: "text-amber-300 border-amber-400/30 hover:bg-amber-400/10",
    green: "text-green-300 border-green-400/30 hover:bg-green-400/10",
  };
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded border bg-background/40 px-3 py-2 font-mono text-xs font-black transition-all cursor-pointer active:scale-95 ${styles[color]}`}
    >
      {children}
      <ArrowRight className="size-3.5" />
    </button>
  );
}
