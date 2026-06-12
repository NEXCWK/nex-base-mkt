"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Pencil, Plus, Trash2, ChevronUp, ChevronDown, Loader2, Check, X,
} from "lucide-react";
import { FileUpload } from "@/components/upload/FileUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────

type Unit = "fco" | "cpe" | "both";
type ItemType = "product" | "pricetable" | "infotable" | "rooms" | "banner" | "heading" | "unit";

interface Room { name: string; cap: string; highlight?: boolean }

interface Item {
  id: string;
  type: ItemType;
  full?: boolean;
  // product / banner / rooms / infotable shared
  label?: string;
  title?: string;
  desc?: string;
  price?: string;
  priceUnit?: string;
  priceAlt?: string;
  priceNote?: string;
  priceLabel?: string;
  badge?: string;
  variant?: "default" | "accent" | "dark";
  info?: string[];
  // tables
  tableTitle?: string;
  rows?: [string, string][];
  // rooms
  rooms?: Room[];
  // heading
  text?: string;
  divider?: boolean;
  // unit
  tag?: string;
  tagVariant?: "fco" | "cpe";
  name?: string;
  addr?: string;
  services?: string[];
}

interface Section {
  id: string;
  number: string;
  title: string;
  unit?: Unit;
  intro?: string;
  items: Item[];
}

const TYPE_LABELS: Record<ItemType, string> = {
  product: "Card de produto",
  pricetable: "Tabela de preços",
  infotable: "Card com tabela",
  rooms: "Salas de reunião",
  banner: "Faixa / banner",
  heading: "Subtítulo",
  unit: "Bloco de unidade",
};

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

// ─── Visual building blocks ─────────────────────────────────────────────────

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

