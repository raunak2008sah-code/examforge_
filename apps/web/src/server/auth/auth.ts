import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from '@examforge/db';

const configuredOrigins = [
  process.env.BETTER_AUTH_URL, 
  process.env.NEXT_PUBLIC_APP_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : undefined,
  process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined
].filter((origin): origin is string => Boolean(origin));

const getBaseURL = () => {
  // If we are on Vercel, prioritize Vercel-provided domains to prevent localhost footguns
  if (process.env.VERCEL_ENV === 'production' && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return process.env.BETTER_AUTH_URL;
};

export const auth = betterAuth({
  appName: 'ExamForge',
  baseURL: getBaseURL(),
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: configuredOrigins,
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: false,
    requireEmailVerification: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    resetPasswordTokenExpiresIn: 60 * 60,
    sendResetPassword: async ({ user, url, token }, request) => {
      const { EmailService } = await import('../services/email.service');
      await EmailService.sendTransactionalEmail({
        to: user.email,
        subject: 'Reset your password',
        html: `<p>Click <a href="${url}">here</a> to reset your password.</p>`,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url, token }, request) => {
      const { EmailService } = await import('../services/email.service');
      await EmailService.sendTransactionalEmail({
        to: user.email,
        subject: 'Verify your email address',
        html: `<p>Click <a href="${url}">here</a> to verify your email.</p>`,
      });
    }
  },
  user: {
    additionalFields: {
      roleId: {
        type: "string",
        required: false,
      }
    }
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // Ensure new users get the STUDENT role by default
          const role = await prisma.role.findUnique({ where: { name: 'STUDENT' } });
          if (!role) throw new Error('STUDENT role not found in database');
          
          return {
            data: {
              ...user,
              roleId: role.id
            }
          };
        }
      }
    }
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    freshAge: 60 * 5,
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    storage: 'memory',
    customRules: {
      '/sign-in/email': {
        window: 60,
        max: 5,
      },
      '/request-password-reset': {
        window: 60 * 15,
        max: 3,
      },
      '/reset-password': {
        window: 60 * 15,
        max: 3,
      },
    },
  },
  advanced: {
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
    useSecureCookies: process.env.NODE_ENV === 'production',
    database: {
      generateId: false,
    },
    cookiePrefix: 'examforge',
  },
});

export type BetterAuthSession = typeof auth.$Infer.Session;
