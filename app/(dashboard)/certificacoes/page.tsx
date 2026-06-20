"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Award, Plus, ChevronDown, ChevronUp,
  ExternalLink, Pencil, Trash2, Loader2,
  Link as LinkIcon, FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CertItem {
  id: string;
  name: string;
  url: string;
  addedAt: string;
}

interface CertGroup {
  id: string;
  name: string;
  items: CertItem[];
  createdAt: string;
}

type DeleteTarget =
  | { type: "group"; group: CertGroup }
  | { type: "item"; groupId: string; item: CertItem };

export default function CertificacoesPage() {
  const [groups, setGroups] = useState<CertGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Group modal
  const [groupModal, setGroupModal] = useState<{ open: boolean; editing?: CertGroup }>({ open: false });
  const [groupName, setGroupName] = useState("");

  // Item modal
  const [itemModal, setItemModal] = useState<{ open: boolean; groupId?: string; editing?: CertItem }>({ open: false });
  const [itemName, setItemName] = useState("");
  const [itemUrl, setItemUrl] = useState("");

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState("");

  const loadGroups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/certificacoes");
      if (res.ok) setGroups(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadGroups(); }, [loadGroups]);

  function openAddGroup() {
    setGroupName("");
    setFormError("");
    setGroupModal({ open: true });
  }

  function openEditGroup(g: CertGroup) {
    setGroupName(g.name);
    setFormError("");
    setGroupModal({ open: true, editing: g });
  }

  function openAddItem(groupId: string) {
    setItemName("");
    setItemUrl("");
    setFormError("");
    setItemModal({ open: true, groupId });
  }

  function openEditItem(groupId: string, item: CertItem) {
    setItemName(item.name);
    setItemUrl(item.url);
    setFormError("");
    setItemModal({ open: true, groupId, editing: item });
  }

  async function saveGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!groupName.trim()) { setFormError("Nome obrigatório."); return; }
    setSaving(true);
    setFormError("");
    try {
      const isEdit = !!groupModal.editing;
      const res = await fetch("/api/certificacoes", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isEdit
            ? { type: "group", id: groupModal.editing!.id, name: groupName.trim() }
            : { type: "group", name: groupName.trim() }
        ),
      });
      if (!res.ok) throw new Error("Erro ao salvar conjunto.");
      setGroupModal({ open: false });
      await loadGroups();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erro");
    } finally {
      setSaving(false);
    }
  }

  async function saveItem(e: React.FormEvent) {
    e.preventDefault();
    if (!itemName.trim() || !itemUrl.trim()) { setFormError("Nome e URL obrigatórios."); return; }
    setSaving(true);
    setFormError("");
    try {
      const isEdit = !!itemModal.editing;
      const res = await fetch("/api/certificacoes", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isEdit
            ? { type: "item", groupId: itemModal.groupId, id: itemModal.editing!.id, name: itemName.trim(), url: itemUrl.trim() }
            : { type: "item", groupId: itemModal.groupId, name: itemName.trim(), url: itemUrl.trim() }
        ),
      });
      if (!res.ok) throw new Error("Erro ao salvar certificação.");
      setItemModal({ open: false });
      await loadGroups();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erro");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const body =
        deleteTarget.type === "group"
          ? { type: "group", id: deleteTarget.group.id }
          : { type: "item", groupId: deleteTarget.groupId, id: deleteTarget.item.id };
      await fetch("/api/certificacoes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setDeleteTarget(null);
      await loadGroups();
    } finally {
      setDeleting(false);
    }
  }

  const deleteDescription =
    deleteTarget?.type === "group"
      ? `Remover o conjunto "${deleteTarget.group.name}" e todas as suas certificações? Esta ação não pode ser desfeita.`
      : `Remover a certificação "${deleteTarget?.item?.name}"?`;

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gray-light rounded-lg flex items-center justify-center">
            <Award size={17} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Certificações</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Conjuntos de certificações e cursos da equipe</p>
          </div>
        </div>
        <Button variant="accent" onClick={openAddGroup}>
          <Plus size={15} />
          Novo conjunto
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm py-10">
          <Loader2 size={15} className="animate-spin" /> Carregando…
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-medium rounded-xl">
          <Award size={28} className="mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="text-sm font-medium text-muted-foreground mb-1">
            Nenhum conjunto de certificações ainda.
          </p>
          <p className="text-xs text-muted-foreground mb-5">
            Crie um conjunto e adicione os links das certificações.
          </p>
          <Button variant="accent" onClick={openAddGroup}>
            <Plus size={14} />
            Criar primeiro conjunto
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {groups.map((group) => {
            const expanded = expandedId === group.id;
            return (
              <div key={group.id} className="border border-gray-medium rounded-xl overflow-hidden bg-white">
                {/* Group row */}
                <div className="flex items-center gap-2 px-4 py-3.5">
                  <button
                    className="flex-1 flex items-center gap-2.5 text-left min-w-0"
                    onClick={() => setExpandedId(expanded ? null : group.id)}
                  >
                    <FolderOpen size={15} className="shrink-0 text-muted-foreground" />
                    <span className="font-semibold text-sm truncate">{group.name}</span>
                    <Badge variant="muted" className="shrink-0">
                      {group.items.length} {group.items.length === 1 ? "cert." : "certs."}
                    </Badge>
                  </button>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={() => openEditGroup(group)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-gray-light transition-colors"
                      title="Editar conjunto"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget({ type: "group", group })}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Remover conjunto"
                    >
                      <Trash2 size={13} />
                    </button>
                    <button
                      onClick={() => setExpandedId(expanded ? null : group.id)}
                      className="p-1.5 rounded-md text-muted-foreground hover:bg-gray-light transition-colors"
                    >
                      {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>

                {/* Expanded content */}
                {expanded && (
                  <div className="border-t border-gray-medium">
                    {group.items.length === 0 ? (
                      <div className="px-5 py-6 text-center">
                        <p className="text-sm text-muted-foreground mb-3">
                          Nenhuma certificação neste conjunto ainda.
                        </p>
                        <Button variant="outline" size="sm" onClick={() => openAddItem(group.id)}>
                          <Plus size={13} />
                          Adicionar certificação
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="divide-y divide-gray-100">
                          {group.items.map((item) => (
                            <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                              <LinkIcon size={13} className="shrink-0 text-muted-foreground" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{item.url}</p>
                              </div>
                              <div className="flex items-center gap-0.5 shrink-0">
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-gray-light transition-colors"
                                  title="Abrir link"
                                >
                                  <ExternalLink size={13} />
                                </a>
                                <button
                                  onClick={() => openEditItem(group.id, item)}
                                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-gray-light transition-colors"
                                  title="Editar"
                                >
                                  <Pencil size={13} />
                                </button>
                                <button
                                  onClick={() => setDeleteTarget({ type: "item", groupId: group.id, item })}
                                  className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
                                  title="Remover"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="px-4 py-3 border-t border-gray-100">
                          <button
                            onClick={() => openAddItem(group.id)}
                            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Plus size={12} />
                            Adicionar certificação
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Group modal */}
      <Modal
        open={groupModal.open}
        onClose={() => setGroupModal({ open: false })}
        title={groupModal.editing ? "Editar conjunto" : "Novo conjunto de certificações"}
        description="Dê um nome ao conjunto para agrupar certificações relacionadas."
      >
        <form onSubmit={saveGroup} className="flex flex-col gap-4">
          <Input
            label="Nome do conjunto *"
            placeholder="Ex: Plataforma RD Station"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            autoFocus
          />
          {formError && <p className="text-xs text-red-500">{formError}</p>}
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setGroupModal({ open: false })}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} className="flex-1">
              {saving && <Loader2 size={13} className="animate-spin" />}
              {groupModal.editing ? "Salvar" : "Criar conjunto"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Item modal */}
      <Modal
        open={itemModal.open}
        onClose={() => setItemModal({ open: false })}
        title={itemModal.editing ? "Editar certificação" : "Nova certificação"}
        description="Adicione o nome e o link da certificação."
      >
        <form onSubmit={saveItem} className="flex flex-col gap-4">
          <Input
            label="Nome da certificação *"
            placeholder="Ex: Marketing de Conteúdo Avançado"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            autoFocus
          />
          <Input
            label="URL / Link *"
            placeholder="https://..."
            value={itemUrl}
            onChange={(e) => setItemUrl(e.target.value)}
          />
          {formError && <p className="text-xs text-red-500">{formError}</p>}
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setItemModal({ open: false })}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} className="flex-1">
              {saving && <Loader2 size={13} className="animate-spin" />}
              {itemModal.editing ? "Salvar" : "Adicionar"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Confirmar remoção"
        description={deleteDescription}
      >
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Cancelar
          </Button>
          <Button onClick={handleDelete} disabled={deleting} className={cn("flex-1 bg-red-500 text-white hover:bg-red-600")}>
            {deleting && <Loader2 size={13} className="animate-spin" />}
            Remover
          </Button>
        </div>
      </Modal>
    </div>
  );
}
