import { useQuery } from "@apollo/client";
import { Permission } from "app/context/authStateReducer";
import { type Query, type ReservationType } from "common/types/gql-types";
// import { useAuthState } from "../../../../context/AuthStateContext";
import { CURRENT_USER } from "../../../../context/queries";

const usePermission = () => {
  const { data: user } = useQuery<Query>(CURRENT_USER);
  // const { authState } = useAuthState();
  // const { hasPermission: baseHasPermission } = authState;

  const hasPermission = (
    reservation: ReservationType,
    permissionName: Permission,
    includeOwn = true
  ) => {
    const serviceSectorPks =
      reservation?.reservationUnits?.[0]?.unit?.serviceSectors
        ?.map((x) => x?.pk)
        ?.filter((x): x is number => x != null) ?? [];

    const unitPk = reservation?.reservationUnits?.[0]?.unit?.pk ?? undefined;

    /*
    const permission = baseHasPermission(
      permissionName,
      unitPk,
      serviceSectorPks
    );

    const isUsersOwnReservation =
      reservation?.user?.pk === user?.currentUser?.pk;

    const ownPermissions =
      includeOwn && isUsersOwnReservation
        ? baseHasPermission(
            Permission.CAN_CREATE_STAFF_RESERVATIONS,
            unitPk,
            serviceSectorPks
          )
        : false;

    return permission || ownPermissions;
    */
    return false;
  };

  return {
    hasPermission,
  };
};

export default usePermission;
