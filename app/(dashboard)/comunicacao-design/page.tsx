"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ExternalLink,
  FolderOpen,
  BookImage,
  Palette,
  Plus,
  Trash2,
  Loader2,
  Link2,
  CalendarHeart,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "recursos" | "conteudos-vendas" | "datas-comemorativas";

interface ConteudoVendas {
  id: string;
  url: string;
  descricao: string;
  produto: string;
  createdAt: string;
}

interface DataComemorativa {
  id: string;
  data: string;
  nomeAcao: string;
  razao: string;
  createdAt: string;
}

// ─── Recursos Tab ─────────────────────────────────────────────────────────────

const LINKS = [
  {
    icon: FolderOpen,
    title: "Materiais multimídia",
    desc: "Todos os vídeos, fotos, artes e materiais de comunicação da área estão organizados no Google Drive.",
    label: "Acessar no Drive",
    href: "https://drive.google.com/drive/folders/1tipHqQKbqD7D1D2pcyNQO-MlbXpxVa-t?usp=drive_link",
  },
  {
    icon: BookImage,
    title: "Identidade Visual & Brandbook",
    desc: "As diretrizes de marca, paleta de cores, tipografia e guia de uso do logo Nex estão disponíveis no Drive.",
    label: "Acessar no Drive",
    href: "https://drive.google.com/drive/folders/1Gs0nem3GMWVESNruoe0EzAWMm7I_Y1Mf?usp=drive_link",
  },
  {
    icon: Palette,
    title: "Design no Canva",
    desc: "Todos os materiais de design são criados e organizados diretamente no Canva. Acesse o workspace da área pelo link abaixo. Caso não seja membro do workspace, converse com a gestão da área para fazer parte.",
    label: "Abrir o Canva",
    href: "https://www.canva.com/",
  },
];

