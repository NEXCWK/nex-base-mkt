'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react'
import type { Profile } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface Props {
  clientes: Profile[]
}

export function GestaoContas({ clientes }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [dialog, setDialog] = useState(false)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [unidade, setUnidade] = useState('')
  const [saving, setSaving] = useState(false)
  const [busca, setBusca] = useState('')

  const filtrados = clientes.filter(c =>
    busca === '' || c.nome.toLowerCase().includes(busca.toLowerCase()) || c.email.toLowerCase().includes(busca.toLowerCase())
  )

  const handleCriar = async () => {
    if (!nome.trim() || !email.trim()) {
      toast({ title: 'Nome e e-mail são obrigatórios', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, unidade }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro')
      toast({ title: 'Conta criada! E-mail de boas-vindas enviado.', variant: 'success' })
      setDialog(false)
      setNome('')
      setEmail('')
      setUnidade('')
      router.refresh()
    } catch (err: any) {
      toast({ title: 'Erro ao criar conta', description: err.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleToggleAtivo = async (cliente: Profile) => {
    await fetch('/api/admin/clientes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: cliente.id, ativo: !cliente.ativo }),
    })
    toast({ title: cliente.ativo ? 'Conta desativada' : 'Conta reativada', variant: 'success' })
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl text-nex-black">Contas de Clientes</h1>
          <p className="text-gray-500 text-sm mt-1">{clientes.length} contas cadastradas</p>
        </div>
        <Button onClick={() => setDialog(true)}>
          <Plus className="h-4 w-4" /> Nova conta
        </Button>
      </div>

      <Input
        placeholder="Buscar por nome ou e-mail..."
        value={busca}
        onChange={e => setBusca(e.target.value)}
      />

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {filtrados.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Nenhuma conta encontrada.</div>
        ) : (
          filtrados.map(cliente => (
            <div key={cliente.id} className={`p-4 flex items-center gap-3 ${!cliente.ativo ? 'opacity-60' : ''}`}>
              <div className="w-10 h-10 rounded-full bg-nex-yellow flex items-center justify-center font-heading font-bold text-nex-black flex-shrink-0">
                {cliente.nome.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{cliente.nome}</p>
                <p className="text-xs text-gray-500">{cliente.email}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {cliente.unidade && <span className="text-xs text-gray-400">Unidade {cliente.unidade}</span>}
                  <span className="text-xs text-gray-300">·</span>
                  <span className="text-xs text-gray-400">Criado {formatDate(cliente.created_at)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge variant={cliente.ativo ? 'aprovado' : 'secondary'}>
                  {cliente.ativo ? 'Ativo' : 'Inativo'}
                </Badge>
                <button
                  onClick={() => handleToggleAtivo(cliente)}
                  className="text-gray-400 hover:text-gray-700 transition-colors"
                  title={cliente.ativo ? 'Desativar conta' : 'Reativar conta'}
                >
                  {cliente.ativo
                    ? <ToggleRight className="h-6 w-6 text-nex-yellow" />
                    : <ToggleLeft className="h-6 w-6" />}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova conta de cliente</DialogTitle>
            <DialogDescription>
              Um e-mail com link de acesso será enviado ao cliente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome completo</Label>
              <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="João Silva" className="mt-1" />
            </div>
            <div>
              <Label>E-mail</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="joao@empresa.com.br" className="mt-1" />
            </div>
            <div>
              <Label>Unidade (opcional)</Label>
              <Input value={unidade} onChange={e => setUnidade(e.target.value)} placeholder="Ex: 301, Campinas" className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDialog(false)}>Cancelar</Button>
            <Button onClick={handleCriar} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Criar conta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
