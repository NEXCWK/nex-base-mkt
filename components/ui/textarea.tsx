"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const autoId = React.useId();
    const fieldId = id ?? autoId;
    return (
      <div className="flex flex-col gap-1.5">
        {label && <label htmlFor={fieldId} className="text-[13px] font-semibold text-gray-dark">{label}</label>}
        <textarea
          ref={ref}
          id={fieldId}
          aria-invalid={error ? true : undefined}
          className={cn(
            "w-full rounded-lg border border-gray-medium bg-white px-3 py-2.5 text-base sm:text-sm leading-relaxed text-foreground shadow-xs placeholder:text-muted-foreground/70 hover:border-[#D4D4D4] focus:outline-none focus:ring-2 focus:ring-black/80 focus:border-transparent transition-[border-color,box-shadow] resize-y min-h-[2.5rem]",
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
Textarea.displayName = "Textarea";
