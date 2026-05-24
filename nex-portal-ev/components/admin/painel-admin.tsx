'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, CheckCircle, AlertCircle, Clock, Users, ArrowRight } from 'lucide-react'
import type { ClienteComStatus } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

interface Props {
  clientes: ClienteComStatus[]
}

type FiltroStatus = 'todos' | 'completo' | 'pendente' | 'com_rejeicao'

const filtroLabels: Record<FiltroStatus, string> = {
  todos: 'Todos',
  completo: 'Completo',
  pendente: 'Pendente',
  com_rejeicao: 'Com rejeição',
}

export function PainelAdmin({ clientes }: Props) {
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<FiltroStatus>('todos')

  const filtrados = clientes
    .filter(c => c.ativo)
    .filter(c =>
      (busca === '' || c.nome.toLowerCase().includes(busca.toLowerCase()) || c.email.toLowerCase().includes(busca.toLowerCase()))
      && (filtro === 'todos' || c.status_geral === filtro)
    )

  const totalCompleto = clientes.filter(c => c.status_geral === 'completo').length
  const totalPendente = clientes.filter(c => c.status_geral === 'pendente').length
  const totalRejeicao = clientes.filter(c => c.status_geral === 'com_rejeicao').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading font-bold text-2xl text-nex-black">Painel</h1>
        <p className="text-gray-500 text-sm mt-1">{clientes.filter(c => c.ativo).length} clientes ativos</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <Users className="h-5 w-5 text-gray-400 mx-auto mb-1" />
          <p className="font-heading font-bold text-2xl">{clientes.filter(c => c.ativo).length}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
        <div className="bg-nex-yellow-light rounded-xl border border-nex-yellow p-4 text-center">
          <CheckCircle className="h-5 w-5 text-yellow-700 mx-auto mb-1" />
          <p className="font-heading font-bold text-2xl">{totalCompleto}</p>
          <p className="text-xs text-gray-600">Completo</p>
        </div>
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 text-center">
          <Clock className="h-5 w-5 text-blue-600 mx-auto mb-1" />
          <p className="font-heading font-bold text-2xl">{totalPendente}</p>
          <p className="text-xs text-gray-600">Pendente</p>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-200 p-4 text-center">
          <AlertCircle className="h-5 w-5 text-red-600 mx-auto mb-1" />
          <p className="font-heading font-bold text-2xl">{totalRejeicao}</p>
          <p className="text-xs text-gray-600">Com rejeição</p>
        </div>
      </div>

      {/* Filtros + Busca */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar cliente..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {(Object.keys(filtroLabels) as FiltroStatus[]).map(f => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filtro === f ? 'bg-nex-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filtroLabels[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de clientes */}
      <div className="space-y-2">
        {filtrados.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>Nenhum cliente encontrado</p>
          </div>
        ) : (
          filtrados.map(cliente => (
            <Link
              key={cliente.id}
              href={`/admin/clientes/${cliente.id}`}
              className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 hover:shadow-sm transition-all group"
            >
              <div className="w-10 h-10 bg-nex-yellow rounded-full flex items-center justify-center font-heading font-bold text-nex-black flex-shrink-0">
                {cliente.nome.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{cliente.nome}</p>
                <p className="text-xs text-gray-500 truncate">{cliente.email}</p>
                {cliente.unidade && (
                  <p className="text-xs text-gray-400">Unidade {cliente.unidade}</p>
                )}
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-gray-500">{cliente.documentos_aprovados}/{cliente.total_documentos} aprovados</p>
                  <div className="w-20 bg-gray-100 rounded-full h-1.5 mt-1">
                    <div
                      className="bg-nex-yellow h-1.5 rounded-full"
                      style={{ width: `${cliente.total_documentos > 0 ? (cliente.documentos_aprovados / cliente.total_documentos) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <StatusBadge status={cliente.status_geral} />
                <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-gray-600 transition-colors" />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: 'completo' | 'pendente' | 'com_rejeicao' }) {
  if (status === 'completo') return <Badge variant="aprovado">Completo</Badge>
  if (status === 'com_rejeicao') return <Badge variant="rejeitado">Rejeição</Badge>
  return <Badge variant="enviado">Pendente</Badge>
}
