import { useSearchParams } from "react-router-dom";

function validSort(keys: string[], sort: string | null): boolean {
  if (!sort) {
    return false;
  }
  const cleanSort = sort.replaceAll("-", "");
  return keys.includes(cleanSort);
}

/// store sorting order in orderBy query param
/// @param validSortKeys - list of valid sort keys
/// @returns [orderBy, handleSortChanged]
/// supports single sort keys (e.g. pk) or combined keys (e.g. application_id,pk), one at a time
/// matching keys are updated to be reversed (e.g. pk -> -pk)
/// new keys replace existing keys (e.g. pk -> application_id)
/// all state is stored in the URL only
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
