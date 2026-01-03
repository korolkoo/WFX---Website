import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Cria uma resposta inicial que permite passar os cookies adiante
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Atualiza a sessão (importante para segurança)
  const { data: { user } } = await supabase.auth.getUser()

  // --- LÓGICA DE PROTEÇÃO DE ROTAS ---

  // Se tentar acessar /admin*
  if (request.nextUrl.pathname.startsWith('/admin')) {
    
    // 1. Se não estiver logado -> Manda pro Login
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // 2. Se estiver logado, verifica se é ADMIN no banco
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    // Se não for admin, chuta para a Home
    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Aplica o middleware em todas as rotas, exceto:
     * - _next/static (arquivos estáticos)
     * - _next/image (otimização de imagens)
     * - favicon.ico (ícone)
     * - imagens públicas (png, jpg, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}