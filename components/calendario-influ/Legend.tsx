import { cn } from "@/lib/utils";
import { USO_META, STATUS_META } from "./types";

export function CalendarioInfluLegend({ compact = false }: { compact?: boolean }) {
  return (
    <div className="bg-white border border-gray-medium rounded-xl p-6 flex flex-col gap-6">
      <div>
        <p className="text-xs font-600 uppercase tracking-wide text-muted-foreground mb-3">
          Rótulos
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-start gap-3">
            <span className={cn("text-xs font-600 uppercase tracking-wide rounded-full px-2.5 py-1 shrink-0", USO_META.primeiro.chip)}>
              {USO_META.primeiro.label}
            </span>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Influenciadores que vão usar a unidade pela primeira vez.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className={cn("text-xs font-600 uppercase tracking-wide rounded-full px-2.5 py-1 shrink-0", USO_META.segundo.chip)}>
              {USO_META.segundo.label}
            </span>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Já usaram uma vez, gostamos do resultado e convidamos para uma segunda visita.
            </p>
          </div>
        </div>
      </div>

      {!compact && (
        <div>
          <p className="text-xs font-600 uppercase tracking-wide text-muted-foreground mb-3">
            Status de comunicação
          </p>
          <div className="flex flex-col gap-2.5">
            <div className="flex items-start gap-3">
              <span className={cn("text-xs font-600 rounded-full px-2.5 py-1 shrink-0", STATUS_META.mapeado.chip)}>
                {STATUS_META.mapeado.label}
              </span>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Influenciador mapeado, mas ainda sem contato ativo para saber se topa.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className={cn("text-xs font-600 rounded-full px-2.5 py-1 shrink-0", STATUS_META["data-a-confirmar"].chip)}>
                {STATUS_META["data-a-confirmar"].label}
              </span>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Já conversamos, ele confirmou interesse — agora estamos combinando a data.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className={cn("text-xs font-600 rounded-full px-2.5 py-1 shrink-0", STATUS_META["data-confirmada"].chip)}>
                {STATUS_META["data-confirmada"].label}
              </span>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Data confirmada de Primeiro ou Segundo Uso. Só esse status aparece no calendário.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-light rounded-lg px-4 py-3">
        <p className="text-sm text-foreground">
          <strong className="font-700">Meta do mês:</strong> idealmente, sempre 2 influenciadores de Primeiro Uso + 2 de Segundo Uso confirmados por mês.
        </p>
      </div>
    </div>
  );
}