function ProductCard({ item }: { item: Item }) {
  const dark = item.variant === "dark";
  const accent = item.variant === "accent";
  return (
    <div className={cn("relative rounded-xl border p-6 flex flex-col overflow-hidden h-full", dark ? "bg-black border-black text-white" : "bg-white border-gray-medium")}>
      <span className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: dark || accent ? "hsl(var(--accent))" : "#ebebea" }} />
      {item.label && (
        <p className={cn("text-[10px] font-bold tracking-widest uppercase mb-2.5", dark ? "text-white/40" : "text-muted-foreground/60")}>{item.label}</p>
      )}
      {item.title && <p className="text-[17px] font-semibold tracking-tight mb-1.5">{item.title}</p>}
      {item.desc && <p className={cn("text-[13px] leading-relaxed mb-5 flex-1", dark ? "text-white/60" : "text-muted-foreground")}>{item.desc}</p>}

      {item.price && (
        <div className={cn("border-t pt-4 flex flex-col gap-1.5", dark ? "border-white/15" : "border-gray-medium")}>
          <div className="flex items-baseline gap-1">
            <span className={cn("text-[13px] font-medium", dark ? "text-white/50" : "text-muted-foreground")}>R$</span>
            <span className="text-[28px] font-bold tracking-tight leading-none">{item.price}</span>
            {item.priceUnit && <span className={cn("text-xs", dark ? "text-white/50" : "text-muted-foreground")}>{item.priceUnit}</span>}
          </div>
          {item.priceAlt && <p className={cn("text-xs", dark ? "text-white/50" : "text-muted-foreground")}>{item.priceAlt}</p>}
          {item.badge && (
            <span className="inline-flex w-fit items-center bg-accent text-black text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded mt-1">{item.badge}</span>
          )}
        </div>
      )}

      {item.info && item.info.length > 0 && (
        <div className="flex flex-col gap-1.5 mt-3">
          {item.info.map((line, i) => (
            <div key={i} className={cn("flex items-start gap-2 text-[12.5px] leading-snug", dark ? "text-white/60" : "text-muted-foreground")}>
              <span className="w-1 h-1 rounded-full bg-accent mt-[7px] shrink-0" />
              {line}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PriceTableInner({ rows }: { rows: [string, string][] }) {
  return (
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
  );
}

function PriceTableCard({ item }: { item: Item }) {
  return (
    <div className="bg-gray-light border border-gray-medium rounded-xl p-5 h-full">
      {item.tableTitle && (
        <p className="text-xs font-semibold tracking-wider uppercase mb-3 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          {item.tableTitle}
        </p>
      )}
      <PriceTableInner rows={item.rows ?? []} />
    </div>
  );
}

function InfoTableCard({ item }: { item: Item }) {
  return (
    <div className="bg-white border border-gray-medium rounded-xl p-6 h-full">
      {item.label && <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground/60 mb-2">{item.label}</p>}
      {item.title && <p className="text-[17px] font-semibold mb-1.5">{item.title}</p>}
      {item.desc && <p className="text-[13px] text-muted-foreground mb-4">{item.desc}</p>}
      <PriceTableCard item={{ ...item, label: undefined, title: undefined, desc: undefined }} />
    </div>
  );
}

function RoomsCard({ item }: { item: Item }) {
  return (
    <div className="bg-white border border-gray-medium rounded-xl p-6 h-full">
      {item.label && <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground/60 mb-2">{item.label}</p>}
      {item.title && <p className="text-[17px] font-semibold mb-3">{item.title}</p>}
      {item.price && (
        <div className="flex items-baseline gap-1 mb-1">
          <span className="text-[13px] text-muted-foreground">R$</span>
          <span className="text-[28px] font-bold tracking-tight leading-none">{item.price}</span>
          {item.priceUnit && <span className="text-xs text-muted-foreground">{item.priceUnit}</span>}
        </div>
      )}
      {item.priceNote && <p className="text-xs text-muted-foreground mb-4">{item.priceNote}</p>}
      <div className={cn("flex flex-wrap gap-2", !item.priceNote && "mt-3")}>
        {(item.rooms ?? []).map((r, i) => (
          <span
            key={i}
            className={cn(
              "inline-flex items-center gap-1.5 text-xs font-medium rounded-md px-2.5 py-1.5 border",
              r.highlight ? "border-accent bg-accent/10" : "border-gray-medium bg-gray-light"
            )}
          >
            {r.name}
            <span className="text-muted-foreground">{r.cap}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function Banner({ item }: { item: Item }) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-4 bg-gray-light border border-gray-medium rounded-xl px-5 py-4 h-full">
      <div>
        {item.label && <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground/60 mb-1">{item.label}</p>}
        {item.title && <p className="text-base font-semibold">{item.title}</p>}
        {item.desc && <p className="text-[13px] text-muted-foreground mt-0.5">{item.desc}</p>}
      </div>
      <div className="text-right shrink-0">
        {item.priceLabel && <p className="text-xs text-muted-foreground">{item.priceLabel}</p>}
        <div className="flex items-baseline gap-1 justify-end">
          <span className="text-[13px] text-muted-foreground">R$</span>
          <span className="text-3xl font-bold tracking-tight">{item.price}</span>
        </div>
        {item.priceUnit && <p className="text-xs text-muted-foreground">{item.priceUnit}</p>}
      </div>
    </div>
  );
}

function Heading({ item }: { item: Item }) {
  return (
    <div>
      {item.divider && <div className="w-10 h-[3px] bg-accent rounded mb-5" />}
      <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">{item.text}</p>
    </div>
  );
}

function UnitBlock({ item }: { item: Item }) {
  return (
    <div className="bg-gray-light rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className={cn("text-[11px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full", item.tagVariant === "cpe" ? "bg-accent text-black" : "bg-black text-white")}>
          {item.tag}
        </span>
        <div>
          <p className="text-[15px] font-semibold">{item.name}</p>
          {item.addr && <p className="text-xs text-muted-foreground">{item.addr}</p>}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        {(item.services ?? []).map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-[13px] bg-white border border-gray-medium rounded-lg px-3 py-2">
            <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", item.tagVariant === "cpe" ? "bg-black" : "bg-accent")} />
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}

function ItemView({ item }: { item: Item }) {
  switch (item.type) {
    case "product": return <ProductCard item={item} />;
    case "pricetable": return <PriceTableCard item={item} />;
    case "infotable": return <InfoTableCard item={item} />;
    case "rooms": return <RoomsCard item={item} />;
    case "banner": return <Banner item={item} />;
    case "heading": return <Heading item={item} />;
    case "unit": return <UnitBlock item={item} />;
    default: return null;
  }
}

// ─── Serialization helpers for the editor ───────────────────────────────────

const linesToArr = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);
const arrToLines = (a?: string[]) => (a ?? []).join("\n");

const rowsToText = (rows?: [string, string][]) => (rows ?? []).map(([k, v]) => `${k} | ${v}`).join("\n");
const textToRows = (s: string): [string, string][] =>
  linesToArr(s).map((l) => {
    const [k, ...rest] = l.split("|");
    return [k.trim(), rest.join("|").trim()] as [string, string];
  });

const roomsToText = (rooms?: Room[]) =>
  (rooms ?? []).map((r) => `${r.name} | ${r.cap}${r.highlight ? " | destaque" : ""}`).join("\n");
const textToRooms = (s: string): Room[] =>
  linesToArr(s).map((l) => {
    const parts = l.split("|").map((p) => p.trim());
    return { name: parts[0] ?? "", cap: parts[1] ?? "", highlight: /destaque|highlight|1|sim/i.test(parts[2] ?? "") };
  });

// ─── Item editor modal ──────────────────────────────────────────────────────

function ItemEditor({
  item, onSave, onClose,
}: {
  item: Item;
  onSave: (item: Item) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<Item>(item);
  const set = (patch: Partial<Item>) => setDraft((d) => ({ ...d, ...patch }));
  const t = draft.type;

  return (
    <Modal open onClose={onClose} title={`${TYPE_LABELS[t]}`} description="Edite os campos e salve. Campos vazios não são exibidos." className="max-w-2xl">
      <div className="flex flex-col gap-3 max-h-[65vh] overflow-y-auto pr-1">
        {t === "heading" && (
          <>
            <Input label="Texto do subtítulo" value={draft.text ?? ""} onChange={(e) => set({ text: e.target.value })} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!draft.divider} onChange={(e) => set({ divider: e.target.checked })} />
              Mostrar divisória amarela acima
            </label>
          </>
        )}

        {t === "unit" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Sigla (tag)" value={draft.tag ?? ""} onChange={(e) => set({ tag: e.target.value })} />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-dark">Cor da tag</label>
                <select value={draft.tagVariant ?? "fco"} onChange={(e) => set({ tagVariant: e.target.value as "fco" | "cpe" })} className="h-10 rounded-md border border-gray-medium px-3 text-sm">
                  <option value="fco">Preta (FCO)</option>
                  <option value="cpe">Amarela (CPE)</option>
                </select>
              </div>
            </div>
            <Input label="Nome da unidade" value={draft.name ?? ""} onChange={(e) => set({ name: e.target.value })} />
            <Input label="Endereço" value={draft.addr ?? ""} onChange={(e) => set({ addr: e.target.value })} />
            <Textarea label="Serviços (um por linha)" rows={8} value={arrToLines(draft.services)} onChange={(e) => set({ services: linesToArr(e.target.value) })} />
          </>
        )}

        {(t === "product" || t === "banner" || t === "rooms" || t === "infotable") && (
          <>
            <Input label="Rótulo (label)" value={draft.label ?? ""} onChange={(e) => set({ label: e.target.value })} />
            <Input label="Título" value={draft.title ?? ""} onChange={(e) => set({ title: e.target.value })} />
            <Textarea label="Descrição" rows={2} value={draft.desc ?? ""} onChange={(e) => set({ desc: e.target.value })} />
          </>
        )}

        {t === "product" && (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-dark">Estilo do card</label>
            <select value={draft.variant ?? "default"} onChange={(e) => set({ variant: e.target.value as Item["variant"] })} className="h-10 rounded-md border border-gray-medium px-3 text-sm">
              <option value="default">Padrão (branco)</option>
              <option value="accent">Destaque (barra amarela)</option>
              <option value="dark">Escuro (fundo preto)</option>
            </select>
          </div>
        )}

        {(t === "product" || t === "rooms" || t === "banner") && (
          <div className="grid grid-cols-2 gap-3">
            <Input label="Preço (sem R$)" value={draft.price ?? ""} onChange={(e) => set({ price: e.target.value })} />
            <Input label="Unidade do preço" placeholder="/ mês, por dia…" value={draft.priceUnit ?? ""} onChange={(e) => set({ priceUnit: e.target.value })} />
          </div>
        )}

        {t === "banner" && (
          <Input label="Texto acima do preço" placeholder="a partir de…" value={draft.priceLabel ?? ""} onChange={(e) => set({ priceLabel: e.target.value })} />
        )}

        {t === "product" && (
          <>
            <Input label="Texto alternativo do preço" value={draft.priceAlt ?? ""} onChange={(e) => set({ priceAlt: e.target.value })} />
            <Input label="Selo (badge)" value={draft.badge ?? ""} onChange={(e) => set({ badge: e.target.value })} />
            <Textarea label="Detalhes (um por linha)" rows={4} value={arrToLines(draft.info)} onChange={(e) => set({ info: linesToArr(e.target.value) })} />
          </>
        )}

        {t === "rooms" && (
          <>
            <Input label="Observação do preço" value={draft.priceNote ?? ""} onChange={(e) => set({ priceNote: e.target.value })} />
            <Textarea label="Salas (Nome | Capacidade | destaque)" rows={6} placeholder="R1 | 8 pos.&#10;R3 | 12 pos. · R$ 120 | destaque" value={roomsToText(draft.rooms)} onChange={(e) => set({ rooms: textToRooms(e.target.value) })} />
          </>
        )}

        {(t === "pricetable" || t === "infotable") && (
          <>
            {t === "infotable" && (
              <>
                <Input label="Rótulo (label)" value={draft.label ?? ""} onChange={(e) => set({ label: e.target.value })} />
                <Input label="Título" value={draft.title ?? ""} onChange={(e) => set({ title: e.target.value })} />
                <Textarea label="Descrição" rows={2} value={draft.desc ?? ""} onChange={(e) => set({ desc: e.target.value })} />
              </>
            )}
            <Input label="Título da tabela" value={draft.tableTitle ?? ""} onChange={(e) => set({ tableTitle: e.target.value })} />
            <Textarea label="Linhas (Descrição | Valor)" rows={6} placeholder="Mensal | R$ 169,00" value={rowsToText(draft.rows)} onChange={(e) => set({ rows: textToRows(e.target.value) })} />
          </>
        )}

        <label className="flex items-center gap-2 text-sm mt-1">
          <input type="checkbox" checked={!!draft.full} onChange={(e) => set({ full: e.target.checked })} />
          Ocupar a largura inteira
        </label>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-gray-medium mt-3">
        <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
        <Button variant="default" size="sm" onClick={() => onSave(draft)}>
          <Check size={14} /> Aplicar
        </Button>
      </div>
    </Modal>
  );
}

// ─── Section editor modal ───────────────────────────────────────────────────

function SectionEditor({
  section, onSave, onClose,
}: {
  section: Section;
  onSave: (s: Section) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<Section>(section);
  const set = (patch: Partial<Section>) => setDraft((d) => ({ ...d, ...patch }));
  return (
    <Modal open onClose={onClose} title="Editar seção" className="max-w-lg">
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-3 gap-3">
          <Input label="Número" value={draft.number} onChange={(e) => set({ number: e.target.value })} />
          <div className="col-span-2 flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-dark">Unidade</label>
            <select
              value={draft.unit ?? ""}
              onChange={(e) => set({ unit: (e.target.value || undefined) as Unit | undefined })}
              className="h-10 rounded-md border border-gray-medium px-3 text-sm"
            >
              <option value="">Nenhuma</option>
              <option value="fco">FCO</option>
              <option value="cpe">CPE</option>
              <option value="both">Ambas</option>
            </select>
          </div>
        </div>
        <Input label="Título" value={draft.title} onChange={(e) => set({ title: e.target.value })} />
        <Textarea label="Introdução (opcional)" rows={2} value={draft.intro ?? ""} onChange={(e) => set({ intro: e.target.value || undefined })} />
      </div>
      <div className="flex justify-end gap-2 pt-4 border-t border-gray-medium mt-3">
        <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
        <Button variant="default" size="sm" onClick={() => onSave(draft)}><Check size={14} /> Aplicar</Button>
      </div>
    </Modal>
  );
}

// ─── Add-item type picker ───────────────────────────────────────────────────

function defaultItem(type: ItemType): Item {
  const base: Item = { id: uid(), type };
  switch (type) {
    case "product": return { ...base, variant: "default", label: "Novo produto", title: "Título", price: "0" };
    case "pricetable": return { ...base, tableTitle: "Tabela", rows: [["Item", "R$ 0,00"]] };
    case "infotable": return { ...base, label: "Rótulo", title: "Título", tableTitle: "Modalidades", rows: [["Item", "R$ 0,00"]] };
    case "rooms": return { ...base, label: "Salas", title: "Unidade", price: "0", priceUnit: "/ hora", rooms: [{ name: "R1", cap: "4 pos." }] };
    case "banner": return { ...base, label: "Rótulo", title: "Título", price: "0" };
    case "heading": return { ...base, text: "Subtítulo", divider: true, full: true };
    case "unit": return { ...base, full: true, tag: "FCO", tagVariant: "fco", name: "Unidade", addr: "Endereço", services: ["Serviço"] };
  }
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function PortfolioPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [editingItem, setEditingItem] = useState<{ sectionId: string; item: Item } | null>(null);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [addingTo, setAddingTo] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/portfolio");
        if (!res.ok) throw new Error("Erro ao carregar");
        setSections(await res.json());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao carregar");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const mutate = useCallback((fn: (prev: Section[]) => Section[]) => {
    setSections((prev) => fn(prev));
    setDirty(true);
  }, []);

  async function save() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/portfolio", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sections),
      });
      if (!res.ok) throw new Error("Erro ao salvar");
      setDirty(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  // ── Section ops ──
  const moveSection = (idx: number, dir: -1 | 1) => mutate((prev) => {
    const next = [...prev];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return prev;
    [next[idx], next[j]] = [next[j], next[idx]];
    return next;
  });
  const deleteSection = (id: string) => mutate((prev) => prev.filter((s) => s.id !== id));
  const addSection = () => mutate((prev) => [
    ...prev,
    { id: uid(), number: String(prev.length + 1).padStart(2, "0"), title: "Nova seção", items: [] },
  ]);

  // ── Item ops ──
  const moveItem = (sectionId: string, idx: number, dir: -1 | 1) => mutate((prev) => prev.map((s) => {
    if (s.id !== sectionId) return s;
    const items = [...s.items];
    const j = idx + dir;
    if (j < 0 || j >= items.length) return s;
    [items[idx], items[j]] = [items[j], items[idx]];
    return { ...s, items };
  }));
  const deleteItem = (sectionId: string, itemId: string) => mutate((prev) => prev.map((s) =>
    s.id === sectionId ? { ...s, items: s.items.filter((i) => i.id !== itemId) } : s
  ));
  const upsertItem = (sectionId: string, item: Item) => mutate((prev) => prev.map((s) => {
    if (s.id !== sectionId) return s;
    const exists = s.items.some((i) => i.id === item.id);
    return { ...s, items: exists ? s.items.map((i) => (i.id === item.id ? item : i)) : [...s.items, item] };
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 size={20} className="animate-spin mr-2" /> Carregando portfólio…
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-8 py-8">
      {/* Header */}
      <header className="pb-6 border-b border-gray-medium">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground mb-3 flex items-center gap-2">
              <span className="inline-block w-4 h-0.5 bg-accent" />
              Portfólio de produtos
            </p>
            <h1 className="text-4xl font-bold tracking-tight leading-none">Espaços, planos<br />&amp; serviços.</h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {dirty && (
              <Button variant="accent" size="sm" onClick={save} disabled={saving}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Salvar alterações
              </Button>
            )}
            <Button variant={editMode ? "default" : "outline"} size="sm" onClick={() => setEditMode((v) => !v)}>
              {editMode ? <><X size={14} /> Sair da edição</> : <><Pencil size={14} /> Editar</>}
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-3 max-w-md">Produtos, preços e condições reunidos num lugar só.</p>
        {error && <p className="text-xs text-red-500 mt-3">{error}</p>}
        {editMode && (
          <p className="text-xs text-muted-foreground mt-3 bg-gray-light border border-gray-medium rounded-md px-3 py-2">
            Modo de edição ativo. Altere seções e itens; clique em <strong>Salvar alterações</strong> para que todos vejam.
          </p>
        )}
      </header>

      {/* Unit legend */}
      <div className="flex gap-3 flex-wrap py-5 border-b border-gray-medium">
        {[
          { unit: "fco" as Unit, label: "Francisco Rocha (FCO)" },
          { unit: "cpe" as Unit, label: "Casa de Pedra — Nex House (CPE)" },
          { unit: "both" as Unit, label: "Ambas as unidades" },
        ].map((b) => (
          <span key={b.label} className="inline-flex items-center gap-2 text-xs font-medium bg-gray-light border border-gray-medium rounded-full px-3 py-1.5">
            <UnitDot unit={b.unit} /> {b.label}
          </span>
        ))}
      </div>

      {/* Sections */}
      {sections.map((section, si) => (
        <section key={section.id} className="py-10 border-b border-gray-medium">
          <div className="flex items-baseline gap-3 mb-1">
            <span className="text-[11px] font-bold tracking-widest text-muted-foreground/60 uppercase w-7">{section.number}</span>
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2 flex-1">
              {section.title}
              {section.unit && <UnitDot unit={section.unit} />}
            </h2>
            {editMode && (
              <div className="flex items-center gap-1">
                <button onClick={() => moveSection(si, -1)} disabled={si === 0} className="p-1.5 rounded hover:bg-gray-light disabled:opacity-30" title="Mover para cima"><ChevronUp size={14} /></button>
                <button onClick={() => moveSection(si, 1)} disabled={si === sections.length - 1} className="p-1.5 rounded hover:bg-gray-light disabled:opacity-30" title="Mover para baixo"><ChevronDown size={14} /></button>
                <button onClick={() => setEditingSection(section)} className="p-1.5 rounded hover:bg-gray-light" title="Editar seção"><Pencil size={14} /></button>
                <button onClick={() => deleteSection(section.id)} className="p-1.5 rounded text-red-500 hover:bg-red-50" title="Excluir seção"><Trash2 size={14} /></button>
              </div>
            )}
          </div>
          {section.intro && <p className="text-sm text-muted-foreground mb-6 ml-10 max-w-2xl">{section.intro}</p>}

          <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-4", !section.intro && "mt-6")}>
            {section.items.map((item, ii) => {
              const fullSpan = item.full || item.type === "heading" || item.type === "unit";
              return (
                <div key={item.id} className={cn("relative", fullSpan && "sm:col-span-2")}>
                  {editMode && (
                    <div className="absolute -top-2 -right-2 z-10 flex items-center gap-0.5 bg-white border border-gray-medium rounded-md shadow-sm">
                      <button onClick={() => moveItem(section.id, ii, -1)} disabled={ii === 0} className="p-1 hover:bg-gray-light disabled:opacity-30" title="Mover"><ChevronUp size={13} /></button>
                      <button onClick={() => moveItem(section.id, ii, 1)} disabled={ii === section.items.length - 1} className="p-1 hover:bg-gray-light disabled:opacity-30" title="Mover"><ChevronDown size={13} /></button>
                      <button onClick={() => setEditingItem({ sectionId: section.id, item })} className="p-1 hover:bg-gray-light" title="Editar"><Pencil size={13} /></button>
                      <button onClick={() => deleteItem(section.id, item.id)} className="p-1 text-red-500 hover:bg-red-50" title="Excluir"><Trash2 size={13} /></button>
                    </div>
                  )}
                  <ItemView item={item} />
                </div>
              );
            })}

            {editMode && (
              <button
                onClick={() => setAddingTo(section.id)}
                className="sm:col-span-2 flex items-center justify-center gap-2 border border-dashed border-gray-medium rounded-xl py-4 text-sm text-muted-foreground hover:border-gray-dark hover:text-foreground transition-colors"
              >
                <Plus size={15} /> Adicionar item
              </button>
            )}
          </div>
        </section>
      ))}

      {editMode && (
        <button
          onClick={addSection}
          className="w-full flex items-center justify-center gap-2 border border-dashed border-gray-medium rounded-xl py-5 my-8 text-sm font-medium text-muted-foreground hover:border-gray-dark hover:text-foreground transition-colors"
        >
          <Plus size={16} /> Adicionar nova seção
        </button>
      )}

      <p className="text-xs text-muted-foreground/70 py-6">
        Preços e condições podem mudar. Consulte disponibilidade. · Nex Coworking · Curitiba
      </p>

      {/* Materiais (upload) */}
      <div className="pt-2">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Materiais e apresentações</h2>
        <FileUpload section="Portfolio de Produtos" />
      </div>

      {/* Modals */}
      {editingItem && (
        <ItemEditor
          item={editingItem.item}
          onClose={() => setEditingItem(null)}
          onSave={(it) => { upsertItem(editingItem.sectionId, it); setEditingItem(null); }}
        />
      )}
      {editingSection && (
        <SectionEditor
          section={editingSection}
          onClose={() => setEditingSection(null)}
          onSave={(s) => { mutate((prev) => prev.map((x) => (x.id === s.id ? { ...x, ...s } : x))); setEditingSection(null); }}
        />
      )}
      {addingTo && (
        <Modal open onClose={() => setAddingTo(null)} title="Adicionar item" description="Escolha o tipo de item a adicionar nesta seção." className="max-w-md">
          <div className="grid grid-cols-1 gap-2">
            {(Object.keys(TYPE_LABELS) as ItemType[]).map((type) => (
              <button
                key={type}
                onClick={() => { upsertItem(addingTo, defaultItem(type)); setAddingTo(null); }}
                className="text-left px-4 py-3 rounded-lg border border-gray-medium hover:border-gray-dark hover:bg-gray-light transition-colors text-sm font-medium"
              >
                {TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
