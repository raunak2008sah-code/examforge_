import { headers } from 'next/headers';
import { prisma, type RoleName } from '@examforge/db';
import { auth, type BetterAuthSession } from './auth';
import { hasPermission, type Permission } from './permissions';

export type AuthenticatedSession = BetterAuthSession & {
  user: BetterAuthSession['user'] & {
    role: RoleName;
    isActive: boolean;
  };
};

export class AuthServiceError extends Error {
  constructor(
    public readonly code: 'UNAUTHENTICATED' | 'FORBIDDEN',
    message: string,
  ) {
    super(message);
    this.name = 'AuthServiceError';
  }
}

const roleCache = new Map<string, { role: any, isActive: boolean, expiresAt: number }>();

const loadActiveUserRole = async (userId: string) => {
  const now = Date.now();
  const cached = roleCache.get(userId);
  if (cached && cached.expiresAt > now) {
    return { isActive: cached.isActive, role: cached.role };
  }

  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      isActive: true,
      deletedAt: null,
    },
    select: {
      isActive: true,
      role: {
        select: {
          name: true,
        },
      },
    },
  });

  if (user) {
    roleCache.set(userId, { role: user.role, isActive: user.isActive, expiresAt: now + 60000 }); // 1 minute cache
  }

  return user;
};

const enrichSession = async (
  session: BetterAuthSession | null,
): Promise<AuthenticatedSession | null> => {
  if (!session) {
    return null;
  }

  const user = await loadActiveUserRole(session.user.id);
  if (!user) {
    return null;
  }

  return {
    ...session,
    user: {
      ...session.user,
      role: user.role.name,
      isActive: user.isActive,
    },
  };
};

const getSessionFromHeaders = async (
  requestHeaders: Headers,
): Promise<AuthenticatedSession | null> => {
  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  return enrichSession(session);
};

const requireAuthFromHeaders = async (requestHeaders: Headers): Promise<AuthenticatedSession> => {
  const session = await getSessionFromHeaders(requestHeaders);

  if (!session) {
    throw new AuthServiceError('UNAUTHENTICATED', 'Authentication is required.');
  }

  return session;
};

const requireRoleFromHeaders = async (
  requestHeaders: Headers,
  role: RoleName,
): Promise<AuthenticatedSession> => {
  const session = await requireAuthFromHeaders(requestHeaders);

  if (session.user.role !== role) {
    throw new AuthServiceError('FORBIDDEN', 'Insufficient permissions.');
  }

  return session;
};

const requireAnyRoleFromHeaders = async (
  requestHeaders: Headers,
  roles: readonly RoleName[],
): Promise<AuthenticatedSession> => {
  const session = await requireAuthFromHeaders(requestHeaders);

  if (!roles.includes(session.user.role)) {
    throw new AuthServiceError('FORBIDDEN', 'Insufficient permissions.');
  }

  return session;
};

const requirePermissionFromHeaders = async (
  requestHeaders: Headers,
  permission: Permission,
): Promise<AuthenticatedSession> => {
  const session = await requireAuthFromHeaders(requestHeaders);

  if (!hasPermission(session.user.role, permission)) {
    throw new AuthServiceError('FORBIDDEN', 'Insufficient permissions.');
  }

  return session;
};

const requireOwnershipFromHeaders = async (
  requestHeaders: Headers,
  resource: { userId: string },
): Promise<AuthenticatedSession> => {
  const session = await requireAuthFromHeaders(requestHeaders);

  if (session.user.role === 'ADMIN' || session.user.id === resource.userId) {
    return session;
  }

  throw new AuthServiceError('FORBIDDEN', 'Resource ownership is required.');
};

export const authService = {
  getSessionFromHeaders,
  requireAuthFromHeaders,
  requireRoleFromHeaders,
  requireAnyRoleFromHeaders,
  requirePermissionFromHeaders,
  requireOwnershipFromHeaders,

  async getSession(): Promise<AuthenticatedSession | null> {
    return getSessionFromHeaders(await headers());
  },

  async requireAuth(): Promise<AuthenticatedSession> {
    return requireAuthFromHeaders(await headers());
  },

  async requireRole(role: RoleName): Promise<AuthenticatedSession> {
    return requireRoleFromHeaders(await headers(), role);
  },

  async requireAnyRole(roles: readonly RoleName[]): Promise<AuthenticatedSession> {
    return requireAnyRoleFromHeaders(await headers(), roles);
  },

  async requireAdmin(): Promise<AuthenticatedSession> {
    return this.requireRole('ADMIN');
  },

  async requireReviewer(): Promise<AuthenticatedSession> {
    return this.requireRole('REVIEWER');
  },

  async requireStudent(): Promise<AuthenticatedSession> {
    return this.requireRole('STUDENT');
  },

  async requirePermission(permission: Permission): Promise<AuthenticatedSession> {
    return requirePermissionFromHeaders(await headers(), permission);
  },

  async requireOwnership(resource: { userId: string }): Promise<AuthenticatedSession> {
    return requireOwnershipFromHeaders(await headers(), resource);
  },
};
