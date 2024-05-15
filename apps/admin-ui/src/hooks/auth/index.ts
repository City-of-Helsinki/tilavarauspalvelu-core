import { useQuery } from "@apollo/client";
import { type Query } from "@gql/gql-types";
import { CURRENT_USER } from "@/context/queries";

export { signIn, signOut } from "common/src/browserHelpers";

export function useSession() {
  const { data, error } = useQuery<Query>(CURRENT_USER);
  const user = data?.currentUser ?? undefined;

  return { isAuthenticated: user != null, user, error };
}
