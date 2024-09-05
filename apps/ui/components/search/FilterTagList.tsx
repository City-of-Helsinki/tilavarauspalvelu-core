import React from "react";
import { useTranslation } from "next-i18next";
import { FilterTags, StyledTag, ResetButton } from "common/src/tags";
import { useSearchModify, useSearchValues } from "@/hooks/useSearchValues";
import { type TFunction } from "i18next";

type FilterTagProps = {
  filters: string[];
  multiSelectFilters: string[];
  hideList: string[];
  translateTag: (key: string, value: string) => string | undefined;
};

const inHours = (minutes: number): number =>
  Math.round((minutes / 60) * 100) / 100; // two decimal places

function translateDuration(t: TFunction, duration: number): string {
  let unit = t("common:abbreviations.hour", { count: inHours(duration) });
  if (duration <= 90) {
    unit = t("common:abbreviations.minute", { count: duration });
  }
  return t("searchForm:filters.duration", { unit });
}

/// Uses query params to display tags for the search form
/// Generic enough to work for both reservation unit search pages but not tested for other use cases
/// @param filters - list of filters in the order they should be displayed
/// @param multiSelectFilters - list of filters that can have multiple values
/// @param hideList - list of filters that should not be displayed
/// @param translateTag - function to translate the tag
/// TODO hide list might also be superflous since we can check against the translation, an empty string should not be displayed
/// TODO multiSelectFilters might be superflous since we can check array type => this would make all tags multi select automatically though
/// but that might be a good thing, the single / multi filtering should be when the url is modified and rechecked when the API call is made
/// silently ignore any invalid values when making API calls.
/// Issue with this change is that all filters would move dynamically between single and multi select (does that matter?)
/// This component should not care about the particulars of the structure, just about the query params
/// (even if the user manually modifies the url to create invalid params or combinations),
/// Which also supports removing the parameters and only using query string and the translation function.
/// An invalid manually modified value (or mangled copy / link) would be ignore. Now it's printed out as a tag.
/// Another thing about that is the translation function is generic enough to allow dynamic changes to the tags
/// (so we can hide / show based on some other condition) of course such would require forcing a rerender with an url change or remounting this.
export function FilterTagList({
  filters,
  multiSelectFilters,
  hideList,
  translateTag,
}: FilterTagProps) {
  const { t } = useTranslation();

  const { handleRemoveTag, handleResetTags } = useSearchModify();
  const formValues = useSearchValues();

  const formValueKeys = Object.keys(formValues);
  const filterOrder = filters;
  const sortedValues = [...formValueKeys].sort(
    (a, b) => filterOrder.indexOf(a) - filterOrder.indexOf(b)
  );

  const filteredTags = sortedValues
    .filter((key) => !hideList.includes(key))
    .filter((key) => {
      const value = formValues[key];
      if (value == null || value === "") {
        return false;
      }
      // TODO there should be a more universal way to check if a value is valid (or filter them out before we get here)
      if (key === "duration" && !(Number(value) > 0)) {
        return false;
      }
      return true;
    });
  const hasTags = filteredTags.length > 0;

  return (
    <FilterTags data-testid="search-form__filter--tags">
      {filteredTags.map((key) => {
        const label = t(`searchForm:filters.${key}`, {
          label: key,
          value: formValues[key],
          count: Number(formValues[key]),
        });
        const value = formValues[key];
        // This should never happen, but for type completeness
        if (value == null || value === "") {
          return null;
        }
        // Still have the old string encoded values (key=v1,v2,v3) for backwards compatibility
        // but support the better array version (key=v1&key=v2&key=v3) for new code
        const isMultiSelect = multiSelectFilters.includes(key);
        if (isMultiSelect) {
          const values = Array.isArray(value) ? value : value.split(",");
          return values.map((subValue) => (
            <StyledTag
              id={`filter-tag__${key}-${subValue}`}
              onClick={() => handleRemoveTag([subValue], key)}
              onDelete={() => handleRemoveTag([subValue], key)}
              key={`${key}-${subValue}`}
              aria-label={t(`searchForm:removeFilter`, {
                value: translateTag(key, subValue),
              })}
            >
              {translateTag(key, subValue)}
            </StyledTag>
          ));
        }
        // TODO why are these different? (multi select and single select)
        return (
          <StyledTag
            id={`filter-tag__${key}`}
            onDelete={() => handleRemoveTag([key])}
            // Why is there no onClick here?
            key={key}
            aria-label={t(`searchForm:removeFilter`, {
              value: label,
            })}
          >
            {key === "duration" && !Number.isNaN(Number(value))
              ? translateDuration(t, Number(value))
              : label}
          </StyledTag>
        );
      })}
      {hasTags && (
        <ResetButton
          onClick={() => handleResetTags(hideList)}
          onDelete={() => handleResetTags(hideList)}
          data-test-id="search-form__reset-button"
        >
          {t("searchForm:resetForm")}
        </ResetButton>
      )}
    </FilterTags>
  );
}
