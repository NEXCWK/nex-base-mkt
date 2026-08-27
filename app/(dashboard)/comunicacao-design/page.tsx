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
  Video,
  Link2,
  ChevronLeft,
  PlayCircle,
} from "lucide-react";
import { FileUpload } from "@/components/upload/FileUpload";
import { CalendarioInfluTab } from "@/components/calendario-influ/CalendarioInfluTab";
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

type Tab = "recursos" | "datas-comemorativas" | "conteudo-influs" | "calendario-influ";

interface DataComemorativa {
  id: string;
  data: string;
  nomeAcao: string;
  razao: string;
  createdAt: string;
}

interface ContentLink {
  id: string;
  url: string;
  descricao?: string;
  addedAt: string;
}

type InfluencerTipo = "fixo" | "avulso";

interface InfluencerConteudo {
  id: string;
  tipo: InfluencerTipo;
  name: string;
  category: string;
  bio: string;
  photoUrl: string;
  profileLink: string;
  instagram: string;
  contentLinks: ContentLink[];
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

// ─── Shared helpers ───────────────────────────────────────────────────────────

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

// ─── Conteúdo Influs Tab ──────────────────────────────────────────────────────

const EMPTY_FIXO_FORM = { name: "", category: "", bio: "", photoUrl: "", profileLink: "" };
const EMPTY_AVULSO_FORM = { name: "", instagram: "", contentLink: "" };

const TIPO_META: Record<InfluencerTipo, { label: string }> = {
  fixo: { label: "Fixo" },
  avulso: { label: "Avulso" },
};

function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function TipoBadge({ tipo }: { tipo: InfluencerTipo }) {
  return (
    <span
      className={cn(
        "inline-flex items-center text-[11px] font-600 uppercase tracking-wide rounded-full px-2 py-0.5 shrink-0",
        tipo === "fixo" ? "bg-black text-white" : "border border-black text-black"
      )}
    >
      {TIPO_META[tipo].label}
    </span>
  );
}

function InfluencerDetailScreen({
  influencer,
  onBack,
  onUpdate,
  onDelete,
}: {
  influencer: InfluencerConteudo;
  onBack: () => void;
  onUpdate: (updated: InfluencerConteudo) => void;
  onDelete: () => void;
}) {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState(EMPTY_FIXO_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [addLinkOpen, setAddLinkOpen] = useState(false);
  const [linkForm, setLinkForm] = useState({ url: "", descricao: "" });
  const [savingLink, setSavingLink] = useState(false);
  const [linkError, setLinkError] = useState("");

  const section = `Comunicacao/Influs/${slugify(influencer.name) || "influenciador"}-${influencer.id.slice(-6)}`;

  function openEdit() {
    setEditForm({
      name: influencer.name,
      category: influencer.category,
      bio: influencer.bio,
      photoUrl: influencer.photoUrl,
      profileLink: influencer.profileLink,
    });
    setSaveError("");
    setEditModalOpen(true);
  }

  async function handleSaveEdit() {
    if (!editForm.name.trim()) return;
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/conteudo-influs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: influencer.id, ...editForm }),
      });
      if (!res.ok) throw new Error("Erro ao salvar");
      const updated: InfluencerConteudo = await res.json();
      onUpdate(updated);
      setEditModalOpen(false);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await fetch("/api/conteudo-influs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: influencer.id }),
      });
      onDelete();
    } finally {
      setDeleting(false);
    }
  }

  async function handleAddLink() {
    if (!linkForm.url.trim()) { setLinkError("URL obrigatória."); return; }
    setSavingLink(true);
    setLinkError("");
    try {
      const newLink: ContentLink = {
        id: Date.now().toString(),
        url: linkForm.url.trim(),
        descricao: linkForm.descricao.trim() || undefined,
        addedAt: new Date().toISOString(),
      };
      const contentLinks = [...influencer.contentLinks, newLink];
      const res = await fetch("/api/conteudo-influs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: influencer.id, contentLinks }),
      });
      if (!res.ok) throw new Error("Erro ao salvar link");
      const updated: InfluencerConteudo = await res.json();
      onUpdate(updated);
      setAddLinkOpen(false);
      setLinkForm({ url: "", descricao: "" });
    } catch (e) {
      setLinkError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSavingLink(false);
    }
  }

  async function handleRemoveLink(linkId: string) {
    const contentLinks = influencer.contentLinks.filter((l) => l.id !== linkId);
    const res = await fetch("/api/conteudo-influs", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: influencer.id, contentLinks }),
    });
    if (!res.ok) return;
    onUpdate(await res.json());
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5"
      >
        <ChevronLeft size={15} />
        Voltar para Conteúdo Influs
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-8 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-light flex items-center justify-center shrink-0 border border-gray-medium">
            {influencer.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={influencer.photoUrl} alt={influencer.name} className="w-full h-full object-cover" />
            ) : (
              <User size={26} className="text-muted-foreground" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-700">{influencer.name}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <TipoBadge tipo={influencer.tipo} />
              {influencer.category && <Badge variant="muted">{influencer.category}</Badge>}
              {influencer.profileLink && (
                <a
                  href={influencer.profileLink.startsWith("http") ? influencer.profileLink : `https://${influencer.profileLink}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-black hover:underline"
                >
                  <Globe size={11} />
                  {influencer.profileLink.replace(/^https?:\/\//, "")}
                </a>
              )}
            </div>
            {influencer.bio && (
              <p className="text-xs text-muted-foreground leading-relaxed mt-2 max-w-md">{influencer.bio}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="outline" size="sm" onClick={openEdit}>
            <Pencil size={13} />
            Editar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteConfirmOpen(true)}
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 size={13} />
          </Button>
        </div>
      </div>

      {/* Arquivo de vídeo */}
      <div className="mb-8">
        <p className="text-xs font-600 uppercase tracking-wide text-muted-foreground mb-3">
          Arquivo de vídeo
        </p>
        <FileUpload section={section} />
      </div>

      {/* Links de conteúdo */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-600 uppercase tracking-wide text-muted-foreground">
            Links de conteúdo (Instagram, TikTok, YouTube...)
          </p>
          {!addLinkOpen && (
            <button
              onClick={() => { setAddLinkOpen(true); setLinkForm({ url: "", descricao: "" }); setLinkError(""); }}
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-black transition-colors"
            >
              <Plus size={12} />
              Adicionar link
            </button>
          )}
        </div>

        {influencer.contentLinks.length === 0 && !addLinkOpen ? (
          <div className="border border-dashed border-gray-medium rounded-xl py-10 text-center">
            <Link2 size={22} className="mx-auto mb-2 text-muted-foreground opacity-30" />
            <p className="text-sm text-muted-foreground">Nenhum link de conteúdo ainda.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 mb-3">
            {influencer.contentLinks.map((link) => (
              <div key={link.id} className="flex items-start gap-2.5 rounded-lg border border-gray-medium bg-white p-3">
                <PlayCircle size={15} className="text-muted-foreground shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-medium text-black hover:underline underline-offset-2 break-all"
                  >
                    {link.url}
                    <ExternalLink size={11} className="shrink-0" />
                  </a>
                  {link.descricao && (
                    <p className="mt-1 text-xs text-muted-foreground">{link.descricao}</p>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveLink(link.id)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                  title="Remover"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}

        {addLinkOpen && (
          <div className="rounded-lg border border-gray-medium bg-gray-light/40 p-3.5 flex flex-col gap-3">
            <Input
              label="URL do conteúdo *"
              value={linkForm.url}
              onChange={(e) => setLinkForm((f) => ({ ...f, url: e.target.value }))}
              placeholder="https://www.instagram.com/reel/..."
              autoFocus
            />
            <Input
              label="Descrição (opcional)"
              value={linkForm.descricao}
              onChange={(e) => setLinkForm((f) => ({ ...f, descricao: e.target.value }))}
              placeholder="Ex: Vídeo de divulgação do coworking"
            />
            {linkError && <p className="text-xs text-red-500">{linkError}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setAddLinkOpen(false)} disabled={savingLink}>
                Cancelar
              </Button>
              <Button size="sm" onClick={handleAddLink} disabled={savingLink}>
                {savingLink && <Loader2 size={13} className="animate-spin" />}
                Adicionar
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Edit modal */}
      <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)} title="Editar influenciador" className="max-w-lg">
        <div className="flex flex-col gap-4">
          <PhotoUploadInf value={editForm.photoUrl} onChange={(v) => setEditForm((f) => ({ ...f, photoUrl: v }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Nome *" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} autoFocus />
            <Input label="Nicho / Categoria" value={editForm.category} onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))} placeholder="Ex: Lifestyle, Tech…" />
          </div>
          <Textarea label="Bio" value={editForm.bio} onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))} placeholder="Breve descrição do influenciador e da parceria…" rows={3} />
          <Input label="Perfil / Link" value={editForm.profileLink} onChange={(e) => setEditForm((f) => ({ ...f, profileLink: e.target.value }))} placeholder="https://instagram.com/…" />
          {saveError && <p className="text-xs text-red-500">{saveError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setEditModalOpen(false)} disabled={saving}>Cancelar</Button>
            <Button size="sm" onClick={handleSaveEdit} disabled={saving || !editForm.name.trim()}>
              {saving && <Loader2 size={13} className="animate-spin" />}
              Salvar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Excluir influenciador"
        description={`Remover "${influencer.name}" e todos os links de conteúdo cadastrados? Esta ação não pode ser desfeita.`}
      >
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => setDeleteConfirmOpen(false)} disabled={deleting}>Cancelar</Button>
          <Button size="sm" onClick={handleDelete} disabled={deleting} className="bg-red-500 text-white hover:bg-red-600">
            {deleting && <Loader2 size={13} className="animate-spin" />}
            Excluir
          </Button>
        </div>
      </Modal>
    </div>
  );
}

type ContentSubTab = "todos" | "fixos" | "avulsos";

const CONTENT_SUB_TABS: { key: ContentSubTab; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "fixos", label: "Fixos" },
  { key: "avulsos", label: "Avulsos" },
];

function ConteudoInflusTab() {
  const [influencers, setInfluencers] = useState<InfluencerConteudo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [subTab, setSubTab] = useState<ContentSubTab>("todos");

  // Fixo creation
  const [fixoModalOpen, setFixoModalOpen] = useState(false);
  const [fixoForm, setFixoForm] = useState(EMPTY_FIXO_FORM);
  const [savingFixo, setSavingFixo] = useState(false);
  const [fixoError, setFixoError] = useState("");

  // Avulso creation
  const [avulsoModalOpen, setAvulsoModalOpen] = useState(false);
  const [avulsoForm, setAvulsoForm] = useState(EMPTY_AVULSO_FORM);
  const [savingAvulso, setSavingAvulso] = useState(false);
  const [avulsoError, setAvulsoError] = useState("");

  // Avulso edit / delete (no dedicated screen — just a lightweight modal)
  const [avulsoEditTarget, setAvulsoEditTarget] = useState<InfluencerConteudo | null>(null);
  const [avulsoEditForm, setAvulsoEditForm] = useState({ name: "", instagram: "" });
  const [savingAvulsoEdit, setSavingAvulsoEdit] = useState(false);
  const [avulsoEditError, setAvulsoEditError] = useState("");
  const [avulsoDeleteTarget, setAvulsoDeleteTarget] = useState<InfluencerConteudo | null>(null);
  const [deletingAvulso, setDeletingAvulso] = useState(false);

  // Avulso content links (managed live from within the edit modal)
  const [avulsoLinkForm, setAvulsoLinkForm] = useState({ url: "", descricao: "" });
  const [savingAvulsoLink, setSavingAvulsoLink] = useState(false);
  const [avulsoLinkError, setAvulsoLinkError] = useState("");

  const fetchInfluencers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/conteudo-influs");
      if (res.ok) setInfluencers(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInfluencers(); }, [fetchInfluencers]);

  function openFixoCreate() {
    setFixoForm(EMPTY_FIXO_FORM);
    setFixoError("");
    setFixoModalOpen(true);
  }

  async function handleCreateFixo() {
    if (!fixoForm.name.trim()) { setFixoError("Nome obrigatório."); return; }
    setSavingFixo(true);
    setFixoError("");
    try {
      const res = await fetch("/api/conteudo-influs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...fixoForm, tipo: "fixo" }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Erro ao criar");
      const created: InfluencerConteudo = await res.json();
      setInfluencers((prev) => [...prev, created]);
      setFixoModalOpen(false);
      setSelectedId(created.id);
    } catch (e) {
      setFixoError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setSavingFixo(false);
    }
  }

  function openAvulsoCreate() {
    setAvulsoForm(EMPTY_AVULSO_FORM);
    setAvulsoError("");
    setAvulsoModalOpen(true);
  }

  async function handleCreateAvulso() {
    if (!avulsoForm.name.trim() || !avulsoForm.instagram.trim() || !avulsoForm.contentLink.trim()) {
      setAvulsoError("Nome, @ do Instagram e link do conteúdo são obrigatórios.");
      return;
    }
    setSavingAvulso(true);
    setAvulsoError("");
    try {
      const res = await fetch("/api/conteudo-influs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...avulsoForm, tipo: "avulso" }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Erro ao criar");
      const created: InfluencerConteudo = await res.json();
      setInfluencers((prev) => [...prev, created]);
      setAvulsoModalOpen(false);
    } catch (e) {
      setAvulsoError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setSavingAvulso(false);
    }
  }

  function openAvulsoEdit(inf: InfluencerConteudo) {
    setAvulsoEditForm({ name: inf.name, instagram: inf.instagram });
    setAvulsoEditError("");
    setAvulsoLinkForm({ url: "", descricao: "" });
    setAvulsoLinkError("");
    setAvulsoEditTarget(inf);
  }

  async function handleSaveAvulsoEdit() {
    if (!avulsoEditTarget) return;
    if (!avulsoEditForm.name.trim() || !avulsoEditForm.instagram.trim()) {
      setAvulsoEditError("Nome e @ do Instagram são obrigatórios.");
      return;
    }
    setSavingAvulsoEdit(true);
    setAvulsoEditError("");
    try {
      const res = await fetch("/api/conteudo-influs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: avulsoEditTarget.id,
          name: avulsoEditForm.name.trim(),
          instagram: avulsoEditForm.instagram.trim(),
        }),
      });
      if (!res.ok) throw new Error("Erro ao salvar");
      const updated: InfluencerConteudo = await res.json();
      setInfluencers((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      setAvulsoEditTarget(null);
    } catch (e) {
      setAvulsoEditError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSavingAvulsoEdit(false);
    }
  }

  async function handleAddAvulsoLink() {
    if (!avulsoEditTarget) return;
    if (!avulsoLinkForm.url.trim()) { setAvulsoLinkError("URL obrigatória."); return; }
    setSavingAvulsoLink(true);
    setAvulsoLinkError("");
    try {
      const newLink: ContentLink = {
        id: Date.now().toString(),
        url: avulsoLinkForm.url.trim(),
        descricao: avulsoLinkForm.descricao.trim() || undefined,
        addedAt: new Date().toISOString(),
      };
      const contentLinks = [...avulsoEditTarget.contentLinks, newLink];
      const res = await fetch("/api/conteudo-influs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: avulsoEditTarget.id, contentLinks }),
      });
      if (!res.ok) throw new Error("Erro ao salvar link");
      const updated: InfluencerConteudo = await res.json();
      setInfluencers((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      setAvulsoEditTarget(updated);
      setAvulsoLinkForm({ url: "", descricao: "" });
    } catch (e) {
      setAvulsoLinkError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSavingAvulsoLink(false);
    }
  }

  async function handleRemoveAvulsoLink(linkId: string) {
    if (!avulsoEditTarget) return;
    const contentLinks = avulsoEditTarget.contentLinks.filter((l) => l.id !== linkId);
    const res = await fetch("/api/conteudo-influs", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: avulsoEditTarget.id, contentLinks }),
    });
    if (!res.ok) return;
    const updated: InfluencerConteudo = await res.json();
    setInfluencers((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    setAvulsoEditTarget(updated);
  }

  async function handleDeleteAvulso() {
    if (!avulsoDeleteTarget) return;
    setDeletingAvulso(true);
    try {
      await fetch("/api/conteudo-influs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: avulsoDeleteTarget.id }),
      });
      setInfluencers((prev) => prev.filter((i) => i.id !== avulsoDeleteTarget.id));
      setAvulsoDeleteTarget(null);
    } finally {
      setDeletingAvulso(false);
    }
  }

  const selected = influencers.find((i) => i.id === selectedId) ?? null;

  if (selected) {
    return (
      <InfluencerDetailScreen
        influencer={selected}
        onBack={() => setSelectedId(null)}
        onUpdate={(updated) => setInfluencers((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))}
        onDelete={() => {
          setInfluencers((prev) => prev.filter((i) => i.id !== selected.id));
          setSelectedId(null);
        }}
      />
    );
  }

  const filteredInfluencers = influencers.filter((inf) => {
    if (subTab === "fixos") return inf.tipo === "fixo";
    if (subTab === "avulsos") return inf.tipo === "avulso";
    return true;
  });

  return (
    <>
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Cadastre influenciadores parceiros e os vídeos/conteúdos que eles postaram.
        </p>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={openFixoCreate}>
            <Plus size={14} />
            Influenciador Fixo
          </Button>
          <Button variant="default" size="sm" onClick={openAvulsoCreate}>
            <Plus size={14} />
            Influenciador Avulso
          </Button>
        </div>
      </div>

      {/* Sub-tabs: Todos / Fixos / Avulsos */}
      <div className="flex gap-1 bg-gray-light p-1 rounded-lg w-fit mb-6">
        {CONTENT_SUB_TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSubTab(key)}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
              subTab === key
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm py-10">
          <Loader2 size={14} className="animate-spin" /> Carregando…
        </div>
      ) : influencers.length === 0 ? (
        <div className="border border-dashed border-gray-medium rounded-xl p-16 text-center">
          <Video size={32} className="mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="text-sm font-medium text-gray-dark mb-1">Nenhum influenciador cadastrado ainda</p>
          <p className="text-xs text-muted-foreground mb-5">
            Cadastre um influenciador Fixo ou Avulso para começar a registrar os conteúdos.
          </p>
        </div>
      ) : filteredInfluencers.length === 0 ? (
        <div className="border border-dashed border-gray-medium rounded-xl p-16 text-center">
          <Video size={32} className="mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="text-sm font-medium text-gray-dark mb-1">
            Nenhum influenciador {subTab === "fixos" ? "Fixo" : "Avulso"} cadastrado ainda
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInfluencers.map((inf) =>
            inf.tipo === "fixo" ? (
              <button key={inf.id} onClick={() => setSelectedId(inf.id)} className="text-left">
                <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-0">
                    <div className="h-28 bg-gray-light flex items-center justify-center overflow-hidden">
                      {inf.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={inf.photoUrl} alt={inf.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gray-medium flex items-center justify-center">
                          <User size={24} className="text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-sm text-black truncate">{inf.name}</h3>
                        <TipoBadge tipo={inf.tipo} />
                      </div>
                      {inf.category && <Badge variant="muted" className="mt-1">{inf.category}</Badge>}
                      <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1.5">
                        <Video size={12} />
                        {inf.contentLinks.length} {inf.contentLinks.length === 1 ? "conteúdo" : "conteúdos"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </button>
            ) : (
              <Card key={inf.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm text-black truncate">{inf.name}</h3>
                    <TipoBadge tipo={inf.tipo} />
                  </div>
                  {inf.instagram && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {inf.instagram.startsWith("@") ? inf.instagram : `@${inf.instagram}`}
                    </p>
                  )}

                  <div className="flex flex-col gap-1.5 mt-3">
                    {inf.contentLinks.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Nenhum link de conteúdo ainda.</p>
                    ) : (
                      inf.contentLinks.map((link) => (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-black hover:underline underline-offset-2 truncate"
                        >
                          <PlayCircle size={12} className="shrink-0" />
                          <span className="truncate">{link.descricao || "Assistir conteúdo"}</span>
                        </a>
                      ))
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-medium">
                    <span className="text-xs text-muted-foreground">
                      {inf.contentLinks.length} {inf.contentLinks.length === 1 ? "conteúdo" : "conteúdos"}
                    </span>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button onClick={() => openAvulsoEdit(inf)} className="p-1 rounded-md text-muted-foreground hover:text-black hover:bg-gray-light transition-colors" title="Editar">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => setAvulsoDeleteTarget(inf)} className="p-1 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors" title="Excluir">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          )}
        </div>
      )}

      {/* Create Fixo modal */}
      <Modal open={fixoModalOpen} onClose={() => setFixoModalOpen(false)} title="Adicionar influenciador Fixo" className="max-w-lg">
        <div className="flex flex-col gap-4">
          <PhotoUploadInf value={fixoForm.photoUrl} onChange={(v) => setFixoForm((f) => ({ ...f, photoUrl: v }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Nome *" value={fixoForm.name} onChange={(e) => setFixoForm((f) => ({ ...f, name: e.target.value }))} placeholder="Nome do influenciador" autoFocus />
            <Input label="Nicho / Categoria" value={fixoForm.category} onChange={(e) => setFixoForm((f) => ({ ...f, category: e.target.value }))} placeholder="Ex: Lifestyle, Tech…" />
          </div>
          <Textarea label="Bio" value={fixoForm.bio} onChange={(e) => setFixoForm((f) => ({ ...f, bio: e.target.value }))} placeholder="Breve descrição do influenciador e da parceria…" rows={3} />
          <Input label="Perfil / Link" value={fixoForm.profileLink} onChange={(e) => setFixoForm((f) => ({ ...f, profileLink: e.target.value }))} placeholder="https://instagram.com/…" />
          {fixoError && <p className="text-xs text-red-500">{fixoError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setFixoModalOpen(false)} disabled={savingFixo}>Cancelar</Button>
            <Button variant="default" size="sm" onClick={handleCreateFixo} disabled={savingFixo || !fixoForm.name.trim()}>
              {savingFixo && <Loader2 size={13} className="animate-spin" />}
              Adicionar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create Avulso modal */}
      <Modal
        open={avulsoModalOpen}
        onClose={() => setAvulsoModalOpen(false)}
        title="Adicionar influenciador Avulso"
        description="Cadastro rápido: nome, @ do Instagram e o link do conteúdo publicado. Você poderá adicionar mais links depois, editando este mesmo perfil."
        className="max-w-md"
      >
        <div className="flex flex-col gap-4">
          <Input label="Nome *" value={avulsoForm.name} onChange={(e) => setAvulsoForm((f) => ({ ...f, name: e.target.value }))} placeholder="Nome do influenciador" autoFocus />
          <Input label="@ do Instagram *" value={avulsoForm.instagram} onChange={(e) => setAvulsoForm((f) => ({ ...f, instagram: e.target.value }))} placeholder="@usuario" />
          <Input label="Link do conteúdo *" value={avulsoForm.contentLink} onChange={(e) => setAvulsoForm((f) => ({ ...f, contentLink: e.target.value }))} placeholder="https://www.instagram.com/reel/..." />
          {avulsoError && <p className="text-xs text-red-500">{avulsoError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setAvulsoModalOpen(false)} disabled={savingAvulso}>Cancelar</Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleCreateAvulso}
              disabled={savingAvulso || !avulsoForm.name.trim() || !avulsoForm.instagram.trim() || !avulsoForm.contentLink.trim()}
            >
              {savingAvulso && <Loader2 size={13} className="animate-spin" />}
              Adicionar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Avulso modal */}
      <Modal
        open={!!avulsoEditTarget}
        onClose={() => setAvulsoEditTarget(null)}
        title="Editar influenciador Avulso"
        className="max-w-md"
      >
        {avulsoEditTarget && (
          <div className="flex flex-col gap-4">
            <Input label="Nome *" value={avulsoEditForm.name} onChange={(e) => setAvulsoEditForm((f) => ({ ...f, name: e.target.value }))} autoFocus />
            <Input label="@ do Instagram *" value={avulsoEditForm.instagram} onChange={(e) => setAvulsoEditForm((f) => ({ ...f, instagram: e.target.value }))} placeholder="@usuario" />
            {avulsoEditError && <p className="text-xs text-red-500">{avulsoEditError}</p>}
            <div className="flex justify-end gap-2">
              <Button size="sm" onClick={handleSaveAvulsoEdit} disabled={savingAvulsoEdit}>
                {savingAvulsoEdit && <Loader2 size={13} className="animate-spin" />}
                Salvar
              </Button>
            </div>

            <div className="border-t border-gray-medium pt-4">
              <p className="text-xs font-600 uppercase tracking-wide text-muted-foreground mb-3">
                Links de conteúdo
              </p>

              {avulsoEditTarget.contentLinks.length > 0 && (
                <div className="flex flex-col gap-2 mb-3">
                  {avulsoEditTarget.contentLinks.map((link) => (
                    <div key={link.id} className="flex items-start gap-2.5 rounded-lg border border-gray-medium bg-white p-2.5">
                      <PlayCircle size={14} className="text-muted-foreground shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm font-medium text-black hover:underline underline-offset-2 break-all"
                        >
                          {link.url}
                          <ExternalLink size={11} className="shrink-0" />
                        </a>
                        {link.descricao && <p className="mt-1 text-xs text-muted-foreground">{link.descricao}</p>}
                      </div>
                      <button
                        onClick={() => handleRemoveAvulsoLink(link.id)}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                        title="Remover"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="rounded-lg border border-gray-medium bg-gray-light/40 p-3 flex flex-col gap-2.5">
                <Input
                  label="Adicionar novo link"
                  value={avulsoLinkForm.url}
                  onChange={(e) => setAvulsoLinkForm((f) => ({ ...f, url: e.target.value }))}
                  placeholder="https://www.instagram.com/reel/..."
                />
                <Input
                  label="Descrição (opcional)"
                  value={avulsoLinkForm.descricao}
                  onChange={(e) => setAvulsoLinkForm((f) => ({ ...f, descricao: e.target.value }))}
                  placeholder="Ex: Vídeo de divulgação do coworking"
                />
                {avulsoLinkError && <p className="text-xs text-red-500">{avulsoLinkError}</p>}
                <Button size="sm" onClick={handleAddAvulsoLink} disabled={savingAvulsoLink} className="self-end">
                  {savingAvulsoLink && <Loader2 size={13} className="animate-spin" />}
                  Adicionar link
                </Button>
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={() => setAvulsoEditTarget(null)}>Fechar</Button>
          </div>
        )}
      </Modal>

      {/* Delete Avulso confirmation */}
      <Modal
        open={!!avulsoDeleteTarget}
        onClose={() => setAvulsoDeleteTarget(null)}
        title="Excluir influenciador"
        description={`Remover "${avulsoDeleteTarget?.name}"? Esta ação não pode ser desfeita.`}
      >
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => setAvulsoDeleteTarget(null)} disabled={deletingAvulso}>Cancelar</Button>
          <Button size="sm" onClick={handleDeleteAvulso} disabled={deletingAvulso} className="bg-red-500 text-white hover:bg-red-600">
            {deletingAvulso && <Loader2 size={13} className="animate-spin" />}
            Excluir
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
  { key: "conteudo-influs", label: "Conteúdo Influs" },
  { key: "calendario-influ", label: "Calendário Influ (Avulso)" },
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
      {tab === "conteudo-influs" && <ConteudoInflusTab />}
      {tab === "calendario-influ" && <CalendarioInfluTab />}
    </div>
  );
}
