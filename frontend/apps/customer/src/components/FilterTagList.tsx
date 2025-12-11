import React from "react";
import type { TFunction } from "i18next";
import { useTranslation } from "next-i18next";
import { useSearchParams } from "next/navigation";
import { SearchTagContainer, SearchTag, TagResetButton } from "ui/src/styled/tags";
import { useSearchModify } from "@/hooks/useSearchValues";

type FilterTagProps = {
  filters: ReadonlyArray<string>;
  multiSelectFilters: ReadonlyArray<string>;
  hideList: ReadonlyArray<string>;
  translateTag: (key: string, value: string) => string | undefined;
};

const inHours = (minutes: number): number => Math.round((minutes / 60) * 100) / 100; // two decimal places

function translateDuration(t: TFunction, duration: number): string {
  let unit = t("common:abbreviations.hour", { count: inHours(duration) });
  if (duration <= 90) {
    unit = t("common:abbreviations.minute", { count: duration });
  }
  return t("searchForm:filters.duration", { unit });
}

/// Uses query params to display tags for the search form
/// Generic enough to work for both reservation unit search pages
/// @param filters - list of filters in the order they should be displayed
/// @param multiSelectFilters - list of filters that can have multiple values
/// @param hideList - list of filters that should not be displayed
/// @param translateTag - function to translate the tag
export function FilterTagList({ filters, multiSelectFilters, hideList, translateTag }: Readonly<FilterTagProps>) {
  const { t } = useTranslation();

  const { handleRemoveTag, handleResetTags } = useSearchModify();
  const searchValues = useSearchParams();

  const possibleKeys = searchValues.keys() ?? ([] as const);

  const formValueKeys: string[] = [];
  for (const key of possibleKeys) {
    if (!formValueKeys.includes(key)) {
      formValueKeys.push(key);
    }
  }

  const keys = [...formValueKeys].sort((a, b) => filters.indexOf(a) - filters.indexOf(b));

  const filteredTags = keys
    .filter((key) => !hideList.includes(key))
    .filter((key) => {
      const value = searchValues.get(key);
      if (value == null || value === "") {
        return false;
      }
      if (key === "duration" && !(Number(value) > 0)) {
        return false;
      }
      return true;
    });
  const hasTags = filteredTags.length > 0;

  return (
    <SearchTagContainer data-testid="search-form__filter--tags">
      {filteredTags.map((key) => {
        const value = searchValues.getAll(key);
        const label = t(`searchForm:filters.${key}`, {
          label: key,
          value,
          count: Number(value),
        });
        // Still have the old string encoded values (key=v1,v2,v3) for backwards compatibility
        // but support the better array version (key=v1&key=v2&key=v3) for new code
        const isMultiSelect = multiSelectFilters.includes(key);
        if (isMultiSelect) {
          const isOldFormat = value.length === 1 && value[0]?.includes(",");
          const values = isOldFormat ? (value[0]?.split(",") ?? []) : value;
          return values.map((val) => (
            <SearchTag
              id={`filter-tag__${key}-${val}`}
              onClick={() => handleRemoveTag(key, val)}
              onDelete={() => handleRemoveTag(key, val)}
              key={`${key}-${val}`}
              aria-label={t(`searchForm:removeFilter`, {
                value: translateTag(key, val),
              })}
            >
              {translateTag(key, val) ?? ""}
            </SearchTag>
          ));
        }
        return (
          <SearchTag
            id={`filter-tag__${key}`}
            onDelete={() => handleRemoveTag(key)}
            onClick={() => handleRemoveTag(key)}
            key={key}
            aria-label={t(`searchForm:removeFilter`, {
              value: label,
            })}
          >
            {key === "duration" && !Number.isNaN(Number(value)) ? translateDuration(t, Number(value)) : label}
          </SearchTag>
        );
      })}
      {hasTags && (
        <TagResetButton
          onClick={() => handleResetTags(hideList)}
          onDelete={() => handleResetTags(hideList)}
          data-testid="search-form__reset-button"
        >
          {t("common:clear")}
        </TagResetButton>
      )}
    </SearchTagContainer>
  );
}
