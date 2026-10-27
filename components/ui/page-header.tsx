"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { findNavContext } from "@/lib/navigation";

const WIDTHS = {
  md: "max-w-4xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  full: "max-w-none",
} as const;

/** Standard page wrapper: consistent gutters and max width across the app. */
export function PageContainer({
  width = "lg",
  className,
  children,
}: {
  width?: keyof typeof WIDTHS;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("mx-auto w-full px-4 sm:px-6 lg:px-10 pt-5 sm:pt-8 pb-16", WIDTHS[width], className)}>
      {children}
    </div>
  );
}

/**
 * Standard page header: breadcrumb (from the nav config), icon, title,
 * description and actions. Actions wrap below the title on small screens.
 */
export function PageHeader({
  title,
  description,
  actions,
  icon,
  className,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  icon?: React.ElementType;
  className?: string;
  children?: React.ReactNode;
}) {
  const pathname = usePathname();
  const { group, item } = findNavContext(pathname);
  const Icon = icon ?? item?.icon;

  return (
    <header className={cn("mb-6 sm:mb-8", className)}>
      {group && (
        <nav aria-label="Você está em" className="mb-3 flex items-center gap-1 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">
            Início
          </Link>
          <ChevronRight size={12} className="opacity-60" />
          <span>{group.label}</span>
        </nav>
      )}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-3.5 min-w-0">
          {Icon && (
            <div className="hidden sm:flex w-11 h-11 shrink-0 items-center justify-center rounded-xl border border-gray-medium bg-white shadow-card">
              <Icon size={19} strokeWidth={1.75} className="text-foreground" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight leading-tight text-foreground">
              {title}
            </h1>
            {description && (
              <p className="mt-1.5 text-sm sm:text-[15px] text-muted-foreground leading-relaxed max-w-2xl">
                {description}
              </p>
            )}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:pt-1">{actions}</div>}
      </div>
      {children}
    </header>
  );
}

/** Small uppercase heading used to label sections within a page. */
export function SectionTitle({
  children,
  description,
  actions,
  className,
}: {
  children: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-3 mb-4", className)}>
      <div className="min-w-0">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{children}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

/** Intro line + primary action shown at the top of a tab panel. */
export function PanelToolbar({
  description,
  actions,
  className,
}: {
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5", className)}>
      {description ? (
        <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">{description}</p>
      ) : (
        <span />
      )}
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
