import { z } from 'zod';
import { UuidSchema } from '../../core';

export const SettingItemSchema = z.object({
  key: z.string(),
  value: z.any(), // Values are dynamically typed jsonb
  updatedBy: UuidSchema.nullable(),
  updatedAt: z.string().datetime(),
});

export type SettingItem = z.infer<typeof SettingItemSchema>;

export const SettingsListResponseSchema = z.array(SettingItemSchema);

export type SettingsListResponse = z.infer<typeof SettingsListResponseSchema>;

export const SettingPatchRequestSchema = z.object({
  value: z.any(),
});

export type SettingPatchRequest = z.infer<typeof SettingPatchRequestSchema>;
