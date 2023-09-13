import {
  UnitRoleType,
  type GeneralRoleType,
  type ServiceSectorRolePermissionType,
  type ServiceSectorRoleType,
  type UserType,
  Maybe,
  UnitType,
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
}

const hasGeneralPermission = (permissionName: string, user: UserType) =>
  user.generalRoles?.find((x) =>
    x?.permissions?.find((y) => y?.permission === permissionName)
  ) != null;

const hasUnitPermission = (
  permissionName: string,
  unitPk: number,
  user: UserType
) => {
  const unitRoles =
    user.unitRoles?.filter((x): x is UnitRoleType => x != null) || [];

  const unitGroups =
    unitRoles
      .map((x) =>
        x.unitGroups?.reduce<Array<UnitType | undefined>>(
          (agv, y) => y?.units?.map((z) => z ?? undefined, agv) ?? [...agv],
          []
        )
      )
      .reduce((agv, x) => [...(agv ?? []), ...(x ?? [])], [])
      ?.map((x) => x?.pk)
      ?.filter((x): x is number => x != null) ?? [];

  const units =
    unitRoles
      .reduce<Maybe<UnitType>[]>((agv, x) => [...agv, ...(x.units ?? [])], [])
      ?.map((x) => x?.pk)
      ?.filter((x): x is number => x != null) ?? [];

  const permissions =
    unitRoles
      .map((x) => x.permissions)
      .reduce((agv, x) => [...(agv ?? []), ...(x ?? [])], [])
      ?.map((x) => x?.permission)
      ?.filter((x) => x != null) ?? [];

  return (
    permissions.includes(permissionName) &&
    (units.includes(unitPk) || unitGroups.includes(unitPk))
  );
};

const hasServiceSectorPermission = (
  permissionName: string,
  serviceSectorPks: number[],
  user: UserType
) => {
  const serviceSectorPermissions = (
    user.serviceSectorRoles?.filter(
      (x): x is ServiceSectorRoleType => x != null
    ) || []
  ).flatMap((sr) =>
    (sr.permissions ?? [])
      .filter((perm): perm is ServiceSectorRolePermissionType => perm != null)
      .map((permission) => ({
        permission: permission.permission,
        serviceSector: sr.serviceSector?.pk,
      }))
  );

  return (
    serviceSectorPermissions
      .filter(
        (up): up is { permission: string; serviceSector: number } =>
          up.permission != null && up.serviceSector != null
      )
      .filter(
        (up) =>
          up.permission === permissionName &&
          serviceSectorPks.includes(up.serviceSector)
      ).length > 0
  );
};

/// Returns true if the user is allowed to perform operation for a specific unit or service sector
export const hasPermission =
  (user: UserType) =>
  (
    permissionName: string,
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
export const hasSomePermission = (user: UserType, permission: Permission) => {
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
};

/// Returns true if the user has any kind of access to the system
export const hasAnyPermission = (user: UserType) => {
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
};
