"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Building2, Camera, Globe, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";

interface MarcaParceira {
  id: string;
  name: string;
  category: string;
  bio: string;
  website: string;
  photoUrl: string;
  createdAt: string;
  updatedAt: string;
}

const EMPTY_FORM = { name: "", category: "", bio: "", website: "", photoUrl: "" };

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

function LogoUpload({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    setProcessing(true);
    try {
      onChange(await resizeImage(file));
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div
        onClick={() => inputRef.current?.click()}
        className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-dashed border-gray-medium cursor-pointer hover:border-black transition-colors group shrink-0"
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="w-full h-full object-contain p-1" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-light">
            <Building2 size={24} className="text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {processing ? (
            <Loader2 size={16} className="text-white animate-spin" />
          ) : (
            <Camera size={16} className="text-white" />
          )}
        </div>
      </div>
      <div>
        <p className="text-xs font-medium text-gray-dark mb-1">Logo da marca</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-xs text-muted-foreground hover:text-black underline underline-offset-2 transition-colors"
        >
          {value ? "Trocar logo" : "Enviar logo"}
        </button>
        {value && (
          <>
            <span className="text-xs text-muted-foreground mx-1.5">·</span>
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-xs text-red-500 hover:text-red-600 underline underline-offset-2 transition-colors"
            >
              Remover
            </button>
          </>
        )}
        <p className="text-[11px] text-muted-foreground mt-1">JPG, PNG ou WEBP</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export default function MarcasParceirasPage() {
  const [marcas, setMarcas] = useState<MarcaParceira[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<MarcaParceira | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<MarcaParceira | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchMarcas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/marcas-parceiras");
      if (res.ok) setMarcas(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMarcas(); }, [fetchMarcas]);

  function openCreate() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setSaveError("");
    setModalOpen(true);
  }

  function openEdit(m: MarcaParceira) {
    setEditTarget(m);
    setForm({ name: m.name, category: m.category, bio: m.bio, website: m.website, photoUrl: m.photoUrl });
    setSaveError("");
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    setSaveError("");
    try {
      if (editTarget) {
        const res = await fetch("/api/marcas-parceiras", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editTarget.id, ...form }),
        });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Erro ao salvar");
        const updated: MarcaParceira = await res.json();
        setMarcas((p) => p.map((x) => (x.id === updated.id ? updated : x)));
      } else {
        const res = await fetch("/api/marcas-parceiras", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Erro ao criar marca");
        const created: MarcaParceira = await res.json();
        setMarcas((p) => [...p, created]);
      }
      setModalOpen(false);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch("/api/marcas-parceiras", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteTarget.id }),
      });
      setMarcas((p) => p.filter((x) => x.id !== deleteTarget.id));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Marcas Parceiras</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Marcas e empresas parceiras do Nex Coworking.
          </p>
        </div>
        <Button variant="default" size="sm" onClick={openCreate}>
          <Plus size={14} /> Adicionar marca
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 size={18} className="animate-spin mr-2" />
          <span className="text-sm">Carregando...</span>
        </div>
      ) : marcas.length === 0 ? (
        <div className="border border-dashed border-gray-medium rounded-xl p-16 text-center">
          <Building2 size={32} className="mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="text-sm font-medium text-gray-dark mb-1">Nenhuma marca cadastrada ainda</p>
          <p className="text-xs text-muted-foreground mb-5">Cadastre as marcas e empresas parceiras do Nex.</p>
          <Button variant="outline" size="sm" onClick={openCreate}>
            <Plus size={14} /> Adicionar marca
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {marcas.map((m) => (
            <Card key={m.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="h-32 bg-gray-light flex items-center justify-center overflow-hidden">
                  {m.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.photoUrl} alt={m.name} className="w-full h-full object-contain p-4" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-medium flex items-center justify-center">
                      <Building2 size={28} className="text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm text-black truncate">{m.name}</h3>
                      {m.category && <Badge variant="muted" className="mt-1">{m.category}</Badge>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => openEdit(m)}
                        className="p-1 rounded-md text-muted-foreground hover:text-black hover:bg-gray-light transition-colors"
                        title="Editar"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(m)}
                        className="p-1 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  {m.bio && (
                    <p className="text-xs text-muted-foreground leading-relaxed mt-2 line-clamp-3">{m.bio}</p>
                  )}
                  {m.website && (
                    <a
                      href={m.website.startsWith("http") ? m.website : `https://${m.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-xs text-black hover:underline"
                    >
                      <Globe size={11} />
                      {m.website.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? "Editar marca" : "Adicionar marca"}
        className="max-w-lg"
      >
        <div className="flex flex-col gap-4">
          <LogoUpload value={form.photoUrl} onChange={(v) => setForm((f) => ({ ...f, photoUrl: v }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Nome *"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Nome da marca"
              autoFocus
            />
            <Input
              label="Setor / Categoria"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              placeholder="Ex: Tech, Saúde…"
            />
          </div>
          <Textarea
            label="Sobre a marca"
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            placeholder="Breve descrição da marca e da parceria com o Nex…"
            rows={3}
          />
          <Input
            label="Site / Link"
            value={form.website}
            onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
            placeholder="https://…"
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

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Excluir marca"
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
