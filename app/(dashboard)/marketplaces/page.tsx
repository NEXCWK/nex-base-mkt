"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Store, ExternalLink, Pencil, Plus, Trash2, Loader2,
  Key, Mail, Phone, Monitor, DollarSign, LayoutList, StickyNote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";

interface Marketplace {
  id: string;
  name: string;
  system: string;
  login: string;
  password: string;
  dailyRate: string;
  hourlyRate: string;
  email: string;
  phone: string;
  desks: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

const EMPTY_FORM: Omit<Marketplace, "id" | "createdAt" | "updatedAt"> = {
  name: "", system: "", login: "", password: "",
  dailyRate: "", hourlyRate: "", email: "", phone: "", desks: "", notes: "",
};

function systemUrl(system: string) {
  if (!system) return "";
  const first = system.split(" /")[0].trim();
  return first.startsWith("http") ? first : `https://${first}`;
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 text-xs">
      <Icon size={12} className="mt-0.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <span className="text-muted-foreground mr-1">{label}:</span>
        <span className="text-foreground break-words">{value}</span>
      </div>
    </div>
  );
}

export default function MarketplacesPage() {
  const [items, setItems] = useState<Marketplace[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Marketplace | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Marketplace | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/marketplaces");
      if (res.ok) setItems(await res.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  function openCreate() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setSaveError("");
    setModalOpen(true);
  }

  function openEdit(m: Marketplace) {
    setEditTarget(m);
    setForm({
      name: m.name, system: m.system, login: m.login, password: m.password,
      dailyRate: m.dailyRate, hourlyRate: m.hourlyRate, email: m.email,
      phone: m.phone, desks: m.desks, notes: m.notes,
    });
    setSaveError("");
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    setSaveError("");
    try {
      if (editTarget) {
        const res = await fetch("/api/marketplaces", {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editTarget.id, ...form }),
        });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Erro ao salvar");
        const updated: Marketplace = await res.json();
        setItems((prev) => prev.map((x) => x.id === updated.id ? updated : x));
      } else {
        const res = await fetch("/api/marketplaces", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Erro ao criar");
        const created: Marketplace = await res.json();
        setItems((prev) => [...prev, created]);
      }
      setModalOpen(false);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch("/api/marketplaces", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteTarget.id }),
      });
      setItems((prev) => prev.filter((x) => x.id !== deleteTarget.id));
      setDeleteTarget(null);
    } finally { setDeleting(false); }
  }

  const f = (key: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Marketplaces</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Plataformas parceiras e seus dados de acesso e precificação.
          </p>
        </div>
        <Button variant="default" size="sm" onClick={openCreate}>
          <Plus size={14} /> Adicionar
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 size={18} className="animate-spin mr-2" />
          <span className="text-sm">Carregando...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="border border-dashed border-gray-medium rounded-xl p-16 text-center">
          <Store size={32} className="mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="text-sm font-medium text-gray-dark mb-1">Nenhum marketplace cadastrado</p>
          <p className="text-xs text-muted-foreground mb-5">Adicione as plataformas parceiras e seus dados.</p>
          <Button variant="outline" size="sm" onClick={openCreate}><Plus size={14} /> Adicionar</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((m) => (
            <div key={m.id} className="border border-gray-medium rounded-xl bg-white overflow-hidden hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-medium">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-gray-light flex items-center justify-center shrink-0">
                    <Store size={15} className="text-gray-dark" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-black truncate">{m.name}</h3>
                    {m.system && (
                      <a
                        href={systemUrl(m.system)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-black transition-colors"
                      >
                        {m.system} <ExternalLink size={9} />
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0 ml-3">
                  <button onClick={() => openEdit(m)} className="p-1.5 rounded-md text-muted-foreground hover:text-black hover:bg-gray-light transition-colors" title="Editar">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => setDeleteTarget(m)} className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors" title="Excluir">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="px-5 py-4 space-y-2.5">
                {/* Access */}
                <div className="pb-2.5 border-b border-gray-medium space-y-2">
                  <InfoRow icon={Monitor} label="Sistema" value={m.system} />
                  <InfoRow icon={Key} label="Login" value={m.login} />
                  {m.password && <InfoRow icon={Key} label="Senha" value={m.password} />}
                </div>

                {/* Pricing */}
                <div className="pb-2.5 border-b border-gray-medium space-y-2">
                  <InfoRow icon={DollarSign} label="Diária" value={m.dailyRate} />
                  <InfoRow icon={DollarSign} label="Hora" value={m.hourlyRate} />
                </div>

                {/* Contact */}
                <div className="space-y-2">
                  <InfoRow icon={Mail} label="E-mail" value={m.email} />
                  <InfoRow icon={Phone} label="Telefone" value={m.phone} />
                  <InfoRow icon={LayoutList} label="Mesas" value={m.desks} />
                  <InfoRow icon={StickyNote} label="Obs." value={m.notes} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? "Editar marketplace" : "Adicionar marketplace"}
        className="max-w-lg"
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Nome *" value={form.name} onChange={f("name")} placeholder="Ex: Desana" autoFocus />
            <Input label="Sistema / URL" value={form.system} onChange={f("system")} placeholder="operator.desana.io" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Login" value={form.login} onChange={f("login")} placeholder="reservasparceiros@nex.work" />
            <Input label="Senha" value={form.password} onChange={f("password")} placeholder="••••••" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Diária" value={form.dailyRate} onChange={f("dailyRate")} placeholder="R$ 00,00" />
            <Input label="Hora" value={form.hourlyRate} onChange={f("hourlyRate")} placeholder="R$ 00,00" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="E-mail" value={form.email} onChange={f("email")} placeholder="contato@…" />
            <Input label="Telefone" value={form.phone} onChange={f("phone")} placeholder="(11) 00000-0000" />
          </div>
          <Input label="Mesas / Posições" value={form.desks} onChange={f("desks")} placeholder="Ex: 5 posições (DASH 3085)" />
          <Textarea label="Observações" value={form.notes} onChange={f("notes")} placeholder="Regras, descontos, detalhes adicionais…" rows={2} />
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

      {/* Delete confirmation */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Excluir marketplace"
        description={`Remover "${deleteTarget?.name}"? Esta ação não pode ser desfeita.`}
      >
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancelar</Button>
          <Button size="sm" onClick={handleDelete} disabled={deleting} className="bg-red-500 text-white hover:bg-red-600">
            {deleting && <Loader2 size={13} className="animate-spin" />}
            Excluir
          </Button>
        </div>
      </Modal>
    </div>
  );
}
