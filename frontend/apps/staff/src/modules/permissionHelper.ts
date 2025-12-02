import { gql } from "@apollo/client";
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

function hasUnitPermission(permission: UserPermissionChoice, unitPk: number, user: NonNullable<UserNode>): boolean {
  for (const role of user.unitRoles) {
    const perms = role.permissions.map((x) => x);
    if (!perms.some((x) => x === permission)) {
      continue;
    }
    const unitPksInGroups = role.unitGroups.flatMap((x) => x.units.map((y) => y.pk));
    if (unitPksInGroups.some((x) => x === unitPk)) {
      return true;
    }

    // Check unit specific permissions
    if (role.units.some((x) => x.pk === unitPk)) {
      return true;
    }
  }

  return false;
}

function hasGeneralPermission(permission: UserPermissionChoice, user: NonNullable<UserNode>): boolean {
  const roles = user.generalRoles;
  return roles.some((x) => x.permissions.some((y) => y === permission));
}

/// Check if the user has a specific permission in any of their roles
/// If a unitPk is provided, check if the user has that permission for that specific unit, otherwise check for any units
export function hasPermission(
  user: CurrentUserQuery["currentUser"],
  permission: UserPermissionChoice,
  unitPk?: number | null
): boolean {
  if (!user) {
    return false;
  }
  if (user.isSuperuser) {
    return true;
  }
  if (hasGeneralPermission(permission, user)) {
    return true;
  }

  if (unitPk && hasUnitPermission(permission, unitPk, user)) {
    return true;
  }
  if (!unitPk && hasSomePermission(user, permission)) {
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

  const someGeneralRoles = user.generalRoles.some((r) => r.permissions.some((x) => x === permission));
  if (someGeneralRoles) {
    return true;
  }

  const someUnitRoles = user.unitRoles.some((role) => role.permissions.some((p) => p === permission));

  return someUnitRoles && !onlyGeneral;
}

function hasPerm(role: Pick<NonNullable<UserNode>["unitRoles"][0], "permissions">): boolean {
  return role.permissions != null && role.permissions.length > 0;
}

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
