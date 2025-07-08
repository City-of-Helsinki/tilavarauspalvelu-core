import { useRouter } from "next/router";

export function useSetSearchParams() {
  const router = useRouter();
  const setSearchParams = (params: URLSearchParams) => {
    // TODO should be more robust with path params
    // TODO this is also in customer useSearchValues.tsx
    if (router.query.id) {
      params.set("id", router.query.id as string);
    }
    router.replace({ query: params.toString() }, undefined, {
      shallow: true,
      scroll: false,
    });
  };

  return setSearchParams;
}
