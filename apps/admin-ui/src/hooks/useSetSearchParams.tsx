import { ignoreMaybeArray } from "common/src/helpers";
import { useRouter } from "next/router";

/// @param keysToCopy - copy these from the original query. required because of the way Next.js route params work
/// ex. without keys a path with [id] param turns .../8 into .../[id]. there is no automatic substitution
export function useSetSearchParams(keysToCopy: string[] = ["id", "pk"]): (params: URLSearchParams) => void {
  const router = useRouter();
  const setSearchParams = (params: URLSearchParams) => {
    const { pathname, query } = router;
    for (const key in keysToCopy) {
      const val = ignoreMaybeArray(query[key]);
      if (val != null) {
        params.set("key", val);
      }
    }
    router.replace(
      {
        pathname,
        query: params.toString(),
      },
      undefined,
      {
        shallow: true,
        scroll: false,
      }
    );
  };

  return setSearchParams;
}
