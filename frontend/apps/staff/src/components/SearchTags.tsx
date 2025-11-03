import React from "react";
import { useTranslation } from "next-i18next";
import { useSearchParams } from "next/navigation";
import { SearchTagContainer, SearchTag, TagResetButton } from "ui/src/styled/tags";
import { useSetSearchParams } from "@/hooks/useSetSearchParams";

interface SearchTagsProps {
  translateTag: (key: string, val: string) => string;
  hide?: Readonly<string[]>;
  defaultTags?: Readonly<Array<{ key: string; value: string | string[] }>>;
  clearButtonLabel?: string;
  clearButtonAriaLabel?: string;
}

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
}: Readonly<SearchTagsProps>): JSX.Element {
  const { t } = useTranslation();
  const params = useSearchParams();
  const setParams = useSetSearchParams();

  const handleDelete = (tag: { key: string; value: string }) => {
    const vals = new URLSearchParams(params);
    vals.delete(tag.key, tag.value);
    // Use an empty proxy so default values don't override user choices
    if (!vals.has(tag.key) && defaultTags.find((d) => d.key === tag.key) != null) {
      vals.set(tag.key, "");
    }
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
    if (tr !== "") {
      tags.push({ key, value, tr });
    }
  }

  // TODO could be improved by comparing default values to current values
  const shouldShowResetButton = tags.length > 0 || defaultTags.length > 0;

  return (
    <SearchTagContainer>
      {tags.map((tag) => (
        <SearchTag
          onDelete={() => handleDelete(tag)}
          key={`${tag.key}-${tag.value}`}
          id={`search-tag-${tag.key}`}
          aria-label={t("common:removeTag", { tag: tag.tr })}
          placeholder=""
        >
          {tag.tr}
        </SearchTag>
      ))}
      {shouldShowResetButton && (
        <TagResetButton
          onClick={handleReset}
          onDelete={handleReset}
          aria-label={clearButtonAriaLabel ?? t("common:clearTags")}
          placeholder=""
        >
          {clearButtonLabel ?? t("common:clear")}
        </TagResetButton>
      )}
    </SearchTagContainer>
  );
}
