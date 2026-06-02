"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  GraduationCap, CheckCircle2, Circle, ChevronRight, ChevronLeft,
  BookOpen, Users, MapPin, Calendar, FileText, Package,
  Megaphone, Code2, Settings, GitBranch, CheckCheck, LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  MODULES, PORTFOLIO, TOTAL_TASKS,
  type TrainingModule, type TaskType, type ProductCategory,
} from "@/lib/training/data";

// ─── Helpers ──────────────────────────────────────────────────────────────────

type Progress = Record<string, boolean>;

function getModuleTasks(mod: TrainingModule) {
  return mod.groups.flatMap((g) => g.tasks);
}

function moduleProgress(mod: TrainingModule, progress: Progress) {
  const tasks = getModuleTasks(mod);
  const done = tasks.filter((t) => progress[t.id]).length;
  return { done, total: tasks.length, pct: tasks.length ? (done / tasks.length) * 100 : 0 };
}

const TYPE_META: Record<TaskType, { label: string; icon: React.ElementType; color: string }> = {
  leitura:   { label: "Leitura",    icon: BookOpen,  color: "text-blue-600 bg-blue-50" },
  pessoas:   { label: "Pessoas",    icon: Users,     color: "text-purple-600 bg-purple-50" },
  visita:    { label: "Visita",     icon: MapPin,    color: "text-green-600 bg-green-50" },
  reuniao:   { label: "Reunião",    icon: Calendar,  color: "text-orange-600 bg-orange-50" },
  documento: { label: "Documento",  icon: FileText,  color: "text-gray-600 bg-gray-100" },
  produto:   { label: "Produto",    icon: Package,   color: "text-yellow-700 bg-yellow-50" },
  conteudo:  { label: "Conteúdo",   icon: Megaphone, color: "text-pink-600 bg-pink-50" },
  script:    { label: "Script",     icon: Code2,     color: "text-indigo-600 bg-indigo-50" },
  sistema:   { label: "Sistema",    icon: Settings,  color: "text-cyan-600 bg-cyan-50" },
  processo:  { label: "Processo",   icon: GitBranch, color: "text-teal-600 bg-teal-50" },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TreinamentoPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"trilha" | "portfolio">("trilha");
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [progress, setProgress] = useState<Progress>({});
  const [mounted, setMounted] = useState(false);

  const storageKey = `nex_training_${session?.user?.email ?? "anon"}`;

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setProgress(JSON.parse(raw));
    } catch { /* ignore */ }
  }, [storageKey]);

  const toggleTask = useCallback(
    (taskId: string) => {
      setProgress((prev) => {
        const next = { ...prev, [taskId]: !prev[taskId] };
        try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* ignore */ }
        return next;
      });
    },
    [storageKey]
  );

  const totalDone = Object.values(progress).filter(Boolean).length;
  const globalPct = TOTAL_TASKS ? (totalDone / TOTAL_TASKS) * 100 : 0;

  const currentModuleIndex = MODULES.findIndex((m) => m.id === activeModule);

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-full">
      {/* ── Page header ── */}
      <div className="px-8 pt-8 pb-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-gray-light rounded-lg flex items-center justify-center shrink-0">
            <GraduationCap size={17} />
          </div>
          <div>
            <h1 className="text-2xl font-700">Treinamento</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Trilha de onboarding para novos membros do time Nex
            </p>
          </div>
        </div>

        {/* Sub-tab */}
        <div className="flex gap-1 bg-gray-light p-1 rounded-lg w-fit">
          {(["trilha", "portfolio"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setActiveTab(t); setActiveModule(null); }}
              className={cn(
                "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
                activeTab === t
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t === "trilha" ? "Trilha" : "Portfólio de Produtos"}
            </button>
          ))}
        </div>
      </div>

      {/* ── TRILHA ── */}
      {activeTab === "trilha" && (
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Module mini-sidebar */}
          <div className="w-52 shrink-0 border-r border-gray-medium bg-white flex flex-col overflow-y-auto scrollbar-hide px-3 py-3 gap-1 ml-8">
            <button
              onClick={() => setActiveModule(null)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors text-left",
                activeModule === null
                  ? "bg-gray-light text-foreground font-semibold"
                  : "text-muted-foreground hover:bg-gray-light hover:text-foreground"
              )}
            >
              <LayoutGrid size={13} className="shrink-0" />
              <span className="flex-1 truncate">Visão Geral</span>
            </button>

            <div className="h-px bg-gray-medium my-1 mx-2" />

            {MODULES.map((mod) => {
              const { done, total, pct } = moduleProgress(mod, progress);
              const complete = done === total;
              const active = activeModule === mod.id;
              return (
                <button
                  key={mod.id}
                  onClick={() => setActiveModule(mod.id)}
                  className={cn(
                    "flex items-start gap-2 px-3 py-2.5 rounded-md text-sm transition-colors text-left group",
                    active
                      ? "bg-gray-light text-foreground font-semibold"
                      : "text-muted-foreground hover:bg-gray-light hover:text-foreground"
                  )}
                >
                  <div className="shrink-0 mt-0.5">
                    {complete ? (
                      <CheckCheck size={13} className="text-green-500" />
                    ) : (
                      <span className="text-[11px] font-700 text-muted-foreground">{mod.number}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate leading-tight">{mod.title}</p>
                    <div className="mt-1.5 w-full h-1 bg-gray-medium rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all", complete ? "bg-green-500" : "bg-foreground")}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">{done}/{total}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Main content */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            {/* Global progress bar */}
            <div className="mb-6 p-4 bg-white border border-gray-medium rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-600">Progresso geral</p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-700 text-foreground">{totalDone}</span> de {TOTAL_TASKS} etapas concluídas
                </p>
              </div>
              <div className="w-full h-2 bg-gray-medium rounded-full overflow-hidden">
                <div
                  className="h-full bg-foreground rounded-full transition-all duration-300"
                  style={{ width: `${globalPct}%` }}
                />
              </div>
              {totalDone === TOTAL_TASKS && totalDone > 0 && (
                <p className="text-xs text-green-600 font-medium mt-2 flex items-center gap-1">
                  <CheckCheck size={12} /> Trilha concluída! Parabéns!
                </p>
              )}
            </div>

            {/* Overview or module detail */}
            {activeModule === null ? (
              <Overview
                modules={MODULES}
                progress={progress}
                onSelectModule={setActiveModule}
              />
            ) : (
              <ModuleDetail
                mod={MODULES[currentModuleIndex]}
                progress={progress}
                onToggle={toggleTask}
                onPrev={currentModuleIndex > 0 ? () => setActiveModule(MODULES[currentModuleIndex - 1].id) : null}
                onNext={currentModuleIndex < MODULES.length - 1 ? () => setActiveModule(MODULES[currentModuleIndex + 1].id) : null}
                onBack={() => setActiveModule(null)}
              />
            )}
          </div>
        </div>
      )}

      {/* ── PORTFÓLIO ── */}
      {activeTab === "portfolio" && (
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <Portfolio />
        </div>
      )}
    </div>
  );
}

