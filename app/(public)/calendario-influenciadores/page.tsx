"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Loader2, CalendarDays } from "lucide-react";
import { CalendarioInfluLegend } from "@/components/calendario-influ/Legend";
import { ThreeMonthCalendar } from "@/components/calendario-influ/ThreeMonthCalendar";
import type { PublicConfirmedEntry } from "@/components/calendario-influ/types";

export default function CalendarioInfluenciadoresPublicPage() {
  const [confirmed, setConfirmed] = useState<PublicConfirmedEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/public/calendario-influ")
      .then((res) => (res.ok ? res.json() : { confirmed: [] }))
      .then((data) => setConfirmed(data.confirmed ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-dvh bg-gray-light/40">
      <header className="bg-white border-b border-gray-medium">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-5 flex items-center gap-3">
          <Image src="/brand/logo-nex-preto.png" alt="Nex Coworking" width={80} height={32} className="object-contain" priority />
          <div className="h-5 w-px bg-gray-medium" />
          <span className="text-sm font-600 text-muted-foreground">Calendário de Influenciadores Avulsos</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-8 py-8 flex flex-col gap-8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white border border-gray-medium rounded-lg flex items-center justify-center shrink-0">
            <CalendarDays size={17} />
          </div>
          <div>
            <h1 className="text-xl font-700 tracking-tight">Próximos influenciadores confirmados</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Visão pública dos próximos 3 meses. Atualizado automaticamente conforme novas datas são confirmadas.
            </p>
          </div>
        </div>

        <CalendarioInfluLegend compact />

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm py-10">
            <Loader2 size={15} className="animate-spin" /> Carregando calendário...
          </div>
        ) : (
          <ThreeMonthCalendar entries={confirmed} />
        )}
      </main>

      <footer className="max-w-5xl mx-auto px-4 sm:px-8 py-6">
        <p className="text-xs text-muted-foreground">
          Página pública somente leitura — a gestão completa do pipeline de influenciadores fica no sistema interno do Nex.
        </p>
      </footer>
    </div>
  );
}
