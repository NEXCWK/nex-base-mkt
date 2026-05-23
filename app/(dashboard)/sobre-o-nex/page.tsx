"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { FileUpload } from "@/components/upload/FileUpload";

const CATEGORIES = [
  { id: "brandbook", label: "BrandBook" },
  { id: "codigo-de-cultura", label: "Codigo de Cultura" },
  { id: "midia-kit", label: "Midia Kit" },
  { id: "historia-do-nex", label: "Historia do Nex" },
] as const;

type CategoryId = (typeof CATEGORIES)[number]["id"];

export default function SobreONexPage() {
  const [activeTab, setActiveTab] = useState<CategoryId>("brandbook");

  const activeCategory = CATEGORIES.find((c) => c.id === activeTab)!;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-black">Sobre o Nex</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Materiais institucionais e de identidade da empresa.
        </p>
      </div>

      {/* Tab navigation */}
      <div className="border-b border-gray-medium mb-8">
        <nav className="flex gap-1" role="tablist">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              role="tab"
              aria-selected={activeTab === cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium rounded-t-md transition-colors relative -mb-px",
                activeTab === cat.id
                  ? "text-black border-b-2 border-black"
                  : "text-muted-foreground hover:text-black hover:bg-gray-light"
              )}
            >
              {cat.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div>
        <div className="mb-4">
          <h2 className="text-base font-semibold text-black">
            {activeCategory.label}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Arquivos relacionados a {activeCategory.label}.
          </p>
        </div>
        <FileUpload
          key={activeTab}
          section="Sobre o Nex"
          category={activeCategory.label}
          label={activeCategory.label}
        />
      </div>
    </div>
  );
}
