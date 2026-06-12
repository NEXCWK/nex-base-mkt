"use client";

import { FileUpload } from "@/components/upload/FileUpload";
import { cn } from "@/lib/utils";

// ─── Unit helpers ─────────────────────────────────────────────────────────────

type Unit = "fco" | "cpe" | "both";

function UnitDot({ unit, className }: { unit: Unit; className?: string }) {
  return (
    <span
      className={cn("inline-block w-2.5 h-2.5 rounded-full shrink-0", className)}
      style={
        unit === "fco"
          ? { background: "#000" }
          : unit === "cpe"
            ? { background: "hsl(var(--accent))", border: "1.5px solid #cca800" }
            : { background: "linear-gradient(135deg,#000 50%,hsl(var(--accent)) 50%)", border: "1px solid #afafac" }
      }
    />
  );
}

function Section({
  number, title, unit, children, intro,
}: {
  number: string;
  title: string;
  unit?: Unit;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="py-10 border-b border-gray-medium">
      <div className="flex items-baseline gap-3 mb-1">
        <span className="text-[11px] font-bold tracking-widest text-muted-foreground/60 uppercase w-7">{number}</span>
        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
          {title}
          {unit && <UnitDot unit={unit} />}
        </h2>
      </div>
      {intro && <p className="text-sm text-muted-foreground mb-6 ml-10 max-w-2xl">{intro}</p>}
      <div className={cn(!intro && "mt-6")}>{children}</div>
    </section>
  );
}

// ─── Cards ────────────────────────────────────────────────────────────────────

