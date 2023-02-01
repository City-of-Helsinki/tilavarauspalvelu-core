import { useQuery } from "@apollo/client";
import { User } from "oidc-client";
import React, { useContext, useEffect, useMemo } from "react";
import { Query } from "common/types/gql-types";

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
import { CURRENT_USER } from "./queries";

export type AuthStateProps = {
  authState: Auth;
};

export const AuthStateContext = React.createContext<AuthStateProps>({
  authState: { state: "Unknown", hasPermission: () => false },
});

export const useAuthState = (): AuthStateProps => useContext(AuthStateContext);

type Props = {
  children: React.ReactNode;
};

export const AuthStateContextProvider: React.FC<Props> = ({
  children,
}: Props) => {
  const [authState, dispatch] = React.useReducer(
    authStateReducer,
    getInitialState()
  );

  const skip = authState.state !== "ApiKeyAvailable";
  const checkApiToken = authState.state === "Authenticated";

  useQuery<Query>(CURRENT_USER, {
    skip,
    onCompleted: ({ currentUser }) => {
      if (currentUser) {
        dispatch({ type: "currentUserLoaded", currentUser });
      } else {
        dispatch({ type: "error", message: "Current User Not Available" });
      }
    },
    onError: () => {
      dispatch({ type: "error", message: "Current User Not Available" });
    },
  });

  useEffect(() => {
    const check = async () => {
      const status = await assertApiAccessTokenIsAvailableAndFresh();
      if (status === "Available") {
        dispatch({ type: "apiTokenAvailable" });
      }
      if (status !== "Available") {
        // token is not available and we failed to get one
        clearApiAccessToken();
        localLogout(true);
        window.location.reload();
      }
    };
    if (checkApiToken) {
      check();
    }
  }, [checkApiToken]);

  const notificationContextValues = useMemo(
    () => ({
      authState,
    }),
    [authState]
  );

  return (
    <AuthStateContext.Provider value={notificationContextValues}>
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
