"use client";
import * as React from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  icon?: React.ElementType;
  count?: number;
}

/**
 * Keeps the active tab in the URL (`?tab=…`, `?sub=…`) so every tab can be
 * linked, bookmarked, reached from quick search and survives a reload.
 * Unknown values fall back to `fallback`. Changing a parent tab clears the
 * keys listed in `resets` (e.g. the sub-tab).
 */
export function useTabParam<T extends string>(
  key: string,
  allowed: readonly T[],
  fallback: T,
  resets: string[] = []
): [T, (value: T) => void] {
  const searchParams = useSearchParams();
  const raw = searchParams.get(key);
  const value = raw && (allowed as readonly string[]).includes(raw) ? (raw as T) : fallback;

  const setValue = React.useCallback(
    (next: T) => {
      const params = new URLSearchParams(window.location.search);
      if (next === fallback) params.delete(key);
      else params.set(key, next);
      for (const r of resets) params.delete(r);
      const qs = params.toString();
      window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key, fallback, resets.join(",")]
  );

  return [value, setValue];
}

function useRovingKeys<T extends string>(items: TabItem<T>[], value: T, onChange: (v: T) => void) {
  return (e: React.KeyboardEvent<HTMLDivElement>) => {
    const idx = items.findIndex((t) => t.id === value);
    let next = -1;
    if (e.key === "ArrowRight") next = (idx + 1) % items.length;
    else if (e.key === "ArrowLeft") next = (idx - 1 + items.length) % items.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = items.length - 1;
    if (next < 0) return;
    e.preventDefault();
    onChange(items[next].id);
    const buttons = e.currentTarget.querySelectorAll<HTMLButtonElement>("[role=tab]");
    buttons[next]?.focus();
  };
}

/** Primary page-level navigation: underlined, horizontally scrollable on mobile. */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  className,
  "aria-label": ariaLabel,
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  "aria-label"?: string;
}) {
  const onKeyDown = useRovingKeys(items, value, onChange);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Keep the active tab in view when the row overflows (mobile).
  React.useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>("[aria-selected=true]");
    el?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [value]);

  return (
    <div className={cn("relative border-b border-gray-medium mb-6 sm:mb-8 -mx-4 sm:mx-0", className)}>
      <div
        ref={listRef}
        role="tablist"
        aria-label={ariaLabel}
        onKeyDown={onKeyDown}
        className="flex gap-1 overflow-x-auto scrollbar-hide px-4 sm:px-0"
      >
        {items.map(({ id, label, icon: Icon, count }) => {
          const active = id === value;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              onClick={() => onChange(id)}
              className={cn(
                "relative inline-flex items-center gap-2 px-3 sm:px-3.5 py-3 text-sm whitespace-nowrap transition-colors rounded-t-md",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-inset",
                active ? "text-foreground font-semibold" : "text-muted-foreground font-medium hover:text-foreground"
              )}
            >
              {Icon && <Icon size={15} className={cn("shrink-0", active ? "text-foreground" : "text-muted-foreground")} />}
              {label}
              {typeof count === "number" && (
                <span
                  className={cn(
                    "min-w-[1.25rem] h-5 px-1.5 rounded-full text-[11px] font-semibold inline-flex items-center justify-center tabular-nums",
                    active ? "bg-black text-white" : "bg-gray-light text-muted-foreground"
                  )}
                >
                  {count}
                </span>
              )}
              <span
                aria-hidden
                className={cn(
                  "absolute left-2 right-2 -bottom-px h-[2px] rounded-full transition-colors",
                  active ? "bg-black" : "bg-transparent"
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Secondary navigation inside a tab: compact segmented control. */
export function SegmentedTabs<T extends string>({
  items,
  value,
  onChange,
  className,
  size = "md",
  "aria-label": ariaLabel,
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: "sm" | "md";
  "aria-label"?: string;
}) {
  const onKeyDown = useRovingKeys(items, value, onChange);
  return (
    <div className={cn("max-w-full overflow-x-auto scrollbar-hide mb-6", className)}>
      <div
        role="tablist"
        aria-label={ariaLabel}
        onKeyDown={onKeyDown}
        className="inline-flex items-center gap-0.5 rounded-xl bg-gray-light p-1 ring-1 ring-inset ring-gray-medium/70"
      >
        {items.map(({ id, label, icon: Icon, count }) => {
          const active = id === value;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              onClick={() => onChange(id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg whitespace-nowrap font-medium transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black",
                size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-[13px]",
                active
                  ? "bg-white text-foreground shadow-card ring-1 ring-black/5"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {Icon && <Icon size={size === "sm" ? 12 : 14} className="shrink-0" />}
              {label}
              {typeof count === "number" && (
                <span className="text-[11px] tabular-nums text-muted-foreground">{count}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
