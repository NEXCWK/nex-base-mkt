"use client";
import { useState, useRef } from "react";
import { Upload, File, ExternalLink, Trash2, Loader2, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  webContentLink: string;
  createdTime: string;
  size?: string;
}

interface FileUploadProps {
  section: string;
  category?: string;
  label?: string;
}

const ACCEPTED = ".pdf,.docx,.pptx,.png,.jpg,.jpeg,.mp4";

function formatSize(bytes?: string): string {
  if (!bytes) return "";
  const n = parseInt(bytes);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function FileUpload({ section, category, label }: FileUploadProps) {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [fetched, setFetched] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DriveFile | null>(null);
  const [deleting, setDeleting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);

  async function fetchFiles() {
    setLoading(true);
    setError("");
    try {
      const sec = category ? `${section}/${category}` : section;
      const res = await fetch(`/api/drive?section=${encodeURIComponent(sec)}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erro ao carregar arquivos");
      }
      setFiles(await res.json());
      setFetched(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  async function uploadFile(file: File) {
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("section", section);
      if (category) fd.append("category", category);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Falha no upload");
      }
      await fetchFiles();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro no upload");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    if (uploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/drive", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: deleteTarget.id }),
      });
      if (!res.ok) throw new Error("Erro ao remover");
      setFiles((f) => f.filter((x) => x.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao remover");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  if (!fetched) {
    return (
      <div className="border border-gray-medium rounded-lg p-8 text-center bg-white">
        <FolderOpen size={24} className="mx-auto mb-3 text-muted-foreground opacity-50" />
        {label && <h3 className="font-600 text-sm mb-1">{label}</h3>}
        <p className="text-xs text-muted-foreground mb-4">
          Os arquivos ficam no Google Drive da equipe.
        </p>
        <Button variant="outline" size="sm" onClick={fetchFiles} disabled={loading}>
          {loading ? <Loader2 size={14} className="animate-spin" /> : null}
          Carregar arquivos
        </Button>
        {error && <p className="mt-3 text-xs text-red-500">{error}</p>}
      </div>
    );
  }

  return (
    <div className="border border-gray-medium rounded-lg overflow-hidden">
      {label && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-medium bg-gray-light">
          <h3 className="font-600 text-sm">{label}</h3>
          <span className="text-xs text-muted-foreground">
            {files.length} {files.length === 1 ? "arquivo" : "arquivos"}
          </span>
        </div>
      )}

      {/* Upload area */}
      <div className="p-4 border-b border-gray-medium">
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
            dragging
              ? "border-black bg-gray-light"
              : "border-gray-medium hover:border-black",
            uploading && "opacity-50 cursor-not-allowed"
          )}
          onClick={() => !uploading && inputRef.current?.click()}
          onDragEnter={(e) => {
            e.preventDefault();
            dragDepth.current++;
            setDragging(true);
          }}
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={(e) => {
            e.preventDefault();
            dragDepth.current--;
            if (dragDepth.current <= 0) setDragging(false);
          }}
          onDrop={handleDrop}
        >
          {uploading ? (
            <Loader2 size={20} className="animate-spin mx-auto mb-2 text-muted-foreground" />
          ) : (
            <Upload size={20} className="mx-auto mb-2 text-muted-foreground" />
          )}
          <p className="text-sm text-muted-foreground">
            {uploading
              ? "Enviando..."
              : dragging
                ? "Solte o arquivo aqui"
                : "Clique para selecionar ou arraste um arquivo"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            PDF, DOCX, PPTX, PNG, JPG, MP4
          </p>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept={ACCEPTED}
            onChange={handleInputChange}
            disabled={uploading}
          />
        </div>
        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      </div>

      {/* File list */}
      <div className="divide-y divide-gray-medium">
        {files.length === 0 && (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Nenhum arquivo ainda.
          </div>
        )}
        {files.map((f) => (
          <div key={f.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-light transition-colors">
            <File size={16} className="shrink-0 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{f.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(f.createdTime)}
                {f.size ? ` · ${formatSize(f.size)}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <a
                href={f.webViewLink}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-white transition-colors"
                title="Abrir no Drive"
              >
                <ExternalLink size={14} />
              </a>
              <button
                onClick={() => setDeleteTarget(f)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Remover"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Delete confirmation */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Remover arquivo"
        description={`Tem certeza que deseja remover "${deleteTarget?.name}"? Esta ação não pode ser desfeita.`}
      >
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
            className="bg-red-500 text-white hover:bg-red-600"
          >
            {deleting && <Loader2 size={13} className="animate-spin" />}
            Remover
          </Button>
        </div>
      </Modal>
    </div>
  );
}
