export enum UserRole {
  SYS_ADMIN = "SYS_ADMIN",
  SYS_OPERATOR = "SYS_OPERATOR",
  SYS_DRIVER = "SYS_DRIVER",
}

export const ROLES = {
  SYS_ADMIN: UserRole.SYS_ADMIN,
  SYS_OPERATOR: UserRole.SYS_OPERATOR,
  SYS_DRIVER: UserRole.SYS_DRIVER,
} as const;

export type Role = UserRole;
