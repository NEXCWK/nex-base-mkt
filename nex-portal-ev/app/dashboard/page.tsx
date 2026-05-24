import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NavCliente } from '@/components/shared/nav-cliente'
import { DashboardCliente } from '@/components/cliente/dashboard-cliente'
import { Toaster } from '@/components/ui/toaster'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!profile || profile.perfil !== 'cliente') redirect('/login')

  const { data: documentosExigidos } = await supabase
    .from('documentos_exigidos')
    .select('*')
    .eq('ativo', true)
    .order('ordem')

  const { data: documentosCliente } = await supabase
    .from('documentos_cliente')
    .select('*')
    .eq('cliente_id', profile.id)
    .order('updated_at', { ascending: false })

  const total = documentosExigidos?.length ?? 0
  const aprovados = documentosCliente?.filter(d => d.status === 'aprovado').length ?? 0
  const rejeitados = documentosCliente?.filter(d => d.status === 'rejeitado').length ?? 0
  const enviados = documentosCliente?.filter(d => d.status === 'enviado').length ?? 0
  const pendentes = total - aprovados - rejeitados - enviados

  return (
    <div className="min-h-screen bg-gray-50">
      <NavCliente nomeCliente={profile.nome} />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <DashboardCliente
          profile={profile}
          stats={{ total, aprovados, rejeitados, enviados, pendentes }}
          documentosCliente={documentosCliente ?? []}
          documentosExigidos={documentosExigidos ?? []}
        />
      </main>
      <Toaster />
    </div>
  )
}
