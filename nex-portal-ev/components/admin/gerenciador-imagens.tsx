'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Upload, Loader2, ImageIcon, Trash2 } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import type { Imagem, ImagemCategoria, ImagemVisibilidade } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { formatDate } from '@/lib/utils'

const categoriaLabels: Record<ImagemCategoria, string> = {
  fachada: 'Fachada', espaco_interno: 'Espaço Interno', logo: 'Logo', outro: 'Outro',
}

interface Props {
  imagens: Imagem[]
  clientes: { id: string; nome: string }[]
}

export function GerenciadorImagens({ imagens, clientes }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [addDialog, setAddDialog] = useState(false)
  const [nome, setNome] = useState('')
  const [categoria, setCategoria] = useState<ImagemCategoria>('fachada')
  const [visibilidade, setVisibilidade] = useState<ImagemVisibilidade>('todos')
  const [clientesSelecionados, setClientesSelecionados] = useState<string[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [filtroCategoria, setFiltroCategoria] = useState<ImagemCategoria | 'todos'>('todos')
  const [urlsCache, setUrlsCache] = useState<Map<string, string>>(new Map())

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: files => setFile(files[0] ?? null),
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    maxFiles: 1,
  })

  const filtradas = filtroCategoria === 'todos' ? imagens : imagens.filter(i => i.categoria === filtroCategoria)

  const getUrl = async (img: Imagem) => {
    if (urlsCache.has(img.id)) return urlsCache.get(img.id)!
    const res = await fetch(`/api/signed-url?path=${encodeURIComponent(img.arquivo_url!)}`)
    const { url } = await res.json()
    setUrlsCache(prev => new Map(prev).set(img.id, url))
    return url
  }

  const handleUpload = async () => {
    if (!file || !nome.trim()) {
      toast({ title: 'Preencha nome e selecione uma imagem', variant: 'destructive' })
      return
    }
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('nome', nome)
    formData.append('categoria', categoria)
    formData.append('visibilidade', visibilidade)
    if (visibilidade === 'especifico') {
      formData.append('clientes', JSON.stringify(clientesSelecionados))
    }
    try {
      const res = await fetch('/api/admin/imagens', { method: 'POST', body: formData })
      if (!res.ok) throw new Error()
      toast({ title: 'Imagem adicionada', variant: 'success' })
      setAddDialog(false)
      setFile(null)
      setNome('')
      router.refresh()
    } catch {
      toast({ title: 'Erro ao fazer upload', variant: 'destructive' })
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remover esta imagem?')) return
    await fetch(`/api/admin/imagens?id=${id}`, { method: 'DELETE' })
    toast({ title: 'Imagem removida', variant: 'success' })
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl text-nex-black">Imagens</h1>
          <p className="text-gray-500 text-sm mt-1">{imagens.length} imagens no repositório</p>
        </div>
        <Button onClick={() => setAddDialog(true)}>
          <Plus className="h-4 w-4" /> Adicionar imagem
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {(['todos', 'fachada', 'espaco_interno', 'logo', 'outro'] as const).map(cat => (
          <button
            key={cat}
            onClick={() => setFiltroCategoria(cat)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filtroCategoria === cat ? 'bg-nex-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat === 'todos' ? `Todas (${imagens.length})` : `${categoriaLabels[cat]} (${imagens.filter(i => i.categoria === cat).length})`}
          </button>
        ))}
      </div>

      {filtradas.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Nenhuma imagem cadastrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtradas.map(img => (
            <AdminImageCard
              key={img.id}
              imagem={img}
              getUrl={() => getUrl(img)}
              onDelete={() => handleDelete(img.id)}
            />
          ))}
        </div>
      )}

      {/* Dialog adicionar imagem */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar imagem</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Fachada Principal" className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Categoria</Label>
                <Select value={categoria} onValueChange={v => setCategoria(v as ImagemCategoria)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fachada">Fachada</SelectItem>
                    <SelectItem value="espaco_interno">Espaço Interno</SelectItem>
                    <SelectItem value="logo">Logo</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Visibilidade</Label>
                <Select value={visibilidade} onValueChange={v => setVisibilidade(v as ImagemVisibilidade)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os clientes</SelectItem>
                    <SelectItem value="especifico">Clientes específicos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {visibilidade === 'especifico' && (
              <div>
                <Label>Clientes</Label>
                <div className="mt-1 max-h-32 overflow-y-auto border border-gray-200 rounded p-2 space-y-1">
                  {clientes.map(c => (
                    <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded">
                      <input
                        type="checkbox"
                        checked={clientesSelecionados.includes(c.id)}
                        onChange={() => setClientesSelecionados(prev =>
                          prev.includes(c.id) ? prev.filter(x => x !== c.id) : [...prev, c.id]
                        )}
                        className="accent-nex-yellow"
                      />
                      {c.nome}
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div>
              <Label>Arquivo</Label>
              <div {...getRootProps()} className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-nex-yellow transition-colors">
                <input {...getInputProps()} />
                {file ? (
                  <p className="text-sm font-medium text-green-600">{file.name}</p>
                ) : (
                  <div>
                    <Upload className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">JPG, PNG ou WEBP — máx. 20MB</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setAddDialog(false)}>Cancelar</Button>
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AdminImageCard({ imagem, getUrl, onDelete }: { imagem: Imagem; getUrl: () => Promise<string>; onDelete: () => void }) {
  const [url, setUrl] = useState<string | null>(null)

  return (
    <div
      className="group relative rounded-xl border border-gray-200 overflow-hidden"
      onMouseEnter={async () => { if (!url) setUrl(await getUrl()) }}
    >
      <div className="aspect-square bg-gray-100">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={imagem.nome} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="h-8 w-8 text-gray-300" />
          </div>
        )}
      </div>
      <div className="p-2">
        <p className="text-xs font-medium truncate">{imagem.nome}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <Badge variant="secondary" className="text-xs px-1.5 py-0">{categoriaLabels[imagem.categoria]}</Badge>
          {imagem.visibilidade === 'especifico' && <Badge variant="secondary" className="text-xs px-1.5 py-0">Específico</Badge>}
        </div>
      </div>
      <button
        onClick={onDelete}
        className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
