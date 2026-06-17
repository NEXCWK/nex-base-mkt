"use client";

import { ExternalLink, FolderOpen, BookImage, Palette } from "lucide-react";

const LINKS = [
  {
    icon: FolderOpen,
    title: "Materiais multimídia",
    desc: "Todos os vídeos, fotos, artes e materiais de comunicação da área estão organizados no Google Drive.",
    label: "Acessar no Drive",
    href: "https://drive.google.com/drive/folders/1tipHqQKbqD7D1D2pcyNQO-MlbXpxVa-t?usp=drive_link",
  },
  {
    icon: BookImage,
    title: "Identidade Visual & Brandbook",
    desc: "As diretrizes de marca, paleta de cores, tipografia e guia de uso do logo Nex estão disponíveis no Drive.",
    label: "Acessar no Drive",
    href: "https://drive.google.com/drive/folders/1Gs0nem3GMWVESNruoe0EzAWMm7I_Y1Mf?usp=drive_link",
  },
  {
    icon: Palette,
    title: "Design no Canva",
    desc: "Todos os materiais de design são criados e organizados diretamente no Canva. Acesse o workspace da área pelo link abaixo. Caso não seja membro do workspace, converse com a gestão da área para fazer parte.",
    label: "Abrir o Canva",
    href: "https://www.canva.com/",
  },
];

export default function ComunicacaoDesignPage() {
  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Comunicação e Design</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acesse os materiais, diretrizes e ferramentas da área de Comunicação e Design.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {LINKS.map(({ icon: Icon, title, desc, label, href }) => (
          <div key={title} className="border border-gray-medium rounded-xl p-6 bg-white">
            <div className="flex items-start gap-4">
              <div className="mt-0.5 rounded-lg bg-gray-light p-2.5 shrink-0">
                <Icon size={18} className="text-gray-dark" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold text-black">{title}</h2>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{desc}</p>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-black hover:underline underline-offset-2"
                >
                  {label}
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
