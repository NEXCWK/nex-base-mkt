import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { uploadFileToDrive, setupClientFolders } from '@/lib/drive/client'
import { notifyAdminUpload } from '@/lib/email/send'
import { ALLOWED_DOC_TYPES, MAX_DOC_SIZE } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServiceClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('file') as File
    const clienteId = formData.get('clienteId') as string
    const documentoExigidoId = formData.get('documentoExigidoId') as string

    if (!file || !clienteId || !documentoExigidoId) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    if (!ALLOWED_DOC_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Tipo de arquivo inválido' }, { status: 400 })
    }

    if (file.size > MAX_DOC_SIZE) {
      return NextResponse.json({ error: 'Arquivo muito grande' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`
    const storagePath = `documentos-cliente/${clienteId}/${documentoExigidoId}/${fileName}`

    // Upload Supabase Storage
    const { error: storageError } = await supabase.storage
      .from('ev-portal')
      .upload(storagePath, buffer, { contentType: file.type, upsert: false })

    if (storageError) throw storageError

    // Upsert no banco (substitui se já existe para esse documento_exigido_id)
    const { data: existing } = await supabase
      .from('documentos_cliente')
      .select('id')
      .eq('cliente_id', clienteId)
      .eq('documento_exigido_id', documentoExigidoId)
      .single()

    let docId: string

    if (existing) {
      const { data } = await supabase
        .from('documentos_cliente')
        .update({
          arquivo_url: storagePath,
          status: 'enviado',
          observacao: null,
          enviado_por: clienteId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select('id')
        .single()
      docId = data!.id
    } else {
      const { data } = await supabase
        .from('documentos_cliente')
        .insert({
          cliente_id: clienteId,
          documento_exigido_id: documentoExigidoId,
          arquivo_url: storagePath,
          status: 'enviado',
          enviado_por: clienteId,
        })
        .select('id')
        .single()
      docId = data!.id
    }

    // Sincronização Drive em background (não bloqueia a resposta)
    syncDrive(clienteId, storagePath, buffer, file.name, file.type, docId, supabase)

    // Notificar admin
    const { data: cliente } = await supabase
      .from('profiles')
      .select('nome, email')
      .eq('id', clienteId)
      .single()

    const { data: docExigido } = await supabase
      .from('documentos_exigidos')
      .select('nome')
      .eq('id', documentoExigidoId)
      .single()

    if (cliente && docExigido) {
      notifyAdminUpload(cliente.nome, docExigido.nome).catch(console.error)
    }

    return NextResponse.json({ success: true, docId })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Erro no upload' }, { status: 500 })
  }
}

async function syncDrive(
  clienteId: string,
  storagePath: string,
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

    let folderId = cliente.drive_folder_id

    if (!folderId) {
      const folders = await setupClientFolders(cliente.nome)
      await supabase
        .from('profiles')
        .update({ drive_folder_id: folders.rootId })
        .eq('id', clienteId)
      folderId = folders.documentosEnviadosId
    }

    const { webViewLink } = await uploadFileToDrive(buffer, fileName, mimeType, folderId)

    await supabase
      .from('documentos_cliente')
      .update({ drive_url: webViewLink })
      .eq('id', docId)
  } catch (error) {
    console.error('Drive sync error:', error)
  }
}
