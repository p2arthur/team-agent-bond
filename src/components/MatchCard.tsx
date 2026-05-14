import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, ArrowRight, MessageSquareText, Lightbulb, Coffee, Sun, Moon } from "lucide-react";

const PERIOD_CONFIG: Record<string, { label: string; Icon: typeof Coffee; color: string }> = {
  morning: { label: "Morning", Icon: Coffee, color: "text-amber-300 border-amber-400/25 bg-amber-400/10" },
  afternoon: { label: "Afternoon", Icon: Sun, color: "text-sky-300 border-sky-400/25 bg-sky-400/10" },
  evening: { label: "Evening", Icon: Moon, color: "text-purple-300 border-purple-400/25 bg-purple-400/10" },
};

interface MatchCardProps {
  match: {
    id: string
    user: {
      id: string; name: string; role: string; company: string | null
      industry: string | null; skills: string[]; twinSummary: string | null
      availability?: string[]
    }
    score: number; reason: string; starters?: string[]
    conversation?: {
      messages: Array<{ role: string; speakerName: string; content: string }>
      verdict: { shouldMeet: boolean; reason: string; starters?: string[] }
    }
  }
}

export function MatchCard({ match }: MatchCardProps) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="pressable-card overflow-hidden rounded-lg border border-border bg-card/85">
      <Link href={`/matches/${match.id}`} className="block p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-md bg-accent/10 border border-accent/20 flex items-center justify-center">
              <span className="font-mono font-black text-accent">{match.user.name.charAt(0)}</span>
            </div>
            <div>
              <p className="mb-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{match.user.company || match.user.industry || "Connection"}</p>
              <h3 className="font-display text-base font-black text-foreground">{match.user.name}</h3>
              <p className="text-xs text-muted-foreground">
                {match.user.role}
                {match.user.company && <span className="text-foreground/40"> at {match.user.company}</span>}
              </p>
            </div>
          </div>
          <span className="rounded border border-accent/25 bg-accent/10 px-2.5 py-1 font-mono text-xs font-black text-accent">
            {Math.round(match.score)}%
          </span>
        </div>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2 leading-relaxed">{match.reason}</p>
        <div className="flex flex-wrap gap-1.5">
          {match.user.skills.slice(0, 4).map((skill) => (
            <Badge key={skill} variant="secondary" className="rounded border border-border bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
              {skill}
            </Badge>
          ))}
          {match.user.skills.length > 4 && (
            <span className="text-[11px] text-muted-foreground">+{match.user.skills.length - 4}</span>
          )}
        </div>
        {match.user.availability && match.user.availability.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
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
      </Link>
      {/* Ice breakers */}
      {(match.starters && match.starters.length > 0) && (
        <div className="border-t border-amber-400/15 bg-amber-400/[0.03] px-5 py-3">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-amber-400 mb-2 flex items-center gap-1.5">
            <Lightbulb className="size-3" />
            Ice Breakers
          </p>
          <div className="flex flex-col gap-1.5">
            {match.starters.slice(0, 2).map((starter, i) => (
              <p key={i} className="text-xs text-foreground/90 leading-relaxed line-clamp-2">
                &ldquo;{starter}&rdquo;
              </p>
            ))}
          </div>
        </div>
      )}
      {match.conversation && (
        <div className="border-t border-border">
          <button
            onClick={(e) => { e.preventDefault(); setExpanded(!expanded) }}
            className="flex w-full cursor-pointer items-center justify-between px-5 py-2.5 font-mono text-xs font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <span className="inline-flex items-center gap-2">
              <MessageSquareText className="size-3.5" />
              Twin Conversation
            </span>
            {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
          {match.conversation.verdict && (
            <div className="px-5 pb-2">
              <p className="text-xs text-muted-foreground italic">{match.conversation.verdict.reason}</p>
            </div>
          )}
          {!expanded && match.conversation.messages.length > 0 && (
            <div className="px-5 pb-3 flex flex-col gap-0.5">
              {match.conversation.messages.slice(0, 2).map((msg, i) => (
                <div key={i} className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{msg.speakerName}: </span>
                  <span className="line-clamp-1">{msg.content}</span>
                </div>
              ))}
              {match.conversation.messages.length > 2 && (
                <p className="text-[11px] text-muted-foreground">+{match.conversation.messages.length - 2} more</p>
              )}
            </div>
          )}
          {expanded && (
            <div className="px-5 pb-4 max-h-44 overflow-y-auto flex flex-col gap-2">
              {match.conversation.messages.map((msg, i) => (
                <div key={i} className={`rounded-md border p-2.5 text-xs ${msg.role === 'twin_a' ? 'border-accent/20 bg-accent/5 text-foreground' : 'border-sky-400/20 bg-sky-400/10 text-foreground'}`}>
                  <span className="font-semibold">{msg.speakerName}: </span>
                  {msg.content}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <Link
        href={`/matches/${match.id}`}
        className="flex items-center justify-between border-t border-border px-5 py-3 font-mono text-xs font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        View Match
        <ArrowRight className="size-3.5" />
      </Link>
    </div>
  )
}
