"use client";

import { useState, useEffect, useCallback } from "react";
import { FileUpload } from "@/components/upload/FileUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { MarkdownContent } from "@/components/ui/markdown-content";
import { cn } from "@/lib/utils";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  FileText,
  Search,
  Video,
  ChevronDown,
  ExternalLink,
  Link2,
  ShoppingBag,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Doc {
  id: string;
  name: string;
  content: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ─── Reusable documents panel ────────────────────────────────────────────────

interface DocumentsPanelProps {
  apiPath: string;
  newLabel: string;
  emptyTitle: string;
  emptyDesc: string;
}

function DocumentsPanel({ apiPath, newLabel, emptyTitle, emptyDesc }: DocumentsPanelProps) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Doc | null>(null);
  const [formName, setFormName] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Doc | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(apiPath);
      if (!res.ok) throw new Error("Erro ao carregar");
      const data: Doc[] = await res.json();
      setDocs(data);
      if (data.length > 0) setSelectedId((prev) => prev ?? data[0].id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, [apiPath]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const filtered = docs.filter((d) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return d.name.toLowerCase().includes(q) || d.content.toLowerCase().includes(q);
  });

  function openCreate() {
    setEditTarget(null);
    setFormName("");
    setFormContent("");
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(doc: Doc) {
    setEditTarget(doc);
    setFormName(doc.name);
    setFormContent(doc.content);
    setFormError("");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditTarget(null);
    setFormName("");
    setFormContent("");
    setFormError("");
  }

  async function handleSave() {
    if (!formName.trim()) {
      setFormError("O nome é obrigatório.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      if (editTarget) {
        const res = await fetch(apiPath, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editTarget.id, name: formName.trim(), content: formContent }),
        });
        if (!res.ok) throw new Error("Erro ao atualizar");
        const updated: Doc = await res.json();
        setDocs((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
        setSelectedId(updated.id);
      } else {
        const res = await fetch(apiPath, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: formName.trim(), content: formContent }),
        });
        if (!res.ok) throw new Error("Erro ao criar");
        const created: Doc = await res.json();
        setDocs((prev) => [...prev, created]);
        setSelectedId(created.id);
        setSearch("");
      }
      closeModal();
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
      const res = await fetch(apiPath, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteTarget.id }),
      });
      if (!res.ok) throw new Error("Erro ao excluir");
      const remaining = docs.filter((d) => d.id !== deleteTarget.id);
      setDocs(remaining);
      if (selectedId === deleteTarget.id) {
        setSelectedId(remaining.length > 0 ? remaining[0].id : null);
      }
      setDeleteTarget(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao excluir");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  const selected = docs.find((d) => d.id === selectedId) ?? null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted-foreground">
          {docs.length} {docs.length === 1 ? "documento" : "documentos"}
        </span>
        <Button variant="default" size="sm" onClick={openCreate}>
          <Plus size={14} />
          {newLabel}
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 size={20} className="animate-spin mr-2" />
          <span className="text-sm">Carregando...</span>
        </div>
      ) : docs.length === 0 ? (
        <div className="border border-dashed border-gray-medium rounded-lg p-12 text-center">
          <FileText size={32} className="mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="text-sm font-medium text-gray-dark mb-1">{emptyTitle}</p>
          <p className="text-xs text-muted-foreground mb-4">{emptyDesc}</p>
          <Button variant="outline" size="sm" onClick={openCreate}>
            <Plus size={14} />
            {newLabel}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-0 border border-gray-medium rounded-lg overflow-hidden min-h-[520px]">
          {/* Left panel */}
          <div className="w-full sm:w-56 shrink-0 border-b sm:border-b-0 sm:border-r border-gray-medium bg-gray-light flex flex-col max-h-56 sm:max-h-none">
            <div className="p-2 border-b border-gray-medium">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar..."
                  className="w-full pl-7 pr-2 py-1.5 text-xs rounded-md border border-gray-medium bg-white focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6 px-3">
                  Nenhum resultado para &quot;{search}&quot;
                </p>
              ) : (
                filtered.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedId(doc.id)}
                    className={cn(
                      "w-full text-left px-3 py-3 border-b border-gray-medium text-sm transition-colors",
                      selectedId === doc.id
                        ? "bg-black text-white"
                        : "text-gray-dark hover:bg-white"
                    )}
                  >
                    <span className="block truncate font-medium">{doc.name}</span>
                    <span
                      className={cn(
                        "block text-xs mt-0.5 truncate",
                        selectedId === doc.id ? "text-white/60" : "text-muted-foreground"
                      )}
                    >
                      {formatDate(doc.updatedAt)}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right panel */}
          <div className="flex-1 flex flex-col min-w-0 bg-white">
            {selected ? (
              <>
                <div className="flex items-start justify-between px-6 py-4 border-b border-gray-medium">
                  <div className="min-w-0 mr-4">
                    <h2 className="text-base font-semibold truncate">{selected.name}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Atualizado em {formatDate(selected.updatedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(selected)}>
                      <Pencil size={14} />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(selected)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
                <div className="flex-1 p-6 overflow-y-auto">
                  <MarkdownContent content={selected.content} />
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <p className="text-sm">Selecione um documento para visualizar.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editTarget ? `Editar: ${editTarget.name}` : newLabel}
        description={
          editTarget
            ? "Edite o nome e o conteúdo. Use # para títulos, **negrito**, *itálico* e - para listas."
            : "Preencha o nome e o conteúdo. Use # para títulos, **negrito**, *itálico* e - para listas."
        }
        className="max-w-2xl"
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Nome"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="Ex: Script de abordagem inicial"
            autoFocus
          />
          <Textarea
            label="Conteúdo"
            value={formContent}
            onChange={(e) => setFormContent(e.target.value)}
            placeholder="# Título&#10;&#10;Conteúdo do documento..."
            rows={16}
            className="text-sm leading-relaxed"
          />
          {formError && <p className="text-xs text-red-500">{formError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={closeModal} disabled={saving}>
              Cancelar
            </Button>
            <Button variant="default" size="sm" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 size={13} className="animate-spin" />}
              {editTarget ? "Salvar alterações" : "Criar"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Excluir documento"
        description={`Tem certeza que deseja excluir "${deleteTarget?.name}"? Esta ação não pode ser desfeita.`}
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
            Excluir
          </Button>
        </div>
      </Modal>
    </div>
  );
}

// ─── Conteúdos para Vendas (Posts & Links) ───────────────────────────────────

interface ConteudoVendas {
  id: string;
  url: string;
  descricao: string;
  produto: string;
  createdAt: string;
}

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

// ─── Video Grupos Tab ─────────────────────────────────────────────────────────

interface VideoLink {
  id: string;
  url: string;
  descricao?: string;
  addedAt: string;
}

interface VideoGrupo {
  id: string;
  name: string;
  createdAt: string;
  links?: VideoLink[];
}

function VideoGruposTab({ tipo, descricao }: { tipo: string; descricao: string }) {
  const [grupos, setGrupos] = useState<VideoGrupo[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // Create group
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [createError, setCreateError] = useState("");
  // Delete group
  const [deleteTarget, setDeleteTarget] = useState<VideoGrupo | null>(null);
  const [deleting, setDeleting] = useState(false);
  // Add Instagram link
  const [addLinkGrupoId, setAddLinkGrupoId] = useState<string | null>(null);
  const [linkForm, setLinkForm] = useState({ url: "", descricao: "" });
  const [savingLink, setSavingLink] = useState(false);
  const [linkError, setLinkError] = useState("");

  const fetchGrupos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/video-grupos?type=${tipo}`);
      if (res.ok) setGrupos(await res.json());
    } finally {
      setLoading(false);
    }
  }, [tipo]);

  useEffect(() => { fetchGrupos(); }, [fetchGrupos]);

  function openCreate() {
    setNewName("");
    setCreateError("");
    setCreateOpen(true);
  }

  async function handleCreate() {
    if (!newName.trim()) { setCreateError("Nome obrigatório."); return; }
    setSaving(true);
    setCreateError("");
    try {
      const res = await fetch("/api/video-grupos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: tipo, name: newName.trim() }),
      });
      if (!res.ok) throw new Error("Erro ao criar");
      const created: VideoGrupo = await res.json();
      setGrupos((prev) => [...prev, created]);
      setExpandedId(created.id);
      setNewName("");
      setCreateOpen(false);
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Erro ao criar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch("/api/video-grupos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: tipo, id: deleteTarget.id }),
      });
      setGrupos((prev) => prev.filter((g) => g.id !== deleteTarget.id));
      if (expandedId === deleteTarget.id) setExpandedId(null);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  async function handleAddLink(grupoId: string) {
    if (!linkForm.url.trim()) { setLinkError("URL obrigatória."); return; }
    setSavingLink(true);
    setLinkError("");
    try {
      const grupo = grupos.find((g) => g.id === grupoId)!;
      const newLink: VideoLink = {
        id: crypto.randomUUID(),
        url: linkForm.url.trim(),
        descricao: linkForm.descricao.trim() || undefined,
        addedAt: new Date().toISOString(),
      };
      const updatedLinks = [...(grupo.links ?? []), newLink];
      const res = await fetch("/api/video-grupos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: tipo, id: grupoId, links: updatedLinks }),
      });
      if (!res.ok) throw new Error("Erro ao salvar link");
      const updated: VideoGrupo = await res.json();
      setGrupos((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
      setAddLinkGrupoId(null);
      setLinkForm({ url: "", descricao: "" });
    } catch (e) {
      setLinkError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSavingLink(false);
    }
  }

  async function handleRemoveLink(grupoId: string, linkId: string) {
    const grupo = grupos.find((g) => g.id === grupoId);
    if (!grupo) return;
    const updatedLinks = (grupo.links ?? []).filter((l) => l.id !== linkId);
    const res = await fetch("/api/video-grupos", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: tipo, id: grupoId, links: updatedLinks }),
    });
    if (!res.ok) return;
    const updated: VideoGrupo = await res.json();
    setGrupos((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
  }

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-muted-foreground leading-relaxed">{descricao}</p>
        <Button variant="default" size="sm" onClick={openCreate} className="shrink-0 ml-4">
          <Plus size={14} />
          Novo Conjunto
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm py-10">
          <Loader2 size={14} className="animate-spin" /> Carregando…
        </div>
      ) : grupos.length === 0 ? (
        <div className="border border-dashed border-gray-medium rounded-xl py-14 text-center">
          <Video size={26} className="mx-auto mb-3 text-muted-foreground opacity-30" />
          <p className="text-sm font-medium text-muted-foreground mb-1">Nenhum conjunto ainda.</p>
          <p className="text-xs text-muted-foreground mb-5">
            Crie um conjunto para organizar os vídeos por produto.
          </p>
          <Button variant="outline" size="sm" onClick={openCreate}>
            <Plus size={13} />
            Novo Conjunto
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {grupos.map((grupo) => {
            const isOpen = expandedId === grupo.id;
            const section = `Vendas/Videos-${tipo}/${grupo.name.replace(/[^a-zA-ZÀ-ú0-9 _-]/g, "").trim().replace(/\s+/g, "-")}`;
            const links = grupo.links ?? [];
            return (
              <div key={grupo.id} className="border border-gray-medium rounded-xl overflow-hidden bg-white">
                {/* Group header */}
                <div className="flex items-center px-4 py-3 gap-2">
                  <button
                    onClick={() => setExpandedId(isOpen ? null : grupo.id)}
                    className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
                  >
                    <Video size={15} className="text-muted-foreground shrink-0" />
                    <span className="text-sm font-semibold text-foreground truncate">{grupo.name}</span>
                    {links.length > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 rounded-full bg-gray-light text-[10px] font-medium text-muted-foreground shrink-0">
                        {links.length} link{links.length > 1 ? "s" : ""}
                      </span>
                    )}
                    <ChevronDown
                      size={14}
                      className={cn(
                        "text-muted-foreground shrink-0 ml-auto transition-transform duration-200",
                        isOpen && "rotate-180"
                      )}
                    />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(grupo)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                    title="Excluir conjunto"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* Expanded content */}
                {isOpen && (
                  <div className="border-t border-gray-medium divide-y divide-gray-100">
                    {/* Upload de arquivo */}
                    <div className="px-4 py-4 bg-gray-light/30">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        Arquivo de vídeo
                      </p>
                      <FileUpload section={section} />
                    </div>

                    {/* Links do Instagram */}
                    <div className="px-4 py-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Link do Instagram
                        </p>
                        {addLinkGrupoId !== grupo.id && (
                          <button
                            onClick={() => {
                              setAddLinkGrupoId(grupo.id);
                              setLinkForm({ url: "", descricao: "" });
                              setLinkError("");
                            }}
                            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-black transition-colors"
                          >
                            <Plus size={12} />
                            Adicionar link
                          </button>
                        )}
                      </div>

                      {/* Link list */}
                      {links.length > 0 && (
                        <div className="flex flex-col gap-2 mb-3">
                          {links.map((link) => (
                            <div
                              key={link.id}
                              className="flex items-start gap-2.5 rounded-lg border border-gray-medium bg-white p-2.5"
                            >
                              <Link2 size={14} className="text-muted-foreground shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <a
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs font-medium text-black hover:underline underline-offset-2 break-all"
                                >
                                  {link.url}
                                  <ExternalLink size={10} className="shrink-0" />
                                </a>
                                {link.descricao && (
                                  <p className="text-xs text-muted-foreground mt-0.5">{link.descricao}</p>
                                )}
                              </div>
                              <button
                                onClick={() => handleRemoveLink(grupo.id, link.id)}
                                className="p-1 rounded text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                                title="Remover link"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Inline add link form */}
                      {addLinkGrupoId === grupo.id ? (
                        <div className="rounded-lg border border-gray-medium bg-gray-light/50 p-3 flex flex-col gap-2">
                          <Input
                            label=""
                            type="url"
                            value={linkForm.url}
                            onChange={(e) => setLinkForm((f) => ({ ...f, url: e.target.value }))}
                            placeholder="https://www.instagram.com/p/…"
                            autoFocus
                          />
                          <Input
                            label=""
                            value={linkForm.descricao}
                            onChange={(e) => setLinkForm((f) => ({ ...f, descricao: e.target.value }))}
                            placeholder="Descrição (opcional)"
                          />
                          {linkError && <p className="text-xs text-red-500">{linkError}</p>}
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setAddLinkGrupoId(null)}
                              disabled={savingLink}
                            >
                              Cancelar
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleAddLink(grupo.id)}
                              disabled={savingLink || !linkForm.url.trim()}
                            >
                              {savingLink && <Loader2 size={12} className="animate-spin" />}
                              Adicionar
                            </Button>
                          </div>
                        </div>
                      ) : links.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Nenhum link adicionado ainda.</p>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Novo Conjunto"
        description="Dê um nome ao conjunto de vídeos. Ex: Sala Privativa, Escritório Virtual…"
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Nome do conjunto *"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Ex: Sala Privativa, Coworking, Auditório…"
            autoFocus
          />
          {createError && <p className="text-xs text-red-500">{createError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleCreate} disabled={saving || !newName.trim()}>
              {saving && <Loader2 size={13} className="animate-spin" />}
              Criar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Excluir conjunto"
        description={`Tem certeza que deseja excluir o conjunto "${deleteTarget?.name}"? Os vídeos enviados também serão removidos.`}
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
            Excluir
          </Button>
        </div>
      </Modal>
    </>
  );
}

// ─── Process content types ────────────────────────────────────────────────────

type ContentBlock =
  | { type: "text"; content: string }
  | { type: "bullets"; items: string[] }
  | { type: "table"; headers: [string, string]; rows: { condition: string; rule: string }[] }
  | { type: "note"; text: string };

interface ProcessStep {
  number: number;
  title: string;
  content: ContentBlock[];
}

const ESCRITORIO_STEPS: ProcessStep[] = [
  {
    number: 1,
    title: "Envio de proposta",
    content: [{ type: "text", content: "Encaminhar a proposta formal por e-mail ao cliente." }],
  },
  {
    number: 2,
    title: "Aceite da proposta",
    content: [{ type: "text", content: "Com o aceite registrado por e-mail, iniciar o processo de assinatura do contrato." }],
  },
  {
    number: 3,
    title: "Contrato",
    content: [{
      type: "bullets",
      items: [
        "Coletar a documentação do cliente",
        "Elaborar e revisar a minuta contratual",
        "Enviar a minuta para aprovação interna antes de qualquer envio ao cliente",
        "Após aprovação interna, encaminhar a minuta por e-mail ao cliente",
        "Com o aval do cliente, enviar via D4Sign para assinatura",
      ],
    }],
  },
  {
    number: 4,
    title: "Faturamento",
    content: [
      { type: "text", content: "Com o contrato assinado, emitir a primeira fatura observando a seguinte regra:" },
      {
        type: "table",
        headers: ["Situação", "Regra"],
        rows: [{ condition: "Início no dia 21 ou depois", rule: "Emitir pro-rata do mês corrente + mês seguinte" }],
      },
      { type: "note", text: "O cliente deve ser informado sobre esse critério antes da assinatura do contrato." },
    ],
  },
  {
    number: 5,
    title: "Onboarding",
    content: [
      { type: "text", content: "Com o pagamento confirmado, enviar e-mail de onboarding conectando o cliente à equipe de Operação." },
      { type: "text", content: "A partir deste ponto, a condução do processo passa a ser responsabilidade da Unidade." },
    ],
  },
  {
    number: 6,
    title: "Arquivamento",
    content: [{ type: "text", content: "Anexar as minutas assinadas ao dashboard do cliente." }],
  },
];

const EVENTOS_STEPS: ProcessStep[] = [
  {
    number: 1,
    title: "Envio de proposta",
    content: [{ type: "text", content: "Encaminhar a proposta formal por e-mail ao cliente." }],
  },
  {
    number: 2,
    title: "Aceite da proposta",
    content: [{ type: "text", content: "Com o aceite registrado por e-mail, iniciar o processo de assinatura do Termo de Compromisso." }],
  },
  {
    number: 3,
    title: "Termo de Compromisso",
    content: [{
      type: "bullets",
      items: [
        "Coletar os dados do cliente",
        "Elaborar e revisar o Termo",
        "Enviar o Termo por e-mail para aprovação do cliente",
        "Após aprovação, encaminhar via D4Sign para assinatura",
      ],
    }],
  },
  {
    number: 4,
    title: "Faturamento",
    content: [
      { type: "text", content: "Com o Termo assinado, emitir a primeira fatura conforme a condição negociada:" },
      {
        type: "table",
        headers: ["Condição", "Regra"],
        rows: [
          { condition: "1×", rule: "Valor integral até 7 dias antes da data do evento" },
          { condition: "2×", rule: "50% para reserva da data + 50% até 7 dias antes do evento" },
        ],
      },
      { type: "note", text: "As condições de rescisão e multa estão previstas no Termo." },
    ],
  },
  {
    number: 5,
    title: "Onboarding",
    content: [
      { type: "text", content: "Com o primeiro pagamento confirmado, enviar e-mail de onboarding conectando o cliente à equipe de Operação." },
      { type: "text", content: "A partir deste ponto, a condução do processo passa a ser responsabilidade da Unidade." },
    ],
  },
];

function StepView({ step, isLast }: { step: ProcessStep; isLast: boolean }) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center shrink-0">
        <div className="w-7 h-7 rounded-full bg-[#FFD400] flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-black leading-none">{step.number}</span>
        </div>
        {!isLast && <div className="flex-1 w-px bg-gray-200 mt-1.5" />}
      </div>
      <div className={cn("flex-1 min-w-0", !isLast && "pb-7")}>
        <h3 className="text-sm font-bold text-gray-900 mb-2.5 leading-tight pt-0.5">{step.title}</h3>
        <div className="space-y-3">
          {step.content.map((block, i) => {
            if (block.type === "text") {
              return (
                <p key={i} className="text-sm text-gray-700 leading-relaxed">{block.content}</p>
              );
            }
            if (block.type === "bullets") {
              return (
                <ul key={i} className="space-y-2">
                  {block.items.map((item, j) => (
                    <li key={j} className="flex gap-2.5 text-sm text-gray-700 leading-snug">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#FFD400] shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              );
            }
            if (block.type === "table") {
              return (
                <div key={i} className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b-2 border-[#FFD400]">
                        {block.headers.map((h, hi) => (
                          <th key={hi} className="text-left py-2 pr-6 text-[11px] font-bold text-gray-900 uppercase tracking-wider">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {block.rows.map((row, ri) => (
                        <tr key={ri} className="border-b border-gray-100 last:border-0">
                          <td className="py-2.5 pr-6 text-sm font-semibold text-gray-900 whitespace-nowrap">{row.condition}</td>
                          <td className="py-2.5 text-sm text-gray-700">{row.rule}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            }
            if (block.type === "note") {
              return (
                <div key={i} className="border-l-[3px] border-[#FFD400] bg-gray-50 px-4 py-3 rounded-r-md">
                  <p className="text-xs text-gray-700 leading-relaxed">{block.text}</p>
                </div>
              );
            }
            return null;
          })}
        </div>
      </div>
    </div>
  );
}

interface ProcessCardProps {
  label: string;
  title: string;
  steps: ProcessStep[];
}

function ProcessCard({ label, title, steps }: ProcessCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm flex flex-col">
      {/* Card header */}
      <div className="bg-black px-6 py-5 shrink-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#FFD400] mb-1">{label}</p>
        <h2 className="text-base font-bold text-white leading-snug">{title}</h2>
      </div>
      {/* Steps */}
      <div className="px-6 py-6 flex-1">
        {steps.map((step, i) => (
          <StepView key={step.number} step={step} isLast={i === steps.length - 1} />
        ))}
      </div>
      {/* Footer */}
      <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 shrink-0">
        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">
          Documento interno · Uso: time comercial e operação
        </p>
      </div>
    </div>
  );
}

function ProcessosFechamento() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-base font-semibold text-gray-900">Processos de Fechamento e Cancelamento</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Fluxo padrão de fechamento por tipo de produto · siga a sequência de etapas em cada negociação.
        </p>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <ProcessCard
          label="Processo de Fechamento"
          title="Escritório Privativo"
          steps={ESCRITORIO_STEPS}
        />
        <ProcessCard
          label="Processo de Fechamento"
          title="Eventos"
          steps={EVENTOS_STEPS}
        />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type MainTab = "arquivos" | "scripts" | "descontos" | "processos" | "conteudo-vendas";
type ScriptSubTab = "scripts" | "fups" | "keypoints" | "sla";
type ConteudoSubTab = "posts" | "carro-chefe" | "sazonais" | "depoimentos" | "influs";

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap",
        active
          ? "border-black text-black"
          : "border-transparent text-muted-foreground hover:text-black"
      )}
    >
      {label}
    </button>
  );
}

function SubTabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
        active
          ? "bg-black text-white"
          : "text-muted-foreground hover:bg-gray-light hover:text-black"
      )}
    >
      {label}
    </button>
  );
}

export default function ComercialPage() {
  const [mainTab, setMainTab] = useState<MainTab>("scripts");
  const [scriptSubTab, setScriptSubTab] = useState<ScriptSubTab>("scripts");
  const [conteudoSubTab, setConteudoSubTab] = useState<ConteudoSubTab>("posts");

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Vendas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Arquivos, scripts e diretrizes comerciais para o time de vendas.
        </p>
      </div>

      {/* Main tabs */}
      <div className="flex gap-1 border-b border-gray-medium mb-8 overflow-x-auto scrollbar-hide">
        <TabButton label="Arquivos" active={mainTab === "arquivos"} onClick={() => setMainTab("arquivos")} />
        <TabButton label="Scripts Comerciais" active={mainTab === "scripts"} onClick={() => setMainTab("scripts")} />
        <TabButton label="Diretrizes de Desconto" active={mainTab === "descontos"} onClick={() => setMainTab("descontos")} />
        <TabButton label="Processos de Fechamento" active={mainTab === "processos"} onClick={() => setMainTab("processos")} />
        <TabButton label="Conteúdo para Vendas" active={mainTab === "conteudo-vendas"} onClick={() => setMainTab("conteudo-vendas")} />
      </div>

      {mainTab === "arquivos" && <FileUpload section="Comercial" />}

      {mainTab === "scripts" && (
        <div>
          <div className="flex gap-1 mb-6 flex-wrap">
            <SubTabButton label="Scripts" active={scriptSubTab === "scripts"} onClick={() => setScriptSubTab("scripts")} />
            <SubTabButton label="FUPs" active={scriptSubTab === "fups"} onClick={() => setScriptSubTab("fups")} />
            <SubTabButton label="Keypoints" active={scriptSubTab === "keypoints"} onClick={() => setScriptSubTab("keypoints")} />
            <SubTabButton label="SLA de Atendimento" active={scriptSubTab === "sla"} onClick={() => setScriptSubTab("sla")} />
          </div>
          {scriptSubTab === "scripts" && (
            <DocumentsPanel
              key="scripts"
              apiPath="/api/scripts"
              newLabel="Novo Script"
              emptyTitle="Nenhum script ainda"
              emptyDesc="Crie o primeiro script comercial para o time."
            />
          )}
          {scriptSubTab === "fups" && (
            <DocumentsPanel
              key="fups"
              apiPath="/api/fups"
              newLabel="Novo FUP"
              emptyTitle="Nenhum FUP ainda"
              emptyDesc="Crie o primeiro guia de follow-up para o time."
            />
          )}
          {scriptSubTab === "keypoints" && (
            <DocumentsPanel
              key="keypoints"
              apiPath="/api/keypoints"
              newLabel="Novo Keypoint"
              emptyTitle="Nenhum keypoint ainda"
              emptyDesc="Crie o primeiro keypoint de qualificação para o time."
            />
          )}
          {scriptSubTab === "sla" && (
            <DocumentsPanel
              key="sla"
              apiPath="/api/sla"
              newLabel="Novo SLA"
              emptyTitle="Nenhum SLA ainda"
              emptyDesc="Crie o primeiro SLA de atendimento para o time."
            />
          )}
        </div>
      )}

      {mainTab === "descontos" && (
        <DocumentsPanel
          key="descontos"
          apiPath="/api/descontos"
          newLabel="Nova Diretriz"
          emptyTitle="Nenhuma diretriz ainda"
          emptyDesc="Crie a primeira diretriz de desconto para o time."
        />
      )}

      {mainTab === "processos" && <ProcessosFechamento />}

      {mainTab === "conteudo-vendas" && (
        <div>
          <div className="flex gap-1 mb-6 flex-wrap">
            <SubTabButton
              label="Posts & Links"
              active={conteudoSubTab === "posts"}
              onClick={() => setConteudoSubTab("posts")}
            />
            <SubTabButton
              label="Vídeos Carro-Chefe"
              active={conteudoSubTab === "carro-chefe"}
              onClick={() => setConteudoSubTab("carro-chefe")}
            />
            <SubTabButton
              label="Vídeos Sazonais"
              active={conteudoSubTab === "sazonais"}
              onClick={() => setConteudoSubTab("sazonais")}
            />
            <SubTabButton
              label="Vídeos Depoimentos"
              active={conteudoSubTab === "depoimentos"}
              onClick={() => setConteudoSubTab("depoimentos")}
            />
            <SubTabButton
              label="Vídeos Influs"
              active={conteudoSubTab === "influs"}
              onClick={() => setConteudoSubTab("influs")}
            />
          </div>
          {conteudoSubTab === "posts" && <ConteudosVendasTab />}
          {conteudoSubTab === "carro-chefe" && (
            <VideoGruposTab
              tipo="carro-chefe"
              descricao="Principais vídeos de cada produto. Crie um conjunto por produto e envie os vídeos específicos."
            />
          )}
          {conteudoSubTab === "sazonais" && (
            <VideoGruposTab
              tipo="sazonais"
              descricao="Vídeos sazonais com condições especiais ou diferenciais. Crie um conjunto por campanha ou produto."
            />
          )}
          {conteudoSubTab === "depoimentos" && (
            <VideoGruposTab
              tipo="depoimentos"
              descricao="Vídeos de depoimentos de clientes. Crie um conjunto por produto ou perfil de cliente."
            />
          )}
          {conteudoSubTab === "influs" && (
            <VideoGruposTab
              tipo="influs"
              descricao="Vídeos de influenciadores parceiros. Crie um conjunto por influenciador ou campanha."
            />
          )}
        </div>
      )}
    </div>
  );
}
