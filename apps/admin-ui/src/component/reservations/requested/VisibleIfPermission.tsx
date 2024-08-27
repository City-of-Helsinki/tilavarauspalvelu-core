import React from "react";
import {
  usePermission,
  type ReservationPermissionType,
} from "@/hooks/usePermission";
import { UserPermissionChoice } from "@gql/gql-types";

const VisibleIfPermission = ({
  reservation,
  permission,
  children,
  otherwise,
}: {
  reservation: ReservationPermissionType;
  permission: UserPermissionChoice;
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
