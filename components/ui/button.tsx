"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "accent" | "destructive" | "subtle";
  size?: "sm" | "md" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg font-semibold whitespace-nowrap select-none",
          "transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:scale-[0.98]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
          {
            "bg-black text-white hover:bg-gray-dark shadow-xs": variant === "default",
            "border border-gray-medium bg-white text-foreground hover:bg-gray-light hover:border-[#D4D4D4] shadow-xs": variant === "outline",
            "bg-transparent text-gray-dark hover:bg-gray-light": variant === "ghost",
            "bg-accent text-black hover:bg-[#F2C900] shadow-xs": variant === "accent",
            "bg-red-600 text-white hover:bg-red-700 shadow-xs focus-visible:ring-red-600": variant === "destructive",
            "bg-gray-light text-foreground hover:bg-gray-medium": variant === "subtle",
          },
          {
            "h-8 px-3 text-[13px]": size === "sm",
            "h-10 px-4 text-sm": size === "md",
            "h-11 px-6 text-[15px]": size === "lg",
            "h-9 w-9 p-0": size === "icon",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
