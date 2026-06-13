import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-dvh bg-gray-light flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <p className="text-6xl font-bold tracking-tight mb-2">404</p>
        <div className="w-10 h-[3px] bg-accent rounded mx-auto mb-4" />
        <h1 className="text-lg font-semibold mb-1">Página não encontrada</h1>
        <p className="text-sm text-muted-foreground mb-6">
          O endereço que você tentou acessar não existe ou foi movido.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-black text-white text-sm font-medium hover:bg-gray-dark transition-colors"
        >
          Voltar à Tela Principal
        </Link>
      </div>
    </div>
  );
}
