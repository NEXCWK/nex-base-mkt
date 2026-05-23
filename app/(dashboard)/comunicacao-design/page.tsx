"use client";

import { FileUpload } from "@/components/upload/FileUpload";
import { Palette, Layout, Image, Type } from "lucide-react";

const SECTION_ITEMS = [
  {
    icon: Palette,
    title: "Identidade Visual",
    description:
      "Paleta de cores, tipografia, logotipos e guias de uso da marca Nex Coworking.",
  },
  {
    icon: Layout,
    title: "Templates e Layouts",
    description:
      "Templates prontos para apresentacoes, documentos internos e materiais de comunicacao.",
  },
  {
    icon: Image,
    title: "Banco de Imagens",
    description:
      "Fotos dos espacos, eventos e equipe aprovadas para uso em publicacoes e campanhas.",
  },
  {
    icon: Type,
    title: "Copies e Textos",
    description:
      "Textos padronizados para redes sociais, emails e materiais impressos.",
  },
];

export default function ComunicacaoDesignPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Comunicacao e Design</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Repositorio centralizado de ativos de design, identidade visual e materiais de comunicacao.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        {SECTION_ITEMS.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="border border-gray-medium rounded-lg p-5 bg-white hover:shadow-sm transition-shadow"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-md bg-gray-light p-2 shrink-0">
                <Icon size={16} className="text-gray-dark" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-dark">{title}</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-3">
        <h2 className="text-base font-semibold">Arquivos</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Carregue e gerencie os arquivos de comunicacao e design.
        </p>
      </div>
      <FileUpload section="Comunicacao e Design" />
    </div>
  );
}
