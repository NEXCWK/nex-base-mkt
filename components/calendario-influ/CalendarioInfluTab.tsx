"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus, Pencil, Trash2, Loader2, Search, Copy, Check, ExternalLink, ListChecks,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { CalendarioInfluLegend } from "./Legend";
import { ThreeMonthCalendar } from "./ThreeMonthCalendar";
import {
  type AvulsoContato, type UsoTipo, type StatusComunicacao,
  USO_META, STATUS_META,
} from "./types";

const PUBLIC_URL = "/calendario-influenciadores";

const EMPTY_FORM = {
  name: "",
  instagram: "",
  uso: "primeiro" as UsoTipo,
  status: "mapeado" as StatusComunicacao,
  data: "",
  notas: "",
};

const STATUS_ORDER: StatusComunicacao[] = ["mapeado", "data-a-confirmar", "data-confirmada"];

export function CalendarioInfluTab() {
  const [contatos, setContatos] = useState<AvulsoContato[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AvulsoContato | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [search, setSearch] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<AvulsoContato | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [copied, setCopied] = useState(false);

  const fetchContatos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/calendario-influ");
      if (res.ok) setContatos(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchContatos(); }, [fetchContatos]);

  // Distinct existing identities, for the "segundo uso" duplicate-avoidance search
  const knownIdentities = useMemo(() => {
    const seen = new Map<string, { name: string; instagram: string }>();
    for (const c of contatos) {
      const key = (c.instagram || c.name).toLowerCase();
      if (!seen.has(key)) seen.set(key, { name: c.name, instagram: c.instagram });
    }
    return Array.from(seen.values());
  }, [contatos]);

  const searchMatches = search.trim()
    ? knownIdentities.filter(
        (i) =>
          i.name.toLowerCase().includes(search.trim().toLowerCase()) ||
          i.instagram.toLowerCase().includes(search.trim().toLowerCase())
      )
    : [];

  const confirmedEntries = useMemo(
    () =>
      contatos
        .filter((c) => c.status === "data-confirmada" && c.data)
        .map((c) => ({ id: c.id, name: c.name, instagram: c.instagram, uso: c.uso, data: c.data })),
    [contatos]
  );

  const pipeline = useMemo(
    () =>
      [...contatos].sort((a, b) => {
        const byStatus = STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
        if (byStatus !== 0) return byStatus;
        return (a.data || "9999").localeCompare(b.data || "9999");
      }),
    [contatos]
  );

  function openCreate() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setSearch("");
    setModalOpen(true);
  }

  function openEdit(c: AvulsoContato) {
    setEditTarget(c);
    setForm({ name: c.name, instagram: c.instagram, uso: c.uso, status: c.status, data: c.data, notas: c.notas });
    setFormError("");
    setSearch("");
    setModalOpen(true);
  }

  function pickIdentity(identity: { name: string; instagram: string }) {
    setForm((f) => ({ ...f, name: identity.name, instagram: identity.instagram }));
    setSearch("");
  }

  async function handleSave() {
    if (!form.name.trim()) { setFormError("Nome obrigatório."); return; }
    if (form.status === "data-confirmada" && !form.data) {
      setFormError("Informe a data — obrigatória quando o status é Data Confirmada.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const isEdit = !!editTarget;
      const res = await fetch("/api/calendario-influ", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEdit ? { id: editTarget!.id, ...form } : form),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Erro ao salvar");
      const saved: AvulsoContato = await res.json();
      setContatos((prev) => (isEdit ? prev.map((c) => (c.id === saved.id ? saved : c)) : [...prev, saved]));
      setModalOpen(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch("/api/calendario-influ", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteTarget.id }),
      });
      setContatos((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  function formatDate(d: string) {
    if (!d) return "";
    const [y, m, day] = d.split("-");
    return `${day}/${m}/${y}`;
  }

  async function copyPublicLink() {
    const url = `${window.location.origin}${PUBLIC_URL}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — user can still copy the visible link manually
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
          Gestão dos influenciadores avulsos em contato — do mapeamento até a data confirmada na unidade.
        </p>
        <Button variant="default" size="sm" onClick={openCreate} className="shrink-0">
          <Plus size={14} />
          Adicionar influenciador
        </Button>
      </div>

      <CalendarioInfluLegend />

      {/* Public link */}
      <div className="bg-white border border-gray-medium rounded-xl p-5 flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="text-sm font-600 mb-1">Link público do calendário</p>
          <p className="text-xs text-muted-foreground">
            Link fixo, sem necessidade de login — compartilhe com quem estiver fora da organização.
          </p>
          <code className="inline-block mt-2 text-xs bg-gray-light rounded px-2 py-1 text-gray-dark break-all">
            {PUBLIC_URL}
          </code>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={copyPublicLink}>
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? "Copiado" : "Copiar link"}
          </Button>
          <a href={PUBLIC_URL} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <ExternalLink size={13} />
              Abrir
            </Button>
          </a>
        </div>
      </div>

      {/* Calendar */}
      <div>
        <p className="text-xs font-600 uppercase tracking-wide text-muted-foreground mb-3">
          Calendário — próximos 3 meses
        </p>
        <ThreeMonthCalendar entries={confirmedEntries} />
      </div>

      {/* Pipeline list */}
      <div>
        <p className="text-xs font-600 uppercase tracking-wide text-muted-foreground mb-3">
          Todos os influenciadores em contato
        </p>
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm py-10">
            <Loader2 size={14} className="animate-spin" /> Carregando…
          </div>
        ) : pipeline.length === 0 ? (
          <div className="border border-dashed border-gray-medium rounded-xl p-12 text-center">
            <ListChecks size={26} className="mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-sm font-medium text-gray-dark mb-1">Nenhum influenciador em contato ainda.</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={openCreate}>
              <Plus size={13} />
              Adicionar influenciador
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {pipeline.map((c) => (
              <div key={c.id} className="border border-gray-medium rounded-lg p-4 bg-white flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-600 text-foreground">{c.name}</span>
                    <span className={cn("text-[11px] font-600 uppercase tracking-wide rounded-full px-2 py-0.5", USO_META[c.uso].chip)}>
                      {USO_META[c.uso].label}
                    </span>
                    <span className={cn("text-[11px] font-600 rounded-full px-2 py-0.5", STATUS_META[c.status].chip)}>
                      {STATUS_META[c.status].label}
                    </span>
                    {c.data && <span className="text-xs text-muted-foreground">{formatDate(c.data)}</span>}
                  </div>
                  {c.instagram && <p className="text-xs text-muted-foreground mt-1">{c.instagram}</p>}
                  {c.notas && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{c.notas}</p>}
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <button onClick={() => openEdit(c)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-gray-light transition-colors" title="Editar">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => setDeleteTarget(c)} className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors" title="Remover">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? "Editar influenciador" : "Adicionar influenciador"}
        className="max-w-lg"
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-gray-dark block mb-1.5">Uso *</label>
            <div className="flex gap-2">
              {(["primeiro", "segundo"] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => { setForm((f) => ({ ...f, uso: u })); setSearch(""); }}
                  className={cn(
                    "flex-1 py-2 rounded-md border text-sm font-600 transition-all",
                    form.uso === u
                      ? "border-black bg-black text-white"
                      : "border-gray-medium text-muted-foreground hover:border-gray-dark hover:text-foreground"
                  )}
                >
                  {USO_META[u].label}
                </button>
              ))}
            </div>
          </div>

          {form.uso === "segundo" && !editTarget && (
            <div className="rounded-lg border border-gray-medium bg-gray-light/40 p-3">
              <label className="text-xs font-medium text-gray-dark block mb-1.5">
                Buscar influenciador já cadastrado (evita perfil duplicado)
              </label>
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nome ou @..."
                  className="w-full pl-7 pr-2 h-9 text-sm rounded-md border border-gray-medium bg-white focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
              {searchMatches.length > 0 && (
                <div className="mt-2 flex flex-col gap-1 max-h-32 overflow-y-auto">
                  {searchMatches.map((m) => (
                    <button
                      key={m.instagram || m.name}
                      type="button"
                      onClick={() => pickIdentity(m)}
                      className="text-left px-2.5 py-1.5 rounded-md text-xs hover:bg-white transition-colors"
                    >
                      <span className="font-600">{m.name}</span>
                      {m.instagram && <span className="text-muted-foreground ml-1.5">{m.instagram}</span>}
                    </button>
                  ))}
                </div>
              )}
              <p className="text-[11px] text-muted-foreground mt-2">
                Não encontrou? Sem problema — preencha os campos abaixo normalmente para cadastrar do zero.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input label="Nome *" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Nome do influenciador" autoFocus />
            <Input label="@ do Instagram" value={form.instagram} onChange={(e) => setForm((f) => ({ ...f, instagram: e.target.value }))} placeholder="@usuario" />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-dark block mb-1.5">Status de comunicação *</label>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as StatusComunicacao }))}
              className="h-10 w-full rounded-md border border-gray-medium bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            >
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>{STATUS_META[s].label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-dark block mb-1.5">
              Data {form.status === "data-confirmada" ? "*" : "(opcional)"}
            </label>
            <input
              type="date"
              value={form.data}
              onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))}
              className="h-10 w-full rounded-md border border-gray-medium bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
            {form.status === "data-confirmada" && (
              <p className="text-[11px] text-muted-foreground mt-1">Essa data aparecerá no calendário público.</p>
            )}
          </div>

          <Textarea
            label="Notas (internas — não aparecem no link público)"
            value={form.notas}
            onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
            placeholder="Combinados, contexto da negociação, follow-ups..."
            rows={3}
          />

          {formError && <p className="text-xs text-red-500">{formError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button>
            <Button size="sm" onClick={handleSave} disabled={saving || !form.name.trim()}>
              {saving && <Loader2 size={13} className="animate-spin" />}
              {editTarget ? "Salvar alterações" : "Adicionar"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Remover influenciador"
        description={`Remover "${deleteTarget?.name}" do pipeline? Esta ação não pode ser desfeita.`}
      >
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancelar</Button>
          <Button size="sm" onClick={handleDelete} disabled={deleting} className="bg-red-500 text-white hover:bg-red-600">
            {deleting && <Loader2 size={13} className="animate-spin" />}
            Remover
          </Button>
        </div>
      </Modal>
    </div>
  );
}
