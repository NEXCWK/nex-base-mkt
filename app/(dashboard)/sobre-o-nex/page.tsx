"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { FileUpload } from "@/components/upload/FileUpload";
import {
  Users, Heart, Compass, Layers, Share2, Leaf,
  MapPin, Phone,
} from "lucide-react";

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS = [
  { id: "historia", label: "História do Nex" },
  { id: "manifesto", label: "Manifesto e Posicionamento" },
  { id: "brandbook", label: "BrandBook" },
  { id: "codigo-de-cultura", label: "Codigo de Cultura" },
  { id: "midia-kit", label: "Midia Kit" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const FILE_UPLOAD_TABS: TabId[] = ["brandbook", "codigo-de-cultura", "midia-kit"];

const FILE_LABELS: Record<string, string> = {
  "brandbook": "BrandBook",
  "codigo-de-cultura": "Codigo de Cultura",
  "midia-kit": "Midia Kit",
};

// ─── História do Nex ─────────────────────────────────────────────────────────

const TIMELINE = [
  {
    year: "2011",
    title: "Uma sala. Uma ideia. Uma aposta.",
    text: "O Nex começou pequeno, de propósito. André Pegorer fundou a empresa em uma sala comercial na Rua Comendador Araújo, no centro de Curitiba. O espaço era compacto, mas a ideia era grande: criar um lugar onde trabalhar de verdade fosse possível, sem o peso de um contrato de escritório convencional.",
  },
  {
    year: "2014",
    title: "A maior unidade de coworking de Curitiba.",
    text: "Três anos depois, o Nex deu o salto que mudou sua escala. A unidade da Francisco Rocha abriu com mais de 40 escritórios privativos, salas de reunião, auditório para eventos e uma série de ambientes pensados tanto para o foco quanto para o encontro. A sede que existe até hoje.",
    highlight: true,
  },
  {
    year: "2016",
    title: "O Rio de Janeiro entra no mapa.",
    text: "O Nex chegou ao Rio. A unidade no bairro da Glória era ainda maior do que a de Curitiba, em um espaço que combinava escala e identidade. Durante cinco anos, o Nex operou no Rio construindo a mesma experiência que aprendera a fazer em Curitiba.",
  },
  {
    year: "2021",
    title: "Curitiba ganha uma segunda casa. E o Nex ganha uma nova linguagem.",
    text: "Dois movimentos no mesmo ano. A unidade do Rio encerrou seu ciclo. E a Casa de Pedra abriu, no imóvel mais icônico de Curitiba. Jardins, arte e um conceito novo de espaço de trabalho. Não era só mais um endereço: era outra maneira de pensar o que um coworking pode ser.",
  },
  {
    year: "2022",
    title: "A experiência entra no cardápio.",
    text: "A The Coffee chegou à Casa de Pedra. Com ela, o Nex entrou no ramo de alimentos e bebidas, expandindo o que o espaço oferece para além do trabalho. Uma xícara de café se tornou parte do dia de quem passa por aqui.",
  },
  {
    year: "2025",
    title: "Nex House. Um novo capítulo.",
    text: "Em 2025, a Casa de Pedra ganhou um nome novo e uma visão mais clara: Nex House. Um coworking com experiência, arte, A&B e encontros com profissionais, tudo em um ambiente que vai além do espaço físico. As assinaturas flexíveis chegaram junto, abrindo uma nova forma de fazer parte do Nex.",
    isNew: true,
  },
  {
    year: "Hoje",
    title: "Mais de 1.100 clientes. Duas unidades. E apenas o começo.",
    text: "O Nex tem hoje duas unidades ativas em Curitiba, mais de 1.100 clientes com contrato entre escritório virtual, assinaturas e posições fixas, e milhares de clientes avulsos em salas de reunião, diárias e eventos. O trabalho que começou em uma sala pequena na Comendador Araújo virou algo que muita gente chama de casa.\n\nE isso é apenas o começo do que estamos construindo.",
    isToday: true,
  },
];

function HistoriaTab() {
  return (
    <div className="max-w-2xl">
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[22px] top-0 bottom-0 w-px bg-gray-medium" />

        <div className="space-y-10">
          {TIMELINE.map((item, i) => (
            <div key={item.year} className="relative flex gap-6">
              {/* Year node */}
              <div className="shrink-0 flex flex-col items-center" style={{ width: 44 }}>
                <div
                  className={cn(
                    "relative z-10 flex items-center justify-center rounded-full font-bold text-xs border-2 border-white shadow-sm",
                    item.isToday
                      ? "w-11 h-11 text-black"
                      : item.highlight
                        ? "w-10 h-10 text-black"
                        : "w-9 h-9 text-black"
                  )}
                  style={{ backgroundColor: "#FFD400" }}
                >
                  {item.isToday ? "●" : item.year.slice(-2)}
                </div>
              </div>

              {/* Content */}
              <div className={cn("pb-2", i === TIMELINE.length - 1 ? "" : "")}>
                <div className="flex items-baseline gap-3 mb-1.5">
                  <span
                    className="text-sm font-bold tracking-wide"
                    style={{ color: "#FFD400", textShadow: "0 0 0 #000", WebkitTextStroke: "0.5px #b8980a" }}
                  >
                    {item.year}
                  </span>
                  {item.isNew && (
                    <span className="text-[10px] font-semibold uppercase tracking-widest bg-black text-white px-2 py-0.5 rounded-full">
                      novo
                    </span>
                  )}
                </div>
                <h3 className={cn(
                  "font-bold leading-snug mb-2 text-black",
                  item.highlight ? "text-xl" : "text-base"
                )}>
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {item.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Manifesto e Posicionamento ───────────────────────────────────────────────

const PILLARS = [
  { icon: Users, name: "Pessoas", sub: "a nossa inspiração", desc: "Antes de qualquer cargo ou função, queremos saber quem você é." },
  { icon: Heart, name: "Felicidade no Trabalho", sub: "o nosso propósito", desc: "Afeto é o que dá alma à nossa experiência." },
  { icon: Compass, name: "Protagonismo", sub: "a nossa jornada", desc: "Somos desbravadores do nosso próprio caminho." },
  { icon: Layers, name: "Diversidade", sub: "o nosso compromisso", desc: "Celebramos a diversidade, sempre." },
  { icon: Share2, name: "Interdependência", sub: "a nossa base", desc: "Um time colaborativo, integrado e orgânico." },
  { icon: Leaf, name: "Legado", sub: "a nossa responsabilidade", desc: "Acreditamos em um futuro melhor." },
];

const ESPACOS = [
  {
    title: "Espaços inspiradores fazem empresas inovadoras.",
    text: "Não importa se você está começando agora ou integra o time de uma empresa maior. Criamos uma atmosfera que inspira o fazer bem feito, estimula conversas produtivas e convida à inovação.",
  },
  {
    title: "O tempo nos escritórios pode ser melhor aproveitado.",
    text: "Estar perto de pessoas com visões de mundo diferentes, em um time ou numa comunidade empreendedora, faz crescer um pouco todo dia. A gente evolui, expande e gera resultados.",
  },
  {
    title: "Toda comunidade tem uma força poderosa de crescimento.",
    text: "E se a pessoa ao lado for a conexão que faltava entre você e a próxima conquista? Isso acontece aqui com frequência. Gente que se aproxima, soma habilidades e cresce junto.",
  },
];

const UNIDADES = [
  {
    name: "Francisco Rocha",
    address: "R. Francisco Rocha, 198 — Batel, Curitiba PR",
    phone: "+55 41 3122-8801",
  },
  {
    name: "Nex House Casa de Pedra",
    address: "Al. Presidente Taunay, 130 — Curitiba PR",
    phone: "+55 41 3122-8801",
  },
];

const MANIFESTO = `Um dia, passamos a acreditar na ligação entre o que somos e o que fazemos.

Passamos tempo demais no escritório para admitir que esse tempo pudesse ser ruim ou insignificante. Então mudamos a relação. Colocamos vida em cada projeto, nos conectamos com cada cliente, vimos cada reunião como uma oportunidade real de gerar algo que importa.

Acreditamos em um movimento que se importa com as pessoas e com o mundo, e entendemos que temos papel nisso. Queremos fazer parte de uma sociedade mais justa e plural. Todo dia nos questionamos e nos desafiamos a fazer mais.

O individualismo nos atrapalhava, e aprendemos a nos conectar. Encontramos novos ambientes de trabalho e descobrimos que estar perto de pessoas com visões diferentes, num time ou numa comunidade, faz com que a gente cresça um pouco a cada dia.

A gente se diverte. Expande fronteiras. Gera resultados.

Aprendemos a empreender, seja começando algo do zero ou fazendo parte de um time onde arriscar e inovar sejam possíveis. Somos pessoas curiosas, que seguem em frente juntas. E somos felizes por isso.

Mudamos a nossa relação com o trabalho. E isso é apenas o começo de tudo o que estamos construindo com o mundo.`;

function ManifestoTab() {
  return (
    <div className="max-w-3xl space-y-16">

      {/* Propósito central */}
      <div className="text-center py-8">
        <p className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight text-black">
          Felicidade no trabalho.
        </p>
        <p className="mt-4 text-base text-muted-foreground leading-relaxed max-w-lg mx-auto">
          Quando o ser e o fazer não são coisas separadas, o trabalho deixa de ser obrigação. Vira propósito. Isso é o que move o Nex e o que move as pessoas que escolhem estar aqui.
        </p>
      </div>

      {/* Pilares */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6">
          Os seis pilares
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-gray-medium rounded-xl overflow-hidden border border-gray-medium">
          {PILLARS.map(({ icon: Icon, name, sub, desc }) => (
            <div key={name} className="bg-white p-5 flex flex-col gap-3">
              <Icon size={20} className="text-muted-foreground" strokeWidth={1.5} />
              <div>
                <p className="text-sm font-bold leading-snug" style={{ color: "#b8980a" }}>
                  {name}
                </p>
                <p className="text-[11px] text-muted-foreground italic mt-0.5">{sub}</p>
              </div>
              <p className="text-xs text-gray-dark leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Manifesto */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6">
          O manifesto
        </h2>
        <div className="space-y-5">
          {MANIFESTO.split("\n\n").map((para, i) => (
            <p
              key={i}
              className={cn(
                "leading-[1.8] text-black",
                i === 0 ? "text-base font-medium" : "text-[15px]"
              )}
            >
              {para}
            </p>
          ))}
        </div>
      </div>

      {/* Espaços que Inspiram */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6">
          Espaços que inspiram
        </h2>
        <div className="space-y-6">
          {ESPACOS.map(({ title, text }, i) => (
            <div key={i} className="border-l-2 pl-5" style={{ borderColor: "#FFD400" }}>
              <p className="text-sm font-semibold text-black mb-1.5">{title}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Unidades */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6">
          Unidades
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {UNIDADES.map(({ name, address, phone }) => (
            <div
              key={name}
              className="rounded-xl p-5 border border-gray-medium"
              style={{ backgroundColor: "#F5F5F5" }}
            >
              <p className="text-sm font-bold text-black mb-3">{name}</p>
              <div className="space-y-1.5">
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <MapPin size={12} className="mt-0.5 shrink-0" />
                  <span>{address}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Phone size={12} className="shrink-0" />
                  <span>{phone}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SobreONexPage() {
  const [activeTab, setActiveTab] = useState<TabId>("historia");

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Sobre o Nex</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          História, identidade e materiais institucionais da empresa.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-medium mb-8">
        <nav className="flex gap-1 flex-wrap" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium rounded-t-md transition-colors relative -mb-px whitespace-nowrap",
                activeTab === tab.id
                  ? "text-black border-b-2 border-black"
                  : "text-muted-foreground hover:text-black hover:bg-gray-light"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {activeTab === "historia" && <HistoriaTab />}
      {activeTab === "manifesto" && <ManifestoTab />}
      {FILE_UPLOAD_TABS.includes(activeTab) && (
        <div>
          <div className="mb-4">
            <h2 className="text-base font-semibold text-black">{FILE_LABELS[activeTab]}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Arquivos relacionados a {FILE_LABELS[activeTab]}.
            </p>
          </div>
          <FileUpload
            key={activeTab}
            section="Sobre o Nex"
            category={FILE_LABELS[activeTab]}
            label={FILE_LABELS[activeTab]}
          />
        </div>
      )}
    </div>
  );
}
