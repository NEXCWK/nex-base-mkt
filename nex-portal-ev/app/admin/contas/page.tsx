import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NavAdmin } from '@/components/shared/nav-admin'
import { GestaoContas } from '@/components/admin/gestao-contas'
import { Toaster } from '@/components/ui/toaster'

export default async function ContasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('perfil')
    .eq('user_id', user.id)
    .single()

  if (adminProfile?.perfil !== 'admin') redirect('/dashboard')

  const { data: clientes } = await supabase
    .from('profiles')
    .select('*')
    .eq('perfil', 'cliente')
    .order('nome')

  return (
    <div className="min-h-screen bg-gray-50">
      <NavAdmin />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <GestaoContas clientes={clientes ?? []} />
      </main>
      <Toaster />
    </div>
  )
}
