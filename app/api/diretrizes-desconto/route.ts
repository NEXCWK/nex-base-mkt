import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { promises as fs } from "fs";
import path from "path";

interface DiscountRule {
  condition: string;
  value: string;
}

interface ProductPolicy {
  id: string;
  product: string;
  profile: string;
  rules: DiscountRule[];
  freeText: string;
  note: string;
  noDiscount: boolean;
}

interface PermanentCampaign {
  id: string;
  name: string;
  objective: string;
  incentive: string;
  kickoff: string;
  responsible: string;
  channel: string;
}

interface Pillar {
  title: string;
  description: string;
}

interface DiscountGuidelines {
  overview: string;
  pillars: Pillar[];
  premises: string[];
  premisesNote: string;
  productPolicies: ProductPolicy[];
  campaigns: PermanentCampaign[];
  updatedAt: string;
}

const DATA_PATH = path.join(process.cwd(), "data", "diretrizes-desconto.json");

const DEFAULT_GUIDELINES: DiscountGuidelines = {
  overview:
    "As diretrizes de desconto são orientações para facilitar a aplicação de descontos em negociações específicas e garantir que o artifício seja utilizado de forma efetiva, nunca como padrão.\n\nDevem ser praticadas principalmente no final da jornada comercial e não devem sobrepor descontos já estruturados em outras regras de negócio e produtos.",
  pillars: [
    { title: "Não Depreciar", description: "Ações promocionais nunca devem depreciar o produto." },
    { title: "Não Criar Hábito", description: "A aplicação do desconto não deve se tornar um hábito." },
  ],
  premises: [
    "Há disponibilidade no curto prazo.",
    "O objetivo é motivar a venda em média e larga escala.",
    "O objetivo é resgatar leads considerados perdidos.",
    "Em situações específicas, para campanhas de fechamento planejadas e definidas com antecedência.",
  ],
  premisesNote:
    "De acordo com oportunidades de mercado, o time de Marketing & Vendas define e executa ações com a base de leads, como resgate de deals perdidos e fidelização com principais clientes. Essas ações seguem os Pilares e são realizadas de maneira autônoma.",
  productPolicies: [
    {
      id: "diarias-salas",
      product: "Diárias de Trabalho e Salas de Reunião",
      profile: "Perfil do lead: pessoa física, uso esporádico, baixo ticket médio, agendamentos no curto prazo.",
      rules: [
        { condition: "Agendamento no dia atual", value: "Até 20% de desconto" },
        { condition: "Agendamento na semana atual", value: "Até 10% de desconto" },
      ],
      freeText: "",
      note: "",
      noDiscount: false,
    },
    {
      id: "eventos",
      product: "Eventos",
      profile: "Perfil do lead: empresas, uso esporádico, agendamentos no médio e longo prazo, maior possibilidade de criar valor por meio dos diferenciais do Nex.",
      rules: [
        { condition: "Agendamento no dia atual", value: "Até 25% de desconto" },
        { condition: "Agendamento na semana atual", value: "Até 20% de desconto" },
        { condition: "Agendamento no mês atual", value: "Até 15% de desconto" },
        { condition: "De 2 a 4 diárias contratadas no mês", value: "Até 15% de desconto" },
        { condition: "Acima de 4 diárias contratadas no mês", value: "Até 25% de desconto" },
      ],
      freeText: "",
      note: "",
      noDiscount: false,
    },
    {
      id: "escritorio-virtual",
      product: "Escritório Virtual",
      profile: "Perfil do lead: empresas, uso contínuo, pouco sensível a atributos intangíveis, negociação direta e objetiva.",
      rules: [
        { condition: "De 2 a 4 escritórios", value: "10% nas modalidades semestral e anual" },
        { condition: "De 5 a 8 escritórios", value: "15% nas modalidades semestral e anual" },
        { condition: "Acima de 8 escritórios", value: "20% nas modalidades semestral e anual" },
      ],
      freeText: "",
      note: "O desconto é aplicado somente na primeira semestralidade ou anualidade.",
      noDiscount: false,
    },
    {
      id: "escritorio-privativo",
      product: "Escritório Privativo e Mesa Fixa de Trabalho",
      profile: "Perfil do lead: empresas, negociações para médio e longo prazo, maior possibilidade de criar valor por meio dos diferenciais do Nex.",
      rules: [],
      freeText: "Sem política fixa. Os descontos seguem definição estratégica comunicada a cada início de mês e podem ser alterados somente na finalização da negociação, de acordo com o movimento estratégico do Closer.",
      note: "",
      noDiscount: false,
    },
    {
      id: "nex-house",
      product: "Assinatura Nex House",
      profile: "Perfil do lead: pessoas físicas e empresas, assinatura de clube contemporâneo, produto de alto valor aspiracional.",
      rules: [],
      freeText: "A Assinatura Nex House não possui política de desconto. Nenhum desconto deve ser aplicado ou negociado para esse produto, sob qualquer circunstância.",
      note: "",
      noDiscount: true,
    },
  ],
  campaigns: [
    {
      id: "precificacao-2a-6a",
      name: "Precificação 2ª e 6ª",
      objective: "Reduzir vacância nos dias de menor demanda.",
      incentive: "30% de desconto aplicado automaticamente às segundas e sextas-feiras. Sem voucher ou código necessário.",
      kickoff: "15/05/2026, duração contínua.",
      responsible: "Time Comercial e Hospitalidade.",
      channel: "Aplicado automaticamente no sistema de reservas.",
    },
    {
      id: "off-peak",
      name: "Desconto Off-Peak",
      objective: "Estimular reservas nos horários de menor ocupação.",
      incentive: "30% de desconto nos horários das 13h às 14h30 e das 17h às 19h.",
      kickoff: "15/05/2026, duração contínua.",
      responsible: "Time Comercial e Hospitalidade.",
      channel: "Aplicado no sistema de reservas.",
    },
    {
      id: "bundle-3-1",
      name: "Bundle 3+1",
      objective: "Aumentar o tempo médio de uso por reserva.",
      incentive: "Contratando 3 horas, a 4ª sai com 50% de desconto (R$ 52,50 pela 4ª hora).",
      kickoff: "15/05/2026, duração contínua.",
      responsible: "Time Comercial e Hospitalidade.",
      channel: "Aplicado no sistema de reservas.",
    },
    {
      id: "day-pass-sala",
      name: "Day Pass + Sala",
      objective: "Incentivar o uso combinado de diária e sala de reunião.",
      incentive: "50% de desconto nas 2 primeiras horas de sala para quem contrata o Day Pass. Válido no mesmo dia da diária.",
      kickoff: "15/05/2026.",
      responsible: "Time Comercial e Hospitalidade.",
      channel: "Condição disponível nas plataformas de venda e comunicação ativa.",
    },
    {
      id: "last-minute-call",
      name: "Last Minute Call",
      objective: "Maximizar a ocupação diária do espaço.",
      incentive: "20% de desconto para reservas realizadas no mesmo dia.",
      kickoff: "15/05/2026, duração contínua.",
      responsible: "Time Comercial e Hospitalidade.",
      channel: "Condição disponível nas plataformas de venda e comunicação ativa.",
    },
  ],
  updatedAt: "2026-01-01T00:00:00.000Z",
};

async function readGuidelines(): Promise<DiscountGuidelines> {
  try {
    return JSON.parse(await fs.readFile(DATA_PATH, "utf-8"));
  } catch {
    await writeGuidelines(DEFAULT_GUIDELINES);
    return DEFAULT_GUIDELINES;
  }
}

async function writeGuidelines(data: DiscountGuidelines) {
  await fs.mkdir(path.join(process.cwd(), "data"), { recursive: true });
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2));
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await readGuidelines());
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json()) as Partial<DiscountGuidelines>;
  const current = await readGuidelines();
  const updated: DiscountGuidelines = {
    overview: body.overview ?? current.overview,
    pillars: body.pillars ?? current.pillars,
    premises: body.premises ?? current.premises,
    premisesNote: body.premisesNote ?? current.premisesNote,
    productPolicies: body.productPolicies ?? current.productPolicies,
    campaigns: body.campaigns ?? current.campaigns,
    updatedAt: new Date().toISOString(),
  };
  await writeGuidelines(updated);
  return NextResponse.json(updated);
}
