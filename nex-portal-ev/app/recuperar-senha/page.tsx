'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Loader2 } from 'lucide-react'

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [carregando, setCarregando] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCarregando(true)
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    })
    setEnviado(true)
    setCarregando(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-nex-yellow rounded-xl mb-4">
            <span className="font-heading font-bold text-2xl text-nex-black">N</span>
          </div>
          <h1 className="font-heading font-bold text-2xl text-nex-black">Recuperar senha</h1>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
          {enviado ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-nex-yellow-light rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl">✉️</span>
              </div>
              <p className="text-gray-700">
                Enviamos um link para <strong>{email}</strong>.
                Verifique sua caixa de entrada.
              </p>
              <Link href="/login" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-4 w-4" /> Voltar para o login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <p className="text-sm text-gray-600">
                Digite seu e-mail e enviaremos um link para criar uma nova senha.
              </p>
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="mt-1"
                />
              </div>
              <Button type="submit" className="w-full" disabled={carregando}>
                {carregando && <Loader2 className="h-4 w-4 animate-spin" />}
                Enviar link
              </Button>
              <div className="text-center">
                <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900">
                  <ArrowLeft className="h-4 w-4" /> Voltar para o login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
