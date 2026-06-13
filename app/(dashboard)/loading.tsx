import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex items-center justify-center py-32 text-muted-foreground">
      <Loader2 size={20} className="animate-spin mr-2" />
      <span className="text-sm">Carregando…</span>
    </div>
  );
}
