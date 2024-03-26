import { filterNonNullable } from "common/src/helpers";
import {
  type UnitRoleNode,
  type GeneralRoleNode,
  type ServiceSectorRoleNode,
  type UserNode,
  GeneralPermissionChoices,
} from "common/types/gql-types";

// TODO reuse the backend enums
// TODO add a safe conversion from Unit -> General permission
export enum Permission {
  CAN_COMMENT_RESERVATIONS = GeneralPermissionChoices.CanCommentReservations,
  CAN_CREATE_STAFF_RESERVATIONS = GeneralPermissionChoices.CanCreateStaffReservations,
  CAN_MANAGE_RESERVATIONS = GeneralPermissionChoices.CanManageReservations,
  CAN_VIEW_RESERVATIONS = GeneralPermissionChoices.CanViewReservations,
  CAN_MANAGE_RESERVATION_UNITS = GeneralPermissionChoices.CanManageReservationUnits,
  CAN_MANAGE_SPACES = GeneralPermissionChoices.CanManageSpaces,
  CAN_MANAGE_RESOURCES = GeneralPermissionChoices.CanManageResources,
  CAN_MANAGE_UNITS = GeneralPermissionChoices.CanManageUnits,
  CAN_VALIDATE_APPLICATIONS = GeneralPermissionChoices.CanValidateApplications,
  CAN_MANAGE_BANNER_NOTIFICATIONS = GeneralPermissionChoices.CanManageNotifications,
}

const hasGeneralPermission = (permissionName: string, user: UserNode) =>
  user.generalRoles?.find((x) =>
    x?.role.permissions?.find((y) => y?.permission === permissionName)
  ) != null;

function hasUnitPermission(
  permissionName: Permission,
  unitPk: number,
  user: UserNode
): boolean {
  const unitRoles = filterNonNullable(user.unitRoles);

  for (const role of unitRoles) {
    const perms = filterNonNullable(
      role.role.permissions?.flatMap((x) => x.permission)
    );
    // TODO safe conversion from Unit -> General permission
    if (perms.find((x) => x.toString() === permissionName) == null) {
      continue;
    }

    // Check unit group permissions
    const groupUnits = role.unitGroup?.flatMap((x) => x?.units);
    if (groupUnits?.find((x) => x?.pk === unitPk)) {
      return true;
    }

    // Check unit specific permissions
    if (role.unit?.find((x) => x?.pk === unitPk)) {
      return true;
    }
  }

  return false;
}

function hasServiceSectorPermission(
  permissionName: Permission,
  serviceSectorPks: number[],
  user: UserNode
): boolean {
  const roles = filterNonNullable(user.serviceSectorRoles);
  for (const role of roles) {
    const perms = filterNonNullable(
      role.role.permissions?.flatMap((x) => x.permission)
    );
    if (perms.find((x) => x.toString() === permissionName) == null) {
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
  (user: UserNode) =>
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
  user: UserNode,
  permission: Permission
): boolean {
  if (user.isSuperuser) {
    return true;
  }

  const hasPerm = (
    role: UnitRoleNode | ServiceSectorRoleNode | GeneralRoleNode | undefined,
    perm: Permission
  ) =>
    role?.role.permissions?.some(
      (p) => p?.permission != null && p.permission.toString() === perm
    );

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
export function hasAnyPermission(user: UserNode): boolean {
  if (user.isSuperuser) {
    return true;
  }

  const hasAnyPerm = (
    role?: UnitRoleNode | ServiceSectorRoleNode | GeneralRoleNode
  ) => role?.role.permissions?.some((p) => p?.permission != null) ?? false;

  const someUnitRoles =
    user?.unitRoles?.some((role) => hasAnyPerm(role ?? undefined)) ?? false;

  const someSectorRoles =
    user?.serviceSectorRoles?.some((role) => hasAnyPerm(role ?? undefined)) ??
    false;

  const someGeneralRoles =
    user?.generalRoles?.some((role) => hasAnyPerm(role ?? undefined)) ?? false;

  return someUnitRoles || someSectorRoles || someGeneralRoles;
}
