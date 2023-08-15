// TODO move this hook up
import { useQuery } from "@apollo/client";
import { type Query, type ReservationType } from "common/types/gql-types";
import {
  hasPermission as baseHasPermission,
  hasSomePermission as baseSomeHasPermission,
  Permission,
} from "app/modules/permissionHelper";
import { CURRENT_USER } from "../../../../context/queries";

const usePermission = () => {
  const { data: user } = useQuery<Query>(CURRENT_USER);

  const hasSomePermission = (permissionName: Permission) => {
    if (!user?.currentUser) return false;
    return baseSomeHasPermission(user?.currentUser, permissionName);
  };

  const hasPermission = (
    reservation: ReservationType,
    permissionName: Permission,
    includeOwn = true
  ) => {
    if (!user?.currentUser) return false;

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

  return {
    user: user?.currentUser ?? undefined,
    hasPermission,
    hasSomePermission,
  };
};

export default usePermission;
