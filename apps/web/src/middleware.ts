import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function decodeJwtPayload(token: string) {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  
  if (token) {
    const payload = decodeJwtPayload(token);
    const userRole = payload?.role;
    
    // Redirect Housekeeping staff away from Dashboard directly to the Housekeeping portal
    // This happens entirely on the server, eliminating client-side layout shift / flickering.
    if (userRole === 'HOUSEKEEPING' && request.nextUrl.pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/housekeeping', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
