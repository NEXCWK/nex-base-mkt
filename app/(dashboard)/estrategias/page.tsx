"use client";

import { useState, useEffect, useRef } from "react";
import { FileUpload } from "@/components/upload/FileUpload";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { PageContainer, PageHeader } from "@/components/ui/page-header";
import { Tabs, useTabParam } from "@/components/ui/tabs";
import { FolderOpen, NotebookPen, Check } from "lucide-react";

const TAGS = [
  "Instagram",
  "LinkedIn",
  "Lancamento",
  "Midia Paga",
  "Email Marketing",
  "Eventos",
  "Parcerias",
] as const;

type Tag = (typeof TAGS)[number];

// Tag values double as storage keys for saved notes, so only the displayed
// label is accented.
const TAG_LABELS: Partial<Record<Tag, string>> = {
  Lancamento: "Lançamento",
  "Midia Paga": "Mídia Paga",
};

const NOTES_KEY = "estrategias_notes";

function loadNotes(): Record<Tag, string> {
  if (typeof window === "undefined") {
    return Object.fromEntries(TAGS.map((t) => [t, ""])) as Record<Tag, string>;
  }
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    if (!raw) return Object.fromEntries(TAGS.map((t) => [t, ""])) as Record<Tag, string>;
    return JSON.parse(raw);
  } catch {
    return Object.fromEntries(TAGS.map((t) => [t, ""])) as Record<Tag, string>;
  }
}

export default function EstrategiasPage() {
  const [tab, setTab] = useTabParam("tab", ["arquivos", "anotacoes"] as const, "arquivos");
  const [activeTag, setActiveTag] = useState<Tag>("Instagram");
  const [notes, setNotes] = useState<Record<Tag, string>>(
    () => Object.fromEntries(TAGS.map((t) => [t, ""])) as Record<Tag, string>
  );
  const [saved, setSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setNotes(loadNotes());
    return () => clearTimeout(savedTimer.current);
  }, []);

  function handleNoteChange(value: string) {
    const updated = { ...notes, [activeTag]: value };
    setNotes(updated);
    try { localStorage.setItem(NOTES_KEY, JSON.stringify(updated)); } catch { /* ignore */ }
    setSaved(true);
    clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaved(false), 1500);
  }

  return (
    <PageContainer width="md">
      <PageHeader
        title="Estratégias"
        description="Arquivos e anotações organizados por canal estratégico."
      />

      <Tabs
        aria-label="Seções de estratégias"
        items={[
          { id: "arquivos", label: "Arquivos", icon: FolderOpen },
          { id: "anotacoes", label: "Anotações por Canal", icon: NotebookPen },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "arquivos" && <FileUpload section="Estrategias" />}

      {tab === "anotacoes" && (
        <div className="rounded-xl border border-gray-medium bg-white shadow-card overflow-hidden">
          <div className="flex flex-wrap gap-2 border-b border-gray-medium bg-canvas p-4">
            {TAGS.map((tag) => {
              const hasNote = !!notes[tag]?.trim();
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setActiveTag(tag)}
                  aria-pressed={activeTag === tag}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors",
                    activeTag === tag
                      ? "bg-black text-white border-black"
                      : "bg-white text-gray-dark border-gray-medium hover:border-black"
                  )}
                >
                  {hasNote && <span className={cn("h-1.5 w-1.5 rounded-full", activeTag === tag ? "bg-accent" : "bg-black")} />}
                  {TAG_LABELS[tag] ?? tag}
                </button>
              );
            })}
          </div>

          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-foreground">{TAG_LABELS[activeTag] ?? activeTag}</span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-xs text-muted-foreground transition-opacity",
                  saved ? "opacity-100" : "opacity-0"
                )}
                aria-live="polite"
              >
                <Check size={12} /> Salvo neste navegador
              </span>
            </div>
            <Textarea
              value={notes[activeTag] ?? ""}
              onChange={(e) => handleNoteChange(e.target.value)}
              placeholder={`Adicione anotações sobre estratégias de ${TAG_LABELS[activeTag] ?? activeTag}...`}
              rows={10}
            />
          </div>
        </div>
      )}
    </PageContainer>
  );
}
