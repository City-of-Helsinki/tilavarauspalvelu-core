import {
  useCurrentUserQuery,
  useCurrentUserSuspenseQuery,
} from "@gql/gql-types";

export function useSession() {
  const { data, error } = useCurrentUserQuery();
  const user = data?.currentUser ?? undefined;

  return { isAuthenticated: user != null, user, error };
}

export function useSessionSuspense() {
  const { data, error } = useCurrentUserSuspenseQuery();
  const user = data?.currentUser ?? undefined;

  return { isAuthenticated: user != null, user, error };
}
