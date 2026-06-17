"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, FolderOpen, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { FileUpload } from "@/components/upload/FileUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

interface Folder {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export default function ContratosPage() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Folder | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchFolders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/contratos");
      if (res.ok) setFolders(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFolders(); }, [fetchFolders]);

  async function handleCreate() {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/contratos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() }),
      });
      if (res.ok) {
        const folder: Folder = await res.json();
        setFolders((prev) => [...prev, folder]);
        setOpenId(folder.id);
        setCreating(false);
        setNewName("");
        setNewDesc("");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch("/api/contratos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteTarget.id }),
      });
      setFolders((prev) => prev.filter((f) => f.id !== deleteTarget.id));
      if (openId === deleteTarget.id) setOpenId(null);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contratos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Organize os contratos por conjunto (tipo de produto ou serviço).
          </p>
        </div>
        <Button variant="default" size="sm" onClick={() => setCreating(true)}>
          <Plus size={14} />
          Criar Novo Conjunto
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 size={18} className="animate-spin mr-2" />
          <span className="text-sm">Carregando...</span>
        </div>
      ) : folders.length === 0 ? (
        <div className="border border-dashed border-gray-medium rounded-xl p-16 text-center">
          <FolderOpen size={32} className="mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="text-sm font-medium text-gray-dark mb-1">Nenhum conjunto criado ainda</p>
          <p className="text-xs text-muted-foreground mb-5">
            Crie um conjunto para organizar contratos por tipo de produto ou serviço.
          </p>
          <Button variant="outline" size="sm" onClick={() => setCreating(true)}>
            <Plus size={14} />
            Criar Novo Conjunto
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {folders.map((folder) => {
            const isOpen = openId === folder.id;
            return (
              <div key={folder.id} className="border border-gray-medium rounded-xl overflow-hidden bg-white">
                <div className="flex items-center justify-between px-5 py-4">
                  <button
                    className="flex items-center gap-3 flex-1 text-left"
                    onClick={() => setOpenId(isOpen ? null : folder.id)}
                  >
                    <FolderOpen
                      size={17}
                      className={cn("shrink-0 transition-colors", isOpen ? "text-black" : "text-muted-foreground")}
                    />
                    <div>
                      <p className="text-sm font-semibold">{folder.name}</p>
                      {folder.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{folder.description}</p>
                      )}
                    </div>
                    {isOpen ? (
                      <ChevronUp size={14} className="ml-auto text-muted-foreground" />
                    ) : (
                      <ChevronDown size={14} className="ml-auto text-muted-foreground" />
                    )}
                  </button>
                  <button
                    onClick={() => setDeleteTarget(folder)}
                    className="ml-3 p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                    title="Excluir conjunto"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {isOpen && (
                  <div className="border-t border-gray-medium px-5 py-5 bg-gray-light/40">
                    <FileUpload
                      section={`Contratos - ${folder.name}`}
                      label={`Contratos — ${folder.name}`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      <Modal
        open={creating}
        onClose={() => { setCreating(false); setNewName(""); setNewDesc(""); }}
        title="Criar Novo Conjunto"
        description="Dê um nome ao conjunto para identificar o tipo de contrato."
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Nome do conjunto *"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Ex: Escritório Privativo, Nex House…"
            autoFocus
          />
          <Input
            label="Descrição (opcional)"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Ex: Contratos de locação de sala privativa"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => { setCreating(false); setNewName(""); setNewDesc(""); }} disabled={saving}>
              Cancelar
            </Button>
            <Button variant="default" size="sm" onClick={handleCreate} disabled={saving || !newName.trim()}>
              {saving && <Loader2 size={13} className="animate-spin" />}
              Criar conjunto
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Excluir conjunto"
        description={`Tem certeza que deseja excluir o conjunto "${deleteTarget?.name}"? Os arquivos precisarão ser excluídos manualmente.`}
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
