"use client";

import { useEffect, useState } from "react";
import { Download, X, Share, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type Platform = "android" | "ios" | "desktop" | "unknown";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  if (/Macintosh|Windows|Linux/.test(ua)) return "desktop";
  return "unknown";
}

function isInStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

function IOSGuide({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center p-4 bg-black/50 backdrop-blur-sm animate-overlay-in">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-pop animate-modal-in">
        <div className="flex items-center justify-between mb-4">
          <span className="font-bold text-base">Instalar no iPhone / iPad</span>
          <button onClick={onClose} aria-label="Fechar" className="p-1.5 rounded-lg text-muted-foreground hover:bg-gray-light">
            <X size={16} />
          </button>
        </div>
        <ol className="space-y-4 text-sm text-foreground">
          <li className="flex items-start gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold">1</span>
            <span>Toque no botão <strong>Compartilhar</strong> <Share size={14} className="inline mb-0.5" /> na barra do Safari.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold">2</span>
            <span>Role para baixo e toque em <strong>&ldquo;Adicionar à Tela de Início&rdquo;</strong> <Plus size={14} className="inline mb-0.5" />.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold">3</span>
            <span>Toque em <strong>&ldquo;Adicionar&rdquo;</strong> no canto superior direito.</span>
          </li>
        </ol>
        <p className="mt-4 text-xs text-muted-foreground">O app aparecerá na tela inicial como um aplicativo nativo.</p>
        <button
          onClick={onClose}
          className="mt-5 w-full rounded-lg bg-black py-2.5 text-sm font-semibold text-white transition hover:bg-gray-dark"
        >
          Entendi
        </button>
      </div>
    </div>
  );
}

/**
 * "Instalar app" entry shown inside the app shell (sidebar footer) instead of a
 * floating button that used to overlap page headers. Hidden when the app is
 * already installed or the browser can't install it.
 */
export function InstallAppButton({ className }: { className?: string }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<Platform>("unknown");
  const [visible, setVisible] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (isInStandaloneMode()) return;

    const p = detectPlatform();
    setPlatform(p);

    if (p === "ios") {
      setVisible(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    const installed = () => setVisible(false);

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installed);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    } finally {
      setInstalling(false);
      // The prompt event can only be used once: hide the entry either way
      // (it comes back if the browser fires beforeinstallprompt again).
      setDeferredPrompt(null);
      setVisible(false);
    }
  };

  if (!visible) return null;

  return (
    <>
      <button
        type="button"
        onClick={platform === "ios" ? () => setShowIOSGuide(true) : install}
        disabled={installing}
        className={cn(
          "flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-white transition-colors disabled:opacity-50",
          className
        )}
      >
        <Download size={15} />
        {installing ? "Instalando…" : "Instalar app"}
      </button>

      {showIOSGuide && <IOSGuide onClose={() => setShowIOSGuide(false)} />}
    </>
  );
}
