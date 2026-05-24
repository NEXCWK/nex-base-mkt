import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NavCliente } from '@/components/shared/nav-cliente'
import { RepositorioCliente } from '@/components/cliente/repositorio-cliente'
import { Toaster } from '@/components/ui/toaster'

export default async function RepositorioPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!profile || profile.perfil !== 'cliente') redirect('/login')

  const { data: documentos } = await supabase
    .from('documentos_nex')
    .select('*')
    .eq('cliente_id', profile.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <NavCliente nomeCliente={profile.nome} />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <RepositorioCliente documentos={documentos ?? []} />
      </main>
      <Toaster />
    </div>
  )
}
