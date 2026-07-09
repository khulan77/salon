export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-warm">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary" />
        <p className="font-display text-lg text-muted">Lumière ✦</p>
      </div>
    </div>
  );
}
