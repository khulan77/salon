export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-48 rounded-lg bg-surface-2" />
      <div className="mt-3 h-4 w-64 rounded bg-surface-2" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-surface-2" />
        ))}
      </div>
      <div className="mt-8 h-64 rounded-2xl bg-surface-2" />
    </div>
  );
}
