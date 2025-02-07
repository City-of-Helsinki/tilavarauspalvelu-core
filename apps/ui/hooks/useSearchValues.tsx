import { useRouter } from "next/router";
import { useSearchParams } from "next/navigation";
import { type ParsedUrlQueryInput } from "node:querystring";

export function useSearchModify() {
  const router = useRouter();
  const searchValues = useSearchParams();

  const handleRouteChange = (query: URLSearchParams | ParsedUrlQueryInput) => {
    if (query instanceof URLSearchParams) {
      // [id] param is not included in the URLSearchParams object but required when routing
      if (router.query.id) {
        query.set("id", router.query.id as string);
      }
      router.replace({ query: query.toString() }, undefined, {
        shallow: true,
        scroll: false,
      });
    } else {
      router.replace({ query }, undefined, { shallow: true, scroll: false });
    }
  };

  // TODO type this properly (not a Record)
  const handleSearch = (criteria: Record<string, unknown>, force: boolean) => {
    const { sort, order, ref } = router.query;
    const newSort = sort != null && !Array.isArray(sort) ? sort : null;
    const newOrder = order != null && !Array.isArray(order) ? order : null;
    // form submit -> router push has no other way to communicate with the hook that updates the query
    // than using query params, so we need to increment the ref to trigger a re-fetch
    // otherwise submitting the same search without any changes breaks pagination
    // alternative would be to disable the form submit (or make it a no-op) if the search values are the same
    // which has other issues like stale data if the page is left open for a long time
    const v = Number(ref) > 0 ? Number(ref) : null;
    const nextRef = v != null ? v + 1 : 1;

    // TODO can this be refactored to use the URLSearchParams object?
    const newValues = {
      ...criteria,
      sort: newSort,
      order: newOrder,
      ...(force ? { ref: nextRef } : {}),
    };

    const query: ParsedUrlQueryInput = {
      ...router.query,
      ...newValues,
    };
    handleRouteChange(query);
  };

  /// @param hideList - list of keys to ignore when resetting the query
  const handleResetTags = (hideList: readonly string[]) => {
    const params = new URLSearchParams();
    for (const key of hideList) {
      const values = searchValues.getAll(key);
      for (const value of values) {
        params.append(key, value);
      }
    }

    handleRouteChange(params);
  };

  const handleRemoveTag = (key: string, value?: string) => {
    // Forbidding resetting all filters (need to rework this so we always remove a single value)
    if (key.length === 0) {
      throw new Error("key must have at least one value");
    }

    // Oh this allows for a case of removing a single value? or no
    // yeah, the subItemKey is the actual query key we are finding from
    // the key: [] is the values we are removing
    const newValues = new URLSearchParams(searchValues);
    if (value) {
      const values = searchValues.getAll(key);
      const isOldFormat = values.length === 1 && values[0].includes(",");
      if (isOldFormat) {
        const newVal = isOldFormat ? values[0].split(",") : values;
        const newValue = newVal.filter((n) => n !== value);
        newValues.set(key, newValue.join(","));
      } else {
        newValues.delete(key, value);
      }
    } else {
      newValues.delete(key);
    }

    handleRouteChange(newValues);
  };

  return { handleSearch, handleRemoveTag, handleResetTags, handleRouteChange };
}
