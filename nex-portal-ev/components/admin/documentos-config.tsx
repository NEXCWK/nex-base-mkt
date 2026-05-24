'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, GripVertical, Loader2, Eye, EyeOff } from 'lucide-react'
import type { DocumentoExigido } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

interface Props {
  documentos: DocumentoExigido[]
}

interface FormData {
  nome: string
  descricao: string
  obrigatorio: boolean
}

const emptyForm: FormData = { nome: '', descricao: '', obrigatorio: true }

export function DocumentosConfig({ documentos }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [dialog, setDialog] = useState<{ open: boolean; mode: 'criar' | 'editar'; doc?: DocumentoExigido }>({
    open: false, mode: 'criar',
  })
  const [form, setForm] = useState<FormData>(emptyForm)
  const [saving, setSaving] = useState(false)

  const openCreate = () => {
    setForm(emptyForm)
    setDialog({ open: true, mode: 'criar' })
  }

  const openEdit = (doc: DocumentoExigido) => {
    setForm({ nome: doc.nome, descricao: doc.descricao ?? '', obrigatorio: doc.obrigatorio })
    setDialog({ open: true, mode: 'editar', doc })
  }

  const handleSave = async () => {
    if (!form.nome.trim()) {
      toast({ title: 'Nome é obrigatório', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      if (dialog.mode === 'criar') {
        const res = await fetch('/api/admin/documentos-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, ordem: documentos.length + 1 }),
        })
        if (!res.ok) throw new Error()
        toast({ title: 'Documento criado', variant: 'success' })
      } else {
        const res = await fetch('/api/admin/documentos-config', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: dialog.doc!.id, ...form }),
        })
        if (!res.ok) throw new Error()
        toast({ title: 'Documento atualizado', variant: 'success' })
      }
      setDialog({ open: false, mode: 'criar' })
      router.refresh()
    } catch {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleToggleAtivo = async (doc: DocumentoExigido) => {
    await fetch('/api/admin/documentos-config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: doc.id, ativo: !doc.ativo }),
    })
    toast({ title: doc.ativo ? 'Documento desativado' : 'Documento ativado', variant: 'success' })
    router.refresh()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remover este documento da lista?')) return
    await fetch(`/api/admin/documentos-config?id=${id}`, { method: 'DELETE' })
    toast({ title: 'Documento removido', variant: 'success' })
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl text-nex-black">Documentos Exigidos</h1>
          <p className="text-gray-500 text-sm mt-1">Configure quais documentos são exigidos dos clientes</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Novo documento
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {documentos.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <p>Nenhum documento configurado ainda.</p>
          </div>
        ) : (
          documentos.map((doc, idx) => (
            <div key={doc.id} className={`p-4 flex items-center gap-3 ${!doc.ativo ? 'opacity-50' : ''}`}>
              <GripVertical className="h-4 w-4 text-gray-300 flex-shrink-0" />
              <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{doc.nome}</span>
                  {doc.obrigatorio ? (
                    <Badge variant="rejeitado" className="text-xs">Obrigatório</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">Opcional</Badge>
                  )}
                  {!doc.ativo && <Badge variant="secondary" className="text-xs">Inativo</Badge>}
                </div>
                {doc.descricao && <p className="text-xs text-gray-500 mt-0.5">{doc.descricao}</p>}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button variant="ghost" size="icon" onClick={() => handleToggleAtivo(doc)} title={doc.ativo ? 'Desativar' : 'Ativar'}>
                  {doc.ativo ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => openEdit(doc)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-600" onClick={() => handleDelete(doc.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={dialog.open} onOpenChange={o => setDialog(d => ({ ...d, open: o }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialog.mode === 'criar' ? 'Novo documento' : 'Editar documento'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input
                value={form.nome}
                onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                placeholder="Ex: RG ou CNH"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Descrição (opcional)</Label>
              <Input
                value={form.descricao}
                onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                placeholder="Ex: Documento de identidade com foto"
                className="mt-1"
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="obrigatorio"
                checked={form.obrigatorio}
                onChange={e => setForm(f => ({ ...f, obrigatorio: e.target.checked }))}
                className="accent-nex-yellow h-4 w-4"
              />
              <Label htmlFor="obrigatorio">Documento obrigatório</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDialog(d => ({ ...d, open: false }))}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
