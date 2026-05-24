'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, XCircle, Upload, FileText, Eye, Plus, Loader2 } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import type { Profile, DocumentoExigido, DocumentoCliente, DocumentoNex, DocumentoCategoria } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { formatDate, statusLabels, ALLOWED_DOC_TYPES, MAX_DOC_SIZE } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface Props {
  cliente: Profile
  documentosExigidos: DocumentoExigido[]
  documentosCliente: DocumentoCliente[]
  documentosNex: DocumentoNex[]
}

const categoriaLabels: Record<DocumentoCategoria, string> = {
  contrato: 'Contrato', fiscal: 'Fiscal', comunicado: 'Comunicado', outro: 'Outro',
}

export function ClienteDetalhe({ cliente, documentosExigidos, documentosCliente, documentosNex }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [reviewDoc, setReviewDoc] = useState<DocumentoCliente | null>(null)
  const [observacao, setObservacao] = useState('')
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [viewUrl, setViewUrl] = useState<string | null>(null)
  const [addDocDialog, setAddDocDialog] = useState(false)
  const [newDocNome, setNewDocNome] = useState('')
  const [newDocCategoria, setNewDocCategoria] = useState<DocumentoCategoria>('contrato')
  const [newDocFile, setNewDocFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const docMap = new Map(documentosCliente.map(d => [d.documento_exigido_id, d]))

  const handleReview = async (docId: string, acao: 'aprovar' | 'rejeitar') => {
    if (acao === 'rejeitar' && !observacao.trim()) {
      toast({ title: 'Informe o motivo da rejeição', variant: 'destructive' })
      return
    }
    setLoadingAction(docId + acao)
    try {
      const res = await fetch('/api/admin/documentos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docId, acao, observacao }),
      })
      if (!res.ok) throw new Error()
      toast({ title: acao === 'aprovar' ? 'Documento aprovado' : 'Documento rejeitado', variant: 'success' })
      setReviewDoc(null)
      setObservacao('')
      router.refresh()
    } catch {
      toast({ title: 'Erro', description: 'Tente novamente.', variant: 'destructive' })
    } finally {
      setLoadingAction(null)
    }
  }

  const handleView = async (url: string) => {
    const res = await fetch(`/api/signed-url?path=${encodeURIComponent(url)}`)
    const { url: signedUrl } = await res.json()
    setViewUrl(signedUrl)
  }

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (files) => setNewDocFile(files[0] ?? null),
    accept: { 'application/pdf': [], 'image/jpeg': [], 'image/png': [] },
    maxFiles: 1,
  })

  const handleAddDoc = async () => {
    if (!newDocFile || !newDocNome.trim()) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' })
      return
    }
    setUploading(true)
    const formData = new FormData()
    formData.append('file', newDocFile)
    formData.append('clienteId', cliente.id)
    formData.append('nome', newDocNome)
    formData.append('categoria', newDocCategoria)
    try {
      const res = await fetch('/api/admin/documentos', { method: 'POST', body: formData })
      if (!res.ok) throw new Error()
      toast({ title: 'Documento adicionado', variant: 'success' })
      setAddDocDialog(false)
      setNewDocFile(null)
      setNewDocNome('')
      router.refresh()
    } catch {
      toast({ title: 'Erro ao enviar documento', variant: 'destructive' })
    } finally {
      setUploading(false)
    }
  }

  const aprovados = documentosCliente.filter(d => d.status === 'aprovado').length
  const total = documentosExigidos.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/painel" className="text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="font-heading font-bold text-2xl text-nex-black">{cliente.nome}</h1>
          <p className="text-gray-500 text-sm">{cliente.email} {cliente.unidade && `· Unidade ${cliente.unidade}`}</p>
        </div>
        <div className="ml-auto">
          <Badge variant={!cliente.ativo ? 'secondary' : aprovados >= total && total > 0 ? 'aprovado' : 'enviado'}>
            {!cliente.ativo ? 'Inativo' : aprovados >= total && total > 0 ? 'Completo' : 'Pendente'}
          </Badge>
        </div>
      </div>

      {/* Seção documentos exigidos */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-heading font-bold">Documentos Exigidos</h2>
          <span className="text-sm text-gray-500">{aprovados}/{total} aprovados</span>
        </div>
        <div className="divide-y divide-gray-100">
          {documentosExigidos.map(docEx => {
            const upload = docMap.get(docEx.id)
            const status = upload?.status ?? 'pendente'
            return (
              <div key={docEx.id} className="p-4 flex items-start gap-3">
                <div className="mt-0.5">
                  {status === 'aprovado' ? <CheckCircle className="h-4 w-4 text-yellow-600" /> :
                   status === 'rejeitado' ? <XCircle className="h-4 w-4 text-red-500" /> :
                   <div className="h-4 w-4 rounded-full border-2 border-gray-300" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{docEx.nome}</span>
                    {docEx.obrigatorio && <span className="text-xs text-red-400">*</span>}
                    <Badge variant={status as any} className="text-xs">{statusLabels[status]}</Badge>
                  </div>
                  {upload?.observacao && status === 'rejeitado' && (
                    <p className="text-xs text-red-600 mt-1">{upload.observacao}</p>
                  )}
                  {upload && (
                    <p className="text-xs text-gray-400 mt-0.5">Atualizado {formatDate(upload.updated_at)}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {upload?.arquivo_url && (
                    <Button variant="ghost" size="icon" onClick={() => handleView(upload.arquivo_url!)} title="Ver arquivo">
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  {upload && status === 'enviado' && (
                    <Button size="sm" onClick={() => { setReviewDoc(upload); setObservacao('') }}>
                      Revisar
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Seção documentos do Nex */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-heading font-bold">Documentos do Nex</h2>
          <Button size="sm" onClick={() => setAddDocDialog(true)}>
            <Plus className="h-3.5 w-3.5" /> Adicionar
          </Button>
        </div>
        {documentosNex.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            Nenhum documento enviado ao cliente ainda.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {documentosNex.map(doc => (
              <div key={doc.id} className="p-4 flex items-center gap-3">
                <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{doc.nome}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="secondary" className="text-xs">{categoriaLabels[doc.categoria]}</Badge>
                    <span className="text-xs text-gray-400">{formatDate(doc.created_at)}</span>
                  </div>
                </div>
                {doc.arquivo_url && (
                  <Button variant="ghost" size="icon" onClick={() => handleView(doc.arquivo_url!)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialog revisar documento */}
      <Dialog open={!!reviewDoc} onOpenChange={() => setReviewDoc(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revisar documento</DialogTitle>
            <DialogDescription>Aprovar ou rejeitar o documento enviado pelo cliente.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="obs">Observação (obrigatório para rejeitar)</Label>
            <textarea
              id="obs"
              className="input h-24 resize-none"
              placeholder="Ex: Documento ilegível, envie novamente com melhor qualidade."
              value={observacao}
              onChange={e => setObservacao(e.target.value)}
            />
          </div>
          <DialogFooter className="flex-row gap-2">
            <Button
              variant="destructive"
              onClick={() => reviewDoc && handleReview(reviewDoc.id, 'rejeitar')}
              disabled={!!loadingAction}
            >
              {loadingAction === reviewDoc?.id + 'rejeitar' && <Loader2 className="h-4 w-4 animate-spin" />}
              Rejeitar
            </Button>
            <Button
              onClick={() => reviewDoc && handleReview(reviewDoc.id, 'aprovar')}
              disabled={!!loadingAction}
            >
              {loadingAction === reviewDoc?.id + 'aprovar' && <Loader2 className="h-4 w-4 animate-spin" />}
              Aprovar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog adicionar documento Nex */}
      <Dialog open={addDocDialog} onOpenChange={setAddDocDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar documento para o cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome do documento</Label>
              <Input value={newDocNome} onChange={e => setNewDocNome(e.target.value)} placeholder="Ex: Contrato de Escritório Virtual" className="mt-1" />
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={newDocCategoria} onValueChange={v => setNewDocCategoria(v as DocumentoCategoria)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contrato">Contrato</SelectItem>
                  <SelectItem value="fiscal">Fiscal</SelectItem>
                  <SelectItem value="comunicado">Comunicado</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Arquivo</Label>
              <div {...getRootProps()} className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-nex-yellow transition-colors">
                <input {...getInputProps()} />
                {newDocFile ? (
                  <p className="text-sm font-medium text-green-600">{newDocFile.name}</p>
                ) : (
                  <div>
                    <Upload className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Arraste ou clique para selecionar</p>
                    <p className="text-xs text-gray-400 mt-1">PDF, JPG ou PNG — máx. 10MB</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setAddDocDialog(false)}>Cancelar</Button>
            <Button onClick={handleAddDoc} disabled={uploading}>
              {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal visualização */}
      <Dialog open={!!viewUrl} onOpenChange={() => setViewUrl(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Visualizar arquivo</DialogTitle></DialogHeader>
          {viewUrl && (
            viewUrl.includes('.pdf') || viewUrl.includes('pdf')
              ? <iframe src={viewUrl} className="w-full h-[60vh] rounded border" />
              // eslint-disable-next-line @next/next/no-img-element
              : <img src={viewUrl} alt="Arquivo" className="max-h-[60vh] mx-auto rounded" />
          )}
          <DialogFooter>
            <Button variant="secondary" onClick={() => setViewUrl(null)}>Fechar</Button>
            {viewUrl && <Button asChild><a href={viewUrl} target="_blank" rel="noopener noreferrer">Abrir</a></Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
