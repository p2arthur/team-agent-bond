"use client";

import { useEffect, useState } from "react";
import { UserHeader } from "@/components/UserHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Coffee,
  Moon,
  Sun,
} from "lucide-react";
import {
  eventSessions,
  PERIOD_INFO,
  EVENT_DATE,
  EVENT_NAME,
  type TimePeriod,
} from "@/lib/event-schedule";

const PERIOD_ICONS: Record<TimePeriod, typeof Sun> = {
  morning: Coffee,
  afternoon: Sun,
  evening: Moon,
};

const PERIOD_COLORS: Record<
  TimePeriod,
  { accent: string; border: string; bg: string; badge: string; dot: string; calendarBg: string }
> = {
  morning: {
    accent: "text-amber-300",
    border: "border-amber-400/30",
    bg: "bg-amber-400/5",
    badge: "border-amber-400/25 bg-amber-400/10 text-amber-300",
    dot: "bg-amber-400",
    calendarBg: "bg-amber-400/8",
  },
  afternoon: {
    accent: "text-sky-300",
    border: "border-sky-400/30",
    bg: "bg-sky-400/5",
    badge: "border-sky-400/25 bg-sky-400/10 text-sky-300",
    dot: "bg-sky-400",
    calendarBg: "bg-sky-400/8",
  },
  evening: {
    accent: "text-purple-300",
    border: "border-purple-400/30",
    bg: "bg-purple-400/5",
    badge: "border-purple-400/25 bg-purple-400/10 text-purple-300",
    dot: "bg-purple-400",
    calendarBg: "bg-purple-400/8",
  },
};

const TIME_SLOTS = [
  { label: "9:00", hour: 9 },
  { label: "10:00", hour: 10 },
  { label: "11:00", hour: 11 },
  { label: "12:00", hour: 12 },
  { label: "1:30", hour: 13 },
  { label: "2:30", hour: 14 },
  { label: "3:15", hour: 15 },
  { label: "4:00", hour: 16 },
  { label: "5:00", hour: 17 },
  { label: "6:00", hour: 18 },
  { label: "7:30", hour: 19 },
  { label: "8:00", hour: 20 },
];

function getSessionPosition(session: typeof eventSessions[0]) {
  const timeMap: Record<string, { start: number; span: number }> = {
    "9:00 AM": { start: 0, span: 1 },
    "10:00 AM": { start: 1, span: 1 },
    "11:00 AM": { start: 2, span: 1 },
    "11:30 AM": { start: 2, span: 1.5 },
    "1:30 PM": { start: 4, span: 1 },
    "2:30 PM": { start: 5, span: 1 },
    "3:15 PM": { start: 6, span: 1 },
    "4:00 PM": { start: 7, span: 1 },
    "6:00 PM": { start: 9, span: 1.5 },
    "7:30 PM": { start: 10, span: 1 },
    "8:00 PM": { start: 11, span: 1.5 },
  };
  return timeMap[session.time] || { start: 0, span: 1 };
}

