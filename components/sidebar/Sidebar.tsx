"use client";
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
  LogOut,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Tela Principal", icon: Home },
  { href: "/sobre-o-nex", label: "Sobre o Nex", icon: Star },
  { href: "/nosso-time", label: "Nosso Time", icon: Users },
  { href: "/playbooks", label: "Playbooks da Area", icon: BookOpen },
  { href: "/estrategias", label: "Estrategias", icon: Target },
  { href: "/comercial", label: "Comercial", icon: Briefcase },
  { href: "/comunicacao-design", label: "Comunicacao e Design", icon: Palette },
  { href: "/marketing", label: "Marketing", icon: Megaphone },
  { href: "/portfolio", label: "Portfolio de Produtos", icon: Building },
  { href: "/propostas", label: "Modelo de Propostas", icon: FileText },
  { href: "/reports", label: "Reports Comerciais", icon: BarChart2 },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 border-r border-gray-medium bg-white flex flex-col z-40">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 h-16 border-b border-gray-medium shrink-0">
        <div className="w-7 h-7 bg-accent rounded-md flex items-center justify-center">
          <span className="text-black font-bold text-sm">N</span>
        </div>
        <div className="leading-tight">
          <p className="text-xs font-700 text-foreground">Nex Coworking</p>
          <p className="text-[10px] text-muted-foreground">Mkt & Vendas</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 scrollbar-hide">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 mx-2 px-3 py-2 rounded-md text-sm transition-colors group",
                active
                  ? "bg-gray-light text-foreground font-medium"
                  : "text-muted-foreground hover:bg-gray-light hover:text-foreground"
              )}
            >
              <Icon
                size={16}
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
      </nav>

      {/* User footer */}
      <div className="border-t border-gray-medium p-3 shrink-0">
        <div className="flex items-center gap-3 px-2 py-1 mb-1">
          <div className="w-7 h-7 rounded-full bg-gray-light border border-gray-medium flex items-center justify-center shrink-0">
            <span className="text-xs font-600 text-gray-dark">
              {session?.user?.name?.[0]?.toUpperCase() || "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">
              {session?.user?.name || "Usuario"}
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
  );
}
