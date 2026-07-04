import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { promises as fs } from "fs";
import path from "path";

interface CadenciaRule {
  id: string;
  title: string;
  description: string;
  tag: string;
}

interface FlowStep {
  id: string;
  title: string;
  description: string;
  optional: boolean;
  badge: string;
}

interface RoleCard {
  id: string;
  tag: string;
  description: string;
}

interface CadenciaCampanhas {
  subtitle: string;
  rulesIntro: string;
  rules: CadenciaRule[];
  whyIntro: string;
  whyParagraphs: string[];
  flowIntro: string;
  flowSteps: FlowStep[];
  rolesIntro: string;
  roles: RoleCard[];
  footerNote: string;
  updatedAt: string;
}

const DATA_PATH = path.join(process.cwd(), "data", "cadencia-campanhas.json");

const DEFAULT_DATA: CadenciaCampanhas = {
  subtitle:
    "Como o Nex decide, aprova e executa cada campanha de fechamento: os limites que protegem a marca e o passo a passo que leva uma condição especial do briefing até o site.",
  rulesIntro:
    "Quatro regras sustentam qualquer condição comercial que sai do Nex. Elas não existem para burocratizar o processo, mas para manter o desconto como ferramenta estratégica, não como hábito.",
  rules: [
    {
      id: "regra-1",
      title: "Até três campanhas por mês",
      description:
        "O mês comporta no máximo três campanhas de fechamento rodando ao mesmo tempo. Esse teto existe porque escassez real é o que sustenta o valor de uma oferta. Quando a condição especial aparece toda semana, ela deixa de ser especial e vira, na prática, o novo preço de tabela.",
      tag: "",
    },
    {
      id: "regra-2",
      title: "Teto de 25% de desconto",
      description:
        "Nenhuma campanha ultrapassa 25% sem passar por aprovação. Acima disso, a decisão sobe para a Reunião Estratégica de Diretores (TT), porque um desconto fora da curva afeta diretamente a margem e o resultado do mês, não só a régua daquela campanha.",
      tag: "Acima de 25% → aprovação em TT",
    },
    {
      id: "regra-3",
      title: "Reunião do dia 15",
      description:
        "Todo dia 15, marketing e vendas se sentam juntos para definir as condições comerciais do mês seguinte. A pauta parte da necessidade real: ritmo de fechamento, sazonalidade, ocupação e o que o momento comercial está pedindo.",
      tag: "",
    },
    {
      id: "regra-4",
      title: "Datas especiais, planejamento antecipado",
      description:
        "Datas com peso próprio, como Black Friday, não seguem o ciclo mensal. Elas entram no calendário com bem mais antecedência, porque pedem mais do que desconto: peça criativa robusta, mídia paga, alinhamento fino com vendas e, muitas vezes, negociação com parceiros.",
      tag: "",
    },
  ],
  whyIntro: "Cada limite carrega uma lógica de mercado por trás, não é arbitrário.",
  whyParagraphs: [
    "Escassez percebida é diferente de escassez fabricada. Quando uma condição especial é rara, ela pesa de verdade na decisão do cliente. Quando vira rotina, o cérebro do consumidor simplesmente reclassifica aquele desconto como preço normal, e a marca perde a ferramenta sem perceber. Limitar o número de campanhas por mês é uma forma de manter essa escassez honesta.",
    "O teto de desconto cumpre uma função parecida, só que do lado da margem. Um desconto alto demais tende a virar o único argumento de venda, o que enfraquece o resto do discurso comercial: atendimento, infraestrutura, localização, comunidade. Manter o teto em 25% obriga o time a vender valor antes de vender preço, e reserva a exceção para quando ela realmente se justifica.",
    "A governança da TT entra exatamente nesse ponto de exceção. Quando um desconto passa do teto, a decisão deixa de ser operacional e se torna estratégica, porque impacta o caixa do mês e o posicionamento de preço do Nex como um todo. Colocar essa decisão na mesa dos diretores garante que ela seja tomada com visão de negócio, não isoladamente por quem está fechando a venda naquele momento.",
    "Já a reunião do dia 15 e o planejamento antecipado de datas especiais resolvem outro problema: o de campanha reativa. Sem um ritual fixo de decisão, é comum que condições comerciais surjam de forma improvisada, sob pressão de meta. Fixar uma data no meio do mês para desenhar o mês seguinte, e reservar meses de antecedência para as datas grandes, transforma a criação de oferta em processo, não em urgência.",
  ],
  flowIntro:
    "Depois que a condição comercial é decidida, ela percorre um caminho fixo até chegar ao cliente. Os passos marcados como opcionais dependem do que a estratégia da campanha prevê.",
  flowSteps: [
    {
      id: "passo-1",
      title: "Definição das ações",
      description:
        "O time de marketing e vendas se reúne e decide o que vai para a rua: percentual de desconto, facilidades de pagamento e o período de vigência da campanha.",
      optional: false,
      badge: "",
    },
    {
      id: "passo-2",
      title: "Spec e copy-base",
      description:
        "A partir dessa decisão, o Marketing Ops produz a especificação técnica e o copy-base da ação: a referência de texto que vai orientar todas as peças seguintes.",
      optional: false,
      badge: "",
    },
    {
      id: "passo-3",
      title: "Landing page da campanha",
      description:
        "A página específica da ação é criada, também via Marketing Ops, com a oferta, as condições e a chamada para ação.",
      optional: false,
      badge: "",
    },
    {
      id: "passo-4",
      title: "Integração com RD Station",
      description:
        "A landing page é conectada ao RD Station. É essa integração que permite rastrear cada lead gerado e conduzir o funil com dados reais, não com estimativa.",
      optional: false,
      badge: "",
    },
    {
      id: "passo-5",
      title: "Criativos da campanha",
      description:
        "Os criativos (imagens, peças para redes, materiais de apoio) são produzidos via Marketing Ops, sempre alinhados ao copy-base definido na etapa 2.",
      optional: false,
      badge: "",
    },
    {
      id: "passo-6",
      title: "Veiculação em redes sociais",
      description:
        "Quando a estratégia da campanha contempla mídia social, a oferta vai ao ar no Instagram e no LinkedIn, com o formato adequado a cada canal.",
      optional: true,
      badge: "Se previsto na estratégia",
    },
    {
      id: "passo-7",
      title: "Disparo para a base",
      description:
        "E-mail marketing e WhatsApp levam a condição especial até a base de contatos já qualificada, quando esse canal faz parte do plano da campanha.",
      optional: true,
      badge: "Se previsto na estratégia",
    },
    {
      id: "passo-8",
      title: "Aviso visual no site",
      description:
        "Por fim, um aviso visual (ícone, dobra, faixa ou pop-up) sinaliza a campanha na página do site, garantindo que quem já está navegando também veja a condição vigente.",
      optional: false,
      badge: "",
    },
  ],
  rolesIntro: "Três frentes sustentam essa cadência, cada uma com uma responsabilidade clara.",
  roles: [
    {
      id: "role-mkt-vendas",
      tag: "Marketing & Vendas",
      description:
        "Decidem o que entra em campanha: desconto, facilidades e período. É essa dupla que se reúne no dia 15 e que enxerga, na prática, o que o mês está pedindo.",
    },
    {
      id: "role-mkt-ops",
      tag: "Marketing Ops",
      description:
        "Transforma a decisão em material: spec, copy-base, landing page e criativos. É o motor de execução técnica de cada campanha.",
    },
  ],
  footerNote:
    "Esta cadência se aplica às campanhas de fechamento recorrentes. Datas especiais com planejamento próprio seguem cronograma à parte, definido com antecedência maior que o ciclo mensal padrão.",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

async function readData(): Promise<CadenciaCampanhas> {
  try {
    return JSON.parse(await fs.readFile(DATA_PATH, "utf-8"));
  } catch {
    await writeData(DEFAULT_DATA);
    return DEFAULT_DATA;
  }
}

async function writeData(data: CadenciaCampanhas) {
  await fs.mkdir(path.join(process.cwd(), "data"), { recursive: true });
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2));
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await readData());
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json()) as Partial<CadenciaCampanhas>;
  const current = await readData();
  const updated: CadenciaCampanhas = {
    subtitle: body.subtitle ?? current.subtitle,
    rulesIntro: body.rulesIntro ?? current.rulesIntro,
    rules: body.rules ?? current.rules,
    whyIntro: body.whyIntro ?? current.whyIntro,
    whyParagraphs: body.whyParagraphs ?? current.whyParagraphs,
    flowIntro: body.flowIntro ?? current.flowIntro,
    flowSteps: body.flowSteps ?? current.flowSteps,
    rolesIntro: body.rolesIntro ?? current.rolesIntro,
    roles: body.roles ?? current.roles,
    footerNote: body.footerNote ?? current.footerNote,
    updatedAt: new Date().toISOString(),
  };
  await writeData(updated);
  return NextResponse.json(updated);
}
