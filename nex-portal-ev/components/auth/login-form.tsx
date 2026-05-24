'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    setCarregando(true)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    })

    if (error) {
      setErro('E-mail ou senha incorretos.')
      setCarregando(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('perfil, ativo')
      .eq('user_id', data.user.id)
      .single()

    if (!profile?.ativo) {
      await supabase.auth.signOut()
      setErro('Conta desativada. Entre em contato com o Nex Coworking.')
      setCarregando(false)
      return
    }

    router.push(profile?.perfil === 'admin' ? '/admin/painel' : '/dashboard')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="seu@email.com"
          required
          autoComplete="email"
          className="mt-1"
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <Label htmlFor="senha">Senha</Label>
          <Link href="/recuperar-senha" className="text-xs text-gray-500 hover:text-gray-900 underline">
            Esqueceu a senha?
          </Link>
        </div>
        <Input
          id="senha"
          type="password"
          value={senha}
          onChange={e => setSenha(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete="current-password"
        />
      </div>
      {erro && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{erro}</p>
      )}
      <Button type="submit" className="w-full" disabled={carregando}>
        {carregando && <Loader2 className="h-4 w-4 animate-spin" />}
        Entrar
      </Button>
    </form>
  )
}
