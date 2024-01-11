import { useSearchParams } from "react-router-dom";

function validSort(keys: string[], sort: string | null): boolean {
  if (!sort) {
    return false;
  }
  const cleanSort = sort.replaceAll("-", "");
  return keys.includes(cleanSort);
}

// TODO move to common, reuse in the two other tabs
export function useSort(
  validSortKeys: string[]
): [string | null, (field: string) => void] {
  const [searchParams, setParams] = useSearchParams();
  const sort = searchParams.get("orderBy");
  const orderBy = validSort(validSortKeys, sort) ? sort : null;

  // Only supports a single sort key
  const handleSortChanged = (field: string) => {
    const params = new URLSearchParams(searchParams);
    if (field === orderBy) {
      // Handle combined keys (e.g. application_id,pk)
      const sortParams = orderBy.split(",");
      const newParams = sortParams.join(",-");
      params.set("orderBy", `-${newParams}`);
    } else {
      params.set("orderBy", field);
    }
    setParams(params, { replace: true });
  };

  return [orderBy, handleSortChanged];
}
