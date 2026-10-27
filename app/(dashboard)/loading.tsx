export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-10 pt-5 sm:pt-8 pb-16" aria-busy="true" aria-label="Carregando">
      <div className="h-3 w-32 rounded-full bg-gray-light animate-pulse mb-4" />
      <div className="h-8 w-64 rounded-lg bg-gray-light animate-pulse mb-3" />
      <div className="h-4 w-96 max-w-full rounded-full bg-gray-light animate-pulse mb-10" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-36 rounded-xl border border-gray-medium bg-gray-light/50 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
