import React from "react";
import { useTranslation } from "next-i18next";
import { FilterTags, StyledTag, ResetButton } from "common/src/tags";
import { useSearchParams } from "next/navigation";
import { useSetSearchParams } from "@/hooks/useSetSearchParams";

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
  clearButtonAriaLabel,
}: Readonly<{
  translateTag: (key: string, val: string) => string;
  hide?: string[];
  defaultTags?: Array<{ key: string; value: string | string[] }>;
  clearButtonLabel?: string;
  clearButtonAriaLabel?: string;
}>): JSX.Element {
  const { t } = useTranslation();
  const params = useSearchParams();
  const setParams = useSetSearchParams();

  const handleDelete = (tag: { key: string; value: string }) => {
    const vals = new URLSearchParams(params);
    vals.delete(tag.key, tag.value);
    setParams(vals);
  };

  const handleReset = () => {
    const newParams = new URLSearchParams();
    for (const [key, value] of params) {
      if (hide.includes(key) && value !== "") {
        newParams.append(key, value);
      }
    }
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
    setParams(newParams);
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
    <FilterTags>
      {tags.map((tag) => (
        <StyledTag
          onDelete={() => handleDelete(tag)}
          key={`${tag.key}-${tag.value}`}
          id={`search-tag-${tag.key}`}
          aria-label={t("common:removeTag", { tag: tag.tr })}
        >
          {tag.tr}
        </StyledTag>
      ))}
      {tags.length > 0 && (
        <ResetButton
          onClick={handleReset}
          onDelete={handleReset}
          aria-label={clearButtonAriaLabel ?? t("common:clearTags")}
        >
          {clearButtonLabel ?? t("common:clear")}
        </ResetButton>
      )}
    </FilterTags>
  );
}
