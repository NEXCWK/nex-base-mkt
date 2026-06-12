"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  GraduationCap, CheckCircle2, Circle, ChevronRight, ChevronLeft,
  BookOpen, Users, MapPin, Calendar, FileText, Package,
  Megaphone, Code2, Settings, GitBranch, CheckCheck, LayoutGrid,
  UserPlus, Trash2,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import {
  MODULES, TOTAL_TASKS,
  type TrainingModule, type TaskType,
} from "@/lib/training/data";

// ─── Helpers ──────────────────────────────────────────────────────────────────

type Progress = Record<string, boolean>;

interface Trainee {
  id: string;
  name: string;
  startedAt: string;
  progress: Progress;
}

const TRAINEES_KEY = "nex_trainings";

function loadTrainees(): Trainee[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TRAINEES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTrainees(list: Trainee[]) {
  try { localStorage.setItem(TRAINEES_KEY, JSON.stringify(list)); } catch { /* ignore */ }
}

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
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [activeTraineeId, setActiveTraineeId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // New / delete trainee modals
  const [newOpen, setNewOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Trainee | null>(null);

  useEffect(() => {
    setMounted(true);
    let list = loadTrainees();

    // Migração: se houver progresso antigo no formato individual, vira o primeiro trainee
    if (list.length === 0) {
      try {
        const legacy = localStorage.getItem(`nex_training_${session?.user?.email ?? "anon"}`);
        const legacyProgress = legacy ? JSON.parse(legacy) : {};
        const hasLegacy = Object.values(legacyProgress as Progress).some(Boolean);
        list = [{
          id: Date.now().toString(),
          name: hasLegacy ? (session?.user?.name ?? "Meu treinamento") : "Primeiro treinamento",
          startedAt: new Date().toISOString(),
          progress: hasLegacy ? legacyProgress : {},
        }];
        saveTrainees(list);
      } catch {
        list = [{ id: Date.now().toString(), name: "Primeiro treinamento", startedAt: new Date().toISOString(), progress: {} }];
        saveTrainees(list);
      }
    }
    setTrainees(list);
    setActiveTraineeId(list[0]?.id ?? null);
  }, [session?.user?.email, session?.user?.name]);

  const activeTrainee = trainees.find((t) => t.id === activeTraineeId) ?? null;
  const progress = activeTrainee?.progress ?? {};

  const persist = useCallback((list: Trainee[]) => {
    setTrainees(list);
    saveTrainees(list);
  }, []);

  const toggleTask = useCallback(
    (taskId: string) => {
      if (!activeTraineeId) return;
      setTrainees((prev) => {
        const next = prev.map((t) =>
          t.id === activeTraineeId
            ? { ...t, progress: { ...t.progress, [taskId]: !t.progress[taskId] } }
            : t
        );
        saveTrainees(next);
        return next;
      });
    },
    [activeTraineeId]
  );

  function createTrainee() {
    const name = newName.trim();
    if (!name) return;
    const t: Trainee = {
      id: Date.now().toString(),
      name,
      startedAt: new Date().toISOString(),
      progress: {},
    };
    const next = [...trainees, t];
    persist(next);
    setActiveTraineeId(t.id);
    setActiveModule(null);
    setNewName("");
    setNewOpen(false);
  }

  function removeTrainee() {
    if (!deleteTarget) return;
    const next = trainees.filter((t) => t.id !== deleteTarget.id);
    persist(next);
    if (activeTraineeId === deleteTarget.id) {
      setActiveTraineeId(next[0]?.id ?? null);
      setActiveModule(null);
    }
    setDeleteTarget(null);
  }

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
            <h1 className="text-2xl font-bold tracking-tight">Treinamento</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Trilha de onboarding para novos membros do time Nex
            </p>
          </div>
        </div>

        {/* Trainee controls */}
        <div className="flex items-center justify-end gap-2 flex-wrap">
          {trainees.length > 0 && (
            <div className="relative">
              <Users size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <select
                value={activeTraineeId ?? ""}
                onChange={(e) => { setActiveTraineeId(e.target.value); setActiveModule(null); }}
                className="pl-7 pr-3 h-9 rounded-md border border-gray-medium text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black max-w-[200px]"
              >
                {trainees.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}
          {activeTrainee && trainees.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteTarget(activeTrainee)}
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
              title="Remover este treinamento"
            >
              <Trash2 size={14} />
            </Button>
          )}
          <Button variant="accent" size="sm" onClick={() => setNewOpen(true)}>
            <UserPlus size={14} />
            Novo treinamento
          </Button>
        </div>

        {activeTrainee && (
          <p className="text-xs text-muted-foreground mt-2">
            Treinando <span className="font-600 text-foreground">{activeTrainee.name}</span>
            {" · "}iniciado em {format(parseISO(activeTrainee.startedAt), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
          </p>
        )}
      </div>

      {/* New trainee modal */}
      <Modal
        open={newOpen}
        onClose={() => { setNewOpen(false); setNewName(""); }}
        title="Iniciar novo treinamento"
        description="Comece uma nova trilha do zero para um novo membro do time."
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Nome do novo membro"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") createTrainee(); }}
            placeholder="Ex: João Silva"
            autoFocus
          />
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => { setNewOpen(false); setNewName(""); }}>
              Cancelar
            </Button>
            <Button variant="accent" size="sm" onClick={createTrainee} disabled={!newName.trim()}>
              <UserPlus size={14} />
              Iniciar trilha
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete trainee modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Remover treinamento"
        description={`Tem certeza que deseja remover a trilha de "${deleteTarget?.name}"? Todo o progresso será perdido.`}
      >
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>
            Cancelar
          </Button>
          <Button size="sm" onClick={removeTrainee} className="bg-red-500 text-white hover:bg-red-600">
            Remover
          </Button>
        </div>
      </Modal>

      {/* ── TRILHA ── */}
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

