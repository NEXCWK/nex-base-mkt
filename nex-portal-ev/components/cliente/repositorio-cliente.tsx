'use client'

import { useState } from 'react'
import { FileText, Download, FolderOpen } from 'lucide-react'
import type { DocumentoNex, DocumentoCategoria } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const categoriaLabels: Record<DocumentoCategoria, string> = {
  contrato: 'Contrato',
  fiscal: 'Fiscal',
  comunicado: 'Comunicado',
  outro: 'Outro',
}

const categorias: DocumentoCategoria[] = ['contrato', 'fiscal', 'comunicado', 'outro']

interface Props {
  documentos: DocumentoNex[]
}

export function RepositorioCliente({ documentos }: Props) {
  const [categoriaAtiva, setCategoriaAtiva] = useState<DocumentoCategoria | 'todos'>('todos')

  const filtrados = categoriaAtiva === 'todos'
    ? documentos
    : documentos.filter(d => d.categoria === categoriaAtiva)

  const handleDownload = async (doc: DocumentoNex) => {
    const res = await fetch(`/api/signed-url?path=${encodeURIComponent(doc.arquivo_url!)}`)
    const { url } = await res.json()
    const a = document.createElement('a')
    a.href = url
    a.download = doc.nome
    a.click()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading font-bold text-2xl text-nex-black">Meus Arquivos</h1>
        <p className="text-gray-500 text-sm mt-1">Documentos disponibilizados pelo Nex Coworking</p>
      </div>

      {/* Filtros por categoria */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCategoriaAtiva('todos')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            categoriaAtiva === 'todos' ? 'bg-nex-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Todos ({documentos.length})
        </button>
        {categorias.map(cat => {
          const count = documentos.filter(d => d.categoria === cat).length
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
      </div>

      {filtrados.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">Nenhum documento disponível</p>
          <p className="text-sm mt-1">O Nex irá disponibilizar documentos aqui quando necessário.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtrados.map(doc => (
            <div key={doc.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 hover:border-gray-300 transition-colors">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="h-5 w-5 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{doc.nome}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">{categoriaLabels[doc.categoria]}</Badge>
                  <span className="text-xs text-gray-400">{formatDate(doc.created_at)}</span>
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => handleDownload(doc)}>
                <Download className="h-3.5 w-3.5" />
                Baixar
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
