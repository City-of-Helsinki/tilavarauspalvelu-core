import React from "react";
import {
  ReservationUnitReservationsFragment,
  type ReservationNode,
} from "@gql/gql-types";
import { Permission } from "app/modules/permissionHelper";
import usePermission from "app/hooks/usePermission";

const VisibleIfPermission = ({
  reservation,
  permission,
  children,
  otherwise,
}: {
  reservation: ReservationNode | ReservationUnitReservationsFragment;
  permission: Permission;
  children: React.ReactNode;
  otherwise?: React.ReactNode;
}) => {
  const { hasPermission } = usePermission();

  if (!hasPermission(reservation, permission)) {
    return otherwise ? <>{otherwise}</> : null;
  }

  return <>{children}</>;
};

export default VisibleIfPermission;
