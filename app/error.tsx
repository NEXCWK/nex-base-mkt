"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-dvh bg-gray-light flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <p className="text-6xl font-bold tracking-tight mb-2">Ops!</p>
        <div className="w-10 h-[3px] bg-accent rounded mx-auto mb-4" />
        <h1 className="text-lg font-semibold mb-1">Algo deu errado</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Ocorreu um erro inesperado. Tente novamente — se persistir, avise o time.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-black text-white text-sm font-medium hover:bg-gray-dark transition-colors"
        >
          Tentar novamente
        </button>
        {error.digest && (
          <p className="text-[10px] text-muted-foreground mt-4">Código: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
