import React, { type ReactNode } from "react";
import { gql } from "@apollo/client";
import { useSession } from "@/hooks";
import { hasPermission } from "@/modules/permissionHelper";
import { UserPermissionChoice, type VisibleIfPermissionFieldsFragment } from "@gql/gql-types";

function VisibleIfPermission({
  reservation,
  permission,
  children,
  otherwise,
}: {
  reservation: VisibleIfPermissionFieldsFragment;
  permission: UserPermissionChoice;
  children: ReactNode;
  otherwise?: React.ReactElement | null;
}): React.ReactElement | null {
  const { user } = useSession();
  const isOwner = reservation.user?.pk === user?.pk;

  const unitPk = reservation?.reservationUnit?.unit?.pk;
  const hasAccess = hasPermission(user, permission, unitPk);

  if (!isOwner && !hasAccess) {
    return otherwise ?? null;
  }

  // eslint-disable-next-line react/jsx-no-useless-fragment -- return type issues
  return <>{children}</>;
}

export default VisibleIfPermission;

export const VISIBLE_IF_PERMISSION_FRAGMENT = gql`
  fragment VisibleIfPermissionFields on ReservationNode {
    id
    user {
      id
      pk
    }
    reservationUnit {
      id
      unit {
        id
        pk
      }
    }
  }
`;
