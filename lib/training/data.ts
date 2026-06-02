export type TaskType =
  | "leitura" | "pessoas" | "visita" | "reuniao"
  | "documento" | "produto" | "conteudo" | "script"
  | "sistema" | "processo";

export interface Task {
  id: string;
  title: string;
  subtitle: string;
  type: TaskType;
}

export interface TaskGroup {
  label: string | null;
  tasks: Task[];
}

export interface TrainingModule {
  id: string;
  number: string;
  title: string;
  description: string;
  groups: TaskGroup[];
}

export interface ProductItem {
  name: string;
  detail?: string;
}

export interface ProductCategory {
  id: string;
  title: string;
  items?: ProductItem[];
  units?: { name: string; items: string[] }[];
}

export const MODULES: TrainingModule[] = [
  {
    id: "mod-01",
    number: "01",
    title: "Onboarding",
    description: "Contexto, cultura e primeiras impressões do Nex",
    groups: [
      {
        label: "Contexto & Cultura",
        tasks: [
          { id: "t01", title: "Breve história do Nex", subtitle: "Entenda de onde viemos e para onde vamos", type: "leitura" },
          { id: "t02", title: "Conhecer o time", subtitle: "Perfis e contatos de toda a equipe Nex", type: "pessoas" },
        ],
      },
      {
        label: "Visitas às Unidades",
        tasks: [
          { id: "t03", title: "Visita à unidade Nex Casa de Pedra", subtitle: "Conheça o espaço e os detalhes da unidade", type: "visita" },
          { id: "t04", title: "Visita à unidade Nex Francisco Rocha", subtitle: "Conheça o espaço e os detalhes da unidade", type: "visita" },
          { id: "t05", title: "Visita à unidade The Coffee", subtitle: "Conheça o café e a parceria com o Nex", type: "visita" },
        ],
      },
      {
        label: "Contexto Operacional",
        tasks: [
          { id: "t06", title: "Sobre os eventos do Nex", subtitle: "Calendário, formatos e como os eventos funcionam", type: "leitura" },
          { id: "t07", title: "Conversa com o André — Fundador", subtitle: "Alinhamento de visão com o fundador do Nex", type: "reuniao" },
        ],
      },
    ],
  },
  {
    id: "mod-02",
    number: "02",
    title: "Nex — Companhia",
    description: "Marca, cultura e posicionamento da empresa",
    groups: [
      {
        label: null,
        tasks: [
          { id: "t08", title: "Brandbook", subtitle: "Identidade visual, uso da marca e guidelines", type: "documento" },
          { id: "t09", title: "Código de Cultura", subtitle: "Valores, comportamentos e a forma de ser Nex", type: "documento" },
          { id: "t10", title: "Sobre Nex House", subtitle: "O produto residencial do ecossistema Nex", type: "produto" },
          { id: "t11", title: "Redes Sociais do Nex", subtitle: "Canais, tom de voz e estratégia de conteúdo", type: "conteudo" },
          { id: "t12", title: "Portfólio de Produtos Nex", subtitle: "Todos os produtos e serviços oferecidos", type: "produto" },
        ],
      },
    ],
  },
  {
    id: "mod-03",
    number: "03",
    title: "Marketing & Vendas",
    description: "Processos, ferramentas e estratégias comerciais",
    groups: [
      {
        label: "Playbooks & Scripts",
        tasks: [
          { id: "t13", title: "Playbook Comercial", subtitle: "Processo de vendas, objeções e técnicas", type: "documento" },
          { id: "t14", title: "Playbook de Comunicação", subtitle: "Guia de tom de voz e comunicação da marca", type: "documento" },
          { id: "t15", title: "Script Comercial", subtitle: "Roteiro de abordagem e qualificação de leads", type: "script" },
        ],
      },
      {
        label: "Ferramentas & Processos",
        tasks: [
          { id: "t16", title: "Softwares", subtitle: "Ferramentas, acessos e como usamos cada sistema", type: "sistema" },
          { id: "t17", title: "Fluxos de Qualificação", subtitle: "Processo de qualificação e acompanhamento de leads", type: "processo" },
          { id: "t18", title: "Contratos, Apresentações e Propostas", subtitle: "Templates e guias para documentação comercial", type: "documento" },
        ],
      },
      {
        label: "Parcerias & Influência",
        tasks: [
          { id: "t19", title: "Time de Influenciadores", subtitle: "Rede de parceiros e estratégia de influência", type: "pessoas" },
          { id: "t20", title: "Parceiros da Área", subtitle: "Empresas e profissionais parceiros do Nex", type: "documento" },
        ],
      },
    ],
  },
  {
    id: "mod-04",
    number: "04",
    title: "Financeiro & Hospitalidade",
    description: "Operações financeiras e experiência do cliente",
    groups: [
      {
        label: null,
        tasks: [
          { id: "t21", title: "Área Financeira", subtitle: "Processos, fluxo de caixa e indicadores financeiros", type: "processo" },
          { id: "t22", title: "Área de Hospitalidade (operações)", subtitle: "Padrões de atendimento e experiência do cliente", type: "processo" },
        ],
      },
    ],
  },
];

export const TOTAL_TASKS = MODULES.flatMap((m) =>
  m.groups.flatMap((g) => g.tasks)
).length;

export const PORTFOLIO: ProductCategory[] = [
  {
    id: "escritorios",
    title: "Escritórios Mobiliados",
    items: [
      { name: "Escritório Privativo" },
      { name: "Mesa Fixa de Trabalho" },
    ],
  },
  {
    id: "coworking",
    title: "Coworking",
    items: [
      { name: "Diária de Trabalho" },
      { name: "Pacote de Diárias" },
      { name: "Diária em Escritório Privativo" },
    ],
  },
  {
    id: "salas",
    title: "Salas de Reunião",
    units: [
      { name: "Unidade Francisco Rocha", items: ["R1", "R2", "R3", "R4", "C1", "C2"] },
      { name: "Unidade Casa de Pedra", items: ["R1", "R2", "R3"] },
    ],
  },
  {
    id: "nexhouse",
    title: "Assinatura Nex House",
    items: [
      { name: "Atrium", detail: "Acesso ilimitado seg–sex · R$ 712/mês" },
      { name: "Gallery", detail: "10 acessos/mês · R$ 512/mês" },
    ],
  },
  {
    id: "virtual",
    title: "Escritório Virtual",
    items: [
      { name: "Endereço Fiscal" },
      { name: "Endereço Comercial" },
    ],
  },
  {
    id: "variados",
    title: "Variados",
    items: [
      { name: "Hora de Fotografia" },
      { name: "Hora de Gravação" },
    ],
  },
  {
    id: "thecoffee",
    title: "The Coffee",
    items: [{ name: "Cafés Especiais" }],
  },
];
