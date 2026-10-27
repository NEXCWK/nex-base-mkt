"use client";

import { ExternalLink, Palette } from "lucide-react";
import { FileUpload } from "@/components/upload/FileUpload";
import { PageContainer, PageHeader, SectionTitle } from "@/components/ui/page-header";

export default function PropostasPage() {
  return (
    <PageContainer width="md">
      <PageHeader
        title="Modelo de Propostas"
        description="Templates e modelos de propostas comerciais para clientes do Nex Coworking."
      />

      {/* Canva card */}
      <a
        href="https://www.canva.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="group mb-10 flex items-start sm:items-center gap-4 rounded-xl border border-gray-medium bg-white p-5 shadow-card transition-all hover:shadow-card-hover hover:border-[#D4D4D4]"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-medium bg-gray-light/60 transition-colors group-hover:bg-black group-hover:border-black">
          <Palette size={19} strokeWidth={1.75} className="text-foreground transition-colors group-hover:text-accent" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-bold text-foreground">Propostas no Canva</h2>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
            Todos os modelos de proposta são criados e editados no workspace da área no Canva.
            Caso não seja membro do workspace, converse com a gestão da área para fazer parte.
          </p>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 shrink-0 text-sm font-semibold text-foreground">
          Abrir o Canva
          <ExternalLink size={13} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </a>

      <SectionTitle>Propostas salvas</SectionTitle>
      <FileUpload section="Modelo de Propostas" />
    </PageContainer>
  );
}
