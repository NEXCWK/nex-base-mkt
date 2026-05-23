"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "accent";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
          {
            "bg-black text-white hover:bg-gray-dark focus:ring-black": variant === "default",
            "border border-gray-medium bg-white text-gray-dark hover:bg-gray-light focus:ring-gray-medium": variant === "outline",
            "bg-transparent text-gray-dark hover:bg-gray-light focus:ring-gray-medium": variant === "ghost",
            "bg-accent text-black hover:bg-yellow-400 focus:ring-accent": variant === "accent",
          },
          {
            "h-8 px-3 text-sm": size === "sm",
            "h-10 px-4 text-sm": size === "md",
            "h-11 px-6 text-base": size === "lg",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
