import { useRouter } from "next/router";

export function useSetSearchParams() {
  const router = useRouter();
  const setSearchParams = (params: URLSearchParams) => {
    const { pathname, query } = router;
    // TODO should be more robust with path params
    // TODO this is also in customer useSearchValues.tsx
    if (query.id) {
      params.set("id", router.query.id as string);
    }
    if (query.pk) {
      params.set("pk", router.query.id as string);
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
