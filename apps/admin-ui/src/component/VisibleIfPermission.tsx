import React, { type ReactNode } from "react";
import { useCheckPermission } from "@/hooks";
import {
  type ReservationUnitReservationsFragment,
  UserPermissionChoice,
} from "@gql/gql-types";
import { useSession } from "@/hooks/auth";

type ReservationPermissionType = Pick<
  ReservationUnitReservationsFragment,
  "reservationUnits" | "user"
>;

function VisibleIfPermission({
  reservation,
  permission,
  children,
  otherwise,
}: {
  reservation: ReservationPermissionType;
  permission: UserPermissionChoice;
  children: ReactNode;
  otherwise?: JSX.Element | null;
}): JSX.Element | null {
  const { user } = useSession();
  const isOwner = reservation.user?.pk === user?.pk;
  const { hasPermission } = useCheckPermission({
    units: [reservation?.reservationUnits?.[0]?.unit?.pk ?? 0],
    permission,
  });

  if (!isOwner && !hasPermission) {
    return otherwise ? otherwise : null;
  }

  // eslint-disable-next-line react/jsx-no-useless-fragment -- return type issues
  return <>{children}</>;
}

export default VisibleIfPermission;
