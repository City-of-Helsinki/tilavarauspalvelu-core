import { useSuspenseQuery, useQuery } from "@apollo/client";
import { useSession } from "next-auth/react";
import {
  type Query,
  type ReservationType,
  type UserType,
} from "common/types/gql-types";
import {
  hasPermission as baseHasPermission,
  hasSomePermission as baseHasSomePermission,
  hasAnyPermission as baseHasAnyPermission,
  Permission,
} from "app/modules/permissionHelper";
import { CURRENT_USER } from "app/context/queries";

const hasPermission = (
  user: UserType | undefined,
  reservation: ReservationType,
  permissionName: Permission,
  includeOwn = true
) => {
  if (!user) {
    return false;
  }

  const serviceSectorPks =
    reservation?.reservationUnits?.[0]?.unit?.serviceSectors
      ?.map((x) => x?.pk)
      ?.filter((x): x is number => x != null) ?? [];

  const unitPk = reservation?.reservationUnits?.[0]?.unit?.pk ?? undefined;

  const permissionCheck = baseHasPermission(user);
  const permission = permissionCheck(permissionName, unitPk, serviceSectorPks);

  const isUsersOwnReservation = reservation?.user?.pk === user?.pk;

  const ownPermissions =
    includeOwn && isUsersOwnReservation
      ? permissionCheck(
          Permission.CAN_CREATE_STAFF_RESERVATIONS,
          unitPk,
          serviceSectorPks
        )
      : false;

  return permission || ownPermissions;
};

/// @returns {user, hasPermission, hasSomePermission, hasAnyPermission}
const usePermission = () => {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const { data, error } = useQuery<Query>(CURRENT_USER, {
    skip: !isAuthenticated,
  });

  const user = data?.currentUser ?? undefined;

  const hasSomePermission = (permissionName: Permission) => {
    if (!isAuthenticated || error || !user) return false;
    return baseHasSomePermission(user, permissionName);
  };

  const hasAnyPermission = () => {
    if (!isAuthenticated || error || !user) return false;
    return baseHasAnyPermission(user);
  };

  return {
    user,
    hasPermission: (
      reservation: ReservationType,
      permissionName: Permission,
      includeOwn = true
    ) => hasPermission(user, reservation, permissionName, includeOwn),
    hasSomePermission,
    hasAnyPermission,
  };
};

// NOTE duplicated code from usePermission, because react hooks break if we do some conditional magic
// Suspended version should be used sparingly because it has to be wrapped in a Suspense component
// and if not it can go to infinite loops or crash.
const usePermissionSuspended = () => {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const { data, error } = useSuspenseQuery<Query>(CURRENT_USER, {
    skip: !isAuthenticated,
  });

  const user = data?.currentUser ?? undefined;
  const hasSomePermission = (permissionName: Permission) => {
    if (!isAuthenticated || error || !user) return false;
    return baseHasSomePermission(user, permissionName);
  };

  const hasAnyPermission = () => {
    if (!isAuthenticated || error || !user) return false;
    return baseHasAnyPermission(user);
  };

  return {
    user,
    hasPermission: (
      reservation: ReservationType,
      permissionName: Permission,
      includeOwn = true
    ) => hasPermission(user, reservation, permissionName, includeOwn),
    hasSomePermission,
    hasAnyPermission,
  };
};

export { usePermissionSuspended };

export default usePermission;
