import { useEffect } from "react";
import { errorToast } from "../components/toast";

/// Show an error toast when a query fails.
/// Apollo Client 4 removed the onError option of useQuery, use this hook in place of it.
/// @param error - the error from useQuery
/// @param text - the toast text
export function useQueryErrorToast(error: unknown, text: string): void {
  useEffect(() => {
    if (error != null) {
      errorToast({ text });
    }
  }, [error, text]);
}
