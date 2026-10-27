"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowUpRight, BarChart2, Briefcase, Building, CalendarClock, PenLine } from "lucide-react";
import { CalendarWidget } from "@/components/reports/CalendarWidget";
import { NAV_GROUPS } from "@/lib/navigation";

function getFirstName(fullName: string | null | undefined): string {
  if (!fullName) return "";
  return fullName.split(" ")[0];
}

function getGreeting(date: Date): string {
  const hour = date.getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

const QUICK_ACTIONS = [
  { href: "/reports", label: "Escrever report de hoje", icon: PenLine, primary: true },
  { href: "/comercial", label: "Scripts comerciais", icon: Briefcase },
  { href: "/portfolio", label: "Portfólio e preços", icon: Building },
  { href: "/reunioes-da-area", label: "Reuniões do mês", icon: CalendarClock },
  { href: "/reports?tab=indicadores", label: "Indicadores", icon: BarChart2 },
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const firstName = getFirstName(session?.user?.name);

  // Greeting and date depend on the viewer's clock/time zone, so they are
  // computed after mount (the server renders in UTC and would mismatch).
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-10 pt-6 sm:pt-10 pb-16">
      {/* Hero */}
      <section className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground min-h-[1rem]">
          {now ? format(now, "EEEE, d 'de' MMMM", { locale: ptBR }) : " "}
        </p>
        <h1 className="mt-2 text-3xl sm:text-[40px] font-bold tracking-tight leading-[1.1]">
          {now ? getGreeting(now) : "Olá"}
          {firstName ? `, ${firstName}` : ""}
          <span className="text-accent">.</span>
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] text-muted-foreground leading-relaxed">
          A base de conhecimento de Marketing, Comunicação &amp; Vendas do Nex: processos, materiais
          comerciais e rotinas do time em um só lugar.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {QUICK_ACTIONS.map(({ href, label, icon: Icon, primary }) => (
            <Link
              key={href}
              href={href}
              className={
                primary
                  ? "inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-accent text-black text-sm font-semibold shadow-xs hover:bg-[#F2C900] transition-colors"
                  : "inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-gray-medium bg-white text-sm font-semibold text-foreground shadow-xs hover:bg-gray-light transition-colors"
              }
            >
              <Icon size={15} />
              {label}
            </Link>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10 items-start">
        {/* Sections, grouped like the sidebar */}
        <div className="space-y-10">
          {NAV_GROUPS.map((group) => (
            <section key={group.id} aria-labelledby={`grp-${group.id}`}>
              <h2 id={`grp-${group.id}`} className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                {group.label}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {group.items.map(({ href, label, description, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="group relative flex items-start gap-3.5 rounded-xl border border-gray-medium bg-white p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-[#D4D4D4] hover:shadow-card-hover"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-medium bg-gray-light/60 transition-colors group-hover:border-black group-hover:bg-black">
                      <Icon size={17} strokeWidth={1.75} className="text-foreground transition-colors group-hover:text-accent" />
                    </span>
                    <span className="min-w-0 flex-1 pr-5">
                      <span className="block text-sm font-semibold text-foreground leading-tight">{label}</span>
                      <span className="mt-1 block text-[13px] text-muted-foreground leading-snug line-clamp-2">{description}</span>
                    </span>
                    <ArrowUpRight
                      size={15}
                      className="absolute right-3.5 top-3.5 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 group-hover:text-foreground"
                    />
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Agenda */}
        <aside className="lg:sticky lg:top-8">
          <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Agenda</h2>
          <CalendarWidget />
        </aside>
      </div>
    </div>
  );
}
