"use client";

import { ExternalLink, FolderOpen } from "lucide-react";
import { FileUpload } from "@/components/upload/FileUpload";

export default function MarketingPage() {
  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Marketing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Estratégias, planos e materiais de marketing do Nex Coworking.
        </p>
      </div>

      {/* Drive link */}
      <div className="border border-gray-medium rounded-xl p-6 bg-white mb-8">
        <div className="flex items-start gap-4">
          <div className="mt-0.5 rounded-lg bg-gray-light p-2.5 shrink-0">
            <FolderOpen size={18} className="text-gray-dark" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-black">Estratégias e organização da área</h2>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              Todas as estratégias, calendários, planos de ação e organizações da área de Marketing estão centralizados no Google Drive. Acesse pelo link abaixo.
            </p>
            <a
              href="https://drive.google.com/drive/folders/1bNQu14d8EWKiHmfsQF9k6qDMtjuIcyFH?usp=drive_link"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-black hover:underline underline-offset-2"
            >
              Acessar pasta de Marketing no Drive
              <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </div>

      {/* File upload for local files */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Arquivos da área</h2>
        <FileUpload section="Marketing" />
      </div>
    </div>
  );
}
