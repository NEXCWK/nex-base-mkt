"use client";

import { FileUpload } from "@/components/upload/FileUpload";

export default function PropostasPage() {
  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Modelo de Propostas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Templates e modelos de propostas comerciais para clientes do Nex Coworking.
        </p>
      </div>

      <FileUpload section="Modelo de Propostas" />
    </div>
  );
}
