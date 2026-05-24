import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NavCliente } from '@/components/shared/nav-cliente'
import { GaleriaCliente } from '@/components/cliente/galeria-cliente'
import { Toaster } from '@/components/ui/toaster'

export default async function ImagensPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!profile || profile.perfil !== 'cliente') redirect('/login')

  const { data: imagensTodos } = await supabase
    .from('imagens')
    .select('*')
    .eq('visibilidade', 'todos')
    .order('created_at', { ascending: false })

  const { data: imagensEspecificas } = await supabase
    .from('imagens')
    .select('*, imagens_clientes!inner(cliente_id)')
    .eq('visibilidade', 'especifico')
    .eq('imagens_clientes.cliente_id', profile.id)
    .order('created_at', { ascending: false })

  const imagens = [...(imagensTodos ?? []), ...(imagensEspecificas ?? [])]

  return (
    <div className="min-h-screen bg-gray-50">
      <NavCliente nomeCliente={profile.nome} />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <GaleriaCliente imagens={imagens} />
      </main>
      <Toaster />
    </div>
  )
}
