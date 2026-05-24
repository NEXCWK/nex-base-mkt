import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { uploadFileToDrive, setupClientFolders, getOrCreateFolder } from '@/lib/drive/client'
import { notifyClienteDocumento } from '@/lib/email/send'

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServiceClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('perfil')
      .eq('user_id', user.id)
      .single()

    if (adminProfile?.perfil !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { docId, acao, observacao } = await request.json()

    const novoStatus = acao === 'aprovar' ? 'aprovado' : 'rejeitado'

    const { error } = await supabase
      .from('documentos_cliente')
      .update({
        status: novoStatus,
        observacao: acao === 'rejeitar' ? observacao : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', docId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Review error:', error)
    return NextResponse.json({ error: 'Erro ao processar' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServiceClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('perfil, id')
      .eq('user_id', user.id)
      .single()

    if (adminProfile?.perfil !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const clienteId = formData.get('clienteId') as string
    const nome = formData.get('nome') as string
    const categoria = formData.get('categoria') as string

    if (!file || !clienteId || !nome || !categoria) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`
    const storagePath = `documentos-nex/${clienteId}/${fileName}`

    const { error: storageError } = await supabase.storage
      .from('ev-portal')
      .upload(storagePath, buffer, { contentType: file.type })

    if (storageError) throw storageError

    const { data: doc } = await supabase
      .from('documentos_nex')
      .insert({
        cliente_id: clienteId,
        nome,
        categoria,
        arquivo_url: storagePath,
        enviado_por: adminProfile.id,
      })
      .select('id')
      .single()

    // Sincronizar Drive em background
    syncDocNexDrive(clienteId, buffer, fileName, file.type, doc!.id, supabase)

    // Notificar cliente
    const { data: cliente } = await supabase
      .from('profiles')
      .select('nome, email')
      .eq('id', clienteId)
      .single()

    if (cliente) {
      notifyClienteDocumento(cliente.email, cliente.nome, nome).catch(console.error)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Add doc error:', error)
    return NextResponse.json({ error: 'Erro ao adicionar documento' }, { status: 500 })
  }
}

async function syncDocNexDrive(
  clienteId: string,
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  docId: string,
  supabase: any
) {
  try {
    const { data: cliente } = await supabase
      .from('profiles')
      .select('nome, drive_folder_id')
      .eq('id', clienteId)
      .single()

    if (!cliente) return

    let rootFolderId = cliente.drive_folder_id

    if (!rootFolderId) {
      const folders = await setupClientFolders(cliente.nome)
      await supabase.from('profiles').update({ drive_folder_id: folders.rootId }).eq('id', clienteId)
      rootFolderId = folders.documentosNexId
    }

    const { webViewLink } = await uploadFileToDrive(buffer, fileName, mimeType, rootFolderId)

    await supabase
      .from('documentos_nex')
      .update({ drive_url: webViewLink })
      .eq('id', docId)
  } catch (error) {
    console.error('Drive sync doc nex error:', error)
  }
}
