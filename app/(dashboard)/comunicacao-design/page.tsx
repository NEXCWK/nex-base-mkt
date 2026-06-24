"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  ExternalLink,
  FolderOpen,
  BookImage,
  Palette,
  Plus,
  Trash2,
  Loader2,
  CalendarHeart,
  User,
  Globe,
  Pencil,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "recursos" | "datas-comemorativas" | "influenciadores";

interface DataComemorativa {
  id: string;
  data: string;
  nomeAcao: string;
  razao: string;
  createdAt: string;
}

interface Influenciador {
  id: string;
  name: string;
  category: string;
  bio: string;
  website: string;
  photoUrl: string;
  createdAt: string;
  updatedAt: string;
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

// ─── Influenciadores Tab ──────────────────────────────────────────────────────

const EMPTY_INF = { name: "", category: "", bio: "", website: "", photoUrl: "" };

function resizeImage(file: File, maxPx = 480, quality = 0.85): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let { width, height } = img;
      if (width > maxPx || height > maxPx) {
        const ratio = Math.min(maxPx / width, maxPx / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.src = url;
  });
}

function PhotoUploadInf({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    setProcessing(true);
    try { onChange(await resizeImage(file)); }
    finally { setProcessing(false); }
  }

  return (
    <div className="flex items-center gap-4">
      <div
        onClick={() => inputRef.current?.click()}
        className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-dashed border-gray-medium cursor-pointer hover:border-black transition-colors group shrink-0"
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-light">
            <User size={24} className="text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {processing ? <Loader2 size={16} className="text-white animate-spin" /> : <Camera size={16} className="text-white" />}
        </div>
      </div>
      <div>
        <p className="text-xs font-medium text-gray-dark mb-1">Foto de perfil</p>
        <button type="button" onClick={() => inputRef.current?.click()} className="text-xs text-muted-foreground hover:text-black underline underline-offset-2 transition-colors">
          {value ? "Trocar foto" : "Enviar foto"}
        </button>
        {value && (<><span className="text-xs text-muted-foreground mx-1.5">·</span><button type="button" onClick={() => onChange("")} className="text-xs text-red-500 hover:text-red-600 underline underline-offset-2 transition-colors">Remover</button></>)}
        <p className="text-[11px] text-muted-foreground mt-1">JPG, PNG ou WEBP</p>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
    </div>
  );
}

function InfluenciadoresTab() {
  const [influenciadores, setInfluenciadores] = useState<Influenciador[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Influenciador | null>(null);
  const [form, setForm] = useState(EMPTY_INF);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Influenciador | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchInfluenciadores = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/influenciadores");
      if (res.ok) setInfluenciadores(await res.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchInfluenciadores(); }, [fetchInfluenciadores]);

  function openCreate() { setEditTarget(null); setForm(EMPTY_INF); setSaveError(""); setModalOpen(true); }
  function openEdit(i: Influenciador) { setEditTarget(i); setForm({ name: i.name, category: i.category, bio: i.bio, website: i.website, photoUrl: i.photoUrl }); setSaveError(""); setModalOpen(true); }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true); setSaveError("");
    try {
      if (editTarget) {
        const res = await fetch("/api/influenciadores", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editTarget.id, ...form }) });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Erro ao salvar");
        const updated: Influenciador = await res.json();
        setInfluenciadores((p) => p.map((x) => x.id === updated.id ? updated : x));
      } else {
        const res = await fetch("/api/influenciadores", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Erro ao criar");
        const created: Influenciador = await res.json();
        setInfluenciadores((p) => [...p, created]);
      }
      setModalOpen(false);
    } catch (e) { setSaveError(e instanceof Error ? e.message : "Erro desconhecido"); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch("/api/influenciadores", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: deleteTarget.id }) });
      setInfluenciadores((p) => p.filter((x) => x.id !== deleteTarget.id));
      setDeleteTarget(null);
    } finally { setDeleting(false); }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-muted-foreground">{influenciadores.length} {influenciadores.length === 1 ? "influenciador" : "influenciadores"} cadastrados</p>
        <Button variant="default" size="sm" onClick={openCreate}><Plus size={14} /> Adicionar</Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm py-10"><Loader2 size={14} className="animate-spin" /> Carregando…</div>
      ) : influenciadores.length === 0 ? (
        <div className="border border-dashed border-gray-medium rounded-xl p-16 text-center">
          <User size={32} className="mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="text-sm font-medium text-gray-dark mb-1">Nenhum influenciador cadastrado ainda</p>
          <p className="text-xs text-muted-foreground mb-5">Cadastre os influenciadores parceiros da área.</p>
          <Button variant="outline" size="sm" onClick={openCreate}><Plus size={14} /> Adicionar</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {influenciadores.map((inf) => (
            <Card key={inf.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="h-32 bg-gray-light flex items-center justify-center overflow-hidden">
                  {inf.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={inf.photoUrl} alt={inf.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-medium flex items-center justify-center">
                      <User size={28} className="text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm text-black truncate">{inf.name}</h3>
                      {inf.category && <Badge variant="muted" className="mt-1">{inf.category}</Badge>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => openEdit(inf)} className="p-1 rounded-md text-muted-foreground hover:text-black hover:bg-gray-light transition-colors" title="Editar"><Pencil size={13} /></button>
                      <button onClick={() => setDeleteTarget(inf)} className="p-1 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors" title="Excluir"><Trash2 size={13} /></button>
                    </div>
                  </div>
                  {inf.bio && <p className="text-xs text-muted-foreground leading-relaxed mt-2 line-clamp-3">{inf.bio}</p>}
                  {inf.website && (
                    <a href={inf.website.startsWith("http") ? inf.website : `https://${inf.website}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-xs text-black hover:underline">
                      <Globe size={11} />{inf.website.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? "Editar influenciador" : "Adicionar influenciador"} className="max-w-lg">
        <div className="flex flex-col gap-4">
          <PhotoUploadInf value={form.photoUrl} onChange={(v) => setForm((f) => ({ ...f, photoUrl: v }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Nome *" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Nome do influenciador" autoFocus />
            <Input label="Nicho / Categoria" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="Ex: Lifestyle, Tech…" />
          </div>
          <Textarea label="Bio" value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} placeholder="Breve descrição do influenciador e da parceria…" rows={3} />
          <Input label="Perfil / Link" value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} placeholder="https://instagram.com/…" />
          {saveError && <p className="text-xs text-red-500">{saveError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button>
            <Button variant="default" size="sm" onClick={handleSave} disabled={saving || !form.name.trim()}>
              {saving && <Loader2 size={13} className="animate-spin" />}
              {editTarget ? "Salvar alterações" : "Adicionar"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Excluir influenciador" description={`Remover "${deleteTarget?.name}"? Esta ação não pode ser desfeita.`}>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancelar</Button>
          <Button size="sm" onClick={handleDelete} disabled={deleting} className="bg-red-500 text-white hover:bg-red-600">
            {deleting && <Loader2 size={13} className="animate-spin" />}Excluir
          </Button>
        </div>
      </Modal>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS: { key: Tab; label: string }[] = [
  { key: "recursos", label: "Recursos" },
  { key: "datas-comemorativas", label: "Datas Comemorativas" },
  { key: "influenciadores", label: "Influenciadores" },
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
      {tab === "datas-comemorativas" && <DatasComemorativasTab />}
      {tab === "influenciadores" && <InfluenciadoresTab />}
    </div>
  );
}
