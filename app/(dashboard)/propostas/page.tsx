"use client";

import { ExternalLink, Palette } from "lucide-react";
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

      {/* Canva card */}
      <div className="border border-gray-medium rounded-xl p-6 bg-white mb-8">
        <div className="flex items-start gap-4">
          <div className="mt-0.5 rounded-lg bg-gray-light p-2.5 shrink-0">
            <Palette size={18} className="text-gray-dark" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-black">Propostas no Canva</h2>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              Todos os modelos de proposta são criados e editados diretamente no Canva, no workspace da área. Acesse pelo link abaixo para visualizar e editar os templates disponíveis.
              <br />
              <span className="text-xs mt-1 inline-block">Caso não seja membro do workspace, converse com a gestão da área para fazer parte.</span>
            </p>
            <a
              href="https://www.canva.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-black hover:underline underline-offset-2"
            >
              Abrir o Canva
              <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </div>

      {/* File upload for saved PDFs etc. */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Propostas salvas</h2>
        <FileUpload section="Modelo de Propostas" />
      </div>
    </div>
  );
}
