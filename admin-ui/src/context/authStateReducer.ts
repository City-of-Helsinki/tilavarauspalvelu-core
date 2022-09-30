import { get, isEqual, set } from "lodash";
import { User } from "oidc-client";
import { getApiAccessToken, localLogout } from "../common/auth/util";
import { UserType } from "../common/gql-types";

export type AuthState =
  | "Unknown"
  | "Authenticated"
  | "HasPermissions"
  | "NoPermissions"
  | "NotAutenticated"
  | "Error";

export type Auth = {
  state: AuthState;
  user?: UserType;
  sid?: string;
  login?: () => void;
  logout?: () => void;
};

// eslint-disable-next-line @typescript-eslint/ban-types
export type YesItsAFunction = Function;

export type Action =
  | {
      type: "setUser";
      user: User | null;
      login: YesItsAFunction;
      logout: YesItsAFunction;
    }
  | { type: "error"; message: string }
  | { type: "currentUserLoaded"; currentUser: UserType };

export const getInitialState = (): Auth => ({
  state: "Unknown",
});

export const authStateReducer = (state: Auth, action: Action): Auth => {
  switch (action.type) {
    case "setUser": {
      const newState = { ...state };

      if (action.user === null && getApiAccessToken() === null) {
        set(newState, "state", "NotAutenticated");
      }
      if (action.user) {
        if (state.state === "NotAutenticated") {
          set(newState, "state", "Authenticated");
        }
      }
      if (action.user?.profile.sid) {
        if (!newState.sid || newState.sid !== action.user.profile.sid) {
          set(newState, "sid", action.user.profile.sid);
        }
      }
      if (!newState.login && action.login !== undefined) {
        set(newState, "login", action.login);
      }
      if (!newState.logout && action.logout) {
        set(newState, "logout", () => {
          localLogout();
          action.logout();
        });
      }

      if (isEqual(newState, state)) {
        return state;
      }

      return newState;
    }
    case "error": {
      return { ...state, state: "Error" };
    }
    case "currentUserLoaded": {
      const { currentUser } = action;

      const hasSomePermissions =
        get(currentUser, "generalRoles.length") > 0 ||
        get(currentUser, "serviceSectorRoles.length") > 0 ||
        get(currentUser, "unitRoles.length") > 0 ||
        currentUser.isSuperuser;

      return {
        ...state,
        user: currentUser,
        state: hasSomePermissions ? "HasPermissions" : "NoPermissions",
      };
    }
    default:
      return { ...state };
  }
};
