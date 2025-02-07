import React from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FilterTags, StyledTag, ResetButton } from "common/src/tags";

/// Creates tags from the search params (uses react-router-dom)
/// @param translateTag callback to format the tag
/// @param hide list of search param keys that are not shown as tags
/// @param defaultTags default optios to set when user clicks clear tags
/// TODO create a wrapper that allows us switching the router (next / react-router)
/// TODO translateTag should be string | null (to make non printed values explicit, though we will remove "" also)
export function SearchTags({
  translateTag,
  hide = [],
  defaultTags = [],
  clearButtonLabel,
}: {
  translateTag: (key: string, val: string) => string;
  hide?: string[];
  defaultTags?: Array<{ key: string; value: string | string[] }>;
  clearButtonLabel?: string;
}): JSX.Element {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();

  const handleDelete = (tag: { key: string; value: string }) => {
    const vals = new URLSearchParams(params);
    vals.delete(tag.key, tag.value);
    setParams(vals, { replace: true });
  };

  const handleReset = () => {
    const newParams = hide.reduce<typeof params>(
      (acc, s) => (params.get(s) ? { ...acc, [s]: params.get(s) } : acc),
      new URLSearchParams()
    );
    // TODO defaultTags and hide should never overlap
    for (const d of defaultTags) {
      if (Array.isArray(d.value)) {
        for (const v of d.value) {
          newParams.append(d.key, v);
        }
      } else {
        newParams.set(d.key, d.value);
      }
    }
    setParams(newParams, { replace: true });
  };

  const tags: { key: string; value: string; tr: string }[] = [];
  for (const [key, value] of params) {
    if (hide.includes(key) || value === "") {
      continue;
    }
    const tr = translateTag(key, value);
    tags.push({ key, value, tr });
  }

  return (
    <FilterTags
      style={{
        // if we don't hide them, gap is doubled when there are no tags
        display: tags.length === 0 ? "none" : "flex",
      }}
    >
      {tags.map((tag) => (
        <StyledTag
          onDelete={() => handleDelete(tag)}
          key={`${tag.key}-${tag.value}`}
          id={`search-tag-${tag.key}`}
        >
          {tag.tr}
        </StyledTag>
      ))}
      {tags.length > 0 && (
        <ResetButton onClick={handleReset} onDelete={handleReset}>
          {clearButtonLabel || t("common.clear")}
        </ResetButton>
      )}
    </FilterTags>
  );
}
