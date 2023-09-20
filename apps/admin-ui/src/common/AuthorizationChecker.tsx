import React, { Suspense } from "react";
import { useSession } from "app/hooks/auth";
import { Permission } from "app/modules/permissionHelper";
import { usePermissionSuspended } from "app/hooks/usePermission";
import MainLander from "app/component/MainLander";
import Loader from "app/component/Loader";

import Error403 from "./Error403";

const AuthorisationChecker = ({
  children,
  permission,
}: {
  children: React.ReactNode;
  permission?: Permission;
}) => {
  const { hasAnyPermission, hasSomePermission } = usePermissionSuspended();

  const { isAuthenticated } = useSession();
  if (!isAuthenticated) {
    return <MainLander />;
  }

  const hasAccess = permission
    ? hasSomePermission(permission)
    : hasAnyPermission();

  // Use suspense to avoid flash of unauthorised content
  return (
    <Suspense fallback={<Loader />}>
      {hasAccess ? children : <Error403 />}
    </Suspense>
  );
};

export default AuthorisationChecker;
