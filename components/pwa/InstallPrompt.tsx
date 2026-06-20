"use client";

import { useEffect, useState } from "react";
import { Download, X, Share, Plus } from "lucide-react";

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
    <div className="fixed inset-0 z-[200] flex items-end justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <span className="font-700 text-base">Instalar no iPhone / iPad</span>
          <button onClick={onClose} className="p-1 rounded-md text-muted-foreground hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>
        <ol className="space-y-4 text-sm text-foreground">
          <li className="flex items-start gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FFD400] text-xs font-700">1</span>
            <span>Toque no botão <strong>Compartilhar</strong> <Share size={14} className="inline mb-0.5" /> na barra do Safari.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FFD400] text-xs font-700">2</span>
            <span>Role para baixo e toque em <strong>&ldquo;Adicionar à Tela de Início&rdquo;</strong> <Plus size={14} className="inline mb-0.5" />.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FFD400] text-xs font-700">3</span>
            <span>Toque em <strong>&ldquo;Adicionar&rdquo;</strong> no canto superior direito.</span>
          </li>
        </ol>
        <p className="mt-4 text-xs text-muted-foreground">O app aparecerá na tela inicial como um aplicativo nativo.</p>
        <button
          onClick={onClose}
          className="mt-5 w-full rounded-lg bg-[#FFD400] py-2.5 text-sm font-600 text-black transition hover:brightness-95"
        >
          Entendi
        </button>
      </div>
    </div>
  );
}

export function InstallPrompt() {
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

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setInstalling(false);
    if (outcome === "accepted") setVisible(false);
    else setDeferredPrompt(null);
  };

  if (!visible) return null;

  return (
    <>
      {/* Small discrete fixed button at top */}
      <button
        onClick={platform === "ios" ? () => setShowIOSGuide(true) : install}
        disabled={installing}
        className="fixed top-2 right-16 lg:top-3 lg:right-4 z-[45] flex items-center gap-1.5 rounded-lg bg-white border border-gray-200 shadow-sm px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors disabled:opacity-50"
        title="Instalar o app Nex MKT"
      >
        <Download size={12} />
        <span className="hidden lg:inline">{installing ? "Instalando…" : "Instalar app"}</span>
      </button>

      {showIOSGuide && <IOSGuide onClose={() => setShowIOSGuide(false)} />}
    </>
  );
}
