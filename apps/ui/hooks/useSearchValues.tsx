import { useRouter } from "next/router";
import { type ParsedUrlQuery } from "node:querystring";
import { type UrlObject } from "node:url";

// TODO should take a list of keys or use a type instead of a record so we can remove invalid keys
export function useSearchValues() {
  const router = useRouter();
  const parsed = router.query;
  if (!parsed.sort) {
    parsed.sort = "name";
  }
  if (!parsed.order) {
    parsed.order = "asc";
  }

  return parsed;
}

export function useSearchModify() {
  const router = useRouter();
  const searchValues = useSearchValues();

  // TODO type this properly (not a Record)
  const handleSearch = (criteria: Record<string, string>, force: boolean) => {
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

    const newValues = {
      ...criteria,
      sort: newSort,
      order: newOrder,
      ...(force ? { ref: nextRef } : {}),
    };

    // NOTE without this next router can't handle [id] pages
    const url: UrlObject = {
      pathname: router.pathname,
      query: {
        ...router.query,
        ...newValues,
      },
    };
    router.replace(url, undefined, { shallow: true });
  };

  /// @param hideList - list of keys to ignore when resetting the query
  const handleResetTags = (hideList: string[]) => {
    const keys = Object.keys(searchValues);
    const newValues = keys.reduce<ParsedUrlQuery>((acc, key) => {
      if (hideList.includes(key)) {
        acc[key] = searchValues[key];
      }
      return acc;
    }, {});
    // NOTE for some reason we don't have to fix [id] pages here
    router.replace({
      query: newValues,
    });
  };

  // TODO is there a case where we remove the whole key: array<string>? and not just single values
  // also we can do a lot simpler variant of this, just remove the key from the query instead of constructing a new query
  // TODO what are the use cases for array input?
  // TODO what are the use cases for subItemKey? and can it be null?
  const handleRemoveTag = (key: string[], subItemKey?: string) => {
    // Forbidding resetting all filters (need to rework this so we always remove a single value)
    if (key.length === 0) {
      throw new Error("key must have at least one value");
    }

    // Oh this allows for a case of removing a single value? or no
    // yeah, the subItemKey is the actual query key we are finding from
    // the key: [] is the values we are removing
    let newValues = {};
    if (subItemKey) {
      const values = searchValues[subItemKey];
      if (values != null && typeof values === "string") {
        const newValue = values.split(",").filter((n) => !key?.includes(n));
        newValues = {
          ...searchValues,
          [subItemKey]: newValue.join(","),
        };
      } else if (values != null && Array.isArray(values)) {
        const newValue = values.filter((n) => !key?.includes(n));
        newValues = {
          ...searchValues,
          [subItemKey]: newValue,
        };
      }
    } else if (key) {
      const { [`${key}`]: _, ...rest } = searchValues;
      newValues = rest;
    }

    router.replace({
      query: newValues,
    });
  };

  return { handleSearch, handleRemoveTag, handleResetTags };
}
