import React from "react";
import { MainLander } from "@/components/MainLander";
import { useSession } from "@/hooks";
import { hasAnyPermission, hasPermission } from "@/modules/permissionHelper";
import type { UserPermissionChoice } from "@gql/gql-types";
import { Error403 } from "./Error403";

interface BaseProps {
  children: React.ReactElement | React.ReactElement[];
}
interface PropsWithPermission extends BaseProps {
  permission: UserPermissionChoice;
  unitPk?: number | null;
}
type AuthorizationCheckerProps = BaseProps | PropsWithPermission;

export function AuthorizationChecker({ children, ...rest }: AuthorizationCheckerProps): React.ReactElement {
  const { user: currentUser, isAuthenticated } = useSession();
  if (!isAuthenticated) {
    return <MainLander />;
  }

  let hasAccess = false;
  if ("permission" in rest) {
    const { permission, unitPk } = rest;
    hasAccess = hasPermission(currentUser, permission, unitPk);
  } else {
    hasAccess = hasAnyPermission(currentUser);
  }

  // eslint-disable-next-line react/jsx-no-useless-fragment
  return hasAccess ? <>{children}</> : <Error403 />;
}
