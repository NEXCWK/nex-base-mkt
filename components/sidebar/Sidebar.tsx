"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  Home,
  Star,
  Users,
  BookOpen,
  Target,
  Briefcase,
  Palette,
  Megaphone,
  Building,
  FileText,
  BarChart2,
  GraduationCap,
  LogOut,
  ChevronRight,
  Menu,
  X,
  FolderOpen,
} from "lucide-react";

const navGroups: {
  label: string | null;
  items: { href: string; label: string; icon: React.ElementType }[];
}[] = [
  {
    label: null,
    items: [{ href: "/", label: "Tela Principal", icon: Home }],
  },
  {
    label: "Institucional",
    items: [
      { href: "/sobre-o-nex", label: "Sobre o Nex", icon: Star },
      { href: "/nosso-time", label: "Nosso Time", icon: Users },
    ],
  },
  {
    label: "Operação",
    items: [
      { href: "/playbooks", label: "Playbooks da Área", icon: BookOpen },
      { href: "/estrategias", label: "Estratégias", icon: Target },
      { href: "/comercial", label: "Vendas", icon: Briefcase },
      { href: "/comunicacao-design", label: "Comunicação e Design", icon: Palette },
      { href: "/marketing", label: "Marketing", icon: Megaphone },
    ],
  },
  {
    label: "Materiais",
    items: [
      { href: "/portfolio", label: "Portfólio de Produtos", icon: Building },
      { href: "/propostas", label: "Modelo de Propostas", icon: FileText },
      { href: "/contratos", label: "Contratos", icon: FolderOpen },
    ],
  },
  {
    label: "Acompanhamento",
    items: [
      { href: "/reports", label: "Reports Comerciais", icon: BarChart2 },
      { href: "/treinamento", label: "Treinamento", icon: GraduationCap },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Fecha o menu mobile ao navegar
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Trava o scroll do body enquanto o menu mobile está aberto
  useEffect(() => {
    if (!mobileOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      {/* ── Top bar (mobile) ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 z-40 bg-white border-b border-gray-medium flex items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/brand/logo-nex-preto.png"
            alt="Nex Coworking"
            width={60}
            height={24}
            className="object-contain"
            priority
          />
          <div className="h-4 w-px bg-gray-medium" />
          <span className="text-[11px] font-600 text-muted-foreground leading-tight">
            Mkt, Com &amp; Ven
          </span>
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-md text-foreground hover:bg-gray-light transition-colors"
          aria-label="Abrir menu"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* ── Backdrop (mobile) ── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-dvh w-60 border-r border-gray-medium bg-white flex flex-col z-50 transition-transform duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        aria-label="Menu principal"
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-gray-medium shrink-0">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/brand/logo-nex-preto.png"
              alt="Nex Coworking"
              width={72}
              height={28}
              className="object-contain"
              priority
            />
            <div className="h-4 w-px bg-gray-medium" />
            <span className="text-[11px] font-600 text-muted-foreground leading-tight">
              Mkt, Com &amp; Ven
            </span>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-md text-muted-foreground hover:bg-gray-light transition-colors"
            aria-label="Fechar menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 scrollbar-hide">
          {navGroups.map((group, gi) => (
            <div key={group.label ?? gi} className={cn(gi > 0 && "mt-4")}>
              {group.label && (
                <p className="px-5 mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  {group.label}
                </p>
              )}
              {group.items.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || (href !== "/" && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-3 mx-2 px-3 py-2 rounded-md text-sm transition-colors group",
                      active
                        ? "bg-gray-light text-foreground"
                        : "text-muted-foreground hover:bg-gray-light hover:text-foreground"
                    )}
                  >
                    <Icon
                      size={15}
                      className={cn(
                        "shrink-0",
                        active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                    <span className="flex-1 truncate">{label}</span>
                    {active && <ChevronRight size={12} className="shrink-0 text-muted-foreground" />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="border-t border-gray-medium p-3 shrink-0">
          <div className="flex items-center gap-3 px-2 py-1 mb-1">
            <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-black">
                {session?.user?.name?.[0]?.toUpperCase() || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">
                {session?.user?.name || "Usuário"}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {session?.user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-gray-light transition-colors"
          >
            <LogOut size={13} />
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}
