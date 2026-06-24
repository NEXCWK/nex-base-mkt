"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Upload, File, Download, Trash2, Loader2, Eye, X,
  FileText, Image as ImageIcon, Film, FileArchive,
  FileSpreadsheet, Presentation, Sparkles, ChevronUp,
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

function isViewable(mimeType: string) {
  return (
    mimeType === "application/pdf" ||
    mimeType.startsWith("image/") ||
    mimeType.startsWith("video/")
  );
}

// ─── Type metadata ───────────────────────────────────────────────────────────

const TYPE_META: Record<string, { icon: React.ElementType; bg: string; color: string; label: string }> = {
  "application/pdf": { icon: FileText, bg: "#FEE2E2", color: "#DC2626", label: "PDF" },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    icon: FileText, bg: "#DBEAFE", color: "#1D4ED8", label: "DOCX",
  },
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": {
    icon: Presentation, bg: "#FFEDD5", color: "#C2410C", label: "PPTX",
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
    icon: FileSpreadsheet, bg: "#DCFCE7", color: "#15803D", label: "XLSX",
  },
};

function getTypeMeta(mimeType: string) {
  if (TYPE_META[mimeType]) return TYPE_META[mimeType];
  if (mimeType.startsWith("image/")) return { icon: ImageIcon, bg: "#F3F4F6", color: "#6B7280", label: "IMG" };
  if (mimeType.startsWith("video/")) return { icon: Film, bg: "#1C1917", color: "#FFFFFF", label: "MP4" };
  return { icon: FileArchive, bg: "#F3F4F6", color: "#6B7280", label: "FILE" };
}

// ─── Thumbnail ────────────────────────────────────────────────────────────────

function ImageThumbnail({ url, name }: { url: string; name: string }) {
  const [error, setError] = useState(false);
  if (error) return <PlaceholderThumbnail mimeType="image/" />;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- dynamic authenticated file served by API
    <img
      src={url}
      alt={name}
      loading="lazy"
      onError={() => setError(true)}
      className="w-full h-full object-cover"
    />
  );
}

function VideoThumbnail({ url }: { url: string }) {
  const [thumbDataUrl, setThumbDataUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    video.src = url;
    video.muted = true;
    video.preload = "metadata";

    const capture = () => {
      if (cancelled) return;
      canvas.width = video.videoWidth || 320;
      canvas.height = video.videoHeight || 180;
      canvas.getContext("2d")?.drawImage(video, 0, 0);
      try {
        setThumbDataUrl(canvas.toDataURL("image/jpeg", 0.7));
      } catch {
        setFailed(true);
      }
    };

    video.addEventListener("loadedmetadata", () => { video.currentTime = 1; });
    video.addEventListener("seeked", capture);
    video.addEventListener("error", () => { if (!cancelled) setFailed(true); });
    video.load();

    return () => { cancelled = true; video.src = ""; };
  }, [url]);

  if (failed) return <PlaceholderThumbnail mimeType="video/" />;
  if (!thumbDataUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-neutral-900">
        <Loader2 size={18} className="animate-spin text-white opacity-40" />
      </div>
    );
  }
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={thumbDataUrl} alt="" className="w-full h-full object-cover" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
          <Film size={14} className="text-white" />
        </div>
      </div>
    </>
  );
}

function PlaceholderThumbnail({ mimeType }: { mimeType: string }) {
  const meta = getTypeMeta(mimeType);
  const Icon = meta.icon;
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2" style={{ backgroundColor: meta.bg }}>
      <Icon size={28} style={{ color: meta.color }} />
      <span className="text-[10px] font-bold tracking-widest" style={{ color: meta.color }}>
        {meta.label}
      </span>
    </div>
  );
}

function FileThumbnail({ file, url }: { file: LocalFile; url: string }) {
  if (file.mimeType.startsWith("image/")) return <ImageThumbnail url={url} name={file.name} />;
  if (file.mimeType.startsWith("video/")) return <VideoThumbnail url={url} />;
  return <PlaceholderThumbnail mimeType={file.mimeType} />;
}

// ─── In-app file viewer ──────────────────────────────────────────────────────

