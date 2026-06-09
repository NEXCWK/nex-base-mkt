"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  BookOpen, Plus, ChevronDown, ChevronUp, Filter,
  ThumbsUp, AlertCircle, FileText, Loader2, CheckCircle2, Clock,
} from "lucide-react";
import { format, parseISO, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Report {
  id: string;
  userEmail: string;
  userName: string;
  date: string;
  timestamp: string;
  feeling: string;
  compliments: string;
  complaints: string;
  notes: string;
}

const FEELINGS = [
  { value: "otimo",   label: "Ótimo",   color: "#22c55e" },
  { value: "bom",     label: "Bom",     color: "#84cc16" },
  { value: "regular", label: "Regular", color: "#f59e0b" },
  { value: "ruim",    label: "Ruim",    color: "#f97316" },
  { value: "pessimo", label: "Péssimo", color: "#ef4444" },
];

const EMPTY_FORM = { feeling: "bom", notes: "", compliments: "", complaints: "" };

function feelingInfo(val: string) {
  return FEELINGS.find((f) => f.value === val) ?? FEELINGS[1];
}

function dateLabel(dateStr: string) {
  const d = parseISO(dateStr);
  if (isToday(d)) return "Hoje";
  if (isYesterday(d)) return "Ontem";
  return format(d, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const { data: session } = useSession();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"hoje" | "historico">("hoje");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [filterUser, setFilterUser] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reports");
      if (res.ok) setReports(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayReports = reports.filter((r) => r.date === todayStr);
  const myTodayReport = todayReports.find(
    (r) => r.userEmail === session?.user?.email
  );

  // ── History ────────────────────────────────────────────────────────────────

  const userNames = Array.from(new Set(reports.map((r) => r.userName || r.userEmail)));

  const filteredReports = reports
    .filter((r) => (filterUser ? (r.userName === filterUser || r.userEmail === filterUser) : true))
    .filter((r) => (filterDate ? r.date === filterDate : true))
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  const reportsByDate = filteredReports.reduce<Record<string, Report[]>>((acc, r) => {
    (acc[r.date] = acc[r.date] ?? []).push(r);
    return acc;
  }, {});

  const sortedDates = Object.keys(reportsByDate).sort((a, b) => b.localeCompare(a));

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Erro ao enviar report");
      }
      setSubmitSuccess(true);
      setForm(EMPTY_FORM);
      setFormOpen(false);
      await fetchReports();
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-8 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gray-light rounded-lg flex items-center justify-center">
            <BookOpen size={17} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Report Diário</h1>
            <p className="text-sm text-muted-foreground mt-0.5 capitalize">
              {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>

        {!myTodayReport && (
          <Button variant="accent" onClick={() => setFormOpen(true)}>
            <Plus size={15} />
            Escrever report de hoje
          </Button>
        )}
      </div>

      {/* Success banner */}
      {submitSuccess && (
        <div className="mb-5 flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 font-medium">
          <CheckCircle2 size={15} />
          Report do dia enviado com sucesso!
        </div>
      )}

      {/* Tab nav */}
      <div className="flex gap-1 bg-gray-light p-1 rounded-lg w-fit mb-6">
        {([["hoje", "Hoje"], ["historico", "Histórico"]] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
              tab === key
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── HOJE ── */}
      {tab === "hoje" && (
        <div>
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm py-10">
              <Loader2 size={15} className="animate-spin" /> Carregando...
            </div>
          ) : todayReports.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-gray-medium rounded-xl">
              <BookOpen size={28} className="mx-auto mb-3 text-muted-foreground opacity-40" />
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Nenhum report escrito hoje ainda.
              </p>
              <p className="text-xs text-muted-foreground mb-5">
                Escreva o primeiro report do dia!
              </p>
              <Button variant="accent" onClick={() => setFormOpen(true)}>
                <Plus size={14} />
                Escrever report de hoje
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Já enviou o report */}
              {myTodayReport && (
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
                  <CheckCircle2 size={14} />
                  Você já enviou seu report de hoje.
                </div>
              )}

              {todayReports.map((r) => (
                <ReportCard key={r.id} report={r} />
              ))}

              {/* Quem ainda não enviou */}
              {!myTodayReport && (
                <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 mt-1">
                  <Clock size={14} />
                  Você ainda não escreveu o report de hoje.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── HISTÓRICO ── */}
      {tab === "historico" && (
        <div>
          {/* Filters */}
          <div className="flex gap-3 mb-5 flex-wrap">
            <div className="relative">
              <Filter size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <select
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                className="pl-8 pr-3 h-9 rounded-md border border-gray-medium text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="">Todos os membros</option>
                {userNames.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="h-9 px-3 rounded-md border border-gray-medium text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black"
            />
            {(filterUser || filterDate) && (
              <Button variant="ghost" size="sm" onClick={() => { setFilterUser(""); setFilterDate(""); }}>
                Limpar filtros
              </Button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm py-8">
              <Loader2 size={15} className="animate-spin" /> Carregando...
            </div>
          ) : sortedDates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm border border-dashed border-gray-medium rounded-xl">
              Nenhum report encontrado.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {sortedDates.map((date) => {
                const dayReports = reportsByDate[date];
                const expanded = expandedDate === date;
                const label = dateLabel(date);
                return (
                  <div key={date} className="border border-gray-medium rounded-xl overflow-hidden">
                    <button
                      className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-light transition-colors text-left"
                      onClick={() => setExpandedDate(expanded ? null : date)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-600 text-sm capitalize">{label}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(parseISO(date), "dd/MM/yyyy")}
                        </span>
                        <Badge variant="muted">
                          {dayReports.length} {dayReports.length === 1 ? "report" : "reports"}
                        </Badge>
                      </div>
                      {expanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
                    </button>

                    {expanded && (
                      <div className="border-t border-gray-medium divide-y divide-gray-medium">
                        {dayReports.map((r) => (
                          <div key={r.id} className="px-5 py-4 bg-gray-light/50">
                            <ReportCard report={r} compact />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal form */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Report Diário"
        description={`${session?.user?.name ?? ""} — ${format(new Date(), "dd/MM/yyyy")}`}
        className="max-w-lg"
      >
        <DailyReportForm
          form={form}
          setForm={setForm}
          onSubmit={handleSubmit}
          submitting={submitting}
          error={submitError}
          onCancel={() => setFormOpen(false)}
        />
      </Modal>
    </div>
  );
}

// ─── Report Card ──────────────────────────────────────────────────────────────

function ReportCard({ report: r, compact = false }: { report: Report; compact?: boolean }) {
  const fi = feelingInfo(r.feeling);
  return (
    <div className={cn("bg-white border border-gray-medium rounded-xl p-5", compact && "rounded-none border-0 bg-transparent p-0")}>
      {/* Author + feeling */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-700 shrink-0"
          style={{ backgroundColor: fi.color + "20", color: fi.color }}
        >
          {(r.userName || r.userEmail).charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-600 text-sm">{r.userName || r.userEmail}</span>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ backgroundColor: fi.color + "20", color: fi.color }}
            >
              {fi.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {format(parseISO(r.timestamp), "HH:mm")}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-3">
        {r.notes && (
          <div className="flex gap-3">
            <FileText size={13} className="mt-0.5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs font-600 text-muted-foreground uppercase tracking-wide mb-1">Como foi o dia</p>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{r.notes}</p>
            </div>
          </div>
        )}
        {r.compliments && (
          <div className="flex gap-3">
            <ThumbsUp size={13} className="mt-0.5 text-green-500 shrink-0" />
            <div>
              <p className="text-xs font-600 text-muted-foreground uppercase tracking-wide mb-1">Destaques positivos</p>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{r.compliments}</p>
            </div>
          </div>
        )}
        {r.complaints && (
          <div className="flex gap-3">
            <AlertCircle size={13} className="mt-0.5 text-amber-500 shrink-0" />
            <div>
              <p className="text-xs font-600 text-muted-foreground uppercase tracking-wide mb-1">Pontos de atenção</p>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{r.complaints}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Daily Report Form ────────────────────────────────────────────────────────

function DailyReportForm({
  form, setForm, onSubmit, submitting, error, onCancel,
}: {
  form: typeof EMPTY_FORM;
  setForm: React.Dispatch<React.SetStateAction<typeof EMPTY_FORM>>;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  error: string;
  onCancel: () => void;
}) {
  const set = (key: keyof typeof EMPTY_FORM) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {/* Feeling */}
      <div>
        <p className="text-sm font-medium text-gray-dark mb-2">Como você avalia o dia?</p>
        <div className="flex gap-2">
          {FEELINGS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, feeling: f.value }))}
              className={cn(
                "flex-1 py-2 rounded-md border text-xs font-600 transition-all",
                form.feeling === f.value
                  ? "border-black bg-black text-white"
                  : "border-gray-medium text-muted-foreground hover:border-gray-dark hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main narrative */}
      <Textarea
        label="Como foi o dia? *"
        placeholder="Conte o que aconteceu — visitas, ligações, conversas, negociações, clima do dia..."
        rows={5}
        value={form.notes}
        onChange={set("notes")}
        required
      />

      {/* Highlights */}
      <Textarea
        label="Destaques positivos"
        placeholder="Boas notícias, elogios de clientes, metas batidas, vitórias do dia..."
        rows={3}
        value={form.compliments}
        onChange={set("compliments")}
      />

      {/* Attention points */}
      <Textarea
        label="Pontos de atenção"
        placeholder="O que precisa de acompanhamento, problemas, reclamações, situações em aberto..."
        rows={3}
        value={form.complaints}
        onChange={set("complaints")}
      />

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex gap-3 pt-1">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting} className="flex-1">
          {submitting && <Loader2 size={14} className="animate-spin" />}
          Enviar report
        </Button>
      </div>
    </form>
  );
}
