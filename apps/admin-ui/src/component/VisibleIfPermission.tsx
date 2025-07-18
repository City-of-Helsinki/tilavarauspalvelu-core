import React, { type ReactNode } from "react";
import { useCheckPermission } from "@/hooks";
import { UserPermissionChoice, type VisibleIfPermissionFieldsFragment } from "@gql/gql-types";
import { useSession } from "@/hooks/auth";
import { gql } from "@apollo/client";

function VisibleIfPermission({
  reservation,
  permission,
  children,
  otherwise,
}: {
  reservation: VisibleIfPermissionFieldsFragment;
  permission: UserPermissionChoice;
  children: ReactNode;
  otherwise?: JSX.Element | null;
}): JSX.Element | null {
  const { user } = useSession();
  const isOwner = reservation.user?.pk === user?.pk;
  const { hasPermission } = useCheckPermission({
    units: [reservation.reservationUnit.unit?.pk ?? 0],
    permission,
  });

  if (!isOwner && !hasPermission) {
    return otherwise ? otherwise : null;
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
