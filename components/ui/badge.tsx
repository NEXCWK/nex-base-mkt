import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "accent" | "outline" | "muted";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        {
          "bg-black text-white": variant === "default",
          "bg-accent text-black": variant === "accent",
          "border border-gray-medium text-gray-dark": variant === "outline",
          "bg-gray-light text-gray-dark": variant === "muted",
        },
        className
      )}
      {...props}
    />
  );
}
