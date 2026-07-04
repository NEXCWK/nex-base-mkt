"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Megaphone, Plus, Pencil, Trash2, Loader2,
  ArrowUp, ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CadenciaRule {
  id: string;
  title: string;
  description: string;
  tag: string;
}

interface FlowStep {
  id: string;
  title: string;
  description: string;
  optional: boolean;
  badge: string;
}

interface RoleCard {
  id: string;
  tag: string;
  description: string;
}

interface CadenciaCampanhas {
  subtitle: string;
  rulesIntro: string;
  rules: CadenciaRule[];
  whyIntro: string;
  whyParagraphs: string[];
  flowIntro: string;
  flowSteps: FlowStep[];
  rolesIntro: string;
  roles: RoleCard[];
  footerNote: string;
  updatedAt: string;
}

const EMPTY_TEXTS_FORM = {
  subtitle: "",
  rulesIntro: "",
  whyIntro: "",
  whyParagraphsText: "",
  flowIntro: "",
  rolesIntro: "",
  footerNote: "",
};

const EMPTY_RULE_FORM = { title: "", description: "", tag: "" };
const EMPTY_STEP_FORM = { title: "", description: "", optional: false, badge: "Se previsto na estratégia" };
const EMPTY_ROLE_FORM = { tag: "", description: "" };

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CadenciaCampanhasPage() {
  const [data, setData] = useState<CadenciaCampanhas | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [textsModal, setTextsModal] = useState(false);
  const [textsForm, setTextsForm] = useState(EMPTY_TEXTS_FORM);

  const [ruleModal, setRuleModal] = useState<{ open: boolean; editing?: CadenciaRule }>({ open: false });
  const [ruleForm, setRuleForm] = useState(EMPTY_RULE_FORM);
  const [ruleDeleteTarget, setRuleDeleteTarget] = useState<CadenciaRule | null>(null);

  const [stepModal, setStepModal] = useState<{ open: boolean; editing?: FlowStep }>({ open: false });
  const [stepForm, setStepForm] = useState(EMPTY_STEP_FORM);
  const [stepDeleteTarget, setStepDeleteTarget] = useState<FlowStep | null>(null);

  const [roleModal, setRoleModal] = useState<{ open: boolean; editing?: RoleCard }>({ open: false });
  const [roleForm, setRoleForm] = useState(EMPTY_ROLE_FORM);
  const [roleDeleteTarget, setRoleDeleteTarget] = useState<RoleCard | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cadencia-campanhas");
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function persist(partial: Partial<CadenciaCampanhas>) {
    const res = await fetch("/api/cadencia-campanhas", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partial),
    });
    if (!res.ok) throw new Error("Erro ao salvar");
    const updated: CadenciaCampanhas = await res.json();
    setData(updated);
    return updated;
  }

  // ── Textos gerais ──
  function openTextsEdit() {
    if (!data) return;
    setTextsForm({
      subtitle: data.subtitle,
      rulesIntro: data.rulesIntro,
      whyIntro: data.whyIntro,
      whyParagraphsText: data.whyParagraphs.join("\n\n"),
      flowIntro: data.flowIntro,
      rolesIntro: data.rolesIntro,
      footerNote: data.footerNote,
    });
    setFormError("");
    setTextsModal(true);
  }

  async function saveTexts(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const whyParagraphs = textsForm.whyParagraphsText
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean);
      await persist({
        subtitle: textsForm.subtitle.trim(),
        rulesIntro: textsForm.rulesIntro.trim(),
        whyIntro: textsForm.whyIntro.trim(),
        whyParagraphs,
        flowIntro: textsForm.flowIntro.trim(),
        rolesIntro: textsForm.rolesIntro.trim(),
        footerNote: textsForm.footerNote.trim(),
      });
      setTextsModal(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erro");
    } finally {
      setSaving(false);
    }
  }

  // ── Regras ──
  function openRuleCreate() {
    setRuleForm(EMPTY_RULE_FORM);
    setFormError("");
    setRuleModal({ open: true });
  }
  function openRuleEdit(r: CadenciaRule) {
    setRuleForm({ title: r.title, description: r.description, tag: r.tag });
    setFormError("");
    setRuleModal({ open: true, editing: r });
  }
  async function saveRule(e: React.FormEvent) {
    e.preventDefault();
    if (!ruleForm.title.trim()) { setFormError("Título obrigatório."); return; }
    if (!data) return;
    setSaving(true);
    setFormError("");
    try {
      const isEdit = !!ruleModal.editing;
      const newRule: CadenciaRule = {
        id: isEdit ? ruleModal.editing!.id : Date.now().toString(),
        title: ruleForm.title.trim(),
        description: ruleForm.description.trim(),
        tag: ruleForm.tag.trim(),
      };
      const rules = isEdit
        ? data.rules.map((r) => (r.id === newRule.id ? newRule : r))
        : [...data.rules, newRule];
      await persist({ rules });
      setRuleModal({ open: false });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erro");
    } finally {
      setSaving(false);
    }
  }
  async function deleteRule() {
    if (!ruleDeleteTarget || !data) return;
    setSaving(true);
    try {
      await persist({ rules: data.rules.filter((r) => r.id !== ruleDeleteTarget.id) });
      setRuleDeleteTarget(null);
    } finally {
      setSaving(false);
    }
  }

  // ── Fluxo ──
  function openStepCreate() {
    setStepForm(EMPTY_STEP_FORM);
    setFormError("");
    setStepModal({ open: true });
  }
  function openStepEdit(s: FlowStep) {
    setStepForm({ title: s.title, description: s.description, optional: s.optional, badge: s.badge });
    setFormError("");
    setStepModal({ open: true, editing: s });
  }
  async function saveStep(e: React.FormEvent) {
    e.preventDefault();
    if (!stepForm.title.trim()) { setFormError("Título obrigatório."); return; }
    if (!data) return;
    setSaving(true);
    setFormError("");
    try {
      const isEdit = !!stepModal.editing;
      const newStep: FlowStep = {
        id: isEdit ? stepModal.editing!.id : Date.now().toString(),
        title: stepForm.title.trim(),
        description: stepForm.description.trim(),
        optional: stepForm.optional,
        badge: stepForm.optional ? stepForm.badge.trim() : "",
      };
      const flowSteps = isEdit
        ? data.flowSteps.map((s) => (s.id === newStep.id ? newStep : s))
        : [...data.flowSteps, newStep];
      await persist({ flowSteps });
      setStepModal({ open: false });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erro");
    } finally {
      setSaving(false);
    }
  }
  async function deleteStep() {
    if (!stepDeleteTarget || !data) return;
    setSaving(true);
    try {
      await persist({ flowSteps: data.flowSteps.filter((s) => s.id !== stepDeleteTarget.id) });
      setStepDeleteTarget(null);
    } finally {
      setSaving(false);
    }
  }
  async function moveStep(index: number, dir: -1 | 1) {
    if (!data) return;
    const target = index + dir;
    if (target < 0 || target >= data.flowSteps.length) return;
    const steps = [...data.flowSteps];
    [steps[index], steps[target]] = [steps[target], steps[index]];
    await persist({ flowSteps: steps });
  }

  // ── Papéis ──
  function openRoleCreate() {
    setRoleForm(EMPTY_ROLE_FORM);
    setFormError("");
    setRoleModal({ open: true });
  }
  function openRoleEdit(r: RoleCard) {
    setRoleForm({ tag: r.tag, description: r.description });
    setFormError("");
    setRoleModal({ open: true, editing: r });
  }
  async function saveRole(e: React.FormEvent) {
    e.preventDefault();
    if (!roleForm.tag.trim()) { setFormError("Nome do papel obrigatório."); return; }
    if (!data) return;
    setSaving(true);
    setFormError("");
    try {
      const isEdit = !!roleModal.editing;
      const newRole: RoleCard = {
        id: isEdit ? roleModal.editing!.id : Date.now().toString(),
        tag: roleForm.tag.trim(),
        description: roleForm.description.trim(),
      };
      const roles = isEdit
        ? data.roles.map((r) => (r.id === newRole.id ? newRole : r))
        : [...data.roles, newRole];
      await persist({ roles });
      setRoleModal({ open: false });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erro");
    } finally {
      setSaving(false);
    }
  }
  async function deleteRole() {
    if (!roleDeleteTarget || !data) return;
    setSaving(true);
    try {
      await persist({ roles: data.roles.filter((r) => r.id !== roleDeleteTarget.id) });
      setRoleDeleteTarget(null);
    } finally {
      setSaving(false);
    }
  }

  if (loading || !data) {
    return (
      <div className="p-4 sm:p-8 max-w-5xl mx-auto">
        <div className="flex items-center gap-2 text-muted-foreground text-sm py-10">
          <Loader2 size={15} className="animate-spin" /> Carregando...
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-10 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gray-light rounded-lg flex items-center justify-center">
            <Megaphone size={17} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Cadência de Campanhas</h1>
            <p className="text-sm text-muted-foreground mt-0.5 max-w-2xl">{data.subtitle}</p>
          </div>
        </div>
        <button
          onClick={openTextsEdit}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-gray-light transition-colors shrink-0"
          title="Editar textos gerais"
        >
          <Pencil size={14} />
        </button>
      </div>

      <div className="flex flex-col gap-12">
        {/* Princípios da cadência */}
        <section>
          <p className="text-xs font-600 uppercase tracking-wide text-muted-foreground mb-1">
            Princípios da cadência
          </p>
          <div className="flex items-start justify-between gap-3 mb-4">
            <p className="text-sm text-muted-foreground max-w-2xl">{data.rulesIntro}</p>
            <Button variant="outline" size="sm" onClick={openRuleCreate} className="shrink-0">
              <Plus size={13} />
              Adicionar regra
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.rules.map((r, i) => (
              <div key={r.id} className="bg-white border border-gray-medium rounded-xl p-6 flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-accent text-black text-sm font-700">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button onClick={() => openRuleEdit(r)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-gray-light transition-colors" title="Editar">
                      <Pencil size={12} />
                    </button>
                    <button onClick={() => setRuleDeleteTarget(r)} className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors" title="Remover">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <h3 className="text-base font-700 mb-2">{r.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{r.description}</p>
                {r.tag && (
                  <span className="inline-block mt-4 text-xs font-600 uppercase tracking-wide border border-black rounded-md px-2.5 py-1 w-fit">
                    {r.tag}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Por que essas regras existem */}
        <section>
          <p className="text-xs font-600 uppercase tracking-wide text-muted-foreground mb-1">
            Por que essas regras existem
          </p>
          <p className="text-sm text-muted-foreground max-w-2xl mb-4">{data.whyIntro}</p>
          <div className="bg-gray-light rounded-xl p-6 sm:p-8 flex flex-col gap-4">
            {data.whyParagraphs.map((p, i) => (
              <p key={i} className="text-sm leading-relaxed max-w-3xl">{p}</p>
            ))}
          </div>
        </section>

        {/* Fluxo de criação de uma campanha */}
        <section>
          <p className="text-xs font-600 uppercase tracking-wide text-muted-foreground mb-1">
            Fluxo de criação de uma campanha
          </p>
          <div className="flex items-start justify-between gap-3 mb-6">
            <p className="text-sm text-muted-foreground max-w-2xl">{data.flowIntro}</p>
            <Button variant="outline" size="sm" onClick={openStepCreate} className="shrink-0">
              <Plus size={13} />
              Adicionar etapa
            </Button>
          </div>
          <div className="relative pl-14">
            <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gray-medium" />
            <div className="flex flex-col gap-6">
              {data.flowSteps.map((s, i) => (
                <div key={s.id} className="relative">
                  <div
                    className={cn(
                      "absolute -left-14 top-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-700 shrink-0",
                      s.optional ? "bg-white border-2 border-black text-black" : "bg-black text-white"
                    )}
                  >
                    {i + 1}
                  </div>
                  <div className="bg-white border border-gray-medium rounded-xl px-5 py-4">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-700">{s.title}</h4>
                        {s.optional && s.badge && (
                          <span className="text-[11px] font-600 uppercase tracking-wide bg-white border border-black rounded-md px-2 py-0.5">
                            {s.badge}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          onClick={() => moveStep(i, -1)}
                          disabled={i === 0}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-gray-light transition-colors disabled:opacity-30 disabled:pointer-events-none"
                          title="Mover para cima"
                        >
                          <ArrowUp size={12} />
                        </button>
                        <button
                          onClick={() => moveStep(i, 1)}
                          disabled={i === data.flowSteps.length - 1}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-gray-light transition-colors disabled:opacity-30 disabled:pointer-events-none"
                          title="Mover para baixo"
                        >
                          <ArrowDown size={12} />
                        </button>
                        <button onClick={() => openStepEdit(s)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-gray-light transition-colors" title="Editar">
                          <Pencil size={12} />
                        </button>
                        <button onClick={() => setStepDeleteTarget(s)} className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors" title="Remover">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Papéis no processo */}
        <section>
          <p className="text-xs font-600 uppercase tracking-wide text-muted-foreground mb-1">
            Papéis no processo
          </p>
          <div className="flex items-start justify-between gap-3 mb-4">
            <p className="text-sm text-muted-foreground max-w-2xl">{data.rolesIntro}</p>
            <Button variant="outline" size="sm" onClick={openRoleCreate} className="shrink-0">
              <Plus size={13} />
              Adicionar papel
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.roles.map((r) => (
              <div key={r.id} className="border border-gray-medium rounded-xl p-6">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="inline-block text-xs font-600 uppercase tracking-wide bg-black text-white rounded-md px-2.5 py-1">
                    {r.tag}
                  </span>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button onClick={() => openRoleEdit(r)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-gray-light transition-colors" title="Editar">
                      <Pencil size={12} />
                    </button>
                    <button onClick={() => setRoleDeleteTarget(r)} className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors" title="Remover">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <p className="text-sm leading-relaxed">{r.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer note */}
        <div className="border-t border-gray-medium pt-5">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="font-700 text-foreground">Nota:</strong> {data.footerNote}
          </p>
        </div>
      </div>

      {/* Textos gerais modal */}
      <Modal
        open={textsModal}
        onClose={() => setTextsModal(false)}
        title="Editar textos gerais"
        description="Subtítulo da página e introduções de cada seção."
        className="max-w-lg"
      >
        <form onSubmit={saveTexts} className="flex flex-col gap-4">
          <Textarea
            label="Subtítulo da página"
            rows={2}
            value={textsForm.subtitle}
            onChange={(e) => setTextsForm((f) => ({ ...f, subtitle: e.target.value }))}
          />
          <Textarea
            label="Introdução — Princípios da cadência"
            rows={2}
            value={textsForm.rulesIntro}
            onChange={(e) => setTextsForm((f) => ({ ...f, rulesIntro: e.target.value }))}
          />
          <Textarea
            label="Introdução — Por que essas regras existem"
            rows={2}
            value={textsForm.whyIntro}
            onChange={(e) => setTextsForm((f) => ({ ...f, whyIntro: e.target.value }))}
          />
          <Textarea
            label="Parágrafos explicativos (separe cada parágrafo com uma linha em branco)"
            rows={8}
            value={textsForm.whyParagraphsText}
            onChange={(e) => setTextsForm((f) => ({ ...f, whyParagraphsText: e.target.value }))}
          />
          <Textarea
            label="Introdução — Fluxo de criação de uma campanha"
            rows={2}
            value={textsForm.flowIntro}
            onChange={(e) => setTextsForm((f) => ({ ...f, flowIntro: e.target.value }))}
          />
          <Textarea
            label="Introdução — Papéis no processo"
            rows={2}
            value={textsForm.rolesIntro}
            onChange={(e) => setTextsForm((f) => ({ ...f, rolesIntro: e.target.value }))}
          />
          <Textarea
            label="Nota de rodapé"
            rows={2}
            value={textsForm.footerNote}
            onChange={(e) => setTextsForm((f) => ({ ...f, footerNote: e.target.value }))}
          />
          {formError && <p className="text-xs text-red-500">{formError}</p>}
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setTextsModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} className="flex-1">
              {saving && <Loader2 size={13} className="animate-spin" />}
              Salvar
            </Button>
          </div>
        </form>
      </Modal>

      {/* Rule modal */}
      <Modal
        open={ruleModal.open}
        onClose={() => setRuleModal({ open: false })}
        title={ruleModal.editing ? "Editar regra" : "Nova regra"}
        description="Um princípio da cadência de condições comerciais."
        className="max-w-lg"
      >
        <form onSubmit={saveRule} className="flex flex-col gap-4">
          <Input
            label="Título *"
            placeholder="Ex: Teto de 25% de desconto"
            value={ruleForm.title}
            onChange={(e) => setRuleForm((f) => ({ ...f, title: e.target.value }))}
            autoFocus
          />
          <Textarea
            label="Descrição"
            rows={4}
            value={ruleForm.description}
            onChange={(e) => setRuleForm((f) => ({ ...f, description: e.target.value }))}
          />
          <Input
            label="Tag (opcional)"
            placeholder="Ex: Acima de 25% → aprovação em TT"
            value={ruleForm.tag}
            onChange={(e) => setRuleForm((f) => ({ ...f, tag: e.target.value }))}
          />
          {formError && <p className="text-xs text-red-500">{formError}</p>}
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setRuleModal({ open: false })}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} className="flex-1">
              {saving && <Loader2 size={13} className="animate-spin" />}
              {ruleModal.editing ? "Salvar" : "Adicionar"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Flow step modal */}
      <Modal
        open={stepModal.open}
        onClose={() => setStepModal({ open: false })}
        title={stepModal.editing ? "Editar etapa" : "Nova etapa"}
        description="Um passo do fluxo de criação de campanha."
        className="max-w-lg"
      >
        <form onSubmit={saveStep} className="flex flex-col gap-4">
          <Input
            label="Título *"
            placeholder="Ex: Landing page da campanha"
            value={stepForm.title}
            onChange={(e) => setStepForm((f) => ({ ...f, title: e.target.value }))}
            autoFocus
          />
          <Textarea
            label="Descrição"
            rows={3}
            value={stepForm.description}
            onChange={(e) => setStepForm((f) => ({ ...f, description: e.target.value }))}
          />
          <label className="flex items-center gap-2 text-sm font-medium text-gray-dark">
            <input
              type="checkbox"
              checked={stepForm.optional}
              onChange={(e) => setStepForm((f) => ({ ...f, optional: e.target.checked }))}
              className="rounded border-gray-medium"
            />
            Etapa opcional
          </label>
          {stepForm.optional && (
            <Input
              label="Selo (badge)"
              placeholder="Ex: Se previsto na estratégia"
              value={stepForm.badge}
              onChange={(e) => setStepForm((f) => ({ ...f, badge: e.target.value }))}
            />
          )}
          {formError && <p className="text-xs text-red-500">{formError}</p>}
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setStepModal({ open: false })}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} className="flex-1">
              {saving && <Loader2 size={13} className="animate-spin" />}
              {stepModal.editing ? "Salvar" : "Adicionar"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Role modal */}
      <Modal
        open={roleModal.open}
        onClose={() => setRoleModal({ open: false })}
        title={roleModal.editing ? "Editar papel" : "Novo papel"}
        description="Uma frente responsável pelo processo."
        className="max-w-lg"
      >
        <form onSubmit={saveRole} className="flex flex-col gap-4">
          <Input
            label="Nome do papel *"
            placeholder="Ex: Marketing Ops"
            value={roleForm.tag}
            onChange={(e) => setRoleForm((f) => ({ ...f, tag: e.target.value }))}
            autoFocus
          />
          <Textarea
            label="Descrição"
            rows={3}
            value={roleForm.description}
            onChange={(e) => setRoleForm((f) => ({ ...f, description: e.target.value }))}
          />
          {formError && <p className="text-xs text-red-500">{formError}</p>}
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setRoleModal({ open: false })}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} className="flex-1">
              {saving && <Loader2 size={13} className="animate-spin" />}
              {roleModal.editing ? "Salvar" : "Adicionar"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmations */}
      <Modal
        open={!!ruleDeleteTarget}
        onClose={() => setRuleDeleteTarget(null)}
        title="Remover regra"
        description={`Remover a regra "${ruleDeleteTarget?.title}"? Esta ação não pode ser desfeita.`}
      >
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={() => setRuleDeleteTarget(null)}>Cancelar</Button>
          <Button onClick={deleteRule} disabled={saving} className="flex-1 bg-red-500 text-white hover:bg-red-600">
            {saving && <Loader2 size={13} className="animate-spin" />}
            Remover
          </Button>
        </div>
      </Modal>

      <Modal
        open={!!stepDeleteTarget}
        onClose={() => setStepDeleteTarget(null)}
        title="Remover etapa"
        description={`Remover a etapa "${stepDeleteTarget?.title}"? Esta ação não pode ser desfeita.`}
      >
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={() => setStepDeleteTarget(null)}>Cancelar</Button>
          <Button onClick={deleteStep} disabled={saving} className="flex-1 bg-red-500 text-white hover:bg-red-600">
            {saving && <Loader2 size={13} className="animate-spin" />}
            Remover
          </Button>
        </div>
      </Modal>

      <Modal
        open={!!roleDeleteTarget}
        onClose={() => setRoleDeleteTarget(null)}
        title="Remover papel"
        description={`Remover o papel "${roleDeleteTarget?.tag}"? Esta ação não pode ser desfeita.`}
      >
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={() => setRoleDeleteTarget(null)}>Cancelar</Button>
          <Button onClick={deleteRole} disabled={saving} className="flex-1 bg-red-500 text-white hover:bg-red-600">
            {saving && <Loader2 size={13} className="animate-spin" />}
            Remover
          </Button>
        </div>
      </Modal>
    </div>
  );
}
