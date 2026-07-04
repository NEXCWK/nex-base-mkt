"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  CalendarClock, Plus, Pencil, Trash2, Loader2,
  ChevronLeft, ChevronRight, Users, Clock, Target, ListChecks,
} from "lucide-react";
import {
  startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay,
  addMonths, subMonths, format,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type MeetingType = "geral" | "campanha" | "comercial" | "comunicacao" | "marketing-ia";
type Frequency = "mensal" | "semanal";
type MonthlyRule = "" | "primeiros-dias" | "terceira-quinta";

interface MeetingRoutine {
  id: string;
  title: string;
  type: MeetingType;
  frequency: Frequency;
  participants: string;
  dateLabel: string;
  weekday: number | null;
  monthlyRule: MonthlyRule;
  time: string;
  duration: string;
  objective: string;
  agenda: string[];
  createdAt: string;
  updatedAt: string;
}

const TYPE_META: Record<MeetingType, { label: string; dot: string; chip: string }> = {
  geral: { label: "Reunião Geral", dot: "bg-black", chip: "bg-black text-white" },
  campanha: { label: "Reunião de Campanha", dot: "bg-accent", chip: "bg-accent text-black" },
  comercial: { label: "Reunião Comercial", dot: "bg-white border-2 border-black", chip: "bg-white text-black border border-black" },
  comunicacao: { label: "Sprint de Comunicação", dot: "bg-gray-medium border-2 border-black", chip: "bg-gray-light text-black border-l-4 border-black" },
  "marketing-ia": { label: "Sprint de Marketing & IA", dot: "bg-gray-dark", chip: "bg-gray-dark text-white" },
};

const WEEKDAY_NAMES = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
const WEEKDAY_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const EMPTY_FORM = {
  title: "",
  type: "geral" as MeetingType,
  frequency: "mensal" as Frequency,
  participants: "",
  dateLabel: "",
  weekday: "" as string,
  monthlyRule: "" as MonthlyRule,
  time: "",
  duration: "",
  objective: "",
  agendaText: "",
};

// ─── Calendar helpers ───────────────────────────────────────────────────────────

function routineAppliesOn(m: MeetingRoutine, day: Date, thirdThursday: Date | null): boolean {
  if (m.frequency === "semanal") return m.weekday !== null && getDay(day) === m.weekday;
  if (m.monthlyRule === "primeiros-dias") return day.getDate() === 1;
  if (m.monthlyRule === "terceira-quinta") return !!thirdThursday && isSameDay(day, thirdThursday);
  return false;
}

function buildCalendar(monthDate: Date, routines: MeetingRoutine[]) {
  const start = startOfMonth(monthDate);
  const end = endOfMonth(monthDate);
  const days = eachDayOfInterval({ start, end });
  const thursdays = days.filter((d) => getDay(d) === 4);
  const thirdThursday = thursdays[2] ?? null;

  const cells: { date: Date | null; routines: MeetingRoutine[] }[] = [];
  const leading = getDay(start);
  for (let i = 0; i < leading; i++) cells.push({ date: null, routines: [] });
  for (const d of days) {
    cells.push({ date: d, routines: routines.filter((m) => routineAppliesOn(m, d, thirdThursday)) });
  }
  while (cells.length % 7 !== 0) cells.push({ date: null, routines: [] });
  return cells;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReunioesDaAreaPage() {
  const [routines, setRoutines] = useState<MeetingRoutine[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayMonth, setDisplayMonth] = useState<Date | null>(null);

  const [formModal, setFormModal] = useState<{ open: boolean; editing?: MeetingRoutine }>({ open: false });
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<MeetingRoutine | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { setDisplayMonth(new Date()); }, []);

  const fetchRoutines = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reunioes-da-area");
      if (res.ok) setRoutines(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRoutines(); }, [fetchRoutines]);

  const calendarCells = useMemo(
    () => (displayMonth ? buildCalendar(displayMonth, routines) : []),
    [displayMonth, routines]
  );

  function openCreate() {
    setForm(EMPTY_FORM);
    setFormError("");
    setFormModal({ open: true });
  }

  function openEdit(m: MeetingRoutine) {
    setForm({
      title: m.title,
      type: m.type,
      frequency: m.frequency,
      participants: m.participants,
      dateLabel: m.dateLabel,
      weekday: m.weekday !== null ? String(m.weekday) : "",
      monthlyRule: m.monthlyRule,
      time: m.time,
      duration: m.duration,
      objective: m.objective,
      agendaText: m.agenda.join("\n"),
    });
    setFormError("");
    setFormModal({ open: true, editing: m });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setFormError("Nome da reunião obrigatório."); return; }
    setSaving(true);
    setFormError("");
    try {
      const isEdit = !!formModal.editing;
      const body = {
        ...(isEdit ? { id: formModal.editing!.id } : {}),
        title: form.title.trim(),
        type: form.type,
        frequency: form.frequency,
        participants: form.participants.trim(),
        dateLabel: form.dateLabel.trim(),
        weekday: form.weekday === "" ? null : Number(form.weekday),
        monthlyRule: form.monthlyRule,
        time: form.time.trim(),
        duration: form.duration.trim(),
        objective: form.objective.trim(),
        agenda: form.agendaText.split("\n").map((s) => s.trim()).filter(Boolean),
      };
      const res = await fetch("/api/reunioes-da-area", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Erro ao salvar reunião.");
      const saved: MeetingRoutine = await res.json();
      setRoutines((prev) =>
        isEdit ? prev.map((r) => (r.id === saved.id ? saved : r)) : [...prev, saved]
      );
      setFormModal({ open: false });
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
      await fetch("/api/reunioes-da-area", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteTarget.id }),
      });
      setRoutines((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  const usedTypes = Array.from(new Set(routines.map((r) => r.type)));

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gray-light rounded-lg flex items-center justify-center">
            <CalendarClock size={17} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Reuniões da Área</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Estrutura oficial de encontros — cadência, participantes, objetivos e calendário do mês.
            </p>
          </div>
        </div>
        <Button variant="accent" onClick={openCreate}>
          <Plus size={15} />
          Nova reunião
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm py-10">
          <Loader2 size={15} className="animate-spin" /> Carregando...
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {/* Legenda */}
          {routines.length > 0 && (
            <div>
              <p className="text-xs font-600 uppercase tracking-wide text-muted-foreground mb-3">Legenda</p>
              <div className="flex flex-wrap gap-2">
                {usedTypes.map((t) => (
                  <div
                    key={t}
                    className="flex items-center gap-2 px-3 py-2 rounded-md border border-gray-medium text-xs font-600"
                  >
                    <span className={cn("w-3 h-3 rounded-full shrink-0", TYPE_META[t].dot)} />
                    {TYPE_META[t].label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detalhamento por reunião */}
          {routines.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-gray-medium rounded-xl">
              <CalendarClock size={28} className="mx-auto mb-3 text-muted-foreground opacity-40" />
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Nenhuma reunião cadastrada ainda.
              </p>
              <Button variant="accent" className="mt-4" onClick={openCreate}>
                <Plus size={14} />
                Criar primeira reunião
              </Button>
            </div>
          ) : (
            <div>
              <p className="text-xs font-600 uppercase tracking-wide text-muted-foreground mb-3">
                Detalhamento por reunião
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {routines.map((m) => (
                  <div
                    key={m.id}
                    className={cn(
                      "bg-white border border-gray-medium rounded-xl p-6 flex flex-col",
                      m.type === "geral" && "md:col-span-2"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
                      <h3 className="text-lg font-700">{m.title}</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={cn(
                            "text-xs font-600 uppercase tracking-wide px-2.5 py-1 rounded-md",
                            m.frequency === "mensal" ? "bg-black text-white" : "bg-accent text-black"
                          )}
                        >
                          {m.frequency === "mensal" ? "Mensal" : "Semanal"}
                        </span>
                        <button
                          onClick={() => openEdit(m)}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-gray-light transition-colors"
                          title="Editar"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(m)}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Remover"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 text-sm mb-4">
                      <Users size={14} className="mt-0.5 text-muted-foreground shrink-0" />
                      <span><strong className="font-600">Participantes:</strong> {m.participants}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 border-y border-gray-medium mb-4">
                      <div>
                        <p className="text-xs font-600 uppercase tracking-wide text-muted-foreground mb-1">Data</p>
                        <p className="text-sm">{m.dateLabel || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs font-600 uppercase tracking-wide text-muted-foreground mb-1">Horário</p>
                        <p className="text-sm">{m.time || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs font-600 uppercase tracking-wide text-muted-foreground mb-1">Duração</p>
                        <p className="text-sm">{m.duration || "—"}</p>
                      </div>
                    </div>

                    {m.objective && (
                      <div className="flex items-start gap-2 mb-4">
                        <Target size={13} className="mt-0.5 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs font-600 uppercase tracking-wide text-muted-foreground mb-1">Objetivo</p>
                          <p className="text-sm leading-relaxed">{m.objective}</p>
                        </div>
                      </div>
                    )}

                    {m.agenda.length > 0 && (
                      <div className="flex items-start gap-2">
                        <ListChecks size={13} className="mt-0.5 text-muted-foreground shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs font-600 uppercase tracking-wide text-muted-foreground mb-2">Pautas</p>
                          <ul className="flex flex-col gap-1.5">
                            {m.agenda.map((item, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Calendário do mês */}
          {displayMonth && (
            <div>
              <p className="text-xs font-600 uppercase tracking-wide text-muted-foreground mb-3">
                Calendário do mês
              </p>
              <div className="border border-gray-medium rounded-xl overflow-hidden">
                <div className="bg-black text-white px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-lg font-700 capitalize">
                      {format(displayMonth, "MMMM yyyy", { locale: ptBR })}
                    </p>
                    <p className="text-xs text-gray-medium mt-0.5">
                      Calendário automático com base na cadência de cada reunião
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setDisplayMonth((d) => subMonths(d ?? new Date(), 1))}
                      className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
                      aria-label="Mês anterior"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={() => setDisplayMonth(new Date())}
                      className="px-2 py-1 text-xs rounded-md hover:bg-white/10 transition-colors"
                    >
                      Hoje
                    </button>
                    <button
                      onClick={() => setDisplayMonth((d) => addMonths(d ?? new Date(), 1))}
                      className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
                      aria-label="Próximo mês"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 bg-gray-light border-b border-gray-medium">
                  {WEEKDAY_SHORT.map((d) => (
                    <div key={d} className="px-2 py-2.5 text-center text-xs font-600 uppercase tracking-wide text-muted-foreground">
                      {d}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7">
                  {calendarCells.map((cell, i) => (
                    <div
                      key={i}
                      className={cn(
                        "min-h-[92px] sm:min-h-[108px] border-r border-b border-gray-medium p-1.5 sm:p-2 flex flex-col gap-1 [&:nth-child(7n)]:border-r-0",
                        !cell.date && "bg-gray-light/60"
                      )}
                    >
                      {cell.date && (
                        <>
                          <span className="text-xs font-600 text-muted-foreground">{cell.date.getDate()}</span>
                          {cell.routines.map((m) => (
                            <span
                              key={m.id}
                              className={cn("text-[10px] sm:text-[11px] font-600 rounded px-1.5 py-1 leading-tight", TYPE_META[m.type].chip)}
                              title={`${m.title} · ${m.time}`}
                            >
                              {m.title} · {m.time}
                            </span>
                          ))}
                        </>
                      )}
                    </div>
                  ))}
                </div>

                <div className="px-5 py-3 bg-gray-light text-xs text-muted-foreground flex items-center gap-2">
                  <Clock size={12} className="shrink-0" />
                  Datas calculadas automaticamente a partir da cadência (dia da semana ou posição no mês) cadastrada em cada reunião.
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Form modal */}
      <Modal
        open={formModal.open}
        onClose={() => setFormModal({ open: false })}
        title={formModal.editing ? "Editar reunião" : "Nova reunião"}
        description="Defina a cadência, participantes e pauta da reunião."
        className="max-w-lg"
      >
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <Input
            label="Nome da reunião *"
            placeholder="Ex: Reunião de Squad"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            autoFocus
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-dark">Tipo (cor)</label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as MeetingType }))}
                className="h-10 rounded-md border border-gray-medium bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              >
                {(Object.keys(TYPE_META) as MeetingType[]).map((t) => (
                  <option key={t} value={t}>{TYPE_META[t].label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-dark">Frequência</label>
              <select
                value={form.frequency}
                onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value as Frequency }))}
                className="h-10 rounded-md border border-gray-medium bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="mensal">Mensal</option>
                <option value="semanal">Semanal</option>
              </select>
            </div>
          </div>

          <Input
            label="Participantes"
            placeholder="Ex: Diretor + time de marketing"
            value={form.participants}
            onChange={(e) => setForm((f) => ({ ...f, participants: e.target.value }))}
          />

          <Input
            label="Data (texto exibido)"
            placeholder="Ex: Quarta-feira, ou 3ª quinta-feira do mês"
            value={form.dateLabel}
            onChange={(e) => setForm((f) => ({ ...f, dateLabel: e.target.value }))}
          />

          {form.frequency === "semanal" ? (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-dark">Dia da semana (para o calendário)</label>
              <select
                value={form.weekday}
                onChange={(e) => setForm((f) => ({ ...f, weekday: e.target.value }))}
                className="h-10 rounded-md border border-gray-medium bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="">Nenhum (não aparece no calendário)</option>
                {WEEKDAY_NAMES.map((name, idx) => (
                  <option key={idx} value={idx}>{name}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-dark">Regra mensal (para o calendário)</label>
              <select
                value={form.monthlyRule}
                onChange={(e) => setForm((f) => ({ ...f, monthlyRule: e.target.value as MonthlyRule }))}
                className="h-10 rounded-md border border-gray-medium bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="">Nenhuma (não aparece no calendário)</option>
                <option value="primeiros-dias">Primeiros dias do mês (dia 1)</option>
                <option value="terceira-quinta">3ª quinta-feira do mês</option>
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Horário"
              placeholder="Ex: 14h30"
              value={form.time}
              onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
            />
            <Input
              label="Duração"
              placeholder="Ex: ~30 minutos"
              value={form.duration}
              onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
            />
          </div>

          <Textarea
            label="Objetivo"
            placeholder="Qual o objetivo desta reunião?"
            rows={2}
            value={form.objective}
            onChange={(e) => setForm((f) => ({ ...f, objective: e.target.value }))}
          />

          <Textarea
            label="Pautas (uma por linha)"
            placeholder={"Painel de Vendas\nAnálise de métricas\n..."}
            rows={4}
            value={form.agendaText}
            onChange={(e) => setForm((f) => ({ ...f, agendaText: e.target.value }))}
          />

          {formError && <p className="text-xs text-red-500">{formError}</p>}

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setFormModal({ open: false })}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} className="flex-1">
              {saving && <Loader2 size={13} className="animate-spin" />}
              {formModal.editing ? "Salvar" : "Criar reunião"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Confirmar remoção"
        description={`Remover a reunião "${deleteTarget?.title}"? Esta ação não pode ser desfeita.`}
      >
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Cancelar
          </Button>
          <Button onClick={handleDelete} disabled={deleting} className="flex-1 bg-red-500 text-white hover:bg-red-600">
            {deleting && <Loader2 size={13} className="animate-spin" />}
            Remover
          </Button>
        </div>
      </Modal>
    </div>
  );
}
