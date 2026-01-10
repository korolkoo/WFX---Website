import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  // Se houver um parâmetro "next", usamos ele para redirecionar, senão vai para /admin
  const next = searchParams.get('next') ?? '/admin'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Redireciona para a página desejada após o login
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Se der erro, volta para a home
  return NextResponse.redirect(`${origin}/`)
}