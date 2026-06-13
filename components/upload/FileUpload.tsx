"use client";
import { useState, useRef, useEffect } from "react";
import {
  Upload, File, Download, Trash2, Loader2, Eye, X,
  FileText, Image as ImageIcon, Film, FileArchive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

interface LocalFile {
  id: string;
  name: string;
  storedName: string;
  size: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: string;
}

interface FileUploadProps {
  section: string;
  category?: string;
  label?: string;
}

const ACCEPTED = ".pdf,.docx,.pptx,.png,.jpg,.jpeg,.mp4";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR");
}

function fileTypeIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return ImageIcon;
  if (mimeType.startsWith("video/")) return Film;
  if (mimeType === "application/pdf") return FileText;
  return FileArchive;
}

function isViewable(mimeType: string) {
  return (
    mimeType === "application/pdf" ||
    mimeType.startsWith("image/") ||
    mimeType.startsWith("video/")
  );
}

// ─── In-app file viewer ──────────────────────────────────────────────────────

function FileViewer({
  file,
  url,
  onClose,
}: {
  file: LocalFile;
  url: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/60 backdrop-blur-sm animate-overlay-in">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-medium shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <File size={16} className="shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">{formatDate(file.uploadedAt)} · {formatSize(file.size)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-4">
          <a
            href={url}
            download={file.name}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-gray-medium hover:bg-gray-light transition-colors"
          >
            <Download size={13} /> Download
          </a>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-gray-light transition-colors"
            title="Fechar"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto flex items-start justify-center p-4">
        {file.mimeType === "application/pdf" && (
          <iframe
            src={url}
            className="w-full max-w-4xl rounded-lg shadow-xl bg-white"
            style={{ minHeight: "calc(100vh - 110px)" }}
            title={file.name}
          />
        )}
        {file.mimeType.startsWith("image/") && (
          <img
            src={url}
            alt={file.name}
            className="max-w-full max-h-[calc(100vh-110px)] rounded-lg shadow-xl object-contain"
          />
        )}
        {file.mimeType.startsWith("video/") && (
          <video
            src={url}
            controls
            className="w-full max-w-4xl rounded-lg shadow-xl bg-black"
            style={{ maxHeight: "calc(100vh - 110px)" }}
          />
        )}
        {!isViewable(file.mimeType) && (
          <div className="flex flex-col items-center justify-center gap-4 bg-white rounded-xl p-12 shadow-xl text-center mt-8">
            <FileArchive size={40} className="text-muted-foreground opacity-40" />
            <p className="text-sm font-medium">Visualização não disponível para este formato</p>
            <p className="text-xs text-muted-foreground mb-2">{file.name}</p>
            <a
              href={url}
              download={file.name}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-black text-white text-sm font-medium hover:bg-gray-dark transition-colors"
            >
              <Download size={14} /> Fazer download
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function FileUpload({ section, category, label }: FileUploadProps) {
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LocalFile | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [previewFile, setPreviewFile] = useState<LocalFile | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);

  const sectionPath = category ? `${section}/${category}` : section;

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/drive?section=${encodeURIComponent(sectionPath)}`);
        if (!res.ok) throw new Error("Erro ao carregar arquivos");
        setFiles(await res.json());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionPath]);

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
      const newFile: LocalFile = await res.json();
      setFiles((prev) => [newFile, ...prev]);
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
        body: JSON.stringify({ fileId: deleteTarget.id, section: sectionPath }),
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

  function fileUrl(f: LocalFile) {
    return `/api/files?section=${encodeURIComponent(sectionPath)}&id=${f.id}&storedName=${encodeURIComponent(f.storedName)}`;
  }

  return (
    <>
      <div className="border border-gray-medium rounded-lg overflow-hidden">
        {label && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-medium bg-gray-light">
            <h3 className="font-600 text-sm">{label}</h3>
            {!loading && (
              <span className="text-xs text-muted-foreground">
                {files.length} {files.length === 1 ? "arquivo" : "arquivos"}
              </span>
            )}
          </div>
        )}

        {/* Upload area */}
        <div className="p-4 border-b border-gray-medium">
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors",
              dragging ? "border-black bg-gray-light" : "border-gray-medium hover:border-black",
              uploading && "opacity-50 cursor-not-allowed"
            )}
            onClick={() => !uploading && inputRef.current?.click()}
            onDragEnter={(e) => { e.preventDefault(); dragDepth.current++; setDragging(true); }}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={(e) => { e.preventDefault(); dragDepth.current--; if (dragDepth.current <= 0) setDragging(false); }}
            onDrop={handleDrop}
          >
            {uploading ? (
              <Loader2 size={18} className="animate-spin mx-auto mb-2 text-muted-foreground" />
            ) : (
              <Upload size={18} className="mx-auto mb-2 text-muted-foreground" />
            )}
            <p className="text-sm text-muted-foreground">
              {uploading ? "Enviando..." : dragging ? "Solte o arquivo aqui" : "Clique para selecionar ou arraste um arquivo"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, PPTX, PNG, JPG, MP4</p>
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
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Carregando arquivos…</span>
            </div>
          ) : files.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Nenhum arquivo ainda.
            </div>
          ) : (
            files.map((f) => {
              const TypeIcon = fileTypeIcon(f.mimeType);
              const url = fileUrl(f);
              const viewable = isViewable(f.mimeType);
              return (
                <div key={f.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-light transition-colors">
                  <TypeIcon size={16} className="shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <button
                      className="text-sm font-medium truncate block w-full text-left hover:underline"
                      onClick={() => setPreviewFile(f)}
                      title="Visualizar"
                    >
                      {f.name}
                    </button>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(f.uploadedAt)} · {formatSize(f.size)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {viewable && (
                      <button
                        onClick={() => setPreviewFile(f)}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-white transition-colors"
                        title="Visualizar"
                      >
                        <Eye size={14} />
                      </button>
                    )}
                    <a
                      href={url}
                      download={f.name}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-white transition-colors"
                      title="Fazer download"
                    >
                      <Download size={14} />
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
              );
            })
          )}
        </div>
      </div>

      {/* File viewer */}
      {previewFile && (
        <FileViewer
          file={previewFile}
          url={fileUrl(previewFile)}
          onClose={() => setPreviewFile(null)}
        />
      )}

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
    </>
  );
}
