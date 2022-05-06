import { User } from "oidc-client";
import React, { useContext, useEffect } from "react";
import { getCurrentUser } from "../common/api";
import {
  assertApiAccessTokenIsAvailableAndFresh,
  clearApiAccessToken,
  localLogout,
} from "../common/auth/util";
import {
  Auth,
  authStateReducer,
  getInitialState,
  YesItsAFunction,
} from "./authStateReducer";
import OIDCLibIntegration from "./OIDCLibIntegration";

export type AuthStateProps = {
  authState: Auth;
};

export const AuthStateContext = React.createContext<AuthStateProps>({
  authState: { state: "Unknown" },
});

export const useAuthState = (): AuthStateProps => useContext(AuthStateContext);

export const AuthStateContextProvider: React.FC = ({ children }) => {
  const [authState, dispatch] = React.useReducer(
    authStateReducer,
    getInitialState()
  );

  useEffect(() => {
    const check = async () => {
      const status = await assertApiAccessTokenIsAvailableAndFresh();
      if (status === "Available") {
        // token is available and fresh, read user permissions
        try {
          const cu = await getCurrentUser();
          dispatch({ type: "currentUserLoaded", currentUser: cu });
        } catch (e) {
          // error reading user permissions
          dispatch({ type: "error", message: "Current User Not Available" });
        }
      } else {
        // token is not available and we failed to get one
        clearApiAccessToken();
        localLogout(true);
        dispatch({ type: "error", message: "No Token Available" });
      }
    };
    if (authState.sid && !authState.user) {
      check();
    }
  }, [authState.sid, authState.user]);

  return (
    <AuthStateContext.Provider
      value={{
        authState,
      }}
    >
      {children}
      <OIDCLibIntegration
        setUser={(
          user: User,
          login: YesItsAFunction,
          logout: YesItsAFunction
        ) => {
          dispatch({
            type: "setUser",
            user,
            login,
            logout,
          });
        }}
      />
    </AuthStateContext.Provider>
  );
};
