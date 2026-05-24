import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getOrCreateImagemFolder, uploadFileToDrive } from '@/lib/drive/client'
import { ALLOWED_IMG_TYPES, MAX_IMG_SIZE } from '@/lib/utils'

export async function POST(request: NextRequest) {
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

    const formData = await request.formData()
    const file = formData.get('file') as File
    const nome = formData.get('nome') as string
    const categoria = formData.get('categoria') as string
    const visibilidade = formData.get('visibilidade') as string
    const clientesRaw = formData.get('clientes') as string | null
    const clientes: string[] = clientesRaw ? JSON.parse(clientesRaw) : []

    if (!file || !nome || !categoria || !visibilidade) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    if (!ALLOWED_IMG_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
    }

    if (file.size > MAX_IMG_SIZE) {
      return NextResponse.json({ error: 'Imagem muito grande' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const ext = file.name.split('.').pop() ?? 'jpg'
    const fileName = `${Date.now()}-${nome.replace(/\s+/g, '-')}.${ext}`
    const storagePath = `imagens/${categoria}/${fileName}`

    const { error: storageError } = await supabase.storage
      .from('ev-portal')
      .upload(storagePath, buffer, { contentType: file.type })

    if (storageError) throw storageError

    const { data: imagem } = await supabase
      .from('imagens')
      .insert({ nome, categoria, visibilidade, arquivo_url: storagePath })
      .select('id')
      .single()

    if (visibilidade === 'especifico' && clientes.length > 0) {
      await supabase.from('imagens_clientes').insert(
        clientes.map(cId => ({ imagem_id: imagem!.id, cliente_id: cId }))
      )
    }

    // Drive sync em background
    syncImagemDrive(buffer, fileName, file.type, categoria, imagem!.id, supabase)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Upload imagem error:', error)
    return NextResponse.json({ error: 'Erro ao fazer upload' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
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

    const id = request.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

    const { data: imagem } = await supabase
      .from('imagens')
      .select('arquivo_url')
      .eq('id', id)
      .single()

    if (imagem?.arquivo_url) {
      await supabase.storage.from('ev-portal').remove([imagem.arquivo_url])
    }

    await supabase.from('imagens_clientes').delete().eq('imagem_id', id)
    await supabase.from('imagens').delete().eq('id', id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete imagem error:', error)
    return NextResponse.json({ error: 'Erro ao remover' }, { status: 500 })
  }
}

async function syncImagemDrive(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  categoria: string,
  imagemId: string,
  supabase: any
) {
  try {
    const folderId = await getOrCreateImagemFolder(categoria)
    const { webViewLink } = await uploadFileToDrive(buffer, fileName, mimeType, folderId)
    await supabase.from('imagens').update({ drive_url: webViewLink }).eq('id', imagemId)
  } catch (error) {
    console.error('Drive sync imagem error:', error)
  }
}