function FileViewer({
  file, url, downloadUrl, onClose,
}: {
  file: LocalFile; url: string; downloadUrl: string; onClose: () => void;
}) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/60 backdrop-blur-sm animate-overlay-in">
      <div className="flex items-center justify-between px-4 sm:px-5 py-3 bg-white border-b border-gray-medium shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <File size={16} className="shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">{formatDate(file.uploadedAt)} · {formatSize(file.size)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-4">
          <a href={downloadUrl} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-gray-medium hover:bg-gray-light transition-colors">
            <Download size={13} /> Download
          </a>
          <button onClick={onClose} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-gray-light transition-colors" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto flex items-start justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        {file.mimeType === "application/pdf" && (
          <iframe src={url} className="w-full max-w-4xl rounded-lg shadow-xl bg-white" style={{ minHeight: "calc(100dvh - 110px)" }} title={file.name} />
        )}
        {file.mimeType.startsWith("image/") && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={file.name} className="max-w-full max-h-[calc(100dvh-110px)] rounded-lg shadow-xl object-contain" />
        )}
        {file.mimeType.startsWith("video/") && (
          <video src={url} controls autoPlay className="w-full max-w-4xl rounded-lg shadow-xl bg-black" style={{ maxHeight: "calc(100dvh - 110px)" }} />
        )}
        {!isViewable(file.mimeType) && (
          <div className="flex flex-col items-center justify-center gap-4 bg-white rounded-xl p-12 shadow-xl text-center mt-8">
            <FileArchive size={40} className="text-muted-foreground opacity-40" />
            <p className="text-sm font-medium">Visualização não disponível para este formato</p>
            <p className="text-xs text-muted-foreground mb-2">{file.name}</p>
            <a href={downloadUrl} className="flex items-center gap-2 px-4 py-2 rounded-md bg-black text-white text-sm font-medium hover:bg-gray-dark transition-colors">
              <Download size={14} /> Fazer download
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PDF summary ───────────────────────────────────────────────────────────────

interface PdfSummary {
  title: string;
  tagline: string;
  highlights: { emoji?: string; text: string }[];
  sections: { heading: string; points: string[] }[];
  generatedAt: string;
}

// Module-level cache so toggling a summary open/closed never refetches,
// and never re-triggers generation. The server is the source of truth.
const summaryMemo = new Map<string, PdfSummary>();

function SummaryPanel({
  sectionPath,
  file,
  collapsible,
  onCollapse,
}: {
  sectionPath: string;
  file: LocalFile;
  collapsible?: boolean;
  onCollapse?: () => void;
}) {
  const cacheKey = `${sectionPath}::${file.id}`;
  const [summary, setSummary] = useState<PdfSummary | null>(summaryMemo.get(cacheKey) ?? null);
  const [loading, setLoading] = useState(!summaryMemo.has(cacheKey));
  const [error, setError] = useState("");

  useEffect(() => {
    if (summaryMemo.has(cacheKey)) {
      setSummary(summaryMemo.get(cacheKey)!);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/pdf-summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ section: sectionPath, id: file.id, storedName: file.storedName }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (data.error === "no_api_key") throw new Error("Resumo automático ainda não configurado.");
          if (data.error === "no_text") throw new Error(data.message || "Não foi possível ler o texto deste PDF.");
          throw new Error(data.message || "Não foi possível gerar o resumo.");
        }
        if (!cancelled && data.summary) {
          summaryMemo.set(cacheKey, data.summary);
          setSummary(data.summary);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erro ao gerar resumo.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [cacheKey, sectionPath, file.id, file.storedName]);

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
      {/* Thin amber accent at top */}
      <div className="h-0.5 bg-gradient-to-r from-amber-400 via-amber-300 to-transparent" />

      {/* Header */}
      <div className="bg-white px-5 pt-4 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={12} className="text-amber-500" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Resumo do Documento
            </span>
          </div>
          {collapsible && (
            <button
              onClick={onCollapse}
              className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              title="Ocultar resumo"
            >
              <ChevronUp size={16} />
            </button>
          )}
        </div>

        {summary ? (
          <>
            <h3 className="text-lg font-bold text-gray-900 leading-tight">{summary.title}</h3>
            {summary.tagline && (
              <p className="mt-1 text-sm text-gray-500 italic leading-snug">{summary.tagline}</p>
            )}
          </>
        ) : loading ? (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 size={14} className="animate-spin" />
            <span className="text-sm">Lendo o PDF e preparando o resumo…</span>
          </div>
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : null}
      </div>

      {/* Body */}
      {summary && (
        <div className="bg-white px-5 py-4 space-y-4">
          {summary.highlights.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {summary.highlights.map((h, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700"
                >
                  <Sparkles size={10} className="text-amber-400 shrink-0" />
                  {h.text}
                </span>
              ))}
            </div>
          )}

          {summary.highlights.length > 0 && summary.sections.length > 0 && (
            <hr className="border-gray-100" />
          )}

          {summary.sections.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {summary.sections.map((s, i) => (
                <div key={i} className="pl-3 border-l-2 border-gray-200">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                    {s.heading}
                  </p>
                  <ul className="space-y-1.5">
                    {s.points.map((p, j) => (
                      <li key={j} className="flex gap-2 text-sm text-gray-600 leading-snug">
                        <span className="mt-2 w-1 h-1 rounded-full bg-gray-300 shrink-0" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          <p className="text-[10px] text-gray-400">
            Resumo gerado automaticamente a partir do PDF · baixe o arquivo para ver o conteúdo completo.
          </p>
        </div>
      )}
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
  const [openSummaryId, setOpenSummaryId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);

  const sectionPath = category ? `${section}/${category}` : section;
  const uploading = uploadQueue > 0;

  const pdfs = files.filter((f) => f.mimeType === "application/pdf");
  const multiPdf = pdfs.length > 1;
  const pdfSignature = pdfs.map((p) => p.id).join(",");

  // Auto-show the summary when there is exactly one PDF; otherwise require a click.
  useEffect(() => {
    if (pdfs.length === 1) setOpenSummaryId(pdfs[0].id);
    else setOpenSummaryId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfSignature]);

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
      try { await uploadOne(f); }
      catch (e) { errors.push(e instanceof Error ? e.message : `Erro em "${f.name}"`); }
      finally { setUploadQueue((q) => Math.max(0, q - 1)); }
    }
    if (errors.length > 0) setError(errors.join(" · "));
    if (inputRef.current) inputRef.current.value = "";
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
            {uploading ? <Loader2 size={11} className="animate-spin" /> : <Upload size={11} />}
            {uploading ? `Enviando (${uploadQueue})…` : "Adicionar"}
          </button>
          <input ref={inputRef} type="file" multiple className="hidden" accept={ACCEPTED} onChange={(e) => { if (e.target.files) uploadMany(e.target.files); }} disabled={uploading} />
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
            <Loader2 size={15} className="animate-spin" />
            <span className="text-sm">Carregando…</span>
          </div>
        ) : files.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">Nenhum arquivo ainda.</p>
            <p className="text-xs text-muted-foreground mt-1 opacity-70">
              Clique em &ldquo;Adicionar&rdquo; ou arraste arquivos aqui.
            </p>
          </div>
        ) : (
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {files.map((f) => {
              const viewable = isViewable(f.mimeType);
              return (
                <div
                  key={f.id}
                  className="group border border-gray-medium rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow"
                >
                  {/* Thumbnail */}
                  <div
                    className="relative h-28 overflow-hidden cursor-pointer"
                    onClick={() => viewable && setPreviewFile(f)}
                    title={viewable ? "Visualizar" : f.name}
                  >
                    <FileThumbnail file={f} url={fileUrl(f)} />
                    {viewable && (
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <Eye size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="px-2.5 py-2">
                    <p
                      className="text-xs font-semibold text-foreground truncate leading-snug cursor-pointer hover:underline underline-offset-2"
                      title={f.name}
                      onClick={() => viewable && setPreviewFile(f)}
                    >
                      {f.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">
                      {formatSize(f.size)} · {formatDate(f.uploadedAt)}
                    </p>
                    {/* Actions */}
                    <div className="flex items-center gap-0.5 mt-1.5 -ml-1">
                      {f.mimeType === "application/pdf" && multiPdf && (
                        <button
                          onClick={() => setOpenSummaryId((cur) => (cur === f.id ? null : f.id))}
                          className={cn(
                            "flex items-center gap-1 px-1.5 py-1 rounded text-[11px] font-semibold transition-colors",
                            openSummaryId === f.id
                              ? "bg-accent text-black"
                              : "text-amber-700 hover:bg-amber-50"
                          )}
                          title="Ver resumo do PDF"
                        >
                          <Sparkles size={11} />
                          {openSummaryId === f.id ? "Ocultar" : "Ver resumo"}
                        </button>
                      )}
                      {viewable && (
                        <button
                          onClick={() => setPreviewFile(f)}
                          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-gray-light transition-colors"
                          title="Visualizar"
                        >
                          <Eye size={12} />
                        </button>
                      )}
                      <a
                        href={fileUrl(f, true)}
                        className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-gray-light transition-colors"
                        title="Download"
                      >
                        <Download size={12} />
                      </a>
                      <button
                        onClick={() => setDeleteTarget(f)}
                        className="p-1 rounded text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Remover"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* PDF summary (auto for single PDF, on-demand for multiple) */}
        {openSummaryId && pdfs.some((p) => p.id === openSummaryId) && (
          <div className="px-4 pb-4">
            <SummaryPanel
              key={openSummaryId}
              sectionPath={sectionPath}
              file={pdfs.find((p) => p.id === openSummaryId)!}
              collapsible={multiPdf}
              onCollapse={() => setOpenSummaryId(null)}
            />
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
          <Button size="sm" onClick={handleDelete} disabled={deleting} className="bg-red-500 text-white hover:bg-red-600">
            {deleting && <Loader2 size={13} className="animate-spin" />}
            Remover
          </Button>
        </div>
      </Modal>
    </>
  );
}
