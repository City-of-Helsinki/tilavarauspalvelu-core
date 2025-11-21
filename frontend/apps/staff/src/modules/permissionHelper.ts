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

/**
 * Checks if user has a specific permission for a given unit
 * Checks both direct unit permissions and unit group permissions
 * @param permission - Permission to check for
 * @param unitPk - Unit primary key
 * @param user - Current user object
 * @returns True if user has the permission for the unit, false otherwise
 */
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

/**
 * Checks if user has a general (non-unit-specific) permission
 * @param permission - Permission to check for
 * @param user - Current user object
 * @returns True if user has the general permission, false otherwise
 */
function hasGeneralPermission(permission: UserPermissionChoice, user: UserNode) {
  const roles = filterNonNullable(user?.generalRoles);
  return roles.find((x) => x.permissions?.find((y) => y === permission) != null);
}

/**
 * Checks if user has a specific permission in any of their roles
 * If unitPk is provided, checks permission for that specific unit
 * If unitPk is null/undefined, checks for general permission or any unit permission
 * @param user - Current user object
 * @param permissionName - Permission to check for
 * @param unitPk - Optional unit primary key to check permission for specific unit
 * @returns True if user has the permission, false otherwise
 */
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
  return !unitPk && hasSomePermission(user, permissionName);
}

/**
 * Checks if user has a specific permission for at least some entities (not necessarily all)
 * Returns true if user is allowed to perform the action for any units or generally
 * @param user - Current user object
 * @param permission - Permission to check for
 * @param onlyGeneral - If true, only checks general permissions (ignores unit-specific permissions)
 * @returns True if user has the permission for at least some context, false otherwise
 * @example
 * // User can view some reservations (but not necessarily all)
 * hasSomePermission(user, UserPermissionChoice.CanViewReservations) // returns true
 */
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

/**
 * Checks if user has any kind of access/permissions in the system
 * Returns true if user has any permissions (general or unit-specific)
 * @param user - Current user object
 * @returns True if user has any permissions, false otherwise
 */
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
