import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const url = request.nextUrl.clone()
  const code = url.searchParams.get('code')
  const type = url.searchParams.get('type')
  const next = url.searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  if (type === 'recovery') {
    url.pathname = '/nova-senha'
    url.searchParams.delete('code')
    url.searchParams.delete('type')
    return NextResponse.redirect(url)
  }

  url.pathname = next
  return NextResponse.redirect(url)
}
