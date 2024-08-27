import { useSession } from "app/hooks/auth";
import {
  type UnitNode,
  type ApplicationRoundQuery,
  type CurrentUserQuery,
  UserPermissionChoice,
} from "@gql/gql-types";
import {
  hasPermission as baseHasPermission,
  hasSomePermission as baseHasSomePermission,
  hasAnyPermission as baseHasAnyPermission,
} from "@/modules/permissionHelper";
import { filterNonNullable } from "common/src/helpers";

export type UnitPermissionFragment =
  | {
      pk?: number | null | undefined;
    }
  | null
  | undefined;

type UserNode = CurrentUserQuery["currentUser"];

const hasUnitPermission = (
  user: UserNode,
  permissionName: UserPermissionChoice,
  unit: UnitPermissionFragment
): boolean => {
  if (user == null || unit?.pk == null) {
    return false;
  }

  const permission = baseHasPermission(user)(permissionName, unit.pk);

  return permission;
};

// TODO replace with a permission fragment (so the type is auto generated)
export type ReservationPermissionType = {
  reservationUnit?:
    | {
        unit?:
          | {
              pk?: number | undefined | null;
            }
          | undefined
          | null;
      }[]
    | null
    | undefined;
  user?: { pk?: number | undefined | null } | null | undefined;
};

const hasPermission = (
  user: UserNode | null | undefined,
  reservation: ReservationPermissionType | null | undefined,
  permissionName: UserPermissionChoice,
  includeOwn = true
) => {
  if (!user) {
    return false;
  }

  const { unit } = reservation?.reservationUnit?.[0] ?? {};

  const unitPk = unit?.pk ?? undefined;

  const permissionCheck = baseHasPermission(user);
  const permission = permissionCheck(permissionName, unitPk);

  const isUsersOwnReservation = reservation?.user?.pk === user?.pk;

  const ownPermissions =
    includeOwn && isUsersOwnReservation
      ? permissionCheck(UserPermissionChoice.CanCreateStaffReservations, unitPk)
      : false;

  return permission || ownPermissions;
};

/// @returns {user, hasPermission, hasSomePermission, hasAnyPermission}
export function usePermission() {
  const { user } = useSession();

  const hasSomePermission = (permissionName: UserPermissionChoice) => {
    if (!user) return false;
    return baseHasSomePermission(user, permissionName);
  };

  const hasAnyPermission = () => {
    if (!user) return false;
    return baseHasAnyPermission(user);
  };

  // TODO restrict the Permission type to only those that are applicable to application rounds
  const hasApplicationRoundPermission = (
    applicationRound: ApplicationRoundQuery["applicationRound"],
    permission: UserPermissionChoice
  ) => {
    if (!applicationRound) return false;
    if (!user) return false;
    const units = filterNonNullable(
      applicationRound.reservationUnits.flatMap((ru) => ru.unit)
    );
    for (const unit of units) {
      if (hasUnitPermission(user, permission, unit as UnitNode)) {
        return true;
      }
    }
    return false;
  };

  // TODO this is becoming convoluted with the addition of a new function for each object type
  return {
    user,
    hasPermission: (
      reservation: ReservationPermissionType,
      permissionName: UserPermissionChoice,
      includeOwn = true
    ) => hasPermission(user, reservation, permissionName, includeOwn),
    hasSomePermission,
    hasAnyPermission,
    hasUnitPermission: (
      permission: UserPermissionChoice,
      unit: UnitPermissionFragment
    ) => user != null && hasUnitPermission(user, permission, unit),
    hasApplicationRoundPermission,
  };
}

// NOTE duplicated code from usePermission, because react hooks break if we do some conditional magic
// Suspended version should be used sparingly because it has to be wrapped in a Suspense component
// and if not it can go to infinite loops or crash.
export function usePermissionSuspended() {
  // TODO should this be suspended? doesn't seem to need it
  const { user } = useSession();

  const hasSomePermission = (permissionName: UserPermissionChoice) => {
    if (!user) return false;
    return baseHasSomePermission(user, permissionName);
  };

  const hasAnyPermission = () => {
    if (!user) return false;
    return baseHasAnyPermission(user);
  };

  return {
    user,
    hasPermission: (
      reservation: ReservationPermissionType,
      permissionName: UserPermissionChoice,
      includeOwn = true
    ) => hasPermission(user, reservation, permissionName, includeOwn),
    hasSomePermission,
    hasAnyPermission,
  };
}