// ─── Overview ─────────────────────────────────────────────────────────────────

function Overview({
  modules, progress, onSelectModule,
}: {
  modules: TrainingModule[];
  progress: Progress;
  onSelectModule: (id: string) => void;
}) {
  return (
    <div>
      <p className="text-xs font-600 text-muted-foreground uppercase tracking-wider mb-4">
        Módulos
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {modules.map((mod) => {
          const { done, total, pct } = moduleProgress(mod, progress);
          const complete = done === total;
          return (
            <button
              key={mod.id}
              onClick={() => onSelectModule(mod.id)}
              className="group text-left bg-white border border-gray-medium rounded-xl p-5 hover:border-gray-dark hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-700 text-muted-foreground bg-gray-light px-2 py-0.5 rounded-md">
                    Módulo {mod.number}
                  </span>
                  {complete && (
                    <span className="flex items-center gap-1 text-xs font-600 text-green-600 bg-green-50 px-2 py-0.5 rounded-md">
                      <CheckCheck size={10} /> Completo
                    </span>
                  )}
                </div>
                <ChevronRight
                  size={14}
                  className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-0.5"
                />
              </div>

              <h3 className="font-700 text-base mb-1">{mod.title}</h3>
              <p className="text-sm text-muted-foreground mb-4 leading-snug">{mod.description}</p>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{done} de {total} etapas</span>
                  <span className="font-600">{Math.round(pct)}%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-medium rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-300", complete ? "bg-green-500" : "bg-foreground")}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Module Detail ─────────────────────────────────────────────────────────────

function ModuleDetail({
  mod, progress, onToggle, onPrev, onNext, onBack,
}: {
  mod: TrainingModule;
  progress: Progress;
  onToggle: (id: string) => void;
  onPrev: (() => void) | null;
  onNext: (() => void) | null;
  onBack: () => void;
}) {
  const { done, total, pct } = moduleProgress(mod, progress);
  const complete = done === total;

  return (
    <div>
      {/* Breadcrumb */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-5"
      >
        <ChevronLeft size={12} />
        Visão geral
      </button>

      {/* Module header */}
      <div className="bg-white border border-gray-medium rounded-xl p-5 mb-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-700 text-muted-foreground bg-gray-light px-2 py-0.5 rounded-md">
                Módulo {mod.number}
              </span>
              {complete && (
                <span className="flex items-center gap-1 text-xs font-600 text-green-600 bg-green-50 px-2 py-0.5 rounded-md">
                  <CheckCheck size={10} /> Completo
                </span>
              )}
            </div>
            <h2 className="text-xl font-700 mb-1">{mod.title}</h2>
            <p className="text-sm text-muted-foreground">{mod.description}</p>
          </div>
        </div>
        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{done} de {total} etapas concluídas</span>
            <span className="font-600">{Math.round(pct)}%</span>
          </div>
          <div className="w-full h-1.5 bg-gray-medium rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-300", complete ? "bg-green-500" : "bg-foreground")}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Task groups */}
      <div className="flex flex-col gap-6 mb-8">
        {mod.groups.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <p className="text-xs font-700 text-muted-foreground uppercase tracking-wider mb-3 px-1">
                {group.label}
              </p>
            )}
            <div className="flex flex-col gap-2">
              {group.tasks.map((task) => {
                const done = !!progress[task.id];
                const meta = TYPE_META[task.type];
                const TypeIcon = meta.icon;
                return (
                  <button
                    key={task.id}
                    onClick={() => onToggle(task.id)}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl border text-left transition-all group",
                      done
                        ? "bg-gray-light border-gray-medium"
                        : "bg-white border-gray-medium hover:border-gray-dark hover:shadow-sm"
                    )}
                  >
                    {/* Toggle icon */}
                    <div className="shrink-0">
                      {done ? (
                        <CheckCircle2 size={18} className="text-green-500" />
                      ) : (
                        <Circle size={18} className="text-gray-medium group-hover:text-muted-foreground transition-colors" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-600 leading-snug", done && "line-through text-muted-foreground")}>
                        {task.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{task.subtitle}</p>
                    </div>

                    {/* Type badge */}
                    <div className={cn("shrink-0 flex items-center gap-1.5 text-[11px] font-600 px-2 py-1 rounded-md", meta.color)}>
                      <TypeIcon size={11} />
                      {meta.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-medium">
        {onPrev ? (
          <Button variant="outline" onClick={onPrev} className="gap-1.5">
            <ChevronLeft size={14} />
            Módulo anterior
          </Button>
        ) : <div />}

        {onNext ? (
          <Button variant="outline" onClick={onNext} className="gap-1.5">
            Próximo módulo
            <ChevronRight size={14} />
          </Button>
        ) : (
          <Button variant="outline" onClick={onBack} className="gap-1.5 text-muted-foreground">
            Ver visão geral
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Portfolio ────────────────────────────────────────────────────────────────

function Portfolio() {
  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-600 text-muted-foreground uppercase tracking-wider">
          Portfólio de Produtos
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Referência dos produtos e serviços oferecidos pelo Nex — somente leitura.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PORTFOLIO.map((cat) => (
          <ProductCategoryCard key={cat.id} category={cat} />
        ))}
      </div>
    </div>
  );
}

function ProductCategoryCard({ category: cat }: { category: ProductCategory }) {
  return (
    <div className="bg-white border border-gray-medium rounded-xl p-5">
      <p className="text-xs font-700 text-muted-foreground uppercase tracking-wider mb-3">
        {cat.title}
      </p>

      {/* Regular items */}
      {cat.items && (
        <ul className="flex flex-col gap-2">
          {cat.items.map((item) => (
            <li key={item.name} className="flex items-start gap-2">
              <div className="w-1 h-1 rounded-full bg-muted-foreground mt-2 shrink-0" />
              <div>
                <p className="text-sm font-500">{item.name}</p>
                {item.detail && (
                  <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Meeting rooms: units side by side */}
      {cat.units && (
        <div className="flex gap-4">
          {cat.units.map((unit) => (
            <div key={unit.name} className="flex-1">
              <p className="text-xs font-600 text-muted-foreground mb-2 leading-snug">{unit.name}</p>
              <div className="flex flex-wrap gap-1.5">
                {unit.items.map((room) => (
                  <span
                    key={room}
                    className="text-xs font-600 bg-gray-light border border-gray-medium rounded-md px-2 py-1"
                  >
                    {room}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
