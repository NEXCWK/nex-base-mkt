import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { setupClientFolders } from '@/lib/drive/client'
import { sendWelcomeEmail } from '@/lib/email/send'

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

    const { nome, email, unidade } = await request.json()

    if (!nome || !email) {
      return NextResponse.json({ error: 'Nome e e-mail obrigatórios' }, { status: 400 })
    }

    // Cria o usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { nome },
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // Cria o perfil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: authData.user.id,
        nome,
        email,
        perfil: 'cliente',
        unidade: unidade || null,
        ativo: true,
      })
      .select()
      .single()

    if (profileError) throw profileError

    // Criar pastas no Drive em background
    setupDriveFolders(profile.id, nome, supabase)

    // Gerar link de recuperação de senha (para o cliente criar a senha)
    const { data: linkData } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
    })

    if (linkData?.properties?.action_link) {
      sendWelcomeEmail(email, nome, linkData.properties.action_link).catch(console.error)
    }

    return NextResponse.json({ success: true, id: profile.id })
  } catch (error) {
    console.error('Create client error:', error)
    return NextResponse.json({ error: 'Erro ao criar conta' }, { status: 500 })
  }
}

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

    const { id, ativo } = await request.json()

    await supabase
      .from('profiles')
      .update({ ativo })
      .eq('id', id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update client error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 })
  }
}

async function setupDriveFolders(clienteId: string, nome: string, supabase: any) {
  try {
    const folders = await setupClientFolders(nome)
    await supabase
      .from('profiles')
      .update({ drive_folder_id: folders.rootId })
      .eq('id', clienteId)
  } catch (error) {
    console.error('Drive folder setup error:', error)
  }
}
