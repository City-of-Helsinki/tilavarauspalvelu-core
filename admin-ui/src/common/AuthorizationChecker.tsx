import React from "react";
import { useSession } from "next-auth/react";
import { Permission } from "app/context/permissionHelper";
import usePermission from "app/component/reservations/requested/hooks/usePermission";

import Error403 from "./Error403";

/* FIXME
const AuthStateError = (state: AuthState) => {
  switch (state) {
    case "HasPermissions":
      return null;
    case "NoPermissions":
      return <Error403 showLogoutSection />;
    case "NotAutenticated":
      return <MainLander />;
    case "ApiKeyAvailable":
    case "Unknown":
    case "Authenticated":
      return <span />;
    case "Error":
      return <Error5xx />;
  }
  return <Error5xx />;
};
*/

const AuthorisationChecker = ({
  children,
  permission,
}: {
  children: React.ReactNode;
  permission?: Permission;
}) => {
  const { hasSomePermission } = usePermission();

  // Only allow logged in
  const { data: session } = useSession();
  if (!session?.user) {
    return <Error403 />;
  }

  // Only allow if user has permission
  if (permission && !hasSomePermission(permission)) {
    return <Error403 showLogoutSection />;
  }
  return <>{children}</>;
};

export default AuthorisationChecker;
