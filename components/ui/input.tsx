"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const autoId = React.useId();
    const fieldId = id ?? autoId;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={fieldId} className="text-[13px] font-semibold text-gray-dark">{label}</label>
        )}
        <input
          ref={ref}
          id={fieldId}
          aria-invalid={error ? true : undefined}
          className={cn(
            "h-10 w-full rounded-lg border border-gray-medium bg-white px-3 text-base sm:text-sm text-foreground shadow-xs placeholder:text-muted-foreground/70 hover:border-[#D4D4D4] focus:outline-none focus:ring-2 focus:ring-black/80 focus:border-transparent transition-[border-color,box-shadow] disabled:bg-gray-light disabled:opacity-70",
            error && "border-red-500 focus:ring-red-500",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
