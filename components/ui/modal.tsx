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

  // Move o foco ao primeiro campo apenas na abertura — efeito isolado para não
  // disparar novamente quando onClose (arrow inline) ganhar nova referência.
  React.useEffect(() => {
    if (!open) return;
    const el = dialogRef.current;
    const target = el?.querySelector<HTMLElement>(
      "input, textarea, select, button:not([aria-label='Fechar'])"
    );
    (target ?? el)?.focus();
  }, [open]);

  // Fecha com Escape
  React.useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && closable && onClose) onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, closable, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={closable ? onClose : undefined}
      />
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative z-10 w-full max-w-md rounded-xl bg-white border border-gray-medium shadow-xl mx-4",
          className
        )}
      >
        <div className="flex items-start justify-between p-6 pb-0">
          <div>
            {title && <h2 className="text-lg font-700 leading-tight">{title}</h2>}
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {closable && onClose && (
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="ml-4 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-gray-light transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
