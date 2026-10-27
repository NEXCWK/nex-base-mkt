import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "accent" | "outline" | "muted" | "success" | "warning";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold leading-4 whitespace-nowrap",
        {
          "bg-black text-white": variant === "default",
          "bg-accent text-black": variant === "accent",
          "border border-gray-medium text-gray-dark": variant === "outline",
          "bg-gray-light text-gray-dark": variant === "muted",
          "bg-green-50 text-green-700 ring-1 ring-inset ring-green-200": variant === "success",
          "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200": variant === "warning",
        },
        className
      )}
      {...props}
    />
  );
}
