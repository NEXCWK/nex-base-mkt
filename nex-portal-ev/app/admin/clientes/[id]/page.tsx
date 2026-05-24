import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NavAdmin } from '@/components/shared/nav-admin'
import { ClienteDetalhe } from '@/components/admin/cliente-detalhe'
import { Toaster } from '@/components/ui/toaster'

export default async function ClienteDetalhePage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('perfil')
    .eq('user_id', user.id)
    .single()

  if (adminProfile?.perfil !== 'admin') redirect('/dashboard')

  const { data: cliente } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.id)
    .eq('perfil', 'cliente')
    .single()

  if (!cliente) notFound()

  const { data: documentosExigidos } = await supabase
    .from('documentos_exigidos')
    .select('*')
    .eq('ativo', true)
    .order('ordem')

  const { data: documentosCliente } = await supabase
    .from('documentos_cliente')
    .select('*')
    .eq('cliente_id', params.id)
    .order('updated_at', { ascending: false })

  const { data: documentosNex } = await supabase
    .from('documentos_nex')
    .select('*')
    .eq('cliente_id', params.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <NavAdmin />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <ClienteDetalhe
          cliente={cliente}
          documentosExigidos={documentosExigidos ?? []}
          documentosCliente={documentosCliente ?? []}
          documentosNex={documentosNex ?? []}
        />
      </main>
      <Toaster />
    </div>
  )
}
