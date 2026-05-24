'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, CheckCircle } from 'lucide-react'

export default function NovaSenhaPage() {
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')

    if (senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    if (senha !== confirmacao) {
      setErro('As senhas não coincidem.')
      return
    }

    setCarregando(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: senha })

    if (error) {
      setErro('Erro ao atualizar a senha. Solicite um novo link.')
      setCarregando(false)
      return
    }

    setSucesso(true)
    setTimeout(() => router.push('/dashboard'), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-nex-yellow rounded-xl mb-4">
            <span className="font-heading font-bold text-2xl text-nex-black">N</span>
          </div>
          <h1 className="font-heading font-bold text-2xl text-nex-black">Criar senha</h1>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
          {sucesso ? (
            <div className="text-center space-y-3">
              <CheckCircle className="h-12 w-12 text-yellow-500 mx-auto" />
              <p className="font-semibold">Senha criada com sucesso!</p>
              <p className="text-sm text-gray-500">Redirecionando...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label>Nova senha</Label>
                <Input
                  type="password"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Confirmar senha</Label>
                <Input
                  type="password"
                  value={confirmacao}
                  onChange={e => setConfirmacao(e.target.value)}
                  placeholder="Repita a senha"
                  required
                  className="mt-1"
                />
              </div>
              {erro && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{erro}</p>
              )}
              <Button type="submit" className="w-full" disabled={carregando}>
                {carregando && <Loader2 className="h-4 w-4 animate-spin" />}
                Salvar senha
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
