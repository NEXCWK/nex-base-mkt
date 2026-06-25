"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  BookOpen, Plus, ChevronDown, ChevronUp, Filter,
  ThumbsUp, AlertCircle, FileText, Loader2, CheckCircle2, Clock,
  TrendingUp, TrendingDown, BarChart3,
} from "lucide-react";
import { format, parseISO, isToday, isYesterday, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  leads: number;
  newSales: number;
  churns: number;
  compliments: string;
  complaints: string;
  notes: string;
  leadTemp?: string;
  qualidadeRetornos?: string;
}

const FEELINGS = [
  { value: "otimo",   label: "Ótimo",   color: "#22c55e" },
  { value: "bom",     label: "Bom",     color: "#84cc16" },
  { value: "regular", label: "Regular", color: "#f59e0b" },
  { value: "ruim",    label: "Ruim",    color: "#f97316" },
  { value: "pessimo", label: "Péssimo", color: "#ef4444" },
];

const LEAD_TEMPS = [
  { value: "frio",   label: "Frio",   color: "#60a5fa" },
  { value: "morno",  label: "Morno",  color: "#f59e0b" },
  { value: "quente", label: "Quente", color: "#ef4444" },
];

const EMPTY_FORM = {
  feeling: "bom",
  leads: "",
  newSales: "",
  churns: "",
  notes: "",
  compliments: "",
  complaints: "",
  leadTemp: "morno",
  qualidadeRetornos: "",
};

function feelingInfo(val: string) {
  return FEELINGS.find((f) => f.value === val) ?? FEELINGS[1];
}

function leadTempInfo(val?: string) {
  return LEAD_TEMPS.find((t) => t.value === val) ?? null;
}

