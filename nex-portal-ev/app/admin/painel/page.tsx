import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NavAdmin } from '@/components/shared/nav-admin'
import { PainelAdmin } from '@/components/admin/painel-admin'
import { Toaster } from '@/components/ui/toaster'

export default async function PainelAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('perfil')
    .eq('user_id', user.id)
    .single()

  if (profile?.perfil !== 'admin') redirect('/dashboard')

  const { data: clientes } = await supabase
    .from('profiles')
    .select('*')
    .eq('perfil', 'cliente')
    .order('nome')

  const { data: documentosExigidos } = await supabase
    .from('documentos_exigidos')
    .select('id')
    .eq('ativo', true)
    .eq('obrigatorio', true)

  const totalObrigatorios = documentosExigidos?.length ?? 0

  const { data: todosDocs } = await supabase
    .from('documentos_cliente')
    .select('cliente_id, status, documento_exigido_id')

  const clientesComStatus = (clientes ?? []).map(cliente => {
    const docsDocliente = (todosDocs ?? []).filter(d => d.cliente_id === cliente.id)
    const aprovados = docsDocliente.filter(d => d.status === 'aprovado').length
    const rejeitados = docsDocliente.filter(d => d.status === 'rejeitado').length
    const enviados = docsDocliente.filter(d => d.status === 'enviado').length

    let status_geral: 'completo' | 'pendente' | 'com_rejeicao' = 'pendente'
    if (rejeitados > 0) status_geral = 'com_rejeicao'
    else if (totalObrigatorios > 0 && aprovados >= totalObrigatorios) status_geral = 'completo'

    return {
      ...cliente,
      total_documentos: totalObrigatorios,
      documentos_aprovados: aprovados,
      documentos_pendentes: totalObrigatorios - aprovados - rejeitados - enviados,
      documentos_rejeitados: rejeitados,
      status_geral,
    }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <NavAdmin />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <PainelAdmin clientes={clientesComStatus} />
      </main>
      <Toaster />
    </div>
  )
}
