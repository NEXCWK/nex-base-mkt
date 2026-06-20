"use client";

import { useState, useEffect, useCallback } from "react";
import { FileUpload } from "@/components/upload/FileUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { MarkdownContent } from "@/components/ui/markdown-content";
import { cn } from "@/lib/utils";
import { Plus, Pencil, Trash2, Loader2, FileText, Search } from "lucide-react";

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

type MainTab = "arquivos" | "scripts" | "descontos" | "processos";
type ScriptSubTab = "scripts" | "fups" | "keypoints" | "sla";

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
        "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
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

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Vendas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Arquivos, scripts e diretrizes comerciais para o time de vendas.
        </p>
      </div>

      {/* Main tabs */}
      <div className="flex gap-1 border-b border-gray-medium mb-8">
        <TabButton label="Arquivos" active={mainTab === "arquivos"} onClick={() => setMainTab("arquivos")} />
        <TabButton label="Scripts Comerciais" active={mainTab === "scripts"} onClick={() => setMainTab("scripts")} />
        <TabButton label="Diretrizes de Desconto" active={mainTab === "descontos"} onClick={() => setMainTab("descontos")} />
        <TabButton label="Processos de Fechamento e Cancelamento" active={mainTab === "processos"} onClick={() => setMainTab("processos")} />
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
    </div>
  );
}
