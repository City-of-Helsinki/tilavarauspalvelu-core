import type { Maybe } from "../types/gql-types";

export function filterNonNullable<T>(arr: Maybe<Maybe<T>[]> | undefined): T[] {
  return arr?.filter((n): n is NonNullable<T> => n !== null) ?? [];
}

