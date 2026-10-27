import {
  Home,
  Star,
  Users,
  Building2,
  CalendarDays,
  Briefcase,
  Building,
  FileText,
  FolderOpen,
  Store,
  BarChart2,
  Megaphone,
  Palette,
  Target,
  Repeat,
  BookOpen,
  CalendarClock,
  LayoutGrid,
  GraduationCap,
  Award,
  type LucideIcon,
} from "lucide-react";

// Single source of truth for the app's information architecture: the sidebar,
// the home screen, the page breadcrumbs and the quick-search (⌘K) all read
// from here, so a page only needs to be registered once.

export interface NavTab {
  /** Value of the `?tab=` query param the page understands. */
  id: string;
  label: string;
}

export interface NavItem {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  keywords?: string[];
  tabs?: NavTab[];
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

export const HOME_ITEM: NavItem = {
  href: "/",
  label: "Tela Principal",
  description: "Visão geral, atalhos e agenda.",
  icon: Home,
  keywords: ["inicio", "home", "dashboard"],
};

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "empresa",
    label: "A Empresa",
    items: [
      {
        href: "/sobre-o-nex",
        label: "Sobre o Nex",
        description: "História, manifesto, brandbook e materiais institucionais.",
        icon: Star,
        keywords: ["historia", "manifesto", "brandbook", "cultura", "midia kit", "unidades"],
        tabs: [
          { id: "historia", label: "História" },
          { id: "manifesto", label: "Manifesto e Posicionamento" },
          { id: "materiais", label: "Materiais Institucionais" },
        ],
      },
      {
        href: "/nosso-time",
        label: "Nosso Time",
        description: "Perfis do time e parceiros da área.",
        icon: Users,
        keywords: ["equipe", "pessoas", "perfil", "parceiros"],
        tabs: [
          { id: "time", label: "Time" },
          { id: "parceiros", label: "Parceiros da Área" },
        ],
      },
      {
        href: "/marcas-parceiras",
        label: "Marcas Parceiras",
        description: "Marcas e empresas parceiras do Nex.",
        icon: Building2,
        keywords: ["parcerias", "logos", "empresas"],
      },
      {
        href: "/nossos-eventos",
        label: "Nossos Eventos",
        description: "Histórico de eventos realizados pelo Nex.",
        icon: CalendarDays,
        keywords: ["eventos", "comunidade", "fotos"],
      },
    ],
  },
  {
    id: "vendas",
    label: "Vendas",
    items: [
      {
        href: "/comercial",
        label: "Vendas",
        description: "Scripts, descontos, processos e conteúdos para o time comercial.",
        icon: Briefcase,
        keywords: ["comercial", "scripts", "fup", "keypoints", "sla", "desconto", "fechamento", "apresentacoes", "videos"],
        tabs: [
          { id: "scripts", label: "Scripts Comerciais" },
          { id: "descontos", label: "Diretrizes de Desconto" },
          { id: "processos", label: "Processos de Fechamento" },
          { id: "apresentacoes", label: "Apresentações Comerciais" },
          { id: "conteudo-vendas", label: "Conteúdo para Vendas" },
          { id: "arquivos", label: "Arquivos" },
        ],
      },
      {
        href: "/portfolio",
        label: "Portfólio de Produtos",
        description: "Espaços, planos, preços e serviços.",
        icon: Building,
        keywords: ["produtos", "precos", "planos", "salas", "escritorio"],
      },
      {
        href: "/propostas",
        label: "Modelo de Propostas",
        description: "Templates e propostas comerciais salvas.",
        icon: FileText,
        keywords: ["proposta", "canva", "template"],
      },
      {
        href: "/contratos",
        label: "Contratos",
        description: "Contratos organizados por tipo de produto.",
        icon: FolderOpen,
        keywords: ["contrato", "documentos"],
      },
      {
        href: "/marketplaces",
        label: "Marketplaces",
        description: "Plataformas parceiras, acessos e precificação.",
        icon: Store,
        keywords: ["desana", "plataformas", "login", "diaria"],
      },
      {
        href: "/reports",
        label: "Reports Comerciais",
        description: "Diário comercial do time e indicadores.",
        icon: BarChart2,
        keywords: ["report", "diario", "indicadores", "vendas", "churn", "leads"],
        tabs: [
          { id: "hoje", label: "Hoje" },
          { id: "indicadores", label: "Indicadores" },
          { id: "historico", label: "Histórico" },
        ],
      },
    ],
  },
  {
    id: "marketing",
    label: "Marketing & Comunicação",
    items: [
      {
        href: "/marketing",
        label: "Marketing",
        description: "Planos da área, mídia e priorização de verba.",
        icon: Megaphone,
        keywords: ["midia", "verba", "ads", "campanhas"],
        tabs: [
          { id: "arquivos", label: "Arquivos de Mídia" },
          { id: "verba", label: "Priorização de Verba" },
        ],
      },
      {
        href: "/comunicacao-design",
        label: "Comunicação e Design",
        description: "Recursos de marca, datas comemorativas e influenciadores.",
        icon: Palette,
        keywords: ["design", "canva", "drive", "influenciadores", "influs", "datas comemorativas", "calendario"],
        tabs: [
          { id: "recursos", label: "Recursos" },
          { id: "datas-comemorativas", label: "Datas Comemorativas" },
          { id: "influenciadores", label: "Influenciadores" },
        ],
      },
      {
        href: "/estrategias",
        label: "Estratégias",
        description: "Arquivos e anotações por canal estratégico.",
        icon: Target,
        keywords: ["instagram", "linkedin", "lancamento", "email", "canal"],
        tabs: [
          { id: "arquivos", label: "Arquivos" },
          { id: "anotacoes", label: "Anotações por Canal" },
        ],
      },
      {
        href: "/cadencia-campanhas",
        label: "Cadência de Campanhas",
        description: "Regras, fluxo e responsáveis das campanhas de fechamento.",
        icon: Repeat,
        keywords: ["campanha", "desconto", "black friday", "fluxo"],
      },
    ],
  },
  {
    id: "gestao",
    label: "Gestão da Área",
    items: [
      {
        href: "/playbooks",
        label: "Playbooks da Área",
        description: "Processos, fornecedores e softwares da área.",
        icon: BookOpen,
        keywords: ["playbook", "outsourcing", "fornecedores", "ferramentas", "softwares"],
        tabs: [
          { id: "arquivos", label: "Arquivos" },
          { id: "parceiros", label: "Parceiros (Outsourcing)" },
          { id: "softwares", label: "Softwares da Área" },
        ],
      },
      {
        href: "/reunioes-da-area",
        label: "Reuniões da Área",
        description: "Rotinas de encontros e calendário automático.",
        icon: CalendarClock,
        keywords: ["reuniao", "sprint", "agenda", "rotina"],
        tabs: [
          { id: "calendario", label: "Calendário" },
          { id: "rotinas", label: "Rotinas" },
        ],
      },
      {
        href: "/repositorio",
        label: "Repositório",
        description: "Quadro kanban de projetos e updates do time.",
        icon: LayoutGrid,
        keywords: ["kanban", "projetos", "tarefas", "quadro"],
      },
      {
        href: "/treinamento",
        label: "Treinamento",
        description: "Trilha de onboarding para novos membros.",
        icon: GraduationCap,
        keywords: ["onboarding", "trilha", "modulos"],
      },
      {
        href: "/certificacoes",
        label: "Certificações",
        description: "Certificações e cursos da equipe.",
        icon: Award,
        keywords: ["cursos", "certificado"],
      },
    ],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = [HOME_ITEM, ...NAV_GROUPS.flatMap((g) => g.items)];

export function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function findNavContext(pathname: string): { group: NavGroup | null; item: NavItem | null } {
  for (const group of NAV_GROUPS) {
    const item = group.items.find((i) => isActivePath(pathname, i.href));
    if (item) return { group, item };
  }
  return { group: null, item: isActivePath(pathname, "/") ? HOME_ITEM : null };
}