function dateLabel(dateStr: string) {
  const d = parseISO(dateStr);
  if (isToday(d)) return "Hoje";
  if (isYesterday(d)) return "Ontem";
  return format(d, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
}

// ─── Word Cloud helpers ───────────────────────────────────────────────────────

const PT_STOPWORDS = new Set([
  "a","o","as","os","e","de","da","do","das","dos","em","na","no","nas","nos",
  "um","uma","uns","umas","que","se","com","para","por","mas","ou","eu","tu",
  "ele","ela","nos","eles","elas","me","te","lhe","meu","minha","meus","minhas",
  "seu","sua","seus","suas","esse","essa","esses","essas","este","esta","estes",
  "estas","aquele","aquela","aqueles","aquelas","muito","mais","bem","ja","ainda",
  "nao","sim","tambem","ao","aos","foi","ser","ter","estar","tem","sao","ha",
  "como","quando","onde","porque","entao","isso","isto","aqui","ali","la","toda",
  "todo","todas","todos","cada","entre","ate","apos","antes","agora","hoje","dia",
  "dias","pelo","pela","pelos","pelas","num","numa","pois","tudo","nada","mesmo",
  "algum","alguns","alguma","algumas","outro","outra","outros","outras","apenas",
  "sobre","sem","assim","logo","portanto","desse","dessa","deste","desta","neste",
  "nessa","naquele","naquela","qual","quais","quem","cujo","cuja","era","sera",
  "seria","seja","foram","eram","serao","teve","tinha","tera","teria","tenha",
  "sendo","estado","fez","fazia","fara","faria","faca","feito","fazendo","vai",
  "ia","ira","iria","pode","podia","podera","poderia","possa","ver","via","vera",
  "veja","visto","vendo","ca","ta","tras","alem","diante","frente","tras","depois",
  "nao","ja","la","ca","ate","bem","foi","tem","nao","isso","esse","essa","esta",
  "este","aqui","ali","la","mais","menos","muito","pouco","tao","tanto","quanto",
  "coisa","coisas","vez","vezes","ano","anos","mes","meses","hora","horas",
  "parte","partes","lugar","lugares","gente","pessoa","pessoas","tipo","tipos",
  "aqui","todo","forma","formas","caso","casos","ponto","pontos","quer","quero",
]);

function buildWordCloud(reports: Report[]): { word: string; count: number }[] {
  const counts: Record<string, number> = {};
  const display: Record<string, string> = {};

  for (const r of reports) {
    const texts = [r.notes, r.compliments, r.complaints, r.qualidadeRetornos];
    for (const text of texts) {
      if (!text) continue;
      const tokens = text.split(/[\s,.\-!?;:()\[\]{}'"""«»\/\\]+/);
      for (const token of tokens) {
        if (!token) continue;
        const lower = token.toLowerCase();
        const normalized = lower
          .normalize("NFD")
          .replace(/[̀-ͯ]/g, "")
          .replace(/[^a-z]/g, "");
        if (normalized.length < 4 || PT_STOPWORDS.has(normalized)) continue;
        counts[normalized] = (counts[normalized] || 0) + 1;
        if (!display[normalized]) display[normalized] = lower;
      }
    }
  }

  return Object.entries(counts)
    .map(([key, count]) => ({ word: display[key] || key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 50);
}

// ─── Word Cloud Component ──────────────────────────────────────────────────────

function WordCloud({ reports }: { reports: Report[] }) {
  const words = buildWordCloud(reports);

  if (words.length === 0) {
    return (
      <p className="text-xs text-muted-foreground py-8 text-center">
        Sem texto suficiente para gerar a nuvem de palavras.
      </p>
    );
  }

  const maxCount = words[0].count;
  const minCount = words[words.length - 1].count;
  const range = Math.max(maxCount - minCount, 1);

  return (
    <div className="flex flex-wrap gap-x-3 gap-y-2 justify-center items-center py-4 px-2">
      {words.map(({ word, count }) => {
        const ratio = (count - minCount) / range;
        const size = Math.round(11 + ratio * 22);
        const opacity = 0.3 + ratio * 0.7;
        const weight = ratio > 0.6 ? 700 : ratio > 0.3 ? 600 : 400;
        return (
          <span
            key={word}
            title={`${count} ${count === 1 ? "ocorrência" : "ocorrências"}`}
            style={{ fontSize: size, opacity, fontWeight: weight, lineHeight: 1.3 }}
            className="text-black cursor-default select-none transition-opacity hover:opacity-100"
          >
            {word}
          </span>
        );
      })}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const { data: session } = useSession();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"hoje" | "indicadores" | "historico">("hoje");
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
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">

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
        {([["hoje", "Hoje"], ["indicadores", "Indicadores"], ["historico", "Histórico"]] as const).map(([key, label]) => (
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

      {/* ── INDICADORES ── */}
      {tab === "indicadores" && (
        <KpiDashboard reports={reports} loading={loading} />
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
  const lt = leadTempInfo(r.leadTemp);
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
            {lt && (
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ backgroundColor: lt.color + "20", color: lt.color }}
              >
                Leads: {lt.label}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {format(parseISO(r.timestamp), "HH:mm")}
          </p>
        </div>
      </div>

      {/* KPIs */}
      {(r.newSales > 0 || r.churns > 0) && (
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-600 bg-gray-light border border-gray-medium rounded-md px-2.5 py-1">
            <TrendingUp size={12} className="text-green-500" />
            {r.newSales} {r.newSales === 1 ? "venda" : "vendas"}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-600 bg-gray-light border border-gray-medium rounded-md px-2.5 py-1">
            <TrendingDown size={12} className="text-red-500" />
            {r.churns} {r.churns === 1 ? "churn" : "churns"}
          </span>
        </div>
      )}

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
        {r.qualidadeRetornos && (
          <div className="flex gap-3">
            <FileText size={13} className="mt-0.5 text-blue-400 shrink-0" />
            <div>
              <p className="text-xs font-600 text-muted-foreground uppercase tracking-wide mb-1">Qualidade dos retornos</p>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{r.qualidadeRetornos}</p>
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

      {/* Lead temperature */}
      <div>
        <p className="text-sm font-medium text-gray-dark mb-2">Temperatura Média dos Leads Gerados</p>
        <div className="flex gap-2">
          {LEAD_TEMPS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, leadTemp: t.value }))}
              className={cn(
                "flex-1 py-2 rounded-md border text-xs font-600 transition-all",
                form.leadTemp === t.value
                  ? "border-black bg-black text-white"
                  : "border-gray-medium text-muted-foreground hover:border-gray-dark hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs do dia */}
      <div>
        <p className="text-sm font-medium text-gray-dark mb-2">Indicadores do dia</p>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Novas vendas"
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="0"
            value={form.newSales}
            onChange={set("newSales")}
          />
          <Input
            label="Churns"
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="0"
            value={form.churns}
            onChange={set("churns")}
          />
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

      {/* Qualidade dos retornos */}
      <Textarea
        label="Qualidade dos Retornos"
        placeholder="Descreva a qualidade dos retornos dos leads — engajamento, objeções, interesse demonstrado..."
        rows={3}
        value={form.qualidadeRetornos}
        onChange={set("qualidadeRetornos")}
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

// ─── KPI Dashboard ──────────────────────────────────────────────────────────────

function StatCard({
  label, value, delta, icon: Icon, accent,
}: {
  label: string;
  value: number | string;
  delta?: string;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <div className="bg-white border border-gray-medium rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-600 text-muted-foreground uppercase tracking-wide">{label}</p>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: accent + "1a" }}>
          <Icon size={14} style={{ color: accent }} />
        </div>
      </div>
      <p className="text-2xl font-700 tracking-tight">{value}</p>
      {delta && <p className="text-xs text-muted-foreground mt-0.5">{delta}</p>}
    </div>
  );
}

function KpiDashboard({ reports, loading }: { reports: Report[]; loading: boolean }) {
  const [range, setRange] = useState<7 | 30 | 90>(30);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm py-10">
        <Loader2 size={15} className="animate-spin" /> Carregando indicadores...
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-16 border border-dashed border-gray-medium rounded-xl">
        <BarChart3 size={28} className="mx-auto mb-3 text-muted-foreground opacity-40" />
        <p className="text-sm font-medium text-muted-foreground mb-1">
          Ainda não há dados para indicadores.
        </p>
        <p className="text-xs text-muted-foreground">
          Os gráficos aparecem conforme o time envia os reports diários.
        </p>
      </div>
    );
  }

  const cutoff = format(subDays(new Date(), range - 1), "yyyy-MM-dd");
  const inRange = reports.filter((r) => r.date >= cutoff);

  // Totais
  const totalSales = inRange.reduce((s, r) => s + (r.newSales || 0), 0);
  const totalChurns = inRange.reduce((s, r) => s + (r.churns || 0), 0);
  const netGrowth = totalSales - totalChurns;

  // Série temporal por dia
  const byDate: Record<string, { sales: number; churns: number }> = {};
  for (let i = range - 1; i >= 0; i--) {
    const d = format(subDays(new Date(), i), "yyyy-MM-dd");
    byDate[d] = { sales: 0, churns: 0 };
  }
  inRange.forEach((r) => {
    if (!byDate[r.date]) byDate[r.date] = { sales: 0, churns: 0 };
    byDate[r.date].sales += r.newSales || 0;
    byDate[r.date].churns += r.churns || 0;
  });
  const series = Object.entries(byDate).map(([date, v]) => ({
    date,
    label: format(parseISO(date), "dd/MM"),
    Vendas: v.sales,
    Churns: v.churns,
  }));

  // Distribuição de feeling
  const feelingCounts = FEELINGS.map((f) => ({
    label: f.label,
    color: f.color,
    value: inRange.filter((r) => r.feeling === f.value).length,
  }));

  // Temperatura dos leads
  const leadTempCounts = LEAD_TEMPS.map((t) => ({
    label: t.label,
    color: t.color,
    value: inRange.filter((r) => r.leadTemp === t.value).length,
  }));

  // Ranking por membro
  const byMember: Record<string, { name: string; sales: number }> = {};
  inRange.forEach((r) => {
    const key = r.userName || r.userEmail;
    if (!byMember[key]) byMember[key] = { name: key, sales: 0 };
    byMember[key].sales += r.newSales || 0;
  });
  const ranking = Object.values(byMember).sort((a, b) => b.sales - a.sales).slice(0, 6);

  return (
    <div className="flex flex-col gap-6">
      {/* Range selector */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Consolidado dos últimos {range} dias · {inRange.length} {inRange.length === 1 ? "report" : "reports"}
        </p>
        <div className="flex gap-1 bg-gray-light p-1 rounded-lg">
          {([7, 30, 90] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "px-3 py-1 rounded-md text-xs font-medium transition-colors",
                range === r ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {r} dias
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard label="Novas vendas" value={totalSales} icon={TrendingUp} accent="#22c55e" />
        <StatCard label="Churns" value={totalChurns} icon={TrendingDown} accent="#ef4444" />
        <StatCard
          label="Crescimento líquido"
          value={netGrowth > 0 ? `+${netGrowth}` : netGrowth}
          delta="vendas − churns"
          icon={BarChart3}
          accent="#000000"
        />
      </div>

      {/* Vendas / Churns ao longo do tempo */}
      <div className="bg-white border border-gray-medium rounded-xl p-5">
        <p className="text-sm font-600 mb-4">Vendas e churns por dia</p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ebebea" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6b6b68" }} interval="preserveStartEnd" tickLine={false} axisLine={{ stroke: "#ebebea" }} />
              <YAxis tick={{ fontSize: 11, fill: "#6b6b68" }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #ebebea" }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="Vendas" stroke="#22c55e" strokeWidth={2} fill="url(#gSales)" />
              <Area type="monotone" dataKey="Churns" stroke="#ef4444" strokeWidth={2} fillOpacity={0} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Ranking por membro */}
        <div className="bg-white border border-gray-medium rounded-xl p-5">
          <p className="text-sm font-600 mb-4">Vendas por membro</p>
          {ranking.length === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center">Sem dados no período.</p>
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ranking} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ebebea" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#6b6b68" }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#2c2c2a" }} width={90} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #ebebea" }} cursor={{ fill: "#f7f7f6" }} />
                  <Bar dataKey="sales" name="Vendas" fill="#000000" radius={[0, 4, 4, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Feeling do time */}
        <div className="bg-white border border-gray-medium rounded-xl p-5">
          <p className="text-sm font-600 mb-4">Clima do time</p>
          <div className="flex flex-col gap-3 pt-2">
            {feelingCounts.map((f) => {
              const max = Math.max(...feelingCounts.map((x) => x.value), 1);
              return (
                <div key={f.label} className="flex items-center gap-3">
                  <span className="text-xs font-600 w-16 shrink-0" style={{ color: f.color }}>{f.label}</span>
                  <div className="flex-1 h-3 bg-gray-light rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${(f.value / max) * 100}%`, backgroundColor: f.color }} />
                  </div>
                  <span className="text-xs text-muted-foreground w-6 text-right">{f.value}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Temperatura dos leads */}
      <div className="bg-white border border-gray-medium rounded-xl p-5">
        <p className="text-sm font-600 mb-4">Temperatura dos Leads</p>
        <div className="flex gap-4">
          {leadTempCounts.map((t) => {
            const total = leadTempCounts.reduce((s, x) => s + x.value, 0) || 1;
            const pct = Math.round((t.value / total) * 100);
            return (
              <div key={t.label} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full rounded-lg py-4 flex flex-col items-center justify-center gap-1"
                  style={{ backgroundColor: t.color + "18", border: `1px solid ${t.color}40` }}
                >
                  <span className="text-2xl font-700" style={{ color: t.color }}>{t.value}</span>
                  <span className="text-xs font-600" style={{ color: t.color }}>{t.label}</span>
                </div>
                <span className="text-xs text-muted-foreground">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Nuvem de Palavras */}
      <div className="bg-white border border-gray-medium rounded-xl p-5">
        <p className="text-sm font-600 mb-1">Nuvem de Palavras</p>
        <p className="text-xs text-muted-foreground mb-4">
          Palavras mais frequentes nos textos dos reports do período
        </p>
        <WordCloud reports={inRange} />
      </div>
    </div>
  );
}
