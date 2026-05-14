export function LoadingSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="radar-spinner" />
      <p className="font-mono text-sm text-muted-foreground">{message}</p>
    </div>
  )
}
