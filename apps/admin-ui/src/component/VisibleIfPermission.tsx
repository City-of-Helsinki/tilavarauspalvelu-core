import React from "react";
import { useCheckPermission } from "@/hooks";
import {
  type ReservationUnitReservationsFragment,
  UserPermissionChoice,
} from "@gql/gql-types";
import { useSession } from "@/hooks/auth";

type ReservationPermissionType = Pick<
  ReservationUnitReservationsFragment,
  "reservationUnit" | "user"
>;

function VisibleIfPermission({
  reservation,
  permission,
  children,
  otherwise,
}: {
  reservation: ReservationPermissionType;
  permission: UserPermissionChoice;
  children: React.ReactNode;
  otherwise?: React.ReactNode;
}): JSX.Element | null {
  const { user } = useSession();
  const isOwner = reservation.user?.pk === user?.pk;
  const { hasPermission } = useCheckPermission({
    units: [reservation?.reservationUnit?.[0]?.unit?.pk ?? 0],
    permission,
  });

  if (!isOwner && !hasPermission) {
    return otherwise ? <>{otherwise}</> : null;
  }

  return <>{children}</>;
}

export default VisibleIfPermission;
