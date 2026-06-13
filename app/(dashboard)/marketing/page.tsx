"use client";

import { FileUpload } from "@/components/upload/FileUpload";

export default function MarketingPage() {
  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Marketing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Materiais, campanhas e recursos de marketing do Nex Coworking.
        </p>
      </div>

      <FileUpload section="Marketing" />
    </div>
  );
}
