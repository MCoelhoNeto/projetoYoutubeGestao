// middleware.ts (na raiz do projeto)
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    console.log(`🛡️ Middleware - Path: ${pathname}, Auth: ${!!token}`);

    // Se não está autenticado e tenta acessar rota protegida
    if (!token && pathname.startsWith('/dashboard')) {
      console.log('🚫 Acesso negado - redirecionando para login');
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }

    // Se está autenticado e tenta acessar login
    if (token && pathname.startsWith('/auth/signin')) {
      console.log('✅ Já autenticado - redirecionando para dashboard');
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Verificar limites do plano (exemplo)
    if (token && pathname.startsWith('/channels/add')) {
      const userPlan = token.plan as any;
      const usage = token.usage as any;
      
      if (userPlan?.type === 'free' && usage?.channelsCount >= 3) {
        console.log('🚫 Limite do plano atingido');
        return NextResponse.redirect(new URL('/upgrade', req.url));
      }
    }

    // Admin routes - apenas para admins
    if (pathname.startsWith('/admin')) {
      const userEmail = token.email;
      const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
      
      if (!adminEmails.includes(userEmail as string)) {
        console.log('🚫 Acesso admin negado');
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Rotas públicas sempre permitidas
        if (pathname.startsWith('/auth/') || 
            pathname === '/' || 
            pathname.startsWith('/api/auth/') ||
            pathname.startsWith('/_next/') ||
            pathname.startsWith('/favicon')) {
          return true;
        }

        // Rotas protegidas precisam de token
        return !!token;
      },
    },
  }
);

// Definir em quais rotas o middleware deve rodar
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)',
  ],
};