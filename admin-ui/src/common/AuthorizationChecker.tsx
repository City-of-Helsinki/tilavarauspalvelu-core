import React from "react";
import { useSession } from "next-auth/react";
import { Permission } from "app/modules/permissionHelper";
import usePermission from "app/hooks/usePermission";
import MainLander from "app/component/MainLander";

import Error403 from "./Error403";

const AuthorisationChecker = ({
  children,
  permission,
}: {
  children: React.ReactNode;
  permission?: Permission;
}) => {
  const { hasAnyPermission, hasSomePermission } = usePermission();

  const { data: session } = useSession();
  if (!session?.user) {
    return <MainLander />;
  }

  const hasAccess = permission
    ? hasSomePermission(permission)
    : hasAnyPermission();
  if (!hasAccess) {
    return <Error403 showLogoutSection />;
  }
  return <>{children}</>;
};

export default AuthorisationChecker;
