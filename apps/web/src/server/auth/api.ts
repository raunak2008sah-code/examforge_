import { NextResponse, type NextRequest } from 'next/server';
import type { RoleName } from '@examforge/db';
import { AuthServiceError, authService, type AuthenticatedSession } from './auth-service';
import type { Permission } from './permissions';

type ApiRouteContext = {
  params?: Record<string, string | string[]>;
};

type ProtectedApiHandler = (
  request: NextRequest,
  context: ApiRouteContext,
  session: AuthenticatedSession,
) => Response | Promise<Response>;

const statusByAuthCode = {
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
} as const satisfies Record<AuthServiceError['code'], 401 | 403>;

export const createAuthErrorResponse = (error: AuthServiceError): NextResponse => {
  return NextResponse.json(
    {
      error: {
        code: error.code,
        message: error.message,
      },
    },
    { status: statusByAuthCode[error.code] },
  );
};

export const createForbiddenResponse = (message = 'Insufficient permissions.'): NextResponse => {
  return NextResponse.json(
    {
      error: {
        code: 'FORBIDDEN',
        message,
      },
    },
    { status: 403 },
  );
};

export const createUnauthenticatedResponse = (
  message = 'Authentication is required.',
): NextResponse => {
  return NextResponse.json(
    {
      error: {
        code: 'UNAUTHENTICATED',
        message,
      },
    },
    { status: 401 },
  );
};

export const getRequiredApiSession = async (): Promise<AuthenticatedSession | NextResponse> => {
  try {
    return await authService.requireAuth();
  } catch (error) {
    if (error instanceof AuthServiceError) {
      return createAuthErrorResponse(error);
    }
    throw error;
  }
};

export const getRequiredApiSessionFromRequest = async (
  request: NextRequest,
): Promise<AuthenticatedSession | NextResponse> => {
  try {
    return await authService.requireAuthFromHeaders(request.headers);
  } catch (error) {
    if (error instanceof AuthServiceError) {
      return createAuthErrorResponse(error);
    }
    throw error;
  }
};

export const getRequiredApiRole = async (
  roles: readonly RoleName[],
): Promise<AuthenticatedSession | NextResponse> => {
  try {
    return await authService.requireAnyRole(roles);
  } catch (error) {
    if (error instanceof AuthServiceError) {
      return createAuthErrorResponse(error);
    }
    throw error;
  }
};

export const getRequiredApiRoleFromRequest = async (
  request: NextRequest,
  roles: readonly RoleName[],
): Promise<AuthenticatedSession | NextResponse> => {
  try {
    return await authService.requireAnyRoleFromHeaders(request.headers, roles);
  } catch (error) {
    if (error instanceof AuthServiceError) {
      return createAuthErrorResponse(error);
    }
    throw error;
  }
};

export const getRequiredApiPermission = async (
  permission: Permission,
): Promise<AuthenticatedSession | NextResponse> => {
  try {
    return await authService.requirePermission(permission);
  } catch (error) {
    if (error instanceof AuthServiceError) {
      return createAuthErrorResponse(error);
    }
    throw error;
  }
};

export const getRequiredApiPermissionFromRequest = async (
  request: NextRequest,
  permission: Permission,
): Promise<AuthenticatedSession | NextResponse> => {
  try {
    return await authService.requirePermissionFromHeaders(request.headers, permission);
  } catch (error) {
    if (error instanceof AuthServiceError) {
      return createAuthErrorResponse(error);
    }
    throw error;
  }
};

export const withApiAuth = (handler: ProtectedApiHandler) => {
  return async (request: NextRequest, context: ApiRouteContext = {}): Promise<Response> => {
    const session = await getRequiredApiSessionFromRequest(request);
    if (session instanceof NextResponse) {
      return session;
    }

    return handler(request, context, session);
  };
};

export const withApiRoles = (roles: readonly RoleName[], handler: ProtectedApiHandler) => {
  return async (request: NextRequest, context: ApiRouteContext = {}): Promise<Response> => {
    const session = await getRequiredApiRoleFromRequest(request, roles);
    if (session instanceof NextResponse) {
      return session;
    }

    return handler(request, context, session);
  };
};

export const withApiPermission = (permission: Permission, handler: ProtectedApiHandler) => {
  return async (request: NextRequest, context: ApiRouteContext = {}): Promise<Response> => {
    const session = await getRequiredApiPermissionFromRequest(request, permission);
    if (session instanceof NextResponse) {
      return session;
    }

    return handler(request, context, session);
  };
};
