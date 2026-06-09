"use client";

import { useState, useEffect } from "react";
import { FileUpload } from "@/components/upload/FileUpload";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

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
  const [activeTag, setActiveTag] = useState<Tag>("Instagram");
  const [notes, setNotes] = useState<Record<Tag, string>>(
    () => Object.fromEntries(TAGS.map((t) => [t, ""])) as Record<Tag, string>
  );
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setNotes(loadNotes());
  }, []);

  function handleNoteChange(value: string) {
    const updated = { ...notes, [activeTag]: value };
    setNotes(updated);
    localStorage.setItem(NOTES_KEY, JSON.stringify(updated));
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Estratégias</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Arquivos e anotações organizados por canal estratégico.
        </p>
      </div>

      <div className="mb-8">
        <FileUpload section="Estrategias" />
      </div>

      <div className="border border-gray-medium rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-medium bg-gray-light">
          <h2 className="text-sm font-semibold">Anotações por Canal</h2>
        </div>

        <div className="p-4">
          <div className="flex flex-wrap gap-2 mb-5">
            {TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                  activeTag === tag
                    ? "bg-black text-white border-black"
                    : "bg-white text-gray-dark border-gray-medium hover:border-black hover:bg-gray-light"
                )}
              >
                {tag}
              </button>
            ))}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-dark">{activeTag}</span>
              {saved && (
                <span className="text-xs text-muted-foreground">Salvo</span>
              )}
            </div>
            <Textarea
              value={notes[activeTag] ?? ""}
              onChange={(e) => handleNoteChange(e.target.value)}
              placeholder={`Adicione anotações sobre estratégias de ${activeTag}...`}
              rows={6}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
