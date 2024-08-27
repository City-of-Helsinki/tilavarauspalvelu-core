import { filterNonNullable } from "common/src/helpers";
import { UserPermissionChoice, type CurrentUserQuery } from "@gql/gql-types";
import { gql } from "@apollo/client";

export const CURRENT_USER = gql`
  query CurrentUser {
    currentUser {
      id
      username
      firstName
      lastName
      email
      isSuperuser
      pk
      unitRoles {
        id
        permissions
        units {
          id
          pk
          nameFi
        }
        role
      }
      generalRoles {
        id
        permissions
        role
      }
    }
  }
`;

type UserNode = CurrentUserQuery["currentUser"];

const hasGeneralPermission = (permissionName: string, user: UserNode) =>
  user?.generalRoles?.find((x) =>
    x?.permissions?.find((y) => y === permissionName)
  ) != null;

function hasUnitPermission(
  permissionName: UserPermissionChoice,
  unitPk: number,
  user: UserNode
): boolean {
  const unitRoles = filterNonNullable(user?.unitRoles);

  for (const role of unitRoles) {
    const perms = filterNonNullable(role.permissions?.map((x) => x));
    if (perms.find((x) => x.toString() === permissionName) == null) {
      continue;
    }

    // Check unit specific permissions
    if (role.units?.find((x) => x?.pk === unitPk)) {
      return true;
    }
  }

  return false;
}

/// Returns true if the user is allowed to perform operation for a specific unit or service sector
export const hasPermission =
  (user: CurrentUserQuery["currentUser"]) =>
  (permissionName: UserPermissionChoice, unitPk?: number): boolean => {
    if (!user) {
      return false;
    }
    if (user.isSuperuser) {
      return true;
    }
    if (hasGeneralPermission(permissionName, user)) {
      return true;
    }

    if (unitPk && hasUnitPermission(permissionName, unitPk, user)) {
      return true;
    }

    return false;
  };

/// Returns true if the user if the user is allowed to perform what the permission is for
/// e.g. if the user allowed to view some reservations but not all this will return true
export function hasSomePermission(
  user: NonNullable<CurrentUserQuery["currentUser"]>,
  permission: UserPermissionChoice
): boolean {
  if (user.isSuperuser) {
    return true;
  }

  const someUnitRoles = user?.unitRoles?.some((role) =>
    role.permissions?.some((p) => p === permission)
  );

  const someGeneralRoles = user?.generalRoles?.some((r) =>
    r.permissions?.some((x) => x === permission)
  );

  return someUnitRoles || someGeneralRoles;
}

/// Returns true if the user has any kind of access to the system
export function hasAnyPermission(user: UserNode): boolean {
  if (!user) {
    return false;
  }
  if (user.isSuperuser) {
    return true;
  }

  const someUnitRoles =
    user?.unitRoles?.some(
      (role) => role.permissions != null && role.permissions?.length > 0
    ) ?? false;

  const someGeneralRoles =
    user?.generalRoles?.some(
      (role) => role.permissions != null && role.permissions?.length > 0
    ) ?? false;

  return someUnitRoles || someGeneralRoles;
}
