import {
  UnitRoleType,
  type ServiceSectorRolePermissionType,
  type ServiceSectorRoleType,
  type UserType,
} from "common/types/gql-types";

const hasUnitPermission = (
  permissionName: string,
  unitPk: number,
  user: UserType
) => {
  const unitPermissions = (
    user.unitRoles?.filter((x): x is UnitRoleType => x != null) || []
  )
    .flatMap((ur) =>
      (ur.units || []).flatMap((unit) =>
        (ur.permissions || []).map((permission) => ({
          permission: permission?.permission,
          unit: unit?.pk,
        }))
      )
    )
    .filter(
      (up): up is { permission: string; unit: number } =>
        up.permission != null && up.unit != null
    );

  return (
    unitPermissions.filter(
      (up) => up.permission === permissionName && up.unit === unitPk
    ).length > 0
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

const permissionHelper =
  (user: UserType) =>
  (
    permissionName: string,
    unitPk?: number,
    serviceSectorPk?: number[]
  ): boolean => {
    if (user.isSuperuser) {
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

export default permissionHelper;
