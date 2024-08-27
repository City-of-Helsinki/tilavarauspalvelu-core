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

function hasUnitPermission(
  permission: UserPermissionChoice,
  unitPk: number,
  user: UserNode
): boolean {
  const unitRoles = filterNonNullable(user?.unitRoles);

  for (const role of unitRoles) {
    const perms = filterNonNullable(role.permissions?.map((x) => x));
    if (perms.find((x) => x === permission) == null) {
      continue;
    }

    // Check unit specific permissions
    if (role.units?.find((x) => x?.pk === unitPk)) {
      return true;
    }
  }

  return false;
}

function hasGeneralPermission(
  permission: UserPermissionChoice,
  user: UserNode
) {
  const roles = filterNonNullable(user?.generalRoles);
  return roles.find(
    (x) => x.permissions?.find((y) => y === permission) != null
  );
}

/// Returns true if the user is allowed to perform operation for a specific unit or service sector
export function hasPermission(
  user: CurrentUserQuery["currentUser"],
  permissionName: UserPermissionChoice,
  unitPk?: number
): boolean {
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
}

/// Returns true if the user if the user is allowed to perform what the permission is for
/// e.g. if the user allowed to view some reservations but not all this will return true
export function hasSomePermission(
  user: CurrentUserQuery["currentUser"],
  permission: UserPermissionChoice,
  onlyGeneral = false
): boolean {
  if (!user) {
    return false;
  }
  if (user.isSuperuser) {
    return true;
  }

  const someGeneralRoles = user?.generalRoles?.some((r) =>
    r.permissions?.some((x) => x === permission)
  );
  if (someGeneralRoles) {
    return true;
  }

  const someUnitRoles = user?.unitRoles?.some((role) =>
    role.permissions?.some((p) => p === permission)
  );

  return someUnitRoles && !onlyGeneral;
}

/// Returns true if the user has any kind of access to the system
export function hasAnyPermission(user: UserNode): boolean {
  if (!user) {
    return false;
  }
  if (user.isSuperuser) {
    return true;
  }

  const hasPerm = (role: Pick<(typeof user.unitRoles)[0], "permissions">) =>
    role.permissions != null && role.permissions.length > 0;

  const someUnitRoles = user.unitRoles.some(hasPerm);
  const someGeneralRoles = user.generalRoles.some(hasPerm);

  return someUnitRoles || someGeneralRoles;
}
