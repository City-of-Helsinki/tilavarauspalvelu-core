import { filterNonNullable } from "common/src/helpers";
import type {
  UnitRoleType,
  GeneralRoleType,
  ServiceSectorRoleType,
  UserType,
} from "common/types/gql-types";

export enum Permission {
  CAN_COMMENT_RESERVATIONS = "can_comment_reservations",
  CAN_CREATE_STAFF_RESERVATIONS = "can_create_staff_reservations",
  CAN_MANAGE_RESERVATIONS = "can_manage_reservations",
  CAN_VIEW_RESERVATIONS = "can_view_reservations",
  CAN_MANAGE_RESERVATION_UNITS = "can_manage_reservation_units",
  CAN_MANAGE_SPACES = "can_manage_spaces",
  CAN_MANAGE_RESOURCES = "can_manage_resources",
  CAN_MANAGE_UNITS = "can_manage_units",
  CAN_VALIDATE_APPLICATIONS = "can_validate_applications",
  CAN_MANAGE_BANNER_NOTIFICATIONS = "can_manage_notifications",
}

const hasGeneralPermission = (permissionName: string, user: UserType) =>
  user.generalRoles?.find((x) =>
    x?.permissions?.find((y) => y?.permission === permissionName)
  ) != null;

function hasUnitPermission(
  permissionName: Permission,
  unitPk: number,
  user: UserType
): boolean {
  const unitRoles = filterNonNullable(user.unitRoles);

  for (const role of unitRoles) {
    if (
      role.permissions?.find((x) => x?.permission === permissionName) == null
    ) {
      continue;
    }

    // Check unit group permissions
    const groupUnits = role.unitGroups?.flatMap((x) => x?.units);
    if (groupUnits?.find((x) => x?.pk === unitPk)) {
      return true;
    }

    // Check unit specific permissions
    if (role.units?.find((x) => x?.pk === unitPk)) {
      return true;
    }
  }

  return false;
}

function hasServiceSectorPermission(
  permissionName: Permission,
  serviceSectorPks: number[],
  user: UserType
): boolean {
  const roles = filterNonNullable(user.serviceSectorRoles);
  for (const role of roles) {
    if (
      role.permissions?.find((x) => x?.permission === permissionName) == null
    ) {
      continue;
    }

    if (
      role.serviceSector?.pk &&
      serviceSectorPks.includes(role.serviceSector.pk)
    ) {
      return true;
    }
  }
  return false;
}

/// Returns true if the user is allowed to perform operation for a specific unit or service sector
export const hasPermission =
  (user: UserType) =>
  (
    permissionName: Permission,
    unitPk?: number,
    serviceSectorPk?: number[]
  ): boolean => {
    if (user.isSuperuser) {
      return true;
    }
    if (hasGeneralPermission(permissionName, user)) {
      return true;
    }

    if (unitPk && hasUnitPermission(permissionName, unitPk, user)) {
      return true;
    }

    if (
      serviceSectorPk &&
      hasServiceSectorPermission(permissionName, serviceSectorPk, user)
    ) {
      return true;
    }

    return false;
  };

/// Returns true if the user if the user is allowed to perform what the permission is for
/// e.g. if the user allowed to view some reservations but not all this will return true
export function hasSomePermission(
  user: UserType,
  permission: Permission
): boolean {
  if (user.isSuperuser) {
    return true;
  }

  const hasPerm = (
    role: UnitRoleType | ServiceSectorRoleType | GeneralRoleType | undefined,
    perm: Permission
  ) => role?.permissions?.some((p) => p?.permission === perm);

  const someUnitRoles =
    user?.unitRoles?.some((role) => hasPerm(role ?? undefined, permission)) ??
    false;

  const someSectorRoles =
    user?.serviceSectorRoles?.some((role) =>
      hasPerm(role ?? undefined, permission)
    ) ?? false;

  const someGeneralRoles =
    user?.generalRoles?.some((role) =>
      hasPerm(role ?? undefined, permission)
    ) ?? false;

  return someUnitRoles || someSectorRoles || someGeneralRoles;
}

/// Returns true if the user has any kind of access to the system
export function hasAnyPermission(user: UserType): boolean {
  if (user.isSuperuser) {
    return true;
  }

  const hasAnyPerm = (
    role?: UnitRoleType | ServiceSectorRoleType | GeneralRoleType
  ) => role?.permissions?.some((p) => p?.permission != null) ?? false;

  const someUnitRoles =
    user?.unitRoles?.some((role) => hasAnyPerm(role ?? undefined)) ?? false;

  const someSectorRoles =
    user?.serviceSectorRoles?.some((role) => hasAnyPerm(role ?? undefined)) ??
    false;

  const someGeneralRoles =
    user?.generalRoles?.some((role) => hasAnyPerm(role ?? undefined)) ?? false;

  return someUnitRoles || someSectorRoles || someGeneralRoles;
}
