import { NextResponse, type NextRequest } from 'next/server';

const publicApiPaths = new Set(['/api/v1/health']);
const sessionCookieNames = ['examforge.session_token', '__Secure-examforge.session_token'];

const isProtectedAdminPath = (pathname: string) =>
  pathname === '/admin' || pathname.startsWith('/admin/');

const isProtectedApiPath = (pathname: string) => {
  return pathname.startsWith('/api/v1/') && !publicApiPaths.has(pathname);
};

const createApiUnauthorizedResponse = () => {
  return NextResponse.json(
    {
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Authentication is required.',
      },
    },
    { status: 401 },
  );
};

const createLoginRedirect = (request: NextRequest) => {
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('next', `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(loginUrl);
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSessionCookie = sessionCookieNames.some((cookieName) => request.cookies.has(cookieName));

  if (isProtectedAdminPath(pathname) && !hasSessionCookie) {
    return createLoginRedirect(request);
  }

  if (isProtectedApiPath(pathname) && !hasSessionCookie) {
    return createApiUnauthorizedResponse();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/v1/:path*'],
};
