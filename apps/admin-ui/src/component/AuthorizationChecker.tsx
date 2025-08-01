import React from "react";
import { useSession } from "@/hooks";
import { MainLander } from "@/component/MainLander";
import { Error403 } from "./Error403";
import { UserPermissionChoice } from "@gql/gql-types";
import { hasAnyPermission, hasPermission } from "@/modules/permissionHelper";

interface BaseProps {
  apiUrl: string;
  children: React.ReactElement | React.ReactElement[];
}
interface PropsWithPermission extends BaseProps {
  permission: UserPermissionChoice;
  unitPk?: number | null;
}
type AuthorizationCheckerProps = BaseProps | PropsWithPermission;

export function AuthorizationChecker({ apiUrl, children, ...rest }: AuthorizationCheckerProps): React.ReactElement {
  const { user: currentUser, isAuthenticated } = useSession();
  if (!isAuthenticated) {
    return <MainLander apiBaseUrl={apiUrl} />;
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
