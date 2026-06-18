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

const DISMISSED_KEY = "pwa-banner-dismissed";

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

    if (sessionStorage.getItem(DISMISSED_KEY)) return;

    if (p === "ios") {
      setVisible(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      if (sessionStorage.getItem(DISMISSED_KEY)) return;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    setVisible(false);
    sessionStorage.setItem(DISMISSED_KEY, "1");
  };

  const install = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setInstalling(false);
    dismiss();
    if (outcome !== "accepted") setDeferredPrompt(null);
  };

  if (!visible) return null;

  // iOS: show instructions overlay
  if (platform === "ios" && showIOSGuide) {
    return (
      <div className="fixed inset-0 z-[200] flex items-end justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <span className="font-700 text-base">Instalar no iPhone / iPad</span>
            <button onClick={() => { setShowIOSGuide(false); dismiss(); }} className="p-1 rounded-md text-muted-foreground hover:bg-gray-100">
              <X size={16} />
            </button>
          </div>
          <ol className="space-y-4 text-sm text-foreground">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FFD400] text-xs font-700">1</span>
              <span>Toque no botão <strong>Compartilhar</strong> <Share size={14} className="inline mb-0.5" /> na barra do Safari (parte inferior ou superior da tela).</span>
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
          <p className="mt-4 text-xs text-muted-foreground">O app aparecerá na sua tela inicial como um aplicativo nativo, sem precisar da App Store.</p>
          <button
            onClick={() => { setShowIOSGuide(false); dismiss(); }}
            className="mt-5 w-full rounded-lg bg-[#FFD400] py-2.5 text-sm font-600 text-black transition hover:brightness-95"
          >
            Entendi
          </button>
        </div>
      </div>
    );
  }

  // Banner (bottom of screen)
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[200] p-3 sm:p-4 safe-area-bottom animate-slide-up">
      <div className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white shadow-2xl flex items-center gap-3 p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/icon-72x72.png"
          alt="Nex MKT"
          className="h-12 w-12 rounded-xl shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-700 leading-tight">Nex MKT</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
            {platform === "ios"
              ? "Adicione à Tela de Início para acesso rápido"
              : "Instale o app para acesso rápido"}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {platform === "ios" ? (
            <button
              onClick={() => setShowIOSGuide(true)}
              className="flex items-center gap-1.5 rounded-lg bg-[#FFD400] px-3 py-2 text-xs font-700 text-black transition hover:brightness-95"
            >
              <Share size={13} />
              Como instalar
            </button>
          ) : (
            <button
              onClick={install}
              disabled={installing}
              className="flex items-center gap-1.5 rounded-lg bg-[#FFD400] px-3 py-2 text-xs font-700 text-black transition hover:brightness-95 disabled:opacity-60"
            >
              <Download size={13} />
              {installing ? "Instalando…" : "Instalar"}
            </button>
          )}
          <button onClick={dismiss} className="p-1.5 rounded-md text-muted-foreground hover:bg-gray-100" aria-label="Fechar">
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
