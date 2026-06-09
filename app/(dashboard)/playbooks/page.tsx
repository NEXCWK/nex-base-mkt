"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, ExternalLink, Building2, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { FileUpload } from "@/components/upload/FileUpload";

// ─── Types ─────────────────────────────────────────────────────────────────

interface Partner {
  id: string;
  name: string;
  service: string;
  contact: string;
  createdAt?: string;
}

interface Tool {
  id: string;
  name: string;
  link: string;
  description: string;
  createdAt?: string;
}

type MainTab = "arquivos" | "parceiros" | "softwares";

const MAIN_TABS: { id: MainTab; label: string }[] = [
  { id: "arquivos", label: "Arquivos" },
  { id: "parceiros", label: "Parceiros (Outsourcing)" },
  { id: "softwares", label: "Softwares da Área" },
];

const FILE_SECTIONS = [
  { id: "marketing", label: "Marketing" },
  { id: "comercial", label: "Comercial" },
  { id: "comunicacao", label: "Comunicacao" },
  { id: "design", label: "Design" },
] as const;

// ─── Empty forms ────────────────────────────────────────────────────────────

const EMPTY_PARTNER: Omit<Partner, "id" | "createdAt"> = {
  name: "",
  service: "",
  contact: "",
};

const EMPTY_TOOL: Omit<Tool, "id" | "createdAt"> = {
  name: "",
  link: "",
  description: "",
};

// ─── Arquivos tab ───────────────────────────────────────────────────────────

