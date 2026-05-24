'use client'

import { useState } from 'react'
import { Download, ImageIcon, CheckSquare, Square, Package } from 'lucide-react'
import type { Imagem, ImagemCategoria } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

const categoriaLabels: Record<ImagemCategoria, string> = {
  fachada: 'Fachada',
  espaco_interno: 'Espaço Interno',
  logo: 'Logo',
  outro: 'Outro',
}

const categorias: ImagemCategoria[] = ['fachada', 'espaco_interno', 'logo', 'outro']

interface Props {
  imagens: Imagem[]
}

export function GaleriaCliente({ imagens }: Props) {
  const { toast } = useToast()
  const [categoriaAtiva, setCategoriaAtiva] = useState<ImagemCategoria | 'todos'>('todos')
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set())
  const [baixandoZip, setBaixandoZip] = useState(false)
  const [urlsCache, setUrlsCache] = useState<Map<string, string>>(new Map())

  const filtradas = categoriaAtiva === 'todos'
    ? imagens
    : imagens.filter(img => img.categoria === categoriaAtiva)

  const toggleSelecionada = (id: string) => {
    setSelecionadas(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selecionarTodas = () => {
    if (selecionadas.size === filtradas.length) {
      setSelecionadas(new Set())
    } else {
      setSelecionadas(new Set(filtradas.map(i => i.id)))
    }
  }

  const getSignedUrl = async (img: Imagem): Promise<string> => {
    if (urlsCache.has(img.id)) return urlsCache.get(img.id)!
    const res = await fetch(`/api/signed-url?path=${encodeURIComponent(img.arquivo_url!)}`)
    const { url } = await res.json()
    setUrlsCache(prev => new Map(prev).set(img.id, url))
    return url
  }

  const handleDownloadSingle = async (img: Imagem) => {
    const url = await getSignedUrl(img)
    const a = document.createElement('a')
    a.href = url
    a.download = img.nome
    a.click()
  }

  const handleDownloadZip = async () => {
    const ids = Array.from(selecionadas)
    if (ids.length === 0) {
      toast({ title: 'Selecione imagens primeiro', variant: 'destructive' })
      return
    }
    setBaixandoZip(true)
    try {
      const res = await fetch('/api/zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'nex-imagens.zip'
      a.click()
      URL.revokeObjectURL(url)
      toast({ title: `${ids.length} imagens baixadas`, variant: 'success' })
    } catch {
      toast({ title: 'Erro ao baixar', description: 'Tente novamente.', variant: 'destructive' })
    } finally {
      setBaixandoZip(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading font-bold text-2xl text-nex-black">Imagens</h1>
          <p className="text-gray-500 text-sm mt-1">Material institucional do Nex Coworking</p>
        </div>
        {selecionadas.size > 0 && (
          <Button onClick={handleDownloadZip} disabled={baixandoZip}>
            {baixandoZip ? (
              <span className="flex items-center gap-2"><Package className="h-4 w-4 animate-bounce" /> Preparando...</span>
            ) : (
              <><Package className="h-4 w-4" /> Baixar {selecionadas.size} selecionada(s)</>
            )}
          </Button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={() => setCategoriaAtiva('todos')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            categoriaAtiva === 'todos' ? 'bg-nex-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Todas ({imagens.length})
        </button>
        {categorias.map(cat => {
          const count = imagens.filter(i => i.categoria === cat).length
          if (count === 0) return null
          return (
            <button
              key={cat}
              onClick={() => setCategoriaAtiva(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                categoriaAtiva === cat ? 'bg-nex-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {categoriaLabels[cat]} ({count})
            </button>
          )
        })}
        {filtradas.length > 0 && (
          <button
            onClick={selecionarTodas}
            className="ml-auto flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
          >
            {selecionadas.size === filtradas.length
              ? <><CheckSquare className="h-4 w-4" /> Desmarcar todas</>
              : <><Square className="h-4 w-4" /> Selecionar todas</>}
          </button>
        )}
      </div>

      {filtradas.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">Nenhuma imagem disponível</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filtradas.map(img => (
            <ImagemCard
              key={img.id}
              imagem={img}
              selecionada={selecionadas.has(img.id)}
              onToggle={() => toggleSelecionada(img.id)}
              onDownload={() => handleDownloadSingle(img)}
              getUrl={() => getSignedUrl(img)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ImagemCard({
  imagem, selecionada, onToggle, onDownload, getUrl
}: {
  imagem: Imagem
  selecionada: boolean
  onToggle: () => void
  onDownload: () => void
  getUrl: () => Promise<string>
}) {
  const [url, setUrl] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  const loadUrl = async () => {
    if (!url) {
      const u = await getUrl()
      setUrl(u)
    }
  }

  return (
    <div
      className={`group relative rounded-xl border-2 overflow-hidden cursor-pointer transition-all ${
        selecionada ? 'border-nex-yellow shadow-md' : 'border-transparent hover:border-gray-300'
      }`}
      onClick={onToggle}
      onMouseEnter={loadUrl}
    >
      <div className="aspect-square bg-gray-100 relative">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={imagem.nome}
            className={`w-full h-full object-cover transition-opacity ${loaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setLoaded(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="h-8 w-8 text-gray-300" />
          </div>
        )}
        {selecionada && (
          <div className="absolute inset-0 bg-nex-yellow/20 flex items-center justify-center">
            <CheckSquare className="h-8 w-8 text-nex-black" />
          </div>
        )}
      </div>
      <div className="p-2">
        <p className="text-xs font-medium truncate">{imagem.nome}</p>
        <p className="text-xs text-gray-400">{
          { fachada: 'Fachada', espaco_interno: 'Espaço Interno', logo: 'Logo', outro: 'Outro' }[imagem.categoria]
        }</p>
      </div>
      <button
        onClick={e => { e.stopPropagation(); onDownload() }}
        className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100"
      >
        <Download className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
