import { UserType } from "../common/gql-types";

const hasUnitPermission = (
  permissionName: string,
  unitPk: number,
  user: UserType
) => {
  const unitPermissions = (user.unitRoles || []).flatMap((ur) =>
    (ur?.units || []).flatMap((unit) =>
      (ur?.permissions || []).map((permission) => ({
        permission: permission?.permission as string,
        unit: unit?.pk as number,
      }))
    )
  );

  return (
    unitPermissions.filter(
      (up) => up.permission === permissionName && up.unit === unitPk
    ).length > 0
  );
};

const hasServiceSectorPermission = (
  permissionName: string,
  serviceSectorPk: number,
  user: UserType
) => {
  const serviceSectorPermissions = (user.serviceSectorRoles || []).flatMap(
    (sr) =>
      (sr?.permissions || []).map((permission) => ({
        permission: permission?.permission as string,
        serviceSector: sr?.serviceSector?.pk as number,
      }))
  );

  return (
    serviceSectorPermissions.filter(
      (up) =>
        up.permission === permissionName && up.serviceSector === serviceSectorPk
    ).length > 0
  );
};

const permissionHelper =
  (user: UserType) =>
  (
    permissionName: string,
    unitPk: number,
    serviceSectorPk?: number
  ): boolean => {
    if (user.isSuperuser) {
      return true;
    }

    if (hasUnitPermission(permissionName, unitPk, user)) {
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
