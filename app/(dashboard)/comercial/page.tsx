"use client";

import { useState, useEffect, useCallback } from "react";
import { FileUpload } from "@/components/upload/FileUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { Plus, Pencil, Trash2, Loader2, FileText } from "lucide-react";

interface Script {
  id: string;
  name: string;
  content: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type Tab = "arquivos" | "scripts";

export default function ComercialPage() {
  const [activeTab, setActiveTab] = useState<Tab>("arquivos");
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Script | null>(null);
  const [formName, setFormName] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Script | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchScripts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/scripts");
      if (!res.ok) throw new Error("Erro ao carregar scripts");
      const data: Script[] = await res.json();
      setScripts(data);
      if (data.length > 0 && !selectedId) {
        setSelectedId(data[0].id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    if (activeTab === "scripts") {
      fetchScripts();
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  function openCreateModal() {
    setEditTarget(null);
    setFormName("");
    setFormContent("");
    setFormError("");
    setModalOpen(true);
  }

  function openEditModal(script: Script) {
    setEditTarget(script);
    setFormName(script.name);
    setFormContent(script.content);
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
      setFormError("O nome do script e obrigatorio.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      if (editTarget) {
        const res = await fetch("/api/scripts", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editTarget.id, name: formName.trim(), content: formContent }),
        });
        if (!res.ok) throw new Error("Erro ao atualizar script");
        const updated: Script = await res.json();
        setScripts((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        setSelectedId(updated.id);
      } else {
        const res = await fetch("/api/scripts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: formName.trim(), content: formContent }),
        });
        if (!res.ok) throw new Error("Erro ao criar script");
        const created: Script = await res.json();
        setScripts((prev) => [...prev, created]);
        setSelectedId(created.id);
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
      const res = await fetch("/api/scripts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteTarget.id }),
      });
      if (!res.ok) throw new Error("Erro ao excluir script");
      const remaining = scripts.filter((s) => s.id !== deleteTarget.id);
      setScripts(remaining);
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

  const selectedScript = scripts.find((s) => s.id === selectedId) ?? null;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Comercial</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Arquivos e scripts comerciais para o time de vendas.
        </p>
      </div>

      <div className="flex gap-1 border-b border-gray-medium mb-8">
        <button
          onClick={() => setActiveTab("arquivos")}
          className={cn(
            "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
            activeTab === "arquivos"
              ? "border-black text-black"
              : "border-transparent text-muted-foreground hover:text-black"
          )}
        >
          Arquivos
        </button>
        <button
          onClick={() => setActiveTab("scripts")}
          className={cn(
            "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
            activeTab === "scripts"
              ? "border-black text-black"
              : "border-transparent text-muted-foreground hover:text-black"
          )}
        >
          Scripts Comerciais
        </button>
      </div>

      {activeTab === "arquivos" && (
        <FileUpload section="Comercial" />
      )}

      {activeTab === "scripts" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground">
              {scripts.length} {scripts.length === 1 ? "script" : "scripts"}
            </span>
            <Button variant="default" size="sm" onClick={openCreateModal}>
              <Plus size={14} />
              Novo Script
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
              <span className="text-sm">Carregando scripts...</span>
            </div>
          ) : scripts.length === 0 ? (
            <div className="border border-dashed border-gray-medium rounded-lg p-12 text-center">
              <FileText size={32} className="mx-auto mb-3 text-muted-foreground opacity-40" />
              <p className="text-sm font-medium text-gray-dark mb-1">Nenhum script ainda</p>
              <p className="text-xs text-muted-foreground mb-4">
                Crie o primeiro script comercial para o time.
              </p>
              <Button variant="outline" size="sm" onClick={openCreateModal}>
                <Plus size={14} />
                Novo Script
              </Button>
            </div>
          ) : (
            <div className="flex gap-0 border border-gray-medium rounded-lg overflow-hidden min-h-[480px]">
              <div className="w-56 shrink-0 border-r border-gray-medium bg-gray-light overflow-y-auto">
                {scripts.map((script) => (
                  <button
                    key={script.id}
                    onClick={() => setSelectedId(script.id)}
                    className={cn(
                      "w-full text-left px-3 py-3 border-b border-gray-medium text-sm transition-colors",
                      selectedId === script.id
                        ? "bg-black text-white"
                        : "text-gray-dark hover:bg-white"
                    )}
                  >
                    <span className="block truncate font-medium">{script.name}</span>
                    <span
                      className={cn(
                        "block text-xs mt-0.5 truncate",
                        selectedId === script.id ? "text-white/60" : "text-muted-foreground"
                      )}
                    >
                      {new Date(script.updatedAt).toLocaleDateString("pt-BR")}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex-1 flex flex-col min-w-0">
                {selectedScript ? (
                  <>
                    <div className="flex items-start justify-between px-6 py-4 border-b border-gray-medium bg-white">
                      <div className="min-w-0 mr-4">
                        <h2 className="text-base font-semibold truncate">{selectedScript.name}</h2>
                        <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                          <span>Criado em {formatDate(selectedScript.createdAt)}</span>
                          <span>·</span>
                          <span>Atualizado em {formatDate(selectedScript.updatedAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(selectedScript)}
                          title="Editar script"
                        >
                          <Pencil size={14} />
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(selectedScript)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          title="Excluir script"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                    <div className="flex-1 p-6 overflow-y-auto bg-white">
                      {selectedScript.content ? (
                        <pre className="text-sm text-gray-dark whitespace-pre-wrap font-sans leading-relaxed">
                          {selectedScript.content}
                        </pre>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          Este script nao possui conteudo. Clique em Editar para adicionar.
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    <p className="text-sm">Selecione um script para visualizar.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editTarget ? "Editar Script" : "Novo Script"}
        description={
          editTarget
            ? "Atualize o nome e o conteudo do script."
            : "Preencha o nome e o conteudo do novo script comercial."
        }
        className="max-w-2xl"
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Nome do script"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="Ex: Abordagem inicial — coworking flexivel"
            autoFocus
          />
          <Textarea
            label="Conteudo"
            value={formContent}
            onChange={(e) => setFormContent(e.target.value)}
            placeholder="Escreva o script aqui. Use linhas em branco para separar blocos..."
            rows={14}
            className="font-mono text-sm leading-relaxed"
          />
          {formError && (
            <p className="text-xs text-red-500">{formError}</p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={closeModal} disabled={saving}>
              Cancelar
            </Button>
            <Button variant="default" size="sm" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 size={13} className="animate-spin" />}
              {editTarget ? "Salvar alteracoes" : "Criar script"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Excluir script"
        description={`Tem certeza que deseja excluir "${deleteTarget?.name}"? Esta acao nao pode ser desfeita.`}
      >
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
            className="bg-red-500 text-white hover:bg-red-600 focus:ring-red-500"
          >
            {deleting && <Loader2 size={13} className="animate-spin" />}
            Excluir
          </Button>
        </div>
      </Modal>
    </div>
  );
}
