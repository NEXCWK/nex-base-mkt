"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  BarChart2, Plus, ChevronDown, ChevronUp, Filter,
  TrendingUp, TrendingDown, Users,
  AlertCircle, ThumbsUp, FileText, Loader2,
} from "lucide-react";
import { format, parseISO, startOfWeek, startOfMonth, startOfYear, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

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
}

const FEELINGS = [
  { value: "otimo", label: "Otimo", color: "#22c55e", emoji: "5" },
  { value: "bom", label: "Bom", color: "#84cc16", emoji: "4" },
  { value: "regular", label: "Regular", color: "#f59e0b", emoji: "3" },
  { value: "ruim", label: "Ruim", color: "#f97316", emoji: "2" },
  { value: "pessimo", label: "Pessimo", color: "#ef4444", emoji: "1" },
];

const PERIOD_TABS = ["Diario", "Semanal", "Mensal", "Anual"] as const;
type Period = (typeof PERIOD_TABS)[number];

// ─── Empty form ───────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  feeling: "bom",
  leads: "",
  newSales: "",
  churns: "",
  compliments: "",
  complaints: "",
  notes: "",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const { data: session } = useSession();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"form" | "historico" | "dashboard">("dashboard");
  const [period, setPeriod] = useState<Period>("Mensal");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [filterUser, setFilterUser] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  // ── Filter for period ──────────────────────────────────────────────────────

  const periodReports = reports.filter((r) => {
    const d = parseISO(r.date);
    const now = new Date();
    if (period === "Diario") return r.date === format(now, "yyyy-MM-dd");
    if (period === "Semanal")
      return isWithinInterval(d, { start: startOfWeek(now, { locale: ptBR }), end: now });
    if (period === "Mensal")
      return isWithinInterval(d, { start: startOfMonth(now), end: now });
    return isWithinInterval(d, { start: startOfYear(now), end: now });
  });

  // ── KPI totals ─────────────────────────────────────────────────────────────

  const kpis = periodReports.reduce(
    (acc, r) => ({
      leads: acc.leads + r.leads,
      newSales: acc.newSales + r.newSales,
      churns: acc.churns + r.churns,
    }),
    { leads: 0, newSales: 0, churns: 0 }
  );

  // ── Chart data ─────────────────────────────────────────────────────────────

  const chartData = (() => {
    const byDate: Record<string, { date: string; leads: number; newSales: number; churns: number }> = {};
    periodReports.forEach((r) => {
      if (!byDate[r.date]) {
        byDate[r.date] = { date: format(parseISO(r.date), "dd/MM"), leads: 0, newSales: 0, churns: 0 };
      }
      byDate[r.date].leads += r.leads;
      byDate[r.date].newSales += r.newSales;
      byDate[r.date].churns += r.churns;
    });
    return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
  })();

  // ── User comparison ────────────────────────────────────────────────────────

  const userNames = Array.from(new Set(reports.map((r) => r.userName || r.userEmail)));
  const userBarData = userNames.map((name) => {
    const userReports = periodReports.filter((r) => (r.userName || r.userEmail) === name);
    return {
      name: name.split(" ")[0],
      leads: userReports.reduce((s, r) => s + r.leads, 0),
      vendas: userReports.reduce((s, r) => s + r.newSales, 0),
      churns: userReports.reduce((s, r) => s + r.churns, 0),
    };
  });

  // ── History filter ─────────────────────────────────────────────────────────

  const filteredHistory = reports
    .filter((r) => (filterUser ? r.userEmail === filterUser || r.userName === filterUser : true))
    .filter((r) => (filterDate ? r.date === filterDate : true))
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          leads: Number(form.leads) || 0,
          newSales: Number(form.newSales) || 0,
          churns: Number(form.churns) || 0,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Erro ao enviar report");
      }
      setSubmitSuccess(true);
      setForm(EMPTY_FORM);
      setFormOpen(false);
      await fetchReports();
      setTimeout(() => setSubmitSuccess(false), 4000);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setSubmitting(false);
    }
  }

  const feelingInfo = (val: string) =>
    FEELINGS.find((f) => f.value === val) || FEELINGS[1];

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gray-light rounded-lg flex items-center justify-center">
            <BarChart2 size={18} />
          </div>
          <div>
            <h1 className="text-2xl font-700">Reports Comerciais</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Acompanhamento diario da operacao
            </p>
          </div>
        </div>
        <Button variant="accent" onClick={() => setFormOpen(true)}>
          <Plus size={15} />
          Novo Report
        </Button>
      </div>

      {/* Success banner */}
      {submitSuccess && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 font-medium">
          Report enviado com sucesso!
        </div>
      )}

      {/* Tab nav */}
      <div className="flex gap-1 bg-gray-light p-1 rounded-lg w-fit mb-6">
        {(["dashboard", "historico", "form"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
              activeTab === t
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t === "dashboard" ? "Dashboard" : t === "historico" ? "Historico" : "Preencher Report"}
          </button>
        ))}
      </div>

      {/* ── DASHBOARD TAB ── */}
      {activeTab === "dashboard" && (
        <div>
          {/* Period selector */}
          <div className="flex gap-2 mb-6">
            {PERIOD_TABS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium border transition-colors",
                  period === p
                    ? "bg-black text-white border-black"
                    : "bg-white text-muted-foreground border-gray-medium hover:border-black hover:text-foreground"
                )}
              >
                {p}
              </button>
            ))}
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Procura / Leads
                  </p>
                  <Users size={15} className="text-muted-foreground" />
                </div>
                <p className="text-3xl font-700">{kpis.leads}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Novas Vendas
                  </p>
                  <TrendingUp size={15} className="text-green-500" />
                </div>
                <p className="text-3xl font-700 text-green-600">{kpis.newSales}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Churns / Cancelamentos
                  </p>
                  <TrendingDown size={15} className="text-red-500" />
                </div>
                <p className="text-3xl font-700 text-red-600">{kpis.churns}</p>
              </CardContent>
            </Card>
          </div>

          {chartData.length > 0 ? (
            <>
              {/* Line chart */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Evolucao do Periodo</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="leads" name="Leads" stroke="#000" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="newSales" name="Vendas" stroke="#FFD400" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="churns" name="Churns" stroke="#ef4444" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Bar chart by user */}
              {userBarData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Comparativo por Membro</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={userBarData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="leads" name="Leads" fill="#2A2A2A" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="vendas" name="Vendas" fill="#FFD400" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="churns" name="Churns" fill="#ef4444" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground border border-dashed border-gray-medium rounded-lg">
              <BarChart2 size={32} className="mb-3 opacity-30" />
              <p className="text-sm">Nenhum report encontrado para este periodo.</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setFormOpen(true)}>
                Preencher primeiro report
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── HISTORICO TAB ── */}
      {activeTab === "historico" && (
        <div>
          {/* Filters */}
          <div className="flex gap-3 mb-5">
            <div className="relative">
              <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
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
                Limpar
              </Button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm py-8">
              <Loader2 size={16} className="animate-spin" />
              Carregando...
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm border border-dashed border-gray-medium rounded-lg">
              Nenhum report encontrado.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredHistory.map((r) => {
                const fi = feelingInfo(r.feeling);
                const expanded = expandedId === r.id;
                return (
                  <div
                    key={r.id}
                    className="border border-gray-medium rounded-lg overflow-hidden"
                  >
                    <button
                      className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-light transition-colors text-left"
                      onClick={() => setExpandedId(expanded ? null : r.id)}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-700 shrink-0"
                        style={{ backgroundColor: fi.color + "20", color: fi.color }}
                      >
                        {fi.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-600 text-sm">{r.userName || r.userEmail}</span>
                          <Badge variant="muted">{fi.label}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(parseISO(r.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-sm shrink-0">
                        <span className="text-muted-foreground">
                          <span className="font-600 text-foreground">{r.leads}</span> leads
                        </span>
                        <span className="text-green-600 font-600">{r.newSales} vendas</span>
                        {r.churns > 0 && (
                          <span className="text-red-500 font-600">{r.churns} churns</span>
                        )}
                        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </div>
                    </button>
                    {expanded && (
                      <div className="border-t border-gray-medium px-5 py-4 bg-gray-light grid grid-cols-1 gap-3">
                        {r.compliments && (
                          <div className="flex gap-3">
                            <ThumbsUp size={14} className="mt-0.5 text-green-500 shrink-0" />
                            <div>
                              <p className="text-xs font-600 text-muted-foreground uppercase mb-1">Elogios</p>
                              <p className="text-sm text-foreground">{r.compliments}</p>
                            </div>
                          </div>
                        )}
                        {r.complaints && (
                          <div className="flex gap-3">
                            <AlertCircle size={14} className="mt-0.5 text-red-500 shrink-0" />
                            <div>
                              <p className="text-xs font-600 text-muted-foreground uppercase mb-1">Reclamacoes</p>
                              <p className="text-sm text-foreground">{r.complaints}</p>
                            </div>
                          </div>
                        )}
                        {r.notes && (
                          <div className="flex gap-3">
                            <FileText size={14} className="mt-0.5 text-muted-foreground shrink-0" />
                            <div>
                              <p className="text-xs font-600 text-muted-foreground uppercase mb-1">Observacoes Gerais</p>
                              <p className="text-sm text-foreground">{r.notes}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── FORM TAB (inline) ── */}
      {activeTab === "form" && (
        <ReportForm
          form={form}
          setForm={setForm}
          onSubmit={handleSubmit}
          submitting={submitting}
          error={submitError}
        />
      )}

      {/* ── MODAL FORM ── */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Novo Report Diario"
        description={`${session?.user?.name || ""} — ${format(new Date(), "dd/MM/yyyy")}`}
        className="max-w-lg"
      >
        <ReportForm
          form={form}
          setForm={setForm}
          onSubmit={handleSubmit}
          submitting={submitting}
          error={submitError}
        />
      </Modal>
    </div>
  );
}

// ─── Report Form Component ────────────────────────────────────────────────────

function ReportForm({
  form,
  setForm,
  onSubmit,
  submitting,
  error,
}: {
  form: typeof EMPTY_FORM;
  setForm: React.Dispatch<React.SetStateAction<typeof EMPTY_FORM>>;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  error: string;
}) {
  const set = (key: keyof typeof EMPTY_FORM) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {/* Feeling */}
      <div>
        <p className="text-sm font-medium text-gray-dark mb-2">Feeling do Dia</p>
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

      {/* Numeric fields */}
      <div className="grid grid-cols-3 gap-3">
        <Input
          label="Procura / Leads"
          type="number"
          min={0}
          placeholder="0"
          value={form.leads}
          onChange={set("leads")}
        />
        <Input
          label="Novas Vendas"
          type="number"
          min={0}
          placeholder="0"
          value={form.newSales}
          onChange={set("newSales")}
        />
        <Input
          label="Churns / Cancelamentos"
          type="number"
          min={0}
          placeholder="0"
          value={form.churns}
          onChange={set("churns")}
        />
      </div>

      {/* Text fields */}
      <Textarea
        label="Elogios"
        placeholder="Registre elogios recebidos hoje..."
        rows={2}
        value={form.compliments}
        onChange={set("compliments")}
      />
      <Textarea
        label="Reclamacoes"
        placeholder="Registre reclamacoes recebidas hoje..."
        rows={2}
        value={form.complaints}
        onChange={set("complaints")}
      />
      <Textarea
        label="Observacoes Gerais / Outras informacoes"
        placeholder="Qualquer observacao relevante do dia..."
        rows={3}
        value={form.notes}
        onChange={set("notes")}
      />

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      <div className="flex gap-3 pt-1">
        <Button type="submit" disabled={submitting} className="flex-1">
          {submitting && <Loader2 size={14} className="animate-spin" />}
          Enviar Report
        </Button>
      </div>
    </form>
  );
}
