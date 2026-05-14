"use client";

import { useEffect, useRef } from "react";

interface ConversationMessage {
  role: "twin_a" | "twin_b";
  speakerName: string;
  content: string;
  timestamp: number;
}
interface ConversationViewProps {
  messages: ConversationMessage[];
  isComplete: boolean;
  verdict?: { shouldMeet: boolean; reason: string };
  userAName: string;
  userBName: string;
}

export function ConversationView({
  messages,
  isComplete,
  verdict,
  userAName,
  userBName,
}: ConversationViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  return (
    <div
      className="dev-panel max-h-80 overflow-y-auto rounded-lg p-5"
      ref={scrollRef}
    >
      <div className="flex flex-col gap-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "twin_a" ? "justify-start" : "justify-end"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg border px-4 py-2.5 ${msg.role === "twin_a" ? "border-border bg-muted" : "border-accent/20 bg-accent/10"}`}
            >
              <p className="mb-1 font-mono text-[11px] font-bold text-muted-foreground">
                {msg.speakerName}
              </p>
              <p className="text-sm text-foreground leading-relaxed">
                {msg.content}
              </p>
            </div>
          </div>
        ))}
        {!isComplete && messages.length === 0 && (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground animate-pulse">
              Starting conversation...
            </p>
          </div>
        )}
      </div>
      {isComplete && verdict && (
        <div
          className={`mt-4 rounded-lg border p-4 ${verdict.shouldMeet ? "border-green-400/30 bg-green-400/10" : "border-border bg-muted"}`}
        >
          <p className="font-mono text-sm font-black text-foreground">
            {verdict.shouldMeet
              ? "Twins recommend meeting"
              : "Not a strong match"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{verdict.reason}</p>
        </div>
      )}
    </div>
  );
}
