import { z } from 'zod';
import { RoleName } from '@examforge/db';

export const UserRoleSchema = z.nativeEnum(RoleName);

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const LoginResponseSchema = z.object({
  user: z.object({
    id: z.string().uuid(),
    name: z.string().nullable(),
    email: z.string().email(),
    role: UserRoleSchema,
  }),
  sessionExpiresAt: z.string().datetime(),
});

export type LoginResponse = z.infer<typeof LoginResponseSchema>;

export const RegisterRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
});

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const SessionResponseSchema = LoginResponseSchema;

export type SessionResponse = z.infer<typeof SessionResponseSchema>;
