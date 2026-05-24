import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()
  const isAuthPage = url.pathname.startsWith('/login') || url.pathname.startsWith('/recuperar-senha')
  const isAdminPage = url.pathname.startsWith('/admin')
  const isClientePage = url.pathname.startsWith('/dashboard') ||
    url.pathname.startsWith('/documentos') ||
    url.pathname.startsWith('/repositorio') ||
    url.pathname.startsWith('/imagens')

  if (!user && (isAdminPage || isClientePage)) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isAuthPage) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('perfil')
      .eq('user_id', user.id)
      .single()

    url.pathname = profile?.perfil === 'admin' ? '/admin/painel' : '/dashboard'
    return NextResponse.redirect(url)
  }

  if (user && isAdminPage) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('perfil')
      .eq('user_id', user.id)
      .single()

    if (profile?.perfil !== 'admin') {
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
