import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = process.env.HMAC_SECRET || 'agendamento-secret-key-super-secure';
const key = new TextEncoder().encode(SECRET_KEY);

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Rotas públicas
  if (path === '/login' || path === '/register' || path.startsWith('/_next') || path === '/api/migrate') {
    return NextResponse.next();
  }

  // Rotas que precisam de autenticação
  if (path.startsWith('/dashboard') || path.startsWith('/admin') || path === '/') {
    const cookie = request.cookies.get('session')?.value;
    
    if (!cookie) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const { payload } = await jwtVerify(cookie, key, {
        algorithms: ['HS256'],
      });
      
      const role = payload.role as string;

      // Proteção de rotas de super-admin (CRPM)
      if (path.startsWith('/admin/crpm') && role !== 'superadmin') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }

      // Proteção de rotas de admin geral
      if (path.startsWith('/admin') && role !== 'admin' && role !== 'superadmin') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      
      return NextResponse.next();
    } catch (e) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
