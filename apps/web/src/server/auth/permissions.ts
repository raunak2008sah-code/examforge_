import type { RoleName } from '@examforge/db';

export const permissions = {
  manageUsers: 'manage:users',
  manageSettings: 'manage:settings',
  manageExams: 'manage:exams',
  manageExamVersions: 'manage:exam-versions',
  manageUploads: 'manage:uploads',
  reviewParserOutput: 'review:parser-output',
  viewExamResults: 'view:exam-results',
  viewPublishedExams: 'view:published-exams',
  manageOwnAttempts: 'manage:own-attempts',
  viewOwnResults: 'view:own-results',
  manageOwnUploads: 'manage:own-uploads',
  reviewOwnParserOutput: 'review:own-parser-output',
  manageOwnExams: 'manage:own-exams',
} as const;

export type Permission = (typeof permissions)[keyof typeof permissions];

const rolePermissions: Record<RoleName, readonly Permission[]> = {
  ADMIN: [
    permissions.manageUsers,
    permissions.manageSettings,
    permissions.manageExams,
    permissions.manageExamVersions,
    permissions.manageUploads,
    permissions.reviewParserOutput,
    permissions.viewExamResults,
    permissions.viewPublishedExams,
  ],
  REVIEWER: [
    permissions.manageUploads,
    permissions.reviewParserOutput,
    permissions.viewPublishedExams,
  ],
  STUDENT: [
    permissions.viewPublishedExams,
    permissions.manageOwnAttempts,
    permissions.viewOwnResults,
    permissions.manageOwnUploads,
    permissions.reviewOwnParserOutput,
    permissions.manageOwnExams,
  ],
};

export const getPermissionsForRole = (role: RoleName): readonly Permission[] =>
  rolePermissions[role];

export const hasPermission = (role: RoleName, permission: Permission): boolean => {
  return rolePermissions[role].includes(permission);
};

export const hasAnyPermission = (
  role: RoleName,
  requiredPermissions: readonly Permission[],
): boolean => {
  return requiredPermissions.some((permission) => hasPermission(role, permission));
};

export const hasRole = (actualRole: RoleName, requiredRole: RoleName): boolean => {
  return actualRole === requiredRole;
};

export const hasAnyRole = (actualRole: RoleName, requiredRoles: readonly RoleName[]): boolean => {
  return requiredRoles.includes(actualRole);
};
