'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, CheckCircle, XCircle, Clock, AlertCircle, FileText, Eye, RefreshCw, Loader2, X } from 'lucide-react'
import type { DocumentoExigido, DocumentoCliente, DocumentoStatus } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { formatBytes, formatDate, statusLabels, ALLOWED_DOC_TYPES, MAX_DOC_SIZE } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

interface Props {
  clienteId: string
  documentosExigidos: DocumentoExigido[]
  documentosCliente: DocumentoCliente[]
}

export function DocumentosCliente({ clienteId, documentosExigidos, documentosCliente }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [uploading, setUploading] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [viewDoc, setViewDoc] = useState<{ docId: string; url: string; nome: string } | null>(null)
  const [rejectDetail, setRejectDetail] = useState<DocumentoCliente | null>(null)

  const docMap = new Map(documentosCliente.map(d => [d.documento_exigido_id, d]))

  const handleUpload = async (docExigidoId: string, file: File) => {
    if (!ALLOWED_DOC_TYPES.includes(file.type)) {
      toast({ title: 'Tipo inválido', description: 'Envie PDF, JPG ou PNG.', variant: 'destructive' })
      return
    }
    if (file.size > MAX_DOC_SIZE) {
      toast({ title: 'Arquivo muito grande', description: 'Máximo 10MB por documento.', variant: 'destructive' })
      return
    }

    setUploading(docExigidoId)
    setProgress(0)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('clienteId', clienteId)
    formData.append('documentoExigidoId', docExigidoId)

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Falha no upload')
      toast({ title: 'Documento enviado!', description: 'Aguardando revisão do Nex.', variant: 'success' })
      router.refresh()
    } catch {
      toast({ title: 'Erro ao enviar', description: 'Tente novamente.', variant: 'destructive' })
    } finally {
      setUploading(null)
      setProgress(0)
    }
  }

  const handleView = async (doc: DocumentoCliente) => {
    const res = await fetch(`/api/signed-url?path=${encodeURIComponent(doc.arquivo_url!)}`)
    const { url } = await res.json()
    setViewDoc({ docId: doc.id, url, nome: doc.arquivo_url?.split('/').pop() ?? 'Arquivo' })
  }

  const aprovados = documentosCliente.filter(d => d.status === 'aprovado').length
  const total = documentosExigidos.length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading font-bold text-2xl text-nex-black">Documentos</h1>
        <p className="text-gray-500 text-sm mt-1">
          {aprovados}/{total} documentos aprovados
        </p>
      </div>

      {/* Barra de progresso */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Progresso</span>
          <span className="text-sm text-gray-500">{total > 0 ? Math.round((aprovados / total) * 100) : 0}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-nex-yellow h-2 rounded-full transition-all"
            style={{ width: `${total > 0 ? (aprovados / total) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Lista de documentos */}
      <div className="space-y-3">
        {documentosExigidos.map(docExigido => {
          const upload = docMap.get(docExigido.id)
          return (
            <DocumentoItem
              key={docExigido.id}
              docExigido={docExigido}
              upload={upload}
              isUploading={uploading === docExigido.id}
              onUpload={(file) => handleUpload(docExigido.id, file)}
              onView={() => upload && handleView(upload)}
              onShowReject={() => upload && setRejectDetail(upload)}
            />
          )
        })}
      </div>

      {/* Modal visualização */}
      <Dialog open={!!viewDoc} onOpenChange={() => setViewDoc(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{viewDoc?.nome}</DialogTitle>
          </DialogHeader>
          {viewDoc && (
            <div className="mt-2">
              {viewDoc.url.includes('.pdf') ? (
                <iframe src={viewDoc.url} className="w-full h-[60vh] rounded border" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={viewDoc.url} alt="Documento" className="max-h-[60vh] mx-auto rounded" />
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="secondary" onClick={() => setViewDoc(null)}>Fechar</Button>
            {viewDoc && (
              <Button asChild>
                <a href={viewDoc.url} target="_blank" rel="noopener noreferrer">Abrir em nova aba</a>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal rejeição */}
      <Dialog open={!!rejectDetail} onOpenChange={() => setRejectDetail(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Motivo da rejeição</DialogTitle>
            <DialogDescription>
              {rejectDetail?.observacao ?? 'Nenhum motivo informado.'}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-gray-500">Faça o reenvio do documento corrigido clicando em &quot;Reenviar&quot;.</p>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setRejectDetail(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DocumentoItem({
  docExigido, upload, isUploading, onUpload, onView, onShowReject
}: {
  docExigido: DocumentoExigido
  upload?: DocumentoCliente
  isUploading: boolean
  onUpload: (file: File) => void
  onView: () => void
  onShowReject: () => void
}) {
  const status: DocumentoStatus = upload?.status ?? 'pendente'

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => files[0] && onUpload(files[0]),
    accept: { 'application/pdf': [], 'image/jpeg': [], 'image/png': [] },
    maxFiles: 1,
    disabled: isUploading || status === 'aprovado',
  })

  const statusIcon = {
    pendente: <Clock className="h-4 w-4 text-gray-400" />,
    enviado: <Clock className="h-4 w-4 text-blue-500" />,
    aprovado: <CheckCircle className="h-4 w-4 text-yellow-600" />,
    rejeitado: <XCircle className="h-4 w-4 text-red-500" />,
  }[status]

  return (
    <div className={`bg-white rounded-xl border p-4 transition-all ${
      status === 'aprovado' ? 'border-nex-yellow' :
      status === 'rejeitado' ? 'border-red-200' :
      status === 'enviado' ? 'border-blue-200' :
      'border-gray-200'
    }`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{statusIcon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{docExigido.nome}</span>
            {docExigido.obrigatorio && (
              <span className="text-xs text-red-500">*obrigatório</span>
            )}
            <Badge variant={status as any}>{statusLabels[status]}</Badge>
          </div>
          {docExigido.descricao && (
            <p className="text-xs text-gray-500 mt-1">{docExigido.descricao}</p>
          )}
          {upload && (
            <p className="text-xs text-gray-400 mt-1">
              Enviado {formatDate(upload.updated_at)}
            </p>
          )}
          {status === 'rejeitado' && upload?.observacao && (
            <button onClick={onShowReject} className="text-xs text-red-600 underline mt-1">
              Ver motivo da rejeição
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {upload && status !== 'pendente' && (
            <Button variant="ghost" size="icon" onClick={onView} title="Visualizar">
              <Eye className="h-4 w-4" />
            </Button>
          )}
          {(status === 'rejeitado' || status === 'pendente') && (
            <div {...getRootProps()}>
              <input {...getInputProps()} />
              <Button size="sm" variant={status === 'rejeitado' ? 'outline' : 'default'} disabled={isUploading}>
                {isUploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : status === 'rejeitado' ? (
                  <><RefreshCw className="h-3.5 w-3.5" /> Reenviar</>
                ) : (
                  <><Upload className="h-3.5 w-3.5" /> Enviar</>
                )}
              </Button>
            </div>
          )}
          {status === 'enviado' && (
            <div {...getRootProps()}>
              <input {...getInputProps()} />
              <Button size="sm" variant="secondary" disabled={isUploading}>
                {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><RefreshCw className="h-3.5 w-3.5" /> Substituir</>}
              </Button>
            </div>
          )}
        </div>
      </div>
      {isDragActive && (
        <div className="mt-3 border-2 border-dashed border-nex-yellow bg-nex-yellow-light rounded-lg p-3 text-center text-sm font-medium text-nex-black">
          Solte aqui para enviar
        </div>
      )}
    </div>
  )
}
