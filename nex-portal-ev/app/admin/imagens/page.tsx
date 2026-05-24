import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NavAdmin } from '@/components/shared/nav-admin'
import { GerenciadorImagens } from '@/components/admin/gerenciador-imagens'
import { Toaster } from '@/components/ui/toaster'

export default async function AdminImagensPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('perfil')
    .eq('user_id', user.id)
    .single()

  if (adminProfile?.perfil !== 'admin') redirect('/dashboard')

  const { data: imagens } = await supabase
    .from('imagens')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: clientes } = await supabase
    .from('profiles')
    .select('id, nome')
    .eq('perfil', 'cliente')
    .eq('ativo', true)
    .order('nome')

  return (
    <div className="min-h-screen bg-gray-50">
      <NavAdmin />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <GerenciadorImagens imagens={imagens ?? []} clientes={clientes ?? []} />
      </main>
      <Toaster />
    </div>
  )
}
