'use client'

import Link from 'next/link'
import { CheckCircle, Clock, AlertCircle, Upload, FileText, Image, ArrowRight } from 'lucide-react'
import type { Profile, DocumentoCliente, DocumentoExigido } from '@/lib/types'
import { Badge } from '@/components/ui/badge'

interface Props {
  profile: Profile
  stats: { total: number; aprovados: number; rejeitados: number; enviados: number; pendentes: number }
  documentosCliente: DocumentoCliente[]
  documentosExigidos: DocumentoExigido[]
}

export function DashboardCliente({ profile, stats, documentosCliente, documentosExigidos }: Props) {
  const statusGeral = stats.total > 0 && stats.aprovados === stats.total
    ? 'completo'
    : stats.rejeitados > 0
    ? 'rejeicao'
    : 'pendente'

  const docMap = new Map(documentosCliente.map(d => [d.documento_exigido_id, d]))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading font-bold text-2xl text-nex-black">
          Olá, {profile.nome.split(' ')[0]}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {profile.unidade ? `Unidade ${profile.unidade}` : 'Escritório Virtual'}
        </p>
      </div>

      {/* Status geral */}
      <div className={`rounded-xl border-2 p-5 flex items-start gap-4 ${
        statusGeral === 'completo'
          ? 'border-nex-yellow bg-nex-yellow-light'
          : statusGeral === 'rejeicao'
          ? 'border-red-200 bg-red-50'
          : 'border-gray-200 bg-white'
      }`}>
        {statusGeral === 'completo' ? (
          <CheckCircle className="h-6 w-6 text-yellow-700 flex-shrink-0 mt-0.5" />
        ) : statusGeral === 'rejeicao' ? (
          <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
        ) : (
          <Clock className="h-6 w-6 text-gray-500 flex-shrink-0 mt-0.5" />
        )}
        <div>
          <p className="font-semibold text-sm">
            {statusGeral === 'completo'
              ? 'Documentação completa!'
              : statusGeral === 'rejeicao'
              ? 'Há documentos para corrigir'
              : 'Documentação em andamento'}
          </p>
          <p className="text-sm text-gray-600 mt-0.5">
            {statusGeral === 'completo'
              ? 'Todos os documentos obrigatórios foram aprovados.'
              : statusGeral === 'rejeicao'
              ? `${stats.rejeitados} documento(s) foram rejeitados. Acesse a aba de documentos para reenviar.`
              : `${stats.pendentes + stats.enviados} documento(s) ainda precisam de atenção.`}
          </p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total" value={stats.total} color="gray" />
        <StatCard label="Aprovados" value={stats.aprovados} color="yellow" />
        <StatCard label="Pendentes" value={stats.pendentes + stats.enviados} color="blue" />
        <StatCard label="Rejeitados" value={stats.rejeitados} color="red" />
      </div>

      {/* Ações rápidas */}
      <div className="grid sm:grid-cols-3 gap-4">
        <QuickLink
          href="/documentos"
          icon={<Upload className="h-5 w-5" />}
          title="Enviar Documentos"
          desc="Faça upload dos documentos solicitados"
          highlight={stats.pendentes > 0 || stats.rejeitados > 0}
        />
        <QuickLink
          href="/repositorio"
          icon={<FileText className="h-5 w-5" />}
          title="Meus Arquivos"
          desc="Documentos disponibilizados pelo Nex"
        />
        <QuickLink
          href="/imagens"
          icon={<Image className="h-5 w-5" />}
          title="Imagens"
          desc="Material institucional do Nex Coworking"
        />
      </div>

      {/* Documentos recentes com rejeição */}
      {stats.rejeitados > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading font-bold text-base">Documentos para corrigir</h2>
            <Link href="/documentos" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1">
              Ver todos <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="space-y-2">
            {documentosExigidos
              .filter(d => docMap.get(d.id)?.status === 'rejeitado')
              .map(doc => {
                const upload = docMap.get(doc.id)
                return (
                  <div key={doc.id} className="bg-white rounded-lg border border-red-200 p-4 flex items-start gap-3">
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{doc.nome}</p>
                      {upload?.observacao && (
                        <p className="text-xs text-red-600 mt-0.5">{upload.observacao}</p>
                      )}
                    </div>
                    <Badge variant="rejeitado">Rejeitado</Badge>
                  </div>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    gray: 'border-gray-200',
    yellow: 'border-nex-yellow bg-nex-yellow-light',
    blue: 'border-blue-200 bg-blue-50',
    red: 'border-red-200 bg-red-50',
  }
  return (
    <div className={`rounded-lg border p-4 text-center ${colorMap[color]}`}>
      <p className="font-heading font-bold text-2xl">{value}</p>
      <p className="text-xs text-gray-600 mt-1">{label}</p>
    </div>
  )
}

function QuickLink({ href, icon, title, desc, highlight }: {
  href: string; icon: React.ReactNode; title: string; desc: string; highlight?: boolean
}) {
  return (
    <Link
      href={href}
      className={`rounded-xl border p-5 hover:shadow-sm transition-all group flex flex-col gap-3 ${
        highlight ? 'border-nex-yellow bg-nex-yellow-light' : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
        highlight ? 'bg-nex-yellow' : 'bg-gray-100 group-hover:bg-gray-200'
      }`}>
        {icon}
      </div>
      <div>
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors self-end" />
    </Link>
  )
}
