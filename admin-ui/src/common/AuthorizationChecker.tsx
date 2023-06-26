import React from "react";
import MainLander from "app/component/MainLander";
import { MainMenuWrapper } from "app/component/withMainMenu";
import { useAuthState } from "../context/AuthStateContext";
import { AuthState, Permission } from "../context/authStateReducer";

import Error403 from "./Error403";
import Error5xx from "./Error5xx";

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

const AuthorisationChecker = ({
  children,
  permission,
}: {
  children: React.ReactNode;
  permission?: Permission;
}) => {
  const { authState } = useAuthState();
  const { hasSomePermission } = authState;
  const error = AuthStateError(authState.state);
  if (error) return error;

  if (permission && !hasSomePermission(permission)) {
    return (
      <MainMenuWrapper>
        <Error403 />
      </MainMenuWrapper>
    );
  }
  return <>{children}</>;
};

export default AuthorisationChecker;