function ProductCard({
  label, title, desc, price, priceUnit, priceAlt, badge, info, dark, accent,
}: {
  label: string;
  title: string;
  desc?: string;
  price?: string;
  priceUnit?: string;
  priceAlt?: string;
  badge?: string;
  info?: string[];
  dark?: boolean;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative rounded-xl border p-6 flex flex-col overflow-hidden",
        dark ? "bg-black border-black text-white" : "bg-white border-gray-medium"
      )}
    >
      <span
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={{ background: dark || accent ? "hsl(var(--accent))" : "#ebebea" }}
      />
      <p className={cn("text-[10px] font-bold tracking-widest uppercase mb-2.5", dark ? "text-white/40" : "text-muted-foreground/60")}>
        {label}
      </p>
      <p className="text-[17px] font-semibold tracking-tight mb-1.5">{title}</p>
      {desc && <p className={cn("text-[13px] leading-relaxed mb-5 flex-1", dark ? "text-white/60" : "text-muted-foreground")}>{desc}</p>}

      {price && (
        <div className={cn("border-t pt-4 flex flex-col gap-1.5", dark ? "border-white/15" : "border-gray-medium")}>
          <div className="flex items-baseline gap-1">
            <span className={cn("text-[13px] font-medium", dark ? "text-white/50" : "text-muted-foreground")}>R$</span>
            <span className="text-[28px] font-bold tracking-tight leading-none">{price}</span>
            {priceUnit && <span className={cn("text-xs", dark ? "text-white/50" : "text-muted-foreground")}>{priceUnit}</span>}
          </div>
          {priceAlt && <p className={cn("text-xs", dark ? "text-white/50" : "text-muted-foreground")}>{priceAlt}</p>}
          {badge && (
            <span className="inline-flex w-fit items-center bg-accent text-black text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded mt-1">
              {badge}
            </span>
          )}
        </div>
      )}

      {info && info.length > 0 && (
        <div className="flex flex-col gap-1.5 mt-3">
          {info.map((line) => (
            <div key={line} className={cn("flex items-start gap-2 text-[12.5px] leading-snug", dark ? "text-white/60" : "text-muted-foreground")}>
              <span className="w-1 h-1 rounded-full bg-accent mt-[7px] shrink-0" />
              {line}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PriceTable({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div className="bg-gray-light border border-gray-medium rounded-xl p-5">
      <p className="text-xs font-semibold tracking-wider uppercase mb-3 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
        {title}
      </p>
      <table className="w-full text-[13px]">
        <tbody>
          {rows.map(([k, v], i) => (
            <tr key={i} className={cn(i < rows.length - 1 && "border-b border-gray-medium/60")}>
              <td className="py-2 pr-3 text-gray-dark align-top">{k}</td>
              <td className="py-2 text-right font-semibold whitespace-nowrap">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RoomChip({ name, cap, highlight }: { name: string; cap: string; highlight?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium rounded-md px-2.5 py-1.5 border",
        highlight ? "border-accent bg-accent/10" : "border-gray-medium bg-gray-light"
      )}
    >
      {name}
      <span className="text-muted-foreground">{cap}</span>
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PortfolioPage() {
  return (
    <div className="max-w-5xl mx-auto px-8 py-8">
      {/* Header */}
      <header className="pb-6 border-b border-gray-medium">
        <p className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground mb-3 flex items-center gap-2">
          <span className="inline-block w-4 h-0.5 bg-accent" />
          Portfólio de produtos
        </p>
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <h1 className="text-4xl font-bold tracking-tight leading-none">
            Espaços, planos<br />&amp; serviços.
          </h1>
          <p className="text-sm text-muted-foreground max-w-[220px]">
            Produtos, preços e condições reunidos num lugar só.
          </p>
        </div>
      </header>

      {/* Unit legend */}
      <div className="flex gap-3 flex-wrap py-5 border-b border-gray-medium">
        {[
          { unit: "fco" as Unit, label: "Francisco Rocha (FCO)" },
          { unit: "cpe" as Unit, label: "Casa de Pedra — Nex House (CPE)" },
          { unit: "both" as Unit, label: "Ambas as unidades" },
        ].map((b) => (
          <span key={b.label} className="inline-flex items-center gap-2 text-xs font-medium bg-gray-light border border-gray-medium rounded-full px-3 py-1.5">
            <UnitDot unit={b.unit} />
            {b.label}
          </span>
        ))}
      </div>

      {/* 01 · Escritórios mobiliados */}
      <Section number="01" title="Escritórios mobiliados" unit="both">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ProductCard
            accent
            label="Escritório Privativo · Ambas as unidades"
            title="Escritório privativo"
            desc="Sala mobiliada, endereço comercial e infraestrutura pronta. Contrato direto com o Nex, sem fiador, sem obra, sem manutenção."
            price="1.300"
            priceUnit="– 1.500 / posição"
            priceAlt="Ticket médio por posição de trabalho"
            info={[
              "Contrato a partir de 6 meses",
              "Multa rescisória: 30% do saldo remanescente",
              "Pré-pago · Boleto ou Pix",
            ]}
          />
          <ProductCard
            label="Mesa Fixa · Exclusivo Francisco Rocha"
            title="Mesa fixa de trabalho"
            desc="Mesa reservada com acesso 24h. Você chega e já está no seu lugar, sem reservar todo dia."
            price="799"
            priceUnit="/ mês"
            info={[
              "Renovação mensal automática",
              "Cancelamento: aviso prévio de 30 dias",
              "Pré-pago · Boleto ou Pix",
            ]}
          />
        </div>
      </Section>

      {/* 02 · Assinatura Nex House */}
      <Section
        number="02"
        title="Assinatura Nex House"
        unit="cpe"
        intro="Disponível exclusivamente na unidade Casa de Pedra. Assinatura mensal ou anual com acesso ao espaço, café da manhã, Wi-Fi e salas de reunião por reserva."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <ProductCard
            dark
            label="Plano Atrium"
            title="Acesso ilimitado"
            desc="Entrada livre todos os dias úteis, dentro do horário comercial. Sem limite de uso mensal."
            price="890"
            priceUnit="/mês"
            priceAlt="Anual: R$ 712/mês · R$ 8.544 à vista"
            badge="20% de desconto no anual"
          />
          <ProductCard
            label="Plano Gallery"
            title="10 acessos por mês"
            desc="Dez entradas por mês. Para quem não vai todo dia, mas quer ter um plano fixo."
            price="640"
            priceUnit="/mês"
            priceAlt="Anual: R$ 512/mês · R$ 6.144 à vista"
            badge="20% de desconto no anual"
          />
        </div>
        <div className="flex items-center justify-between flex-wrap gap-4 bg-gray-light border border-gray-medium rounded-xl px-5 py-4">
          <div>
            <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground/60 mb-1">Day Pass · Casa de Pedra</p>
            <p className="text-base font-semibold">Diária avulsa</p>
            <p className="text-[13px] text-muted-foreground mt-0.5">Uma entrada no Nex House, sem precisar de assinatura.</p>
          </div>
          <div className="text-right">
            <div className="flex items-baseline gap-1 justify-end">
              <span className="text-[13px] text-muted-foreground">R$</span>
              <span className="text-3xl font-bold tracking-tight">130</span>
            </div>
            <p className="text-xs text-muted-foreground">por dia</p>
          </div>
        </div>
      </Section>

      {/* 03 · Salas & diárias */}
      <Section number="03" title="Salas de reunião & diárias">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white border border-gray-medium rounded-xl p-6">
            <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground/60 mb-2">Salas de reunião · Francisco Rocha</p>
            <p className="text-[17px] font-semibold mb-3">Unidade FCO</p>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-[13px] text-muted-foreground">R$</span>
              <span className="text-[28px] font-bold tracking-tight leading-none">99</span>
              <span className="text-xs text-muted-foreground">/ hora</span>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Sala R3: R$ 120,00/hora</p>
            <div className="flex flex-wrap gap-2">
              <RoomChip name="R1" cap="8 pos." />
              <RoomChip name="R2" cap="6 pos." />
              <RoomChip name="R3" cap="12 pos. · R$ 120" highlight />
              <RoomChip name="R4" cap="4 pos." />
              <RoomChip name="C1" cap="3 pos." />
              <RoomChip name="C2" cap="5 pos." />
            </div>
          </div>
          <div className="bg-white border border-gray-medium rounded-xl p-6">
            <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground/60 mb-2">Salas de reunião · Nex House CPE</p>
            <p className="text-[17px] font-semibold mb-3">Unidade Nex House</p>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-[13px] text-muted-foreground">R$</span>
              <span className="text-[28px] font-bold tracking-tight leading-none">110</span>
              <span className="text-xs text-muted-foreground">/ hora</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <RoomChip name="R1" cap="4 pos." />
              <RoomChip name="R2" cap="8 pos." />
              <RoomChip name="R3" cap="6 pos." />
            </div>
          </div>
        </div>

        <div className="w-10 h-[3px] bg-accent rounded mb-5" />
        <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-3">Pacotes de 10 horas</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <PriceTable title="Nex House" rows={[["Visitante", "R$ 799,00"], ["Contrato", "R$ 679,00"]]} />
          <PriceTable title="Francisco Rocha" rows={[["Visitante", "R$ 669,00"], ["Contrato", "R$ 569,00"]]} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ProductCard
            label="Diária de trabalho · Exclusivo FCO"
            title="Diária de trabalho"
            desc="Um dia de trabalho no Francisco Rocha. Sem assinatura."
            price="99"
            priceUnit="/ dia"
          />
          <PriceTable
            title="Pacote de diárias · FCO — 10 unidades"
            rows={[["Visitante", "R$ 693,00"], ["Contrato", "R$ 589,00"]]}
          />
        </div>
      </Section>

      {/* 04 · Eventos */}
      <Section
        number="04"
        title="Eventos corporativos"
        unit="both"
        intro="Auditório para offsites, treinamentos e reuniões de equipe. Reserva por período (até 4h) ou diária de 10h."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ProductCard label="Auditório · Período" title="Até 4 horas" price="910" />
          <ProductCard accent label="Auditório · Diária" title="Diária de 10 horas" price="1.640" />
        </div>
      </Section>

      {/* 05 · Escritório virtual */}
      <Section
        number="05"
        title="Escritório virtual"
        intro="Endereço comercial ou fiscal para uso em CNPJ, cartão de visita, correspondência e site. Sem custo de escritório físico."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-medium rounded-xl p-6">
            <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground/60 mb-2">Endereço Fiscal · Exclusivo Francisco Rocha</p>
            <p className="text-[17px] font-semibold mb-1.5">Endereço fiscal</p>
            <p className="text-[13px] text-muted-foreground mb-4">Endereço para registro de CNPJ e alvará. Disponível somente na unidade Francisco Rocha.</p>
            <PriceTable
              title="Modalidades"
              rows={[
                ["Mensal", "R$ 169,00"],
                ["Semestral · R$ 116,50/mês", "R$ 699,00"],
                ["Anual à vista · R$ 99,92/mês", "R$ 1.199,00"],
                ["Anual parcelado", "R$ 1.349,00"],
              ]}
            />
          </div>
          <div className="bg-white border border-gray-medium rounded-xl p-6">
            <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground/60 mb-2">Endereço Comercial · Ambas as unidades</p>
            <p className="text-[17px] font-semibold mb-1.5">Endereço comercial</p>
            <p className="text-[13px] text-muted-foreground mb-4">Endereço para correspondência, cartão de visita e site. Disponível nas duas unidades.</p>
            <PriceTable
              title="Modalidades"
              rows={[
                ["Mensal", "R$ 112,00"],
                ["Semestral · R$ 77,50/mês", "R$ 465,00"],
                ["Anual à vista · R$ 66,58/mês", "R$ 799,00"],
                ["Anual parcelado", "R$ 1.038,00"],
              ]}
            />
          </div>
        </div>
      </Section>

      {/* 06 · Produção de conteúdo */}
      <Section number="06" title="Produção de conteúdo" unit="both">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: "Foto", title: "Sessão fotográfica", desc: "Fotos no espaço Nex. Consulte disponibilidade de data.", price: "150" },
            { label: "Vídeo", title: "Sessão de filmagem", desc: "Filmagem no espaço Nex. Consulte disponibilidade de data.", price: "150" },
          ].map((c) => (
            <div key={c.label} className="flex items-center justify-between gap-4 border border-gray-medium rounded-xl px-5 py-4">
              <div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground/60 mb-1">{c.label}</p>
                <p className="text-base font-semibold">{c.title}</p>
                <p className="text-[13px] text-muted-foreground mt-0.5">{c.desc}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-muted-foreground">a partir de</p>
                <div className="flex items-baseline gap-1 justify-end">
                  <span className="text-[13px] text-muted-foreground">R$</span>
                  <span className="text-3xl font-bold tracking-tight">{c.price}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Serviços por unidade */}
      <Section number="↓" title="Serviços por unidade">
        <div className="flex flex-col gap-4">
          <div className="bg-gray-light rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[11px] font-bold tracking-widest uppercase bg-black text-white px-2.5 py-1 rounded-full">FCO</span>
              <div>
                <p className="text-[15px] font-semibold">Francisco Rocha</p>
                <p className="text-xs text-muted-foreground">Rua Francisco Rocha, 1285, Batel, Curitiba</p>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              {[
                "Escritório Privativo",
                "Mesa Fixa de Trabalho",
                "Salas de Reunião — R1 (8), R2 (6), R3 (12), R4 (4), C1 (3), C2 (5) · R$ 99/h / R3 R$ 120/h",
                "Diária de Trabalho — R$ 99/dia",
                "Eventos / Auditório",
                "Escritório Virtual — Endereço Fiscal e Comercial",
                "Produção de conteúdo (foto e vídeo)",
              ].map((s) => (
                <div key={s} className="flex items-center gap-2 text-[13px] bg-white border border-gray-medium rounded-lg px-3 py-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                  {s}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-light rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[11px] font-bold tracking-widest uppercase bg-accent text-black px-2.5 py-1 rounded-full">CPE</span>
              <div>
                <p className="text-[15px] font-semibold">Casa de Pedra — Nex House</p>
                <p className="text-xs text-muted-foreground">Al. Presidente Taunay, 130, Batel, Curitiba</p>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              {[
                "Escritório Privativo",
                "Assinatura Nex House — Atrium & Gallery",
                "Day Pass — R$ 130/dia",
                "Salas de Reunião — R1 (4), R2 (8), R3 (6) · R$ 110/h",
                "Eventos / Auditório",
                "Escritório Virtual — Endereço Comercial",
                "Produção de conteúdo (foto e vídeo)",
              ].map((s) => (
                <div key={s} className="flex items-center gap-2 text-[13px] bg-white border border-gray-medium rounded-lg px-3 py-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-black shrink-0" />
                  {s}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <p className="text-xs text-muted-foreground/70 py-6">
        Preços e condições podem mudar. Consulte disponibilidade. · Nex Coworking · Curitiba
      </p>

      {/* Materiais (upload) */}
      <div className="pt-2">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Materiais e apresentações
        </h2>
        <FileUpload section="Portfolio de Produtos" />
      </div>
    </div>
  );
}
