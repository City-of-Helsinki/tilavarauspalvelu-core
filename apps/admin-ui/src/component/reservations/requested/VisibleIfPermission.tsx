import React from "react";
import { Permission } from "@/modules/permissionHelper";
import usePermission, {
  type ReservationPermissionType,
} from "@/hooks/usePermission";

const VisibleIfPermission = ({
  reservation,
  permission,
  children,
  otherwise,
}: {
  reservation: ReservationPermissionType;
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
