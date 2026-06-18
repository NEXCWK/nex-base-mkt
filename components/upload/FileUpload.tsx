"use client";
import { useState, useRef, useEffect, useCallback } from "react";
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

const ACCEPTED = ".pdf,.docx,.pptx,.xlsx,.png,.jpg,.jpeg,.webp,.mp4";

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
  downloadUrl,
  onClose,
}: {
  file: LocalFile;
  url: string;
  downloadUrl: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/60 backdrop-blur-sm animate-overlay-in">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-3 bg-white border-b border-gray-medium shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <File size={16} className="shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">{formatDate(file.uploadedAt)} · {formatSize(file.size)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-4">
          <a
            href={downloadUrl}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-gray-medium hover:bg-gray-light transition-colors"
          >
            <Download size={13} /> Download
          </a>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-gray-light transition-colors"
            title="Fechar (Esc)"
            aria-label="Fechar visualização"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div
        className="flex-1 overflow-auto flex items-start justify-center p-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        {file.mimeType === "application/pdf" && (
          <iframe
            src={url}
            className="w-full max-w-4xl rounded-lg shadow-xl bg-white"
            style={{ minHeight: "calc(100dvh - 110px)" }}
            title={file.name}
          />
        )}
        {file.mimeType.startsWith("image/") && (
          // eslint-disable-next-line @next/next/no-img-element -- dynamic authenticated content served by API
          <img
            src={url}
            alt={file.name}
            className="max-w-full max-h-[calc(100dvh-110px)] rounded-lg shadow-xl object-contain"
          />
        )}
        {file.mimeType.startsWith("video/") && (
          <video
            src={url}
            controls
            autoPlay
            className="w-full max-w-4xl rounded-lg shadow-xl bg-black"
            style={{ maxHeight: "calc(100dvh - 110px)" }}
          />
        )}
        {!isViewable(file.mimeType) && (
          <div className="flex flex-col items-center justify-center gap-4 bg-white rounded-xl p-12 shadow-xl text-center mt-8">
            <FileArchive size={40} className="text-muted-foreground opacity-40" />
            <p className="text-sm font-medium">Visualização não disponível para este formato</p>
            <p className="text-xs text-muted-foreground mb-2">{file.name}</p>
            <a
              href={downloadUrl}
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
  const [uploadQueue, setUploadQueue] = useState(0);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LocalFile | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [previewFile, setPreviewFile] = useState<LocalFile | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);

  const sectionPath = category ? `${section}/${category}` : section;
  const uploading = uploadQueue > 0;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/drive?section=${encodeURIComponent(sectionPath)}`);
        if (!res.ok) throw new Error("Erro ao carregar arquivos");
        const data = await res.json();
        if (!cancelled) setFiles(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erro desconhecido");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [sectionPath]);

  const uploadOne = useCallback(async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("section", section);
    if (category) fd.append("category", category);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Falha no upload de "${file.name}"`);
    }
    const newFile: LocalFile = await res.json();
    setFiles((prev) => [newFile, ...prev]);
  }, [section, category]);

  async function uploadMany(list: FileList | File[]) {
    const items = Array.from(list);
    if (items.length === 0) return;
    setError("");
    setUploadQueue(items.length);
    const errors: string[] = [];
    for (const f of items) {
      try {
        await uploadOne(f);
      } catch (e) {
        errors.push(e instanceof Error ? e.message : `Erro em "${f.name}"`);
      } finally {
        setUploadQueue((q) => Math.max(0, q - 1));
      }
    }
    if (errors.length > 0) setError(errors.join(" · "));
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) uploadMany(e.target.files);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    if (uploading) return;
    if (e.dataTransfer.files) uploadMany(e.dataTransfer.files);
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

  function fileUrl(f: LocalFile, download = false) {
    return `/api/files?section=${encodeURIComponent(sectionPath)}&id=${f.id}&storedName=${encodeURIComponent(f.storedName)}${download ? "&download=1" : ""}`;
  }

  return (
    <>
      <div
        className={cn(
          "relative border border-gray-medium rounded-xl overflow-hidden bg-white",
          dragging && "ring-2 ring-black ring-offset-1"
        )}
        onDragEnter={(e) => { e.preventDefault(); dragDepth.current++; setDragging(true); }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={(e) => { e.preventDefault(); dragDepth.current--; if (dragDepth.current <= 0) setDragging(false); }}
        onDrop={handleDrop}
      >
        {/* Drag overlay */}
        {dragging && (
          <div className="absolute inset-0 z-10 bg-white/95 border-2 border-dashed border-black rounded-xl flex flex-col items-center justify-center gap-2 pointer-events-none">
            <Upload size={22} className="text-gray-dark" />
            <p className="text-sm font-medium text-foreground">Solte os arquivos aqui</p>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 bg-gray-light/50 border-b border-gray-medium">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex-1 truncate">
            {label ?? "Arquivos"}
          </span>
          {!loading && (
            <span className="text-xs text-muted-foreground shrink-0">
              {files.length} {files.length === 1 ? "arquivo" : "arquivos"}
            </span>
          )}
          <button
            onClick={() => !uploading && inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md border border-gray-medium bg-white hover:bg-gray-light transition-colors disabled:opacity-50 shrink-0 ml-1"
          >
            {uploading
              ? <Loader2 size={11} className="animate-spin" />
              : <Upload size={11} />}
            {uploading ? `Enviando (${uploadQueue})…` : "Adicionar"}
          </button>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            accept={ACCEPTED}
            onChange={handleInputChange}
            disabled={uploading}
          />
        </div>

        {/* File list */}
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
            <Loader2 size={15} className="animate-spin" />
            <span className="text-sm">Carregando…</span>
          </div>
        ) : files.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-muted-foreground">Nenhum arquivo ainda.</p>
            <p className="text-xs text-muted-foreground mt-1 opacity-70">
              Clique em &ldquo;Adicionar&rdquo; ou arraste arquivos aqui.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-medium">
            {files.map((f) => {
              const TypeIcon = fileTypeIcon(f.mimeType);
              const viewable = isViewable(f.mimeType);
              return (
                <div key={f.id} className="flex items-center gap-4 px-4 py-4 hover:bg-gray-light/40 transition-colors">
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-lg bg-gray-light border border-gray-medium flex items-center justify-center shrink-0">
                    <TypeIcon size={18} className="text-gray-dark" />
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <button
                      className="text-sm font-semibold text-foreground truncate block w-full text-left hover:underline underline-offset-2"
                      onClick={() => setPreviewFile(f)}
                      title="Visualizar"
                    >
                      {f.name}
                    </button>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(f.uploadedAt)} · {formatSize(f.size)}
                    </p>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {viewable && (
                      <button
                        onClick={() => setPreviewFile(f)}
                        className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-gray-light transition-colors"
                        title="Visualizar"
                      >
                        <Eye size={14} />
                      </button>
                    )}
                    <a
                      href={fileUrl(f, true)}
                      className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-gray-light transition-colors"
                      title="Download"
                    >
                      <Download size={14} />
                    </a>
                    <button
                      onClick={() => setDeleteTarget(f)}
                      className="p-2 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Remover"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {error && <p className="px-4 pb-3 text-xs text-red-500">{error}</p>}
      </div>

      {/* File viewer */}
      {previewFile && (
        <FileViewer
          file={previewFile}
          url={fileUrl(previewFile)}
          downloadUrl={fileUrl(previewFile, true)}
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