export default function SchedulePage() {
  const [availability, setAvailability] = useState<TimePeriod[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [counts, setCounts] = useState<Record<TimePeriod, number>>({
    morning: 0,
    afternoon: 0,
    evening: 0,
  });

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;
    fetch(`/api/profile?userId=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.profile.availability) {
          try {
            const parsed = data.profile.availability;
            if (Array.isArray(parsed)) setAvailability(parsed);
          } catch {}
        }
      })
      .catch(() => {});

    fetch("/api/schedule/counts")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.counts) setCounts(data.counts);
      })
      .catch(() => {});
  }, []);

  const toggleAvailability = (period: TimePeriod) => {
    setSaved(false);
    setAvailability((prev) =>
      prev.includes(period)
        ? prev.filter((p) => p !== period)
        : [...prev, period],
    );
  };

  const handleSave = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;
    setSaving(true);
    try {
      await fetch("/api/profile/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, availability }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
    setSaving(false);
  };

  const periods: TimePeriod[] = ["morning", "afternoon", "evening"];

  return (
    <div className="min-h-full px-5 py-8 md:px-8 xl:px-10">
      <div className="mx-auto max-w-6xl">
        <UserHeader />

        <div className="mb-6">
          <span className="mono-label text-primary">{EVENT_NAME}</span>
          <h2 className="mt-3 font-display text-4xl font-black text-foreground">
            Event Schedule
          </h2>
          <p className="mt-2 text-muted-foreground">
            {EVENT_DATE} — Select when you&apos;re available for networking.
          </p>
        </div>

        {/* Availability selector */}
        <div className="dev-panel mb-8 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="mono-label text-primary">
                Your Availability
              </span>
              <p className="text-xs text-muted-foreground mt-1">
                Pick time slots — your twin only matches with people available at the same time
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-md border border-border bg-card/75 p-1">
                <button
                  onClick={() => setView("calendar")}
                  className={`rounded-md px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                    view === "calendar"
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Calendar
                </button>
                <button
                  onClick={() => setView("list")}
                  className={`rounded-md px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                    view === "list"
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  List
                </button>
              </div>
              <Button
                onClick={handleSave}
                disabled={saving || availability.length === 0}
                className="pressable-accent h-9 px-4 font-mono text-[11px] font-black bg-accent text-primary-foreground hover:bg-primary/90 border-0 cursor-pointer disabled:opacity-30"
              >
                {saving ? "Saving..." : saved ? "Saved!" : "Save"}
              </Button>
            </div>
          </div>
          <div className="flex gap-2">
            {periods.map((period) => {
              const info = PERIOD_INFO[period];
              const Icon = PERIOD_ICONS[period];
              const colors = PERIOD_COLORS[period];
              const selected = availability.includes(period);

              return (
                <button
                  key={period}
                  onClick={() => toggleAvailability(period)}
                  className={`flex items-center gap-2.5 rounded-lg border px-4 py-2.5 text-left transition-all cursor-pointer flex-1 ${
                    selected
                      ? `${colors.border} ${colors.bg}`
                      : "border-border bg-card/50 hover:bg-muted"
                  }`}
                >
                  <Icon
                    className={`size-4 ${selected ? colors.accent : "text-muted-foreground"}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`font-mono text-xs font-bold ${selected ? colors.accent : "text-foreground"}`}>
                      {info.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{info.time}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {counts[period]} attendee{counts[period] !== 1 ? "s" : ""}
                    </p>
                  </div>
                  {selected && <CheckCircle2 className={`size-3.5 ${colors.accent} shrink-0`} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Calendar view */}
        {view === "calendar" && (
          <div className="dev-panel rounded-lg overflow-hidden mb-8">
            {/* Period headers */}
            <div className="grid grid-cols-[70px_1fr_1fr_1fr] border-b border-border">
              <div className="p-3 border-r border-border" />
              {periods.map((period) => {
                const info = PERIOD_INFO[period];
                const colors = PERIOD_COLORS[period];
                const selected = availability.includes(period);
                return (
                  <div
                    key={period}
                    className={`p-3 border-r border-border last:border-r-0 ${selected ? colors.bg : ""}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`size-2 rounded-full ${colors.dot}`} />
                      <span className={`font-mono text-xs font-bold ${colors.accent}`}>
                        {info.label}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {counts[period]}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{info.time}</p>
                  </div>
                );
              })}
            </div>

            {/* Time grid */}
            <div className="grid grid-cols-[70px_1fr_1fr_1fr]">
              {TIME_SLOTS.map((slot) => (
                <div key={slot.label} className="contents">
                  <div className="p-2 border-r border-b border-border text-right pr-3">
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {slot.label}
                    </span>
                  </div>
                  {periods.map((period) => {
                    const colors = PERIOD_COLORS[period];
                    const sessionsHere = eventSessions.filter((s) => {
                      if (s.period !== period) return false;
                      const pos = getSessionPosition(s);
                      return pos.start === slot.hour - 9 || 
                        (slot.hour >= 13 && pos.start === slot.hour - 9.5) ||
                        (period === "afternoon" && slot.hour === 13 && s.time === "1:30 PM") ||
                        (period === "evening" && slot.hour === 18 && s.time === "6:00 PM") ||
                        (period === "evening" && slot.hour === 20 && s.time === "8:00 PM");
                    });
                    const selected = availability.includes(period);

                    return (
                      <div
                        key={`${period}-${slot.label}`}
                        className={`border-r border-b border-border last:border-r-0 min-h-[48px] p-1 ${selected ? colors.calendarBg : ""}`}
                      >
                        {sessionsHere.map((session) => (
                          <div
                            key={session.id}
                            className={`rounded-md border ${colors.border} ${colors.bg} px-2 py-1.5 cursor-pointer hover:opacity-80 transition-opacity`}
                          >
                            <p className="font-mono text-[9px] font-bold text-muted-foreground truncate">
                              {session.track}
                            </p>
                            <p className={`text-[10px] font-bold ${colors.accent} leading-tight line-clamp-2`}>
                              {session.title}
                            </p>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* List view */}
        {view === "list" && (
          <>
            {periods.map((period) => {
              const info = PERIOD_INFO[period];
              const Icon = PERIOD_ICONS[period];
              const colors = PERIOD_COLORS[period];
              const sessions = eventSessions.filter((s) => s.period === period);
              const isSelected = availability.includes(period);

              return (
                <div key={period} className="mb-8">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`size-7 rounded-md flex items-center justify-center ${colors.bg} ${colors.border} border`}>
                      <Icon className={`size-3.5 ${colors.accent}`} />
                    </div>
                    <h3 className="font-display text-lg font-black text-foreground">
                      {info.label}
                    </h3>
                    <span className="text-xs text-muted-foreground">{info.time}</span>
                    <span className="text-xs text-muted-foreground">
                      · {counts[period]} attendee{counts[period] !== 1 ? "s" : ""}
                    </span>
                    {isSelected && (
                      <span className={`ml-auto inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 ${colors.badge}`}>
                        <CheckCircle2 className="size-2.5" />
                        <span className="font-mono text-[9px] font-bold">Available</span>
                      </span>
                    )}
                  </div>

                  <div className="grid gap-2 md:grid-cols-2">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className="pressable-card dev-panel-soft rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-mono text-[9px] font-bold text-muted-foreground">
                                {session.track}
                              </span>
                              <span className="text-muted-foreground text-[9px]">·</span>
                              <span className="font-mono text-[9px] text-muted-foreground">
                                {session.duration}
                              </span>
                            </div>
                            <h4 className="font-display text-sm font-black text-foreground leading-snug">
                              {session.title}
                            </h4>
                          </div>
                          <span className={`shrink-0 rounded border px-2 py-0.5 font-mono text-[10px] font-bold ${colors.badge}`}>
                            {session.time}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                          {session.description}
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="size-5 rounded bg-accent/10 border border-accent/20 flex items-center justify-center">
                            <span className="font-mono text-[8px] font-black text-accent">
                              {session.speaker.charAt(0)}
                            </span>
                          </div>
                          <span className="text-[11px] text-muted-foreground">
                            {session.speaker}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {session.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="rounded border border-border bg-muted px-1.5 py-0 font-mono text-[8px] text-muted-foreground"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