function RecursosTab() {
  return (
    <div className="flex flex-col gap-4">
      {LINKS.map(({ icon: Icon, title, desc, label, href }) => (
        <div key={title} className="border border-gray-medium rounded-xl p-6 bg-white">
          <div className="flex items-start gap-4">
            <div className="mt-0.5 rounded-lg bg-gray-light p-2.5 shrink-0">
              <Icon size={18} className="text-gray-dark" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-black">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{desc}</p>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-black hover:underline underline-offset-2"
              >
                {label}
                <ExternalLink size={13} />
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Conteúdos para Vendas Tab ────────────────────────────────────────────────

const EMPTY_CV = { url: "", descricao: "", produto: "" };

function ConteudosVendasTab() {
  const [items, setItems] = useState<ConteudoVendas[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_CV);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ConteudoVendas | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/conteudos-vendas");
      if (res.ok) setItems(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  function openCreate() {
    setForm(EMPTY_CV);
    setFormError("");
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.url.trim()) { setFormError("URL obrigatória."); return; }
    setSaving(true);
    setFormError("");
    try {
      const res = await fetch("/api/conteudos-vendas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Erro ao salvar");
      const saved: ConteudoVendas = await res.json();
      setItems((prev) => [...prev, saved]);
      setModalOpen(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch("/api/conteudos-vendas", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteTarget.id }),
      });
      setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  function formatCreatedAt(iso: string) {
    try {
      return format(parseISO(iso), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return "";
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Links de posts, conteúdos e materiais úteis para o processo de vendas.
        </p>
        <Button variant="default" size="sm" onClick={openCreate} className="shrink-0 ml-4">
          <Plus size={14} />
          Adicionar
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm py-10">
          <Loader2 size={14} className="animate-spin" /> Carregando…
        </div>
      ) : items.length === 0 ? (
        <div className="border border-dashed border-gray-medium rounded-xl py-14 text-center">
          <ShoppingBag size={26} className="mx-auto mb-3 text-muted-foreground opacity-30" />
          <p className="text-sm font-medium text-muted-foreground mb-1">Nenhum conteúdo ainda.</p>
          <p className="text-xs text-muted-foreground mb-5">
            Adicione links de posts e materiais para usar nas vendas.
          </p>
          <Button variant="outline" size="sm" onClick={openCreate}>
            <Plus size={13} />
            Adicionar
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="border border-gray-medium rounded-xl p-4 bg-white flex items-start gap-4"
            >
              <div className="mt-0.5 rounded-lg bg-gray-light p-2 shrink-0">
                <Link2 size={16} className="text-gray-dark" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-medium text-black hover:underline underline-offset-2 break-all"
                    >
                      {item.url}
                      <ExternalLink size={11} className="shrink-0" />
                    </a>
                    {item.descricao && (
                      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                        {item.descricao}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      {item.produto && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-light text-xs font-medium text-gray-dark">
                          {item.produto}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatCreatedAt(item.createdAt)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setDeleteTarget(item)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors shrink-0 mt-0.5"
                    title="Remover"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Adicionar conteúdo"
        description="Adicione um link de post ou material útil para o processo de vendas."
      >
        <div className="flex flex-col gap-4">
          <Input
            label="URL do post *"
            type="url"
            value={form.url}
            onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
            placeholder="https://www.instagram.com/p/..."
          />
          <Textarea
            label="Descrição"
            value={form.descricao}
            onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
            placeholder="Descreva o conteúdo ou como usar nas vendas…"
            rows={3}
          />
          <Input
            label="Produto relacionado"
            value={form.produto}
            onChange={(e) => setForm((f) => ({ ...f, produto: e.target.value }))}
            placeholder="Ex: Sala Privativa, Coworking…"
          />
          {formError && <p className="text-xs text-red-500">{formError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving || !form.url.trim()}>
              {saving && <Loader2 size={13} className="animate-spin" />}
              Adicionar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Remover conteúdo"
        description="Tem certeza que deseja remover este link?"
      >
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
            className="bg-red-500 text-white hover:bg-red-600"
          >
            {deleting && <Loader2 size={13} className="animate-spin" />}
            Remover
          </Button>
        </div>
      </Modal>
    </>
  );
}

// ─── Datas Comemorativas Tab ──────────────────────────────────────────────────

const EMPTY_DC = { data: "", nomeAcao: "", razao: "" };

function DatasComemorativasTab() {
  const [items, setItems] = useState<DataComemorativa[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_DC);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DataComemorativa | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/datas-comemorativas");
      if (res.ok) {
        const data: DataComemorativa[] = await res.json();
        setItems(data.sort((a, b) => a.data.localeCompare(b.data)));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  function openCreate() {
    setForm(EMPTY_DC);
    setFormError("");
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.data) { setFormError("Data obrigatória."); return; }
    if (!form.razao.trim()) { setFormError("Razão / importância obrigatória."); return; }
    setSaving(true);
    setFormError("");
    try {
      const res = await fetch("/api/datas-comemorativas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Erro ao salvar");
      const saved: DataComemorativa = await res.json();
      setItems((prev) =>
        [...prev, saved].sort((a, b) => a.data.localeCompare(b.data))
      );
      setModalOpen(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch("/api/datas-comemorativas", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteTarget.id }),
      });
      setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  function formatData(dateStr: string) {
    try {
      return format(parseISO(dateStr), "dd 'de' MMMM", { locale: ptBR });
    } catch {
      return dateStr;
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Datas importantes para a marca Nex e suas ações comemorativas.
        </p>
        <Button variant="default" size="sm" onClick={openCreate} className="shrink-0 ml-4">
          <Plus size={14} />
          Adicionar
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm py-10">
          <Loader2 size={14} className="animate-spin" /> Carregando…
        </div>
      ) : items.length === 0 ? (
        <div className="border border-dashed border-gray-medium rounded-xl py-14 text-center">
          <CalendarHeart size={26} className="mx-auto mb-3 text-muted-foreground opacity-30" />
          <p className="text-sm font-medium text-muted-foreground mb-1">Nenhuma data ainda.</p>
          <p className="text-xs text-muted-foreground mb-5">
            Adicione datas comemorativas relevantes para a marca.
          </p>
          <Button variant="outline" size="sm" onClick={openCreate}>
            <Plus size={13} />
            Adicionar
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="border border-gray-medium rounded-xl p-4 bg-white flex items-start gap-4"
            >
              <div className="mt-0.5 rounded-lg bg-gray-light p-2 shrink-0 text-center min-w-[52px]">
                <CalendarHeart size={16} className="text-gray-dark mx-auto mb-0.5" />
                <span className="text-[10px] font-semibold text-gray-dark leading-none">
                  {item.data
                    ? (() => {
                        try {
                          return format(parseISO(item.data), "dd/MM", { locale: ptBR });
                        } catch {
                          return item.data;
                        }
                      })()
                    : ""}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {formatData(item.data)}
                      {item.nomeAcao && (
                        <span className="ml-2 font-normal text-muted-foreground">
                          — {item.nomeAcao}
                        </span>
                      )}
                    </p>
                    {item.razao && (
                      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                        {item.razao}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setDeleteTarget(item)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors shrink-0 mt-0.5"
                    title="Remover"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Adicionar data comemorativa"
        description="Registre datas importantes para a marca e suas ações."
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-gray-dark block mb-1.5">Data *</label>
            <input
              type="date"
              value={form.data}
              onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))}
              className="h-10 w-full rounded-md border border-gray-medium bg-white px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
            />
          </div>
          <Input
            label="Nome da ação / evento (opcional)"
            value={form.nomeAcao}
            onChange={(e) => setForm((f) => ({ ...f, nomeAcao: e.target.value }))}
            placeholder="Ex: Dia do Coworking, Aniversário do Nex…"
          />
          <Textarea
            label="Razão / Por que é importante para a Nex *"
            value={form.razao}
            onChange={(e) => setForm((f) => ({ ...f, razao: e.target.value }))}
            placeholder="Descreva a relevância desta data para a marca e possíveis ações…"
            rows={3}
          />
          {formError && <p className="text-xs text-red-500">{formError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving || !form.data || !form.razao.trim()}>
              {saving && <Loader2 size={13} className="animate-spin" />}
              Adicionar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Remover data"
        description="Tem certeza que deseja remover esta data comemorativa?"
      >
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
            className="bg-red-500 text-white hover:bg-red-600"
          >
            {deleting && <Loader2 size={13} className="animate-spin" />}
            Remover
          </Button>
        </div>
      </Modal>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS: { key: Tab; label: string }[] = [
  { key: "recursos", label: "Recursos" },
  { key: "conteudos-vendas", label: "Conteúdos para Vendas" },
  { key: "datas-comemorativas", label: "Datas Comemorativas" },
];

export default function ComunicacaoDesignPage() {
  const [tab, setTab] = useState<Tab>("recursos");

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Comunicação e Design</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acesse os materiais, diretrizes e ferramentas da área de Comunicação e Design.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-light p-1 rounded-lg w-fit mb-6">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
              tab === key
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "recursos" && <RecursosTab />}
      {tab === "conteudos-vendas" && <ConteudosVendasTab />}
      {tab === "datas-comemorativas" && <DatasComemorativasTab />}
    </div>
  );
}
