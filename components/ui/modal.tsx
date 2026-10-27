"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose?: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  closable?: boolean;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className,
  closable = true,
}: ModalProps) {
  const dialogRef = React.useRef<HTMLDivElement>(null);

  // Auto-focus and scroll-lock: only when modal opens, never on re-renders
  React.useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    const el = dialogRef.current;
    const target = el?.querySelector<HTMLElement>("input, textarea, select, button:not([aria-label='Fechar'])");
    (target ?? el)?.focus();
    return () => {
      document.body.style.overflow = "";
      previouslyFocused?.focus?.();
    };
  }, [open]);

  // Escape key: separate effect so onClose reference changes don't retrigger focus
  React.useEffect(() => {
    if (!open || !closable || !onClose) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, closable, onClose]);

  const titleId = React.useId();
  const descId = React.useId();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px] animate-overlay-in"
        onClick={closable ? onClose : undefined}
        aria-hidden
      />
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        className={cn(
          "relative z-10 w-full max-w-md bg-white shadow-pop outline-none",
          "rounded-t-2xl sm:rounded-2xl border border-gray-medium",
          "max-h-[92dvh] sm:max-h-[88dvh] flex flex-col animate-modal-in",
          className
        )}
      >
        {/* Grab handle (mobile sheet) */}
        <div className="sm:hidden flex justify-center pt-2.5 -mb-2 shrink-0" aria-hidden>
          <span className="h-1 w-10 rounded-full bg-gray-medium" />
        </div>
        <div className="flex items-start justify-between gap-4 px-5 sm:px-6 pt-5 sm:pt-6 shrink-0">
          <div className="min-w-0">
            {title && (
              <h2 id={titleId} className="text-lg font-bold leading-tight tracking-tight">
                {title}
              </h2>
            )}
            {description && (
              <p id={descId} className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                {description}
              </p>
            )}
          </div>
          {closable && onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="-mr-1.5 -mt-1 shrink-0 rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-gray-light transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>
        <div className="px-5 sm:px-6 pt-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] sm:pb-6 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
}
