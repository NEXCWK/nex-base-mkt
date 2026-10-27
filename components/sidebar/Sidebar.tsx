"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { ChevronDown, LogOut, Menu, Search, X } from "lucide-react";
import { HOME_ITEM, NAV_GROUPS, isActivePath, type NavItem } from "@/lib/navigation";
import { CommandPalette, Kbd, useCommandPalette } from "@/components/command/CommandPalette";
import { InstallAppButton } from "@/components/pwa/InstallPrompt";

const COLLAPSED_KEY = "nex_sidebar_collapsed_groups";

function loadCollapsed(): string[] {
  try {
    const raw = localStorage.getItem(COLLAPSED_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActivePath(pathname, item.href);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13.5px] transition-colors",
        active
          ? "bg-white text-foreground font-semibold shadow-card ring-1 ring-black/[0.06]"
          : "text-gray-dark/80 font-medium hover:bg-black/[0.04] hover:text-foreground"
      )}
    >
      {active && <span aria-hidden className="absolute -left-3 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-accent" />}
      <Icon
        size={16}
        strokeWidth={active ? 2 : 1.75}
        className={cn("shrink-0", active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")}
      />
      <span className="flex-1 truncate">{item.label}</span>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const palette = useCommandPalette();
  const [isMac, setIsMac] = useState(true);
  useEffect(() => setIsMac(/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)), []);

  useEffect(() => setCollapsed(loadCollapsed()), []);

  function toggleGroup(id: string) {
    setCollapsed((prev) => {
      const next = prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id];
      try { localStorage.setItem(COLLAPSED_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }

  // Fecha o menu mobile ao navegar
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Trava o scroll do body enquanto o menu mobile está aberto
  useEffect(() => {
    if (!mobileOpen) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMobileOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  const userName = session?.user?.name || "Usuário";
  const initials = userName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "U";

  return (
    <>
      {/* ── Top bar (mobile) ── */}
      <header className="lg:hidden fixed top-0 inset-x-0 h-14 z-40 bg-white/85 backdrop-blur-md border-b border-gray-medium flex items-center justify-between pl-2 pr-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2.5 rounded-lg text-foreground hover:bg-gray-light transition-colors"
            aria-label="Abrir menu"
            aria-expanded={mobileOpen}
            aria-controls="app-sidebar"
          >
            <Menu size={20} />
          </button>
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/brand/logo-nex-preto.png" alt="Nex Coworking" width={56} height={22} className="object-contain" priority />
            <span className="h-4 w-px bg-gray-medium" />
            <span className="text-[11px] font-semibold text-muted-foreground leading-tight">Mkt, Com &amp; Ven</span>
          </Link>
        </div>
        <button
          onClick={() => palette.setOpen(true)}
          className="p-2.5 rounded-lg text-foreground hover:bg-gray-light transition-colors"
          aria-label="Buscar"
        >
          <Search size={19} />
        </button>
      </header>

      {/* ── Backdrop (mobile) ── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] animate-overlay-in"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        id="app-sidebar"
        className={cn(
          "fixed left-0 top-0 h-dvh w-[17rem] lg:w-64 border-r border-gray-medium bg-canvas flex flex-col z-50",
          "transition-transform duration-300 ease-out-soft",
          mobileOpen ? "translate-x-0 shadow-pop" : "-translate-x-full lg:translate-x-0"
        )}
        aria-label="Menu principal"
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-5 h-16 shrink-0">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/brand/logo-nex-preto.png" alt="Nex Coworking" width={68} height={26} className="object-contain" priority />
            <span className="h-4 w-px bg-gray-medium" />
            <span className="text-[11px] font-semibold text-muted-foreground leading-tight">
              Marketing, Com.
              <br />
              &amp; Vendas
            </span>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-muted-foreground hover:bg-white transition-colors"
            aria-label="Fechar menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick search */}
        <div className="px-3 pb-3 shrink-0">
          <button
            type="button"
            onClick={() => { setMobileOpen(false); palette.setOpen(true); }}
            className="flex w-full items-center gap-2.5 rounded-lg border border-gray-medium bg-white px-3 h-9 text-[13px] text-muted-foreground shadow-xs hover:border-[#D4D4D4] hover:text-foreground transition-colors"
          >
            <Search size={14} />
            <span className="flex-1 text-left">Buscar…</span>
            <span className="hidden lg:flex items-center gap-0.5">
              <Kbd>{isMac ? "⌘" : "Ctrl"}</Kbd>
              <Kbd>K</Kbd>
            </span>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 pb-4 scrollbar-hide">
          <div className="mb-3">
            <NavLink item={HOME_ITEM} pathname={pathname} />
          </div>
          {NAV_GROUPS.map((group) => {
            const containsActive = group.items.some((i) => isActivePath(pathname, i.href));
            const isCollapsed = collapsed.includes(group.id) && !containsActive;
            return (
              <div key={group.id} className="mb-2">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  aria-expanded={!isCollapsed}
                  className="group flex w-full items-center justify-between rounded-md px-2.5 pt-3 pb-1.5 text-[10.5px] font-bold uppercase tracking-[0.12em] text-muted-foreground/80 hover:text-foreground transition-colors"
                >
                  {group.label}
                  <ChevronDown
                    size={12}
                    className={cn("opacity-0 group-hover:opacity-100 transition-all", isCollapsed && "-rotate-90 opacity-100")}
                  />
                </button>
                {!isCollapsed && (
                  <div className="flex flex-col gap-0.5">
                    {group.items.map((item) => (
                      <NavLink key={item.href} item={item} pathname={pathname} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="border-t border-gray-medium p-3 shrink-0 safe-area-bottom">
          <InstallAppButton className="mb-1" />
          <div className="flex items-center gap-3 rounded-lg px-2.5 py-2">
            <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center shrink-0 ring-2 ring-accent ring-offset-2 ring-offset-canvas">
              <span className="text-[11px] font-bold text-white">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-foreground truncate">{userName}</p>
              <p className="text-[11px] text-muted-foreground truncate">{session?.user?.email}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white transition-colors"
              aria-label="Sair"
              title="Sair"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      <CommandPalette open={palette.open} onClose={() => palette.setOpen(false)} />
    </>
  );
}
