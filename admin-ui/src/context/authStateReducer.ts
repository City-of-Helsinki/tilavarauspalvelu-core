import { get, isEqual, set } from "lodash";
import { User } from "oidc-client";
import { UserType } from "common/types/gql-types";
import { localLogout } from "../common/auth/util";
import permissionHelper from "./permissionHelper";

export type AuthState =
  | "Unknown" // initial state
  | "Authenticated" // oidc authenticated
  | "ApiKeyAvailable" // api key is available and valid
  | "HasPermissions" // get user call done
  | "NoPermissions" // get user call done
  | "NotAutenticated"
  | "Error";

export enum Permission {
  CAN_COMMENT_RESERVATIONS = "can_comment_reservations",
  CAN_CREATE_STAFF_RESERVATIONS = "can_create_staff_reservations",
  CAN_MANAGE_RESERVATIONS = "can_manage_reservations",
  CAN_VIEW_RESERVATIONS = "can_view_reservations",
  CAN_MANAGE_RESERVATION_UNITS = "can_manage_reservation_units",
  CAN_MANAGE_SPACES = "can_manage_spaces",
  CAN_MANAGE_RESOURCES = "can_manage_resources",
  CAN_MANAGE_UNITS = "can_manage_units",
  CAN_VALIDATE_APPLICATIONS = "can_validate_applications",
}

export type Auth = {
  state: AuthState;
  user?: UserType;
  sid?: string;
  login?: () => void;
  logout?: () => void;
  hasSomePermission: (permission: Permission) => boolean;
  hasPermission: (
    permission: Permission,
    unitPk?: number,
    serviceSectorPks?: number[]
  ) => boolean;
};

// eslint-disable-next-line @typescript-eslint/ban-types
export type YesItsAFunction = Function;

export const isValidAuthState = (state: AuthState): boolean => {
  switch (state) {
    case "Unknown":
    case "Authenticated":
    case "ApiKeyAvailable":
    case "NoPermissions":
    case "NotAutenticated":
    case "Error":
      return false;
    case "HasPermissions":
      return true;
  }
  return false;
};

export type Action =
  | {
      type: "setUser";
      user: User | null;
      login: YesItsAFunction;
      logout: YesItsAFunction;
    }
  | { type: "error"; message: string }
  | { type: "apiTokenAvailable" }
  | { type: "currentUserLoaded"; currentUser: UserType };

export const getInitialState = (): Auth => ({
  state: "Unknown",
  hasPermission: () => false,
  hasSomePermission: () => false,
});

const somePermissions = (user: UserType, permission: Permission) => {
  if (user.isSuperuser) {
    return true;
  }

  const someUnitRoles =
    user?.unitRoles?.some((role) =>
      role?.permissions?.some((p) => p?.permission === permission)
    ) ?? false;

  const someSectorRoles =
    user?.serviceSectorRoles?.some((role) =>
      role?.permissions?.some((p) => p?.permission === permission)
    ) ?? false;

  const someGeneralRoles =
    user?.generalRoles?.some((role) =>
      role?.permissions?.some((p) => p?.permission === permission)
    ) ?? false;

  return someUnitRoles || someSectorRoles || someGeneralRoles;
};

export const authStateReducer = (state: Auth, action: Action): Auth => {
  switch (action.type) {
    case "setUser": {
      const newState = { ...state };

      if (!action.user) {
        set(newState, "state", "NotAutenticated");
      }

      if (action.user) {
        if (state.state === "Unknown" || state.state === "NotAutenticated") {
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
    case "apiTokenAvailable": {
      const newState = { ...state };
      if (state.state === "Authenticated") {
        set(newState, "state", "ApiKeyAvailable");
      }
      return newState;
    }

    case "currentUserLoaded": {
      const { currentUser } = action;

      const hasSomePermissions =
        get(currentUser, "generalRoles.length", 0) > 0 ||
        get(currentUser, "serviceSectorRoles.length", 0) > 0 ||
        get(currentUser, "unitRoles.length", 0) > 0 ||
        currentUser.isSuperuser;

      return {
        ...state,
        hasPermission: permissionHelper(currentUser),
        hasSomePermission: (perm: Permission) =>
          somePermissions(currentUser, perm),
        user: currentUser,
        state: hasSomePermissions ? "HasPermissions" : "NoPermissions",
      };
    }
    default:
      return { ...state };
  }
};
