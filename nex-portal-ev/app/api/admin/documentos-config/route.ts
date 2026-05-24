import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

async function getAdmin(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('perfil').eq('user_id', user.id).single()
  return profile?.perfil === 'admin' ? user : null
}

export async function POST(request: NextRequest) {
  const supabase = await createServiceClient()
  if (!await getAdmin(supabase)) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const body = await request.json()
  const { error } = await supabase.from('documentos_exigidos').insert(body)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createServiceClient()
  if (!await getAdmin(supabase)) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const { id, ...updates } = await request.json()
  const { error } = await supabase.from('documentos_exigidos').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createServiceClient()
  if (!await getAdmin(supabase)) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  const { error } = await supabase.from('documentos_exigidos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
