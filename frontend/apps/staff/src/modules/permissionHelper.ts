import { gql } from "@apollo/client";
import { filterNonNullable } from "ui/src/modules/helpers";
import type { CurrentUserQuery, UserPermissionChoice } from "@gql/gql-types";

export const CURRENT_USER = gql`
  query CurrentUser {
    currentUser {
      id
      pk
      username
      firstName
      lastName
      email
      isSuperuser
      isAdAuthenticated
      unitRoles {
        id
        permissions
        units {
          id
          pk
          nameFi
        }
        unitGroups {
          id
          units {
            id
            pk
          }
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

function hasUnitPermission(permission: UserPermissionChoice, unitPk: number, user: UserNode): boolean {
  const unitRoles = filterNonNullable(user?.unitRoles);

  for (const role of unitRoles) {
    const perms = filterNonNullable(role.permissions?.map((x) => x));
    if (perms.some((x) => x === permission) == null) {
      continue;
    }
    const unitsInGroups = filterNonNullable(role.unitGroups?.flatMap((x) => x.units.map((y) => y.pk)));
    if (unitsInGroups.some((x) => x === unitPk)) {
      return true;
    }

    // Check unit specific permissions
    if (role.units?.find((x) => x?.pk === unitPk)) {
      return true;
    }
  }

  return false;
}

function hasGeneralPermission(permission: UserPermissionChoice, user: UserNode) {
  const roles = filterNonNullable(user?.generalRoles);
  return roles.find((x) => x.permissions?.find((y) => y === permission) != null);
}

/// Check if the user has a specific permission in any of their roles
/// If a unitPk is provided, check if the user has that permission for that specific unit, otherwise check for any units
export function hasPermission(
  user: CurrentUserQuery["currentUser"],
  permissionName: UserPermissionChoice,
  unitPk?: number | null
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
  if (!unitPk && hasSomePermission(user, permissionName)) {
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

  const someGeneralRoles = user?.generalRoles?.some((r) => r.permissions?.some((x) => x === permission));
  if (someGeneralRoles) {
    return true;
  }

  const someUnitRoles = user?.unitRoles?.some((role) => role.permissions?.some((p) => p === permission));

  return someUnitRoles && !onlyGeneral;
}

const hasPerm = (role: Pick<NonNullable<UserNode>["unitRoles"][0], "permissions">) =>
  role.permissions != null && role.permissions.length > 0;

/// Returns true if the user has any kind of access to the system
export function hasAnyPermission(user: UserNode): boolean {
  if (!user) {
    return false;
  }
  if (user.isSuperuser) {
    return true;
  }

  const someUnitRoles = user.unitRoles.some(hasPerm);
  const someGeneralRoles = user.generalRoles.some(hasPerm);

  return someUnitRoles || someGeneralRoles;
}
