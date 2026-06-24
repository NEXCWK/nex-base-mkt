"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
  Calendar,
  LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

// ─── Types ────────────────────────────────────────────────────────────────────

interface KanbanColumn {
  id: string;
  title: string;
  order: number;
  createdAt: string;
}

interface KanbanCard {
  id: string;
  columnId: string;
  title: string;
  description: string;
  members: string[];
  dueDate: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface TeamMember {
  email: string;
  name: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function formatDate(iso: string) {
  try {
    return format(parseISO(iso), "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return iso;
  }
}

// ─── Card Detail / Edit Modal ─────────────────────────────────────────────────

interface CardModalProps {
  open: boolean;
  onClose: () => void;
  card: KanbanCard | null;
  columnId: string;
  teamMembers: TeamMember[];
  onSaved: (card: KanbanCard) => void;
  onDeleted: (id: string) => void;
}

function CardModal({ open, onClose, card, columnId, teamMembers, onSaved, onDeleted }: CardModalProps) {
  const isEdit = card !== null;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [members, setMembers] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setTitle(card?.title ?? "");
      setDescription(card?.description ?? "");
      setMembers(card?.members ?? []);
      setDueDate(card?.dueDate ?? "");
      setError("");
    }
  }, [open, card]);

  function toggleMember(email: string) {
    setMembers((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  }

  async function handleSave() {
    if (!title.trim()) { setError("Título obrigatório."); return; }
    setSaving(true);
    setError("");
    try {
      const body = isEdit
        ? { id: card!.id, title, description, members, dueDate }
        : { columnId, title, description, members, dueDate };
      const res = await fetch(`/api/repositorio?type=card`, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Erro ao salvar");
      onSaved(await res.json());
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!card) return;
    setDeleting(true);
    try {
      await fetch("/api/repositorio?type=card", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: card.id }),
      });
      onDeleted(card.id);
      onClose();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar card" : "Novo card"}
      className="max-w-lg"
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Título *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título do card"
        />
        <Textarea
          label="Descrição"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descreva o conteúdo ou contexto deste card…"
          rows={4}
        />

        {teamMembers.length > 0 && (
          <div>
            <label className="text-sm font-medium text-gray-dark block mb-2">Membros</label>
            <div className="flex flex-wrap gap-2">
              {teamMembers.map((m) => {
                const selected = members.includes(m.email);
                return (
                  <button
                    key={m.email}
                    type="button"
                    onClick={() => toggleMember(m.email)}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                      selected
                        ? "bg-black text-white border-black"
                        : "bg-white text-gray-dark border-gray-medium hover:border-gray-dark"
                    )}
                  >
                    <span className="w-4 h-4 rounded-full bg-gray-light flex items-center justify-center text-[9px] font-bold text-black shrink-0">
                      {initials(m.name || m.email)}
                    </span>
                    {m.name || m.email}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-gray-dark block mb-1.5">Data de vencimento</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="h-10 w-full rounded-md border border-gray-medium bg-white px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
          />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex items-center justify-between pt-2">
          {isEdit ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 disabled:opacity-50 transition-colors"
            >
              {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
              Excluir card
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={saving || deleting}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving || deleting || !title.trim()}>
              {saving && <Loader2 size={13} className="animate-spin" />}
              {isEdit ? "Salvar" : "Criar card"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─── Column Menu ──────────────────────────────────────────────────────────────

interface ColumnMenuProps {
  column: KanbanColumn;
  onRename: (col: KanbanColumn) => void;
  onDelete: (col: KanbanColumn) => void;
}

function ColumnMenu({ column, onRename, onDelete }: ColumnMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-gray-light transition-colors"
        title="Opções"
      >
        <MoreHorizontal size={14} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-7 z-20 bg-white border border-gray-medium rounded-lg shadow-lg py-1 w-36">
            <button
              type="button"
              onClick={() => { setOpen(false); onRename(column); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-foreground hover:bg-gray-light transition-colors"
            >
              <Pencil size={12} /> Renomear
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); onDelete(column); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={12} /> Excluir coluna
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── KanbanCard display ───────────────────────────────────────────────────────

interface KanbanCardDisplayProps {
  card: KanbanCard;
  teamMembers: TeamMember[];
  onClick: () => void;
}

function KanbanCardDisplay({ card, teamMembers, onClick }: KanbanCardDisplayProps) {
  const memberMap = Object.fromEntries(teamMembers.map((m) => [m.email, m]));

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-medium rounded-xl p-3.5 cursor-pointer hover:shadow-sm hover:border-gray-dark transition-all group"
    >
      <p className="text-sm font-semibold text-foreground leading-snug mb-1">{card.title}</p>
      {card.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-2">
          {card.description}
        </p>
      )}
      {(card.members.length > 0 || card.dueDate) && (
        <div className="flex items-center justify-between mt-2 gap-2">
          {card.members.length > 0 ? (
            <div className="flex -space-x-1.5">
              {card.members.slice(0, 4).map((email) => {
                const m = memberMap[email];
                return (
                  <div
                    key={email}
                    title={m?.name || email}
                    className="w-5 h-5 rounded-full bg-gray-light border border-white flex items-center justify-center text-[9px] font-bold text-gray-dark shrink-0"
                  >
                    {initials(m?.name || email)}
                  </div>
                );
              })}
              {card.members.length > 4 && (
                <div className="w-5 h-5 rounded-full bg-gray-light border border-white flex items-center justify-center text-[9px] font-bold text-muted-foreground shrink-0">
                  +{card.members.length - 4}
                </div>
              )}
            </div>
          ) : (
            <span />
          )}
          {card.dueDate && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
              <Calendar size={10} />
              {formatDate(card.dueDate)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RepositorioPage() {
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Column modals
  const [colModalOpen, setColModalOpen] = useState(false);
  const [colModalEdit, setColModalEdit] = useState<KanbanColumn | null>(null);
  const [colTitle, setColTitle] = useState("");
  const [colSaving, setColSaving] = useState(false);
  const [colError, setColError] = useState("");

  // Delete column confirmation
  const [deleteCol, setDeleteCol] = useState<KanbanColumn | null>(null);
  const [deletingCol, setDeletingCol] = useState(false);

  // Card modal
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [cardModalEdit, setCardModalEdit] = useState<KanbanCard | null>(null);
  const [cardModalColumnId, setCardModalColumnId] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [kanbanRes, teamRes] = await Promise.all([
        fetch("/api/repositorio"),
        fetch("/api/team"),
      ]);
      if (kanbanRes.ok) {
        const data = await kanbanRes.json();
        setColumns((data.columns ?? []).sort((a: KanbanColumn, b: KanbanColumn) => a.order - b.order));
        setCards(data.cards ?? []);
      }
      if (teamRes.ok) {
        setTeamMembers(await teamRes.json());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Column CRUD ──

  function openCreateColumn() {
    setColModalEdit(null);
    setColTitle("");
    setColError("");
    setColModalOpen(true);
  }

  function openRenameColumn(col: KanbanColumn) {
    setColModalEdit(col);
    setColTitle(col.title);
    setColError("");
    setColModalOpen(true);
  }

  async function handleSaveColumn() {
    if (!colTitle.trim()) { setColError("Título obrigatório."); return; }
    setColSaving(true);
    setColError("");
    try {
      const res = colModalEdit
        ? await fetch("/api/repositorio?type=column", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: colModalEdit.id, title: colTitle }),
          })
        : await fetch("/api/repositorio?type=column", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: colTitle }),
          });
      if (!res.ok) throw new Error("Erro ao salvar");
      const saved: KanbanColumn = await res.json();
      if (colModalEdit) {
        setColumns((prev) => prev.map((c) => (c.id === saved.id ? saved : c)));
      } else {
        setColumns((prev) => [...prev, saved]);
      }
      setColModalOpen(false);
    } catch (e) {
      setColError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setColSaving(false);
    }
  }

  async function handleDeleteColumn() {
    if (!deleteCol) return;
    setDeletingCol(true);
    try {
      await fetch("/api/repositorio?type=column", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteCol.id }),
      });
      setColumns((prev) => prev.filter((c) => c.id !== deleteCol.id));
      setCards((prev) => prev.filter((c) => c.columnId !== deleteCol.id));
      setDeleteCol(null);
    } finally {
      setDeletingCol(false);
    }
  }

  // ── Card CRUD ──

  function openCreateCard(columnId: string) {
    setCardModalEdit(null);
    setCardModalColumnId(columnId);
    setCardModalOpen(true);
  }

  function openEditCard(card: KanbanCard) {
    setCardModalEdit(card);
    setCardModalColumnId(card.columnId);
    setCardModalOpen(true);
  }

  function handleCardSaved(card: KanbanCard) {
    setCards((prev) => {
      const idx = prev.findIndex((c) => c.id === card.id);
      if (idx >= 0) return prev.map((c) => (c.id === card.id ? card : c));
      return [...prev, card];
    });
  }

  function handleCardDeleted(id: string) {
    setCards((prev) => prev.filter((c) => c.id !== id));
  }

  // ── Render ──

  if (loading) {
    return (
      <div className="p-4 sm:p-8 flex items-center gap-2 text-muted-foreground text-sm">
        <Loader2 size={16} className="animate-spin" /> Carregando repositório…
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Repositório</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quadro kanban para organizar informações, projetos e updates do time.
          </p>
        </div>
        <Button variant="default" size="sm" onClick={openCreateColumn} className="ml-4 shrink-0">
          <Plus size={14} />
          Nova coluna
        </Button>
      </div>

      {/* Board */}
      {columns.length === 0 ? (
        <div className="border border-dashed border-gray-medium rounded-xl py-20 text-center">
          <LayoutGrid size={28} className="mx-auto mb-3 text-muted-foreground opacity-30" />
          <p className="text-sm font-medium text-muted-foreground mb-1">Nenhuma coluna ainda.</p>
          <p className="text-xs text-muted-foreground mb-5">
            Crie colunas para organizar o quadro.
          </p>
          <Button variant="outline" size="sm" onClick={openCreateColumn}>
            <Plus size={13} />
            Nova coluna
          </Button>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1 min-h-0 items-start">
          {columns.map((col) => {
            const colCards = cards
              .filter((c) => c.columnId === col.id)
              .sort((a, b) => a.order - b.order);
            return (
              <div
                key={col.id}
                className="flex-shrink-0 w-[280px] flex flex-col bg-gray-light/60 border border-gray-medium rounded-xl overflow-hidden"
                style={{ maxHeight: "calc(100vh - 200px)" }}
              >
                {/* Column header */}
                <div className="flex items-center justify-between px-3.5 py-3 border-b border-gray-medium shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-semibold text-foreground truncate">{col.title}</span>
                    <span className="text-xs text-muted-foreground bg-gray-medium/60 rounded-full px-1.5 py-0.5 shrink-0">
                      {colCards.length}
                    </span>
                  </div>
                  <ColumnMenu
                    column={col}
                    onRename={openRenameColumn}
                    onDelete={(c) => setDeleteCol(c)}
                  />
                </div>

                {/* Cards list */}
                <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
                  {colCards.map((card) => (
                    <KanbanCardDisplay
                      key={card.id}
                      card={card}
                      teamMembers={teamMembers}
                      onClick={() => openEditCard(card)}
                    />
                  ))}
                </div>

                {/* Add card button */}
                <div className="shrink-0 p-2 border-t border-gray-medium">
                  <button
                    type="button"
                    onClick={() => openCreateCard(col.id)}
                    className="flex items-center gap-1.5 w-full px-3 py-2 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-white transition-colors"
                  >
                    <Plus size={12} />
                    Adicionar card
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Column create/rename modal */}
      <Modal
        open={colModalOpen}
        onClose={() => setColModalOpen(false)}
        title={colModalEdit ? "Renomear coluna" : "Nova coluna"}
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Título da coluna *"
            value={colTitle}
            onChange={(e) => setColTitle(e.target.value)}
            placeholder="Ex: Em andamento, Concluído…"
            onKeyDown={(e) => { if (e.key === "Enter") handleSaveColumn(); }}
          />
          {colError && <p className="text-xs text-red-500">{colError}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => setColModalOpen(false)} disabled={colSaving}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSaveColumn} disabled={colSaving || !colTitle.trim()}>
              {colSaving && <Loader2 size={13} className="animate-spin" />}
              {colModalEdit ? "Salvar" : "Criar"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete column confirmation */}
      <Modal
        open={!!deleteCol}
        onClose={() => setDeleteCol(null)}
        title="Excluir coluna"
        description={
          deleteCol
            ? `Excluir "${deleteCol.title}" e todos os seus cards? Esta ação não pode ser desfeita.`
            : ""
        }
      >
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => setDeleteCol(null)} disabled={deletingCol}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleDeleteColumn}
            disabled={deletingCol}
            className="bg-red-500 text-white hover:bg-red-600"
          >
            {deletingCol && <Loader2 size={13} className="animate-spin" />}
            Excluir
          </Button>
        </div>
      </Modal>

      {/* Card create/edit modal */}
      <CardModal
        open={cardModalOpen}
        onClose={() => setCardModalOpen(false)}
        card={cardModalEdit}
        columnId={cardModalColumnId}
        teamMembers={teamMembers}
        onSaved={handleCardSaved}
        onDeleted={handleCardDeleted}
      />
    </div>
  );
}
