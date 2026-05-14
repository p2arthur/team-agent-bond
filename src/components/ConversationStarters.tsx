export function ConversationStarters({ starters }: { starters: string[] }) {
  return (
    <div className="flex flex-col gap-3">
      <span className="mono-label text-muted-foreground">
        Suggested Conversation Openers
      </span>
      {starters.map((starter, i) => (
        <div
          key={i}
          className="pressable rounded-lg border border-amber-400/30 bg-amber-400/10 p-4"
        >
          <p className="text-sm text-foreground italic leading-relaxed">
            &ldquo;{starter}&rdquo;
          </p>
        </div>
      ))}
    </div>
  );
}
