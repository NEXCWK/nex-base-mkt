"use client";

import { FileUpload } from "@/components/upload/FileUpload";

export default function PortfolioPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Portfolio de Produtos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Descricao completa dos produtos e planos oferecidos pelo Nex Coworking.
        </p>
      </div>

      <FileUpload section="Portfolio de Produtos" />
    </div>
  );
}