function ArquivosTab() {
  const [openSection, setOpenSection] = useState<string | null>("marketing");

  return (
    <div className="space-y-3">
      {FILE_SECTIONS.map((sec) => {
        const isOpen = openSection === sec.id;
        return (
          <div key={sec.id} className="border border-gray-medium rounded-lg overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-5 py-3.5 bg-white hover:bg-gray-light transition-colors text-left"
              onClick={() => setOpenSection(isOpen ? null : sec.id)}
            >
              <span className="font-medium text-sm text-black">{sec.label}</span>
              <span className="text-xs text-muted-foreground">{isOpen ? "Recolher" : "Expandir"}</span>
            </button>
            {isOpen && (
              <div className="border-t border-gray-medium p-5 bg-white">
                <FileUpload
                  section="Playbooks da Area"
                  category={sec.label}
                  label={sec.label}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Partners tab ───────────────────────────────────────────────────────────

function ParceirosTab() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partner | null>(null);
  const [form, setForm] = useState(EMPTY_PARTNER);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<Partner | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/partners");
      if (!res.ok) throw new Error("Erro ao carregar parceiros");
      setPartners(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_PARTNER);
    setSaveError("");
    setModalOpen(true);
  }

  function openEdit(partner: Partner) {
    setEditing(partner);
    setForm({ name: partner.name, service: partner.service, contact: partner.contact });
    setSaveError("");
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setSaveError("Nome e obrigatorio");
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      if (editing) {
        const res = await fetch("/api/partners", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, id: editing.id }),
        });
        if (!res.ok) throw new Error("Erro ao atualizar");
      } else {
        const res = await fetch("/api/partners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error("Erro ao criar");
      }
      await fetchPartners();
      setModalOpen(false);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/partners", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteTarget.id }),
      });
      if (!res.ok) throw new Error("Erro ao remover");
      await fetchPartners();
      setDeleteTarget(null);
    } catch {
      // silently close; list will refresh
    } finally {
      setDeleting(false);
    }
  }

  function setField(key: keyof typeof EMPTY_PARTNER, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-muted-foreground">
          Empresas e profissionais externos parceiros da area.
        </p>
        <Button variant="accent" size="sm" onClick={openAdd}>
          <Plus size={14} />
          Adicionar parceiro
        </Button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-5 h-5 rounded-full border-2 border-black border-t-transparent animate-spin" />
        </div>
      )}

      {!loading && error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && partners.length === 0 && (
        <div className="rounded-lg border border-gray-medium bg-gray-light p-12 text-center">
          <Building2 size={32} className="mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Nenhum parceiro cadastrado ainda.
          </p>
        </div>
      )}

      {!loading && !error && partners.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {partners.map((partner) => (
            <Card key={partner.id}>
              <CardHeader>
                <CardTitle className="text-sm">{partner.name}</CardTitle>
                {partner.service && (
                  <Badge variant="muted" className="w-fit mt-1">
                    {partner.service}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="pt-3">
                {partner.contact && (
                  <p className="text-xs text-muted-foreground break-all">{partner.contact}</p>
                )}
              </CardContent>
              <CardFooter className="gap-2 pt-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEdit(partner)}
                  className="h-7 px-2 text-xs"
                >
                  <Pencil size={12} />
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteTarget(partner)}
                  className="h-7 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={12} />
                  Remover
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Editar parceiro" : "Novo parceiro"}
      >
        <div className="space-y-4">
          <Input
            label="Nome"
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            placeholder="Nome da empresa ou profissional"
          />
          <Input
            label="Servico / Especialidade"
            value={form.service}
            onChange={(e) => setField("service", e.target.value)}
            placeholder="Ex: Design Grafico, Desenvolvimento"
          />
          <Input
            label="Contato"
            value={form.contact}
            onChange={(e) => setField("contact", e.target.value)}
            placeholder="Email, telefone ou site"
          />

          {saveError && <p className="text-xs text-red-500">{saveError}</p>}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setModalOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button variant="accent" size="sm" onClick={handleSave} disabled={saving}>
              {saving ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-black border-t-transparent animate-spin" />
                  Salvando...
                </span>
              ) : (
                "Salvar"
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Remover parceiro"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja remover{" "}
            <span className="font-medium text-black">{deleteTarget?.name}</span>? Esta ação não pode
            ser desfeita.
          </p>
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
            >
              {deleting ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Removendo...
                </span>
              ) : (
                "Remover"
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Tools tab ──────────────────────────────────────────────────────────────

function SoftwaresTab() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Tool | null>(null);
  const [form, setForm] = useState(EMPTY_TOOL);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<Tool | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTools = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/tools");
      if (!res.ok) throw new Error("Erro ao carregar ferramentas");
      setTools(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTools();
  }, [fetchTools]);

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_TOOL);
    setSaveError("");
    setModalOpen(true);
  }

  function openEdit(tool: Tool) {
    setEditing(tool);
    setForm({ name: tool.name, link: tool.link, description: tool.description });
    setSaveError("");
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setSaveError("Nome e obrigatorio");
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      if (editing) {
        const res = await fetch("/api/tools", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, id: editing.id }),
        });
        if (!res.ok) throw new Error("Erro ao atualizar");
      } else {
        const res = await fetch("/api/tools", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error("Erro ao criar");
      }
      await fetchTools();
      setModalOpen(false);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/tools", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteTarget.id }),
      });
      if (!res.ok) throw new Error("Erro ao remover");
      await fetchTools();
      setDeleteTarget(null);
    } catch {
      // silently close; list will refresh
    } finally {
      setDeleting(false);
    }
  }

  function setField(key: keyof typeof EMPTY_TOOL, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-muted-foreground">
          Ferramentas e softwares utilizados pela area.
        </p>
        <Button variant="accent" size="sm" onClick={openAdd}>
          <Plus size={14} />
          Adicionar software
        </Button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-5 h-5 rounded-full border-2 border-black border-t-transparent animate-spin" />
        </div>
      )}

      {!loading && error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && tools.length === 0 && (
        <div className="rounded-lg border border-gray-medium bg-gray-light p-12 text-center">
          <Wrench size={32} className="mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Nenhum software cadastrado ainda.
          </p>
        </div>
      )}

      {!loading && !error && tools.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map((tool) => (
            <Card key={tool.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm">{tool.name}</CardTitle>
                  {tool.link && (
                    <a
                      href={tool.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 p-1 rounded-md text-muted-foreground hover:text-black hover:bg-gray-light transition-colors"
                      title="Abrir link"
                    >
                      <ExternalLink size={13} />
                    </a>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-3">
                {tool.description && (
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                    {tool.description}
                  </p>
                )}
                {tool.link && (
                  <p className="mt-2 text-xs text-muted-foreground truncate">{tool.link}</p>
                )}
              </CardContent>
              <CardFooter className="gap-2 pt-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEdit(tool)}
                  className="h-7 px-2 text-xs"
                >
                  <Pencil size={12} />
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteTarget(tool)}
                  className="h-7 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={12} />
                  Remover
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Editar software" : "Novo software"}
      >
        <div className="space-y-4">
          <Input
            label="Nome"
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            placeholder="Nome da ferramenta"
          />
          <Input
            label="Link"
            value={form.link}
            onChange={(e) => setField("link", e.target.value)}
            placeholder="https://..."
            type="url"
          />
          <Textarea
            label="Descricao"
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
            placeholder="Para que serve e como e utilizado..."
            rows={3}
          />

          {saveError && <p className="text-xs text-red-500">{saveError}</p>}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setModalOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button variant="accent" size="sm" onClick={handleSave} disabled={saving}>
              {saving ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-black border-t-transparent animate-spin" />
                  Salvando...
                </span>
              ) : (
                "Salvar"
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Remover software"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja remover{" "}
            <span className="font-medium text-black">{deleteTarget?.name}</span>? Esta ação não pode
            ser desfeita.
          </p>
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
            >
              {deleting ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Removendo...
                </span>
              ) : (
                "Remover"
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function PlaybooksPage() {
  const [activeTab, setActiveTab] = useState<MainTab>("arquivos");

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-black">Playbooks da Área</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Arquivos, parceiros e ferramentas da área de marketing e comunicação.
        </p>
      </div>

      {/* Tab navigation */}
      <div className="border-b border-gray-medium mb-8">
        <nav className="flex gap-1" role="tablist">
          {MAIN_TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium rounded-t-md transition-colors relative -mb-px",
                activeTab === tab.id
                  ? "text-black border-b-2 border-black"
                  : "text-muted-foreground hover:text-black hover:bg-gray-light"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === "arquivos" && <ArquivosTab />}
      {activeTab === "parceiros" && <ParceirosTab />}
      {activeTab === "softwares" && <SoftwaresTab />}
    </div>
  );
}
