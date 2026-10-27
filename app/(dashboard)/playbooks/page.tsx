"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, ExternalLink, Building2, Wrench, BookOpen } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/ui/page-header";
import { Tabs, SegmentedTabs, useTabParam } from "@/components/ui/tabs";
import { EmptyState, LoadingState } from "@/components/ui/states";
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

const MAIN_TABS: { id: MainTab; label: string; icon: React.ElementType }[] = [
  { id: "arquivos", label: "Playbooks", icon: BookOpen },
  { id: "parceiros", label: "Parceiros (Outsourcing)", icon: Building2 },
  { id: "softwares", label: "Softwares da Área", icon: Wrench },
];

const FILE_SECTIONS = [
  { id: "marketing", label: "Marketing" },
  { id: "vendas", label: "Vendas" },
  { id: "comunicacao", label: "Comunicação" },
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
  const [openSection, setOpenSection] = useTabParam(
    "sub",
    FILE_SECTIONS.map((sec) => sec.id),
    "marketing"
  );
  const current = FILE_SECTIONS.find((sec) => sec.id === openSection) ?? FILE_SECTIONS[0];

  return (
    <div>
      <SegmentedTabs
        aria-label="Playbook da área"
        items={FILE_SECTIONS.map(({ id, label }) => ({ id, label }))}
        value={openSection}
        onChange={setOpenSection}
      />
      <FileUpload
        key={current.id}
        section="Playbooks da Area"
        category={current.label}
        label={`Playbook · ${current.label}`}
      />
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
      setSaveError("Nome é obrigatório");
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
      window.alert("Não foi possível remover. Tente novamente.");
    } finally {
      setDeleting(false);
    }
  }

  function setField(key: keyof typeof EMPTY_PARTNER, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <p className="text-sm text-muted-foreground">
          Empresas e profissionais externos que prestam serviço para a área.
        </p>
        <Button variant="accent" size="sm" onClick={openAdd}>
          <Plus size={14} />
          Adicionar parceiro
        </Button>
      </div>

      {loading && <LoadingState />}

      {!loading && error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && partners.length === 0 && (
        <EmptyState
          icon={Building2}
          title="Nenhum parceiro cadastrado ainda"
          description="Cadastre agências, freelancers e fornecedores que atendem a área."
          action={<Button variant="outline" size="sm" onClick={openAdd}><Plus size={14} /> Adicionar parceiro</Button>}
        />
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
            label="Serviço / Especialidade"
            value={form.service}
            onChange={(e) => setField("service", e.target.value)}
            placeholder="Ex: Design Gráfico, Desenvolvimento"
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
      setSaveError("Nome é obrigatório");
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
      window.alert("Não foi possível remover. Tente novamente.");
    } finally {
      setDeleting(false);
    }
  }

  function setField(key: keyof typeof EMPTY_TOOL, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <p className="text-sm text-muted-foreground">
          Ferramentas e softwares utilizados pela área.
        </p>
        <Button variant="accent" size="sm" onClick={openAdd}>
          <Plus size={14} />
          Adicionar software
        </Button>
      </div>

      {loading && <LoadingState />}

      {!loading && error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && tools.length === 0 && (
        <EmptyState
          icon={Wrench}
          title="Nenhum software cadastrado ainda"
          description="Registre as ferramentas que o time usa e para que servem."
          action={<Button variant="outline" size="sm" onClick={openAdd}><Plus size={14} /> Adicionar software</Button>}
        />
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
            label="Descrição"
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
            placeholder="Para que serve e como é utilizado..."
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
  const [activeTab, setActiveTab] = useTabParam<MainTab>("tab", MAIN_TABS.map((t) => t.id), "arquivos", ["sub"]);

  return (
    <PageContainer>
      <PageHeader
        title="Playbooks da Área"
        description="Processos documentados, fornecedores externos e as ferramentas usadas pela área."
      />

      <Tabs aria-label="Seções dos playbooks" items={MAIN_TABS} value={activeTab} onChange={setActiveTab} />

      {activeTab === "arquivos" && <ArquivosTab />}
      {activeTab === "parceiros" && <ParceirosTab />}
      {activeTab === "softwares" && <SoftwaresTab />}
    </PageContainer>
  );
}
