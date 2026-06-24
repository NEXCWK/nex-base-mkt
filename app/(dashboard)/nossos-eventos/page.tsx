"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { CalendarDays, Camera, Loader2, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Evento {
  id: string;
  name: string;
  date: string;
  description: string;
  location: string;
  photoUrl: string;
  createdAt: string;
  updatedAt: string;
}

const EMPTY_FORM = { name: "", date: "", description: "", location: "", photoUrl: "" };

function formatDate(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric",
  });
}

function resizeImage(file: File, maxPx = 800, quality = 0.85): Promise<string> {
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

function PhotoUpload({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    setProcessing(true);
    try { onChange(await resizeImage(file)); }
    finally { setProcessing(false); }
  }

  return (
    <div>
      <p className="text-xs font-medium text-gray-dark mb-2">Foto do evento</p>
      <div
        onClick={() => inputRef.current?.click()}
        className={cn(
          "relative w-full h-36 rounded-lg overflow-hidden border-2 border-dashed border-gray-medium cursor-pointer hover:border-black transition-colors group",
          value ? "border-solid" : ""
        )}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gray-light">
            <Camera size={20} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Clique para adicionar foto</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {processing
            ? <Loader2 size={18} className="text-white animate-spin" />
            : <Camera size={18} className="text-white" />}
        </div>
      </div>
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="mt-1.5 text-xs text-red-500 hover:text-red-600 underline underline-offset-2"
        >
          Remover foto
        </button>
      )}
      <input
        ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
      />
    </div>
  );
}

export default function NossosEventosPage() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Evento | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Evento | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchEventos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/nossos-eventos");
      if (res.ok) {
        const data: Evento[] = await res.json();
        setEventos(data.sort((a, b) => b.date.localeCompare(a.date)));
      }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchEventos(); }, [fetchEventos]);

  function openCreate() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setSaveError("");
    setModalOpen(true);
  }

  function openEdit(e: Evento) {
    setEditTarget(e);
    setForm({ name: e.name, date: e.date, description: e.description, location: e.location, photoUrl: e.photoUrl });
    setSaveError("");
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    setSaveError("");
    try {
      if (editTarget) {
        const res = await fetch("/api/nossos-eventos", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editTarget.id, ...form }),
        });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Erro ao salvar");
        const updated: Evento = await res.json();
        setEventos((prev) => prev.map((x) => x.id === updated.id ? updated : x).sort((a, b) => b.date.localeCompare(a.date)));
      } else {
        const res = await fetch("/api/nossos-eventos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Erro ao criar evento");
        const created: Evento = await res.json();
        setEventos((prev) => [...prev, created].sort((a, b) => b.date.localeCompare(a.date)));
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
      await fetch("/api/nossos-eventos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteTarget.id }),
      });
      setEventos((prev) => prev.filter((x) => x.id !== deleteTarget.id));
      setDeleteTarget(null);
    } finally { setDeleting(false); }
  }

  // Group events by year
  const byYear = eventos.reduce<Record<string, Evento[]>>((acc, ev) => {
    const year = ev.date ? ev.date.slice(0, 4) : "Sem data";
    (acc[year] ??= []).push(ev);
    return acc;
  }, {});
  const years = Object.keys(byYear).sort((a, b) => b.localeCompare(a));

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nossos Eventos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Histórico de eventos realizados pelo Nex.
          </p>
        </div>
        <Button variant="default" size="sm" onClick={openCreate}>
          <Plus size={14} /> Adicionar evento
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 size={18} className="animate-spin mr-2" />
          <span className="text-sm">Carregando...</span>
        </div>
      ) : eventos.length === 0 ? (
        <div className="border border-dashed border-gray-medium rounded-xl p-16 text-center">
          <CalendarDays size={32} className="mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="text-sm font-medium text-gray-dark mb-1">Nenhum evento cadastrado ainda</p>
          <p className="text-xs text-muted-foreground mb-5">Registre os eventos realizados pelo Nex.</p>
          <Button variant="outline" size="sm" onClick={openCreate}>
            <Plus size={14} /> Adicionar evento
          </Button>
        </div>
      ) : (
        <div className="space-y-10">
          {years.map((year) => (
            <div key={year}>
              {/* Year heading */}
              <div className="flex items-center gap-3 mb-5">
                <span
                  className="text-lg font-bold tracking-tight"
                  style={{ color: "#b8980a" }}
                >
                  {year}
                </span>
                <div className="flex-1 h-px bg-gray-medium" />
                <span className="text-xs text-muted-foreground">
                  {byYear[year].length} {byYear[year].length === 1 ? "evento" : "eventos"}
                </span>
              </div>

              {/* Event cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {byYear[year].map((ev) => (
                  <div key={ev.id} className="border border-gray-medium rounded-xl overflow-hidden bg-white hover:shadow-md transition-shadow">
                    {/* Photo */}
                    <div className="h-36 bg-gray-light flex items-center justify-center overflow-hidden">
                      {ev.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={ev.photoUrl} alt={ev.name} className="w-full h-full object-cover" />
                      ) : (
                        <CalendarDays size={28} className="text-muted-foreground opacity-30" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-sm text-black leading-snug">{ev.name}</h3>
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => openEdit(ev)} className="p-1 rounded-md text-muted-foreground hover:text-black hover:bg-gray-light transition-colors" title="Editar">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => setDeleteTarget(ev)} className="p-1 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors" title="Excluir">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {ev.date && (
                        <Badge variant="muted" className="mb-2">
                          {formatDate(ev.date)}
                        </Badge>
                      )}

                      {ev.location && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                          <MapPin size={11} className="shrink-0" />
                          <span className="truncate">{ev.location}</span>
                        </div>
                      )}

                      {ev.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 mt-1">
                          {ev.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? "Editar evento" : "Adicionar evento"}
        className="max-w-lg"
      >
        <div className="flex flex-col gap-4">
          <PhotoUpload value={form.photoUrl} onChange={(v) => setForm((f) => ({ ...f, photoUrl: v }))} />
          <Input
            label="Nome do evento *"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Ex: Connecting Night"
            autoFocus
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Data"
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
            <Input
              label="Local"
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              placeholder="Ex: Nex House"
            />
          </div>
          <Textarea
            label="Descrição"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Breve descrição do evento…"
            rows={3}
          />
          {saveError && <p className="text-xs text-red-500">{saveError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
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
        title="Excluir evento"
        description={`Remover "${deleteTarget?.name}"? Esta ação não pode ser desfeita.`}
      >
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Cancelar
          </Button>
          <Button size="sm" onClick={handleDelete} disabled={deleting} className="bg-red-500 text-white hover:bg-red-600">
            {deleting && <Loader2 size={13} className="animate-spin" />}
            Excluir
          </Button>
        </div>
      </Modal>
    </div>
  );
}
