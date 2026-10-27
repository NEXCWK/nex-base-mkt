"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { CornerDownLeft, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ALL_NAV_ITEMS, NAV_GROUPS, HOME_ITEM, type NavItem } from "@/lib/navigation";

interface Entry {
  key: string;
  href: string;
  title: string;
  context: string;
  icon: NavItem["icon"];
  haystack: string;
}

function normalize(text: string) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function groupLabelFor(item: NavItem) {
  return NAV_GROUPS.find((g) => g.items.includes(item))?.label ?? "Início";
}

const ENTRIES: Entry[] = ALL_NAV_ITEMS.flatMap((item) => {
  const group = item === HOME_ITEM ? "Início" : groupLabelFor(item);
  const base: Entry = {
    key: item.href,
    href: item.href,
    title: item.label,
    context: group,
    icon: item.icon,
    haystack: normalize([item.label, item.description, group, ...(item.keywords ?? [])].join(" ")),
  };
  const tabs: Entry[] = (item.tabs ?? []).map((t, i) => ({
    key: `${item.href}?tab=${t.id}`,
    // The first tab is each page's default, so it needs no query param.
    href: i === 0 ? item.href : `${item.href}?tab=${t.id}`,
    title: t.label,
    context: item.label,
    icon: item.icon,
    haystack: normalize([t.label, item.label, ...(item.keywords ?? [])].join(" ")),
  }));
  return [base, ...tabs];
});

export function useCommandPalette() {
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return { open, setOpen };
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);

  const results = React.useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return ENTRIES.filter((e) => !e.key.includes("?tab="));
    const terms = q.split(/\s+/);
    const score = (e: Entry) => {
      const title = normalize(e.title);
      if (title.startsWith(q)) return 3;
      if (title.includes(q)) return 2;
      return terms.some((t) => title.includes(t)) ? 1 : 0;
    };
    return ENTRIES.filter((e) => terms.every((t) => e.haystack.includes(t)))
      .map((e, i) => ({ e, i, s: score(e) }))
      .sort((a, b) => b.s - a.s || a.i - b.i)
      .map(({ e }) => e)
      .slice(0, 30);
  }, [query]);

  React.useEffect(() => {
    if (!open) return;
    setQuery("");
    setActive(0);
    const t = setTimeout(() => inputRef.current?.focus(), 10);
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(t);
      document.body.style.overflow = "";
    };
  }, [open]);

  React.useEffect(() => setActive(0), [query]);

  React.useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function go(entry: Entry | undefined) {
    if (!entry) return;
    onClose();
    router.push(entry.href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(results[active]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center p-3 sm:p-4 pt-[10vh] sm:pt-[14vh]">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px] animate-overlay-in" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Busca rápida"
        className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-gray-medium bg-white shadow-pop animate-modal-in"
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-3 border-b border-gray-medium px-4">
          <Search size={17} className="shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar páginas, abas e materiais…"
            className="h-14 w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground/70"
            role="combobox"
            aria-expanded
            aria-controls="command-results"
            aria-activedescendant={results[active] ? `cmd-${active}` : undefined}
          />
          <button type="button" onClick={onClose} aria-label="Fechar busca" className="rounded-lg p-1.5 text-muted-foreground hover:bg-gray-light hover:text-foreground">
            <X size={16} />
          </button>
        </div>

        <ul id="command-results" ref={listRef} role="listbox" className="max-h-[min(60dvh,420px)] overflow-y-auto p-2">
          {results.length === 0 ? (
            <li className="px-3 py-10 text-center text-sm text-muted-foreground">
              Nada encontrado para &ldquo;{query}&rdquo;.
            </li>
          ) : (
            results.map((r, i) => {
              const Icon = r.icon;
              const isActive = i === active;
              return (
                <li
                  key={r.key}
                  id={`cmd-${i}`}
                  data-index={i}
                  role="option"
                  aria-selected={isActive}
                  onMouseMove={() => setActive(i)}
                  onClick={() => go(r)}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5",
                    isActive ? "bg-gray-light" : "bg-transparent"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
                      isActive ? "border-black bg-black text-white" : "border-gray-medium bg-white text-foreground"
                    )}
                  >
                    <Icon size={15} strokeWidth={1.75} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">{r.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">{r.context}</span>
                  </span>
                  {isActive && <CornerDownLeft size={14} className="shrink-0 text-muted-foreground" />}
                </li>
              );
            })
          )}
        </ul>

        <div className="hidden sm:flex items-center gap-4 border-t border-gray-medium bg-canvas px-4 py-2.5 text-[11px] text-muted-foreground">
          <span><Kbd>↑</Kbd> <Kbd>↓</Kbd> navegar</span>
          <span><Kbd>Enter</Kbd> abrir</span>
          <span><Kbd>Esc</Kbd> fechar</span>
        </div>
      </div>
    </div>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-md border border-gray-medium bg-white px-1 font-sans text-[10px] font-semibold text-muted-foreground shadow-xs">
      {children}
    </kbd>
  );
}
