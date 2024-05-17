import React from "react";
import { Permission } from "app/modules/permissionHelper";
import usePermission, {
  type ReservationPermissionType,
} from "app/hooks/usePermission";

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
