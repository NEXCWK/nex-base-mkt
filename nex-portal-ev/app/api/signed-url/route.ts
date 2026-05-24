import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const path = request.nextUrl.searchParams.get('path')
    if (!path) return NextResponse.json({ error: 'Path obrigatório' }, { status: 400 })

    const { data, error } = await supabase.storage
      .from('ev-portal')
      .createSignedUrl(path, 3600)

    if (error) throw error

    return NextResponse.json({ url: data.signedUrl })
  } catch (error) {
    console.error('Signed URL error:', error)
    return NextResponse.json({ error: 'Erro ao gerar URL' }, { status: 500 })
  }
}
