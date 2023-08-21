// TODO move this hook up
import { useQuery } from "@apollo/client";
import { useSession } from "next-auth/react";
import { type Query, type ReservationType } from "common/types/gql-types";
import {
  hasPermission as baseHasPermission,
  hasSomePermission as baseHasSomePermission,
  hasAnyPermission as baseHasAnyPermission,
  Permission,
} from "app/modules/permissionHelper";
import { CURRENT_USER } from "app/context/queries";

const usePermission = () => {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const { data: user } = useQuery<Query>(CURRENT_USER, {
    skip: !isAuthenticated,
    fetchPolicy: "no-cache",
  });

  const hasSomePermission = (permissionName: Permission) => {
    if (!isAuthenticated || !user?.currentUser) return false;
    return baseHasSomePermission(user?.currentUser, permissionName);
  };

  const hasAnyPermission = () => {
    if (!isAuthenticated || !user?.currentUser) return false;
    return baseHasAnyPermission(user?.currentUser);
  };

  const hasPermission = (
    reservation: ReservationType,
    permissionName: Permission,
    includeOwn = true
  ) => {
    if (!isAuthenticated || !user?.currentUser) return false;

    const serviceSectorPks =
      reservation?.reservationUnits?.[0]?.unit?.serviceSectors
        ?.map((x) => x?.pk)
        ?.filter((x): x is number => x != null) ?? [];

    const unitPk = reservation?.reservationUnits?.[0]?.unit?.pk ?? undefined;

    const permissionCheck = baseHasPermission(user?.currentUser);
    const permission = permissionCheck(
      permissionName,
      unitPk,
      serviceSectorPks
    );

    const isUsersOwnReservation =
      reservation?.user?.pk === user?.currentUser?.pk;

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

  const actualUser =
    isAuthenticated && user?.currentUser ? user.currentUser : undefined;
  return {
    user: actualUser,
    hasPermission,
    hasSomePermission,
    hasAnyPermission,
  };
};

export default usePermission;
