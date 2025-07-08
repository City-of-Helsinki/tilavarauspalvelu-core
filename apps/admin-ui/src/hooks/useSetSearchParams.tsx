import { ignoreMaybeArray } from "common/src/helpers";
import { useRouter } from "next/router";

export function useSetSearchParams() {
  const router = useRouter();
  const setSearchParams = (params: URLSearchParams) => {
    const { pathname, query } = router;
    // TODO should be more robust with path params
    // TODO this is also in customer useSearchValues.tsx
    const id = ignoreMaybeArray(query.id);
    if (id != null) {
      params.set("id", id);
    }
    const pk = ignoreMaybeArray(query.pk);
    if (pk != null) {
      params.set("pk", pk);
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
