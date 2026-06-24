"use client";

import { useState, useEffect, useCallback } from "react";
import { ExternalLink, FolderOpen, Plus, Pencil, Trash2, Loader2, TrendingUp } from "lucide-react";
import { FileUpload } from "@/components/upload/FileUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

// ─── Types ────────────────────────────────────────────────────────────────────

interface VerbaEntry {
  id: string;
  month: string;
  platform: string;
  campaign: string;
  amount: number;
  notes?: string;
  createdAt: string;
}

const PLATFORMS = [
  "Meta Ads",
  "Google Ads",
  "TikTok Ads",
  "LinkedIn Ads",
  "YouTube Ads",
  "Pinterest Ads",
  "Outro",
];

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatMonth(monthStr: string) {
  try {
    return format(parseISO(`${monthStr}-01`), "MMMM 'de' yyyy", { locale: ptBR });
  } catch {
    return monthStr;
  }
}

// ─── Priorização de Verba ─────────────────────────────────────────────────────

const EMPTY_FORM = {
  month: format(new Date(), "yyyy-MM"),
  platform: "Meta Ads",
  campaign: "",
  amount: "",
  notes: "",
};

function VerbaManager() {
  const [entries, setEntries] = useState<VerbaEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<VerbaEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VerbaEntry | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/verba");
      if (res.ok) setEntries(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  function openCreate() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(entry: VerbaEntry) {
    setEditTarget(entry);
    setForm({
      month: entry.month,
      platform: entry.platform,
      campaign: entry.campaign,
      amount: String(entry.amount),
      notes: entry.notes ?? "",
    });
    setFormError("");
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.campaign.trim() || !form.amount) {
      setFormError("Preencha campanha e verba.");
      return;
    }
    const amount = parseFloat(form.amount.replace(",", "."));
    if (isNaN(amount) || amount < 0) {
      setFormError("Valor de verba inválido.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const body = { ...form, amount };
      const res = editTarget
        ? await fetch("/api/verba", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: editTarget.id, ...body }),
          })
        : await fetch("/api/verba", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
      if (!res.ok) throw new Error("Erro ao salvar");
      const saved: VerbaEntry = await res.json();
      if (editTarget) {
        setEntries((prev) => prev.map((e) => (e.id === saved.id ? saved : e)));
      } else {
        setEntries((prev) => [...prev, saved]);
      }
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
      await fetch("/api/verba", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteTarget.id }),
      });
      setEntries((prev) => prev.filter((e) => e.id !== deleteTarget.id));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  const byMonth = entries.reduce<Record<string, VerbaEntry[]>>((acc, e) => {
    (acc[e.month] = acc[e.month] ?? []).push(e);
    return acc;
  }, {});
  const months = Object.keys(byMonth).sort((a, b) => b.localeCompare(a));

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Registre a verba investida por plataforma e campanha, separado por mês.
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
      ) : months.length === 0 ? (
        <div className="border border-dashed border-gray-medium rounded-xl py-14 text-center">
          <TrendingUp size={26} className="mx-auto mb-3 text-muted-foreground opacity-30" />
          <p className="text-sm font-medium text-muted-foreground mb-1">Nenhum registro ainda.</p>
          <p className="text-xs text-muted-foreground mb-5">
            Registre a verba investida por plataforma e campanha.
          </p>
          <Button variant="outline" size="sm" onClick={openCreate}>
            <Plus size={13} />
            Adicionar
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {months.map((month) => {
            const monthEntries = byMonth[month];
            const total = monthEntries.reduce((s, e) => s + e.amount, 0);
            const byPlatform = monthEntries.reduce<Record<string, number>>((acc, e) => {
              acc[e.platform] = (acc[e.platform] ?? 0) + e.amount;
              return acc;
            }, {});

            return (
              <div key={month} className="border border-gray-medium rounded-xl overflow-hidden bg-white">
                {/* Month header */}
                <div className="flex items-center justify-between px-5 py-3 bg-gray-light/60 border-b border-gray-medium">
                  <span className="text-sm font-semibold capitalize">{formatMonth(month)}</span>
                  <span className="text-sm font-bold tabular-nums">{formatBRL(total)}</span>
                </div>
                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[480px]">
                    <thead>
                      <tr className="text-xs text-muted-foreground uppercase tracking-wide border-b border-gray-medium">
                        <th className="text-left px-5 py-2.5 font-semibold">Plataforma</th>
                        <th className="text-left px-5 py-2.5 font-semibold">Campanha</th>
                        <th className="text-right px-5 py-2.5 font-semibold">Verba</th>
                        <th className="px-3 py-2.5 w-16" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-medium">
                      {monthEntries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-gray-light/40 transition-colors">
                          <td className="px-5 py-3 font-medium whitespace-nowrap">{entry.platform}</td>
                          <td className="px-5 py-3 text-muted-foreground">
                            {entry.campaign}
                            {entry.notes && (
                              <span className="block text-xs opacity-60 mt-0.5">{entry.notes}</span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-right font-semibold tabular-nums whitespace-nowrap">
                            {formatBRL(entry.amount)}
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1 justify-end">
                              <button
                                onClick={() => openEdit(entry)}
                                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-gray-light transition-colors"
                                title="Editar"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(entry)}
                                className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
                                title="Remover"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    {Object.keys(byPlatform).length > 1 && (
                      <tfoot>
                        <tr className="border-t border-gray-medium bg-gray-light/30">
                          <td className="px-5 py-2.5 text-xs text-muted-foreground" colSpan={2}>
                            {Object.entries(byPlatform).map(([p, v]) => (
                              <span key={p} className="mr-4 inline-block">
                                {p}: {formatBRL(v)}
                              </span>
                            ))}
                          </td>
                          <td className="px-5 py-2.5 text-right text-xs font-semibold text-muted-foreground tabular-nums">
                            Total: {formatBRL(total)}
                          </td>
                          <td className="px-3" />
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? "Editar registro" : "Adicionar verba"}
        description="Registre a verba investida em uma plataforma e campanha específica."
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-dark block mb-1.5">Mês *</label>
              <input
                type="month"
                value={form.month}
                onChange={(e) => setForm((f) => ({ ...f, month: e.target.value }))}
                className="w-full h-10 px-3 rounded-md border border-gray-medium text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-dark block mb-1.5">Plataforma *</label>
              <select
                value={form.platform}
                onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value }))}
                className="w-full h-10 px-3 rounded-md border border-gray-medium text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black"
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
          <Input
            label="Campanha *"
            value={form.campaign}
            onChange={(e) => setForm((f) => ({ ...f, campaign: e.target.value }))}
            placeholder="Ex: Brand Awareness Q2, Remarketing Sala…"
          />
          <Input
            label="Verba investida (R$) *"
            type="number"
            min={0}
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            placeholder="0,00"
          />
          <Input
            label="Observações (opcional)"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Período, objetivo, público-alvo…"
          />
          {formError && <p className="text-xs text-red-500">{formError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={saving || !form.campaign.trim() || !form.amount}
            >
              {saving && <Loader2 size={13} className="animate-spin" />}
              {editTarget ? "Salvar" : "Adicionar"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Remover registro"
        description={
          deleteTarget
            ? `Remover verba de ${formatBRL(deleteTarget.amount)} em ${deleteTarget.campaign} (${deleteTarget.platform})?`
            : ""
        }
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

type MidiaTab = "arquivos" | "verba";

export default function MarketingPage() {
  const [midiaTab, setMidiaTab] = useState<MidiaTab>("arquivos");

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Marketing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Estratégias, planos e materiais de marketing do Nex Coworking.
        </p>
      </div>

      {/* Drive link */}
      <div className="border border-gray-medium rounded-xl p-6 bg-white mb-8">
        <div className="flex items-start gap-4">
          <div className="mt-0.5 rounded-lg bg-gray-light p-2.5 shrink-0">
            <FolderOpen size={18} className="text-gray-dark" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-black">Estratégias e organização da área</h2>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              Todas as estratégias, calendários, planos de ação e organizações da área de Marketing estão centralizados no Google Drive. Acesse pelo link abaixo.
            </p>
            <a
              href="https://drive.google.com/drive/folders/1bNQu14d8EWKiHmfsQF9k6qDMtjuIcyFH?usp=drive_link"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-black hover:underline underline-offset-2"
            >
              Acessar pasta de Marketing no Drive
              <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </div>

      {/* Mídia section */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Mídia
        </h2>
        <div className="flex gap-1 bg-gray-light p-1 rounded-lg w-fit mb-6">
          {([["arquivos", "Arquivos PDF"], ["verba", "Priorização de Verba"]] as const).map(
            ([key, tabLabel]) => (
              <button
                key={key}
                onClick={() => setMidiaTab(key)}
                className={cn(
                  "px-4 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                  midiaTab === key
                    ? "bg-white text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tabLabel}
              </button>
            )
          )}
        </div>

        {midiaTab === "arquivos" && <FileUpload section="Marketing - Mídia" />}
        {midiaTab === "verba" && <VerbaManager />}
      </div>
    </div>
  );
}
