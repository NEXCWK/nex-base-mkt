"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Star,
  Users,
  BookOpen,
  Target,
  Briefcase,
  Palette,
  Megaphone,
  Building,
  FileText,
  BarChart2,
  ChevronRight,
  Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarWidget } from "@/components/reports/CalendarWidget";
import { cn } from "@/lib/utils";

interface Section {
  href: string;
  label: string;
  description: string;
  icon: React.ElementType;
}

const sections: Section[] = [
  {
    href: "/sobre-o-nex",
    label: "Sobre o Nex",
    description: "Historia, missao, valores e posicionamento da marca.",
    icon: Star,
  },
  {
    href: "/nosso-time",
    label: "Nosso Time",
    description: "Perfis, papeis e contatos da equipe de marketing e vendas.",
    icon: Users,
  },
  {
    href: "/playbooks",
    label: "Playbooks da Area",
    description: "Processos, rotinas e checklists operacionais da equipe.",
    icon: BookOpen,
  },
  {
    href: "/estrategias",
    label: "Estrategias",
    description: "OKRs, metas e diretrizes estrategicas do periodo.",
    icon: Target,
  },
  {
    href: "/comercial",
    label: "Comercial",
    description: "Pipeline, scripts de vendas e gestao de leads.",
    icon: Briefcase,
  },
  {
    href: "/comunicacao-design",
    label: "Comunicacao e Design",
    description: "Identidade visual, templates e guia de comunicacao.",
    icon: Palette,
  },
  {
    href: "/marketing",
    label: "Marketing",
    description: "Campanhas, calendario editorial e performance de canais.",
    icon: Megaphone,
  },
  {
    href: "/portfolio",
    label: "Portfolio de Produtos",
    description: "Planos, espacos e diferenciais do Nex Coworking.",
    icon: Building,
  },
  {
    href: "/propostas",
    label: "Modelo de Propostas",
    description: "Templates e guias para criar propostas comerciais.",
    icon: FileText,
  },
  {
    href: "/reports",
    label: "Reports Comerciais",
    description: "Indicadores, dashboards e historico de resultados.",
    icon: BarChart2,
  },
];

function getFirstName(fullName: string | null | undefined): string {
  if (!fullName) return "voce";
  return fullName.split(" ")[0];
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const firstName = getFirstName(session?.user?.name);
  const greeting = getGreeting();
  const todayFormatted = format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  });

  return (
    <div className="max-w-6xl mx-auto px-8 py-8">
      {/* Stats bar */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-medium">
        <p className="text-sm text-muted-foreground capitalize">{todayFormatted}</p>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Zap size={13} className="text-accent" />
          <span>Area de Marketing, Comunicacao &amp; Vendas</span>
        </div>
      </div>

      {/* Hero / Welcome */}
      <div className="mb-10">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight mb-1">
          {greeting}, {firstName}!
        </h1>
        <p className="text-base text-muted-foreground max-w-2xl">
          Bem-vindo a base de conhecimento da area de Marketing, Comunicacao e Vendas
          do Nex Coworking. Acesse playbooks, estrategias, materiais comerciais e
          muito mais em um so lugar.
        </p>
      </div>

      {/* Main grid: sections + calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_288px] gap-8 items-start">
        {/* Quick access cards */}
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Acesso Rapido
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sections.map(({ href, label, description, icon: Icon }) => (
              <Link key={href} href={href} className="group block">
                <Card
                  className={cn(
                    "h-full cursor-pointer border-gray-medium",
                    "group-hover:border-gray-dark group-hover:shadow-sm transition-all"
                  )}
                >
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="shrink-0 w-8 h-8 rounded-md bg-gray-light border border-gray-medium flex items-center justify-center group-hover:bg-accent group-hover:border-accent transition-colors">
                      <Icon
                        size={15}
                        className="text-muted-foreground group-hover:text-black transition-colors"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-foreground leading-tight">
                          {label}
                        </p>
                        <ChevronRight
                          size={13}
                          className="shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-snug line-clamp-2">
                        {description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Calendar widget */}
        <div className="lg:sticky lg:top-8">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Agenda
          </h2>
          <CalendarWidget />
        </div>
      </div>
    </div>
  );
}
