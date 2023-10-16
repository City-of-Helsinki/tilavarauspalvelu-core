import React from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { Tag } from "hds-react";
import { inHours } from "./SearchForm";

type FilterTagProps = {
  formValueKeys: string[];
  formValues: { [key: string]: string | null };
  removeValue?: (key?: string[], subItemKey?: string) => void;
  getFormSubValueLabel: (key: string, value: string) => string | undefined;
};

const TagControls = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-s);
`;

const StyledTag = styled(Tag)`
  font-size: var(--fontsize-body-m);
`;

const FilterTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-s);
  margin-right: var(--spacing-m);
`;

const ResetButton = styled(StyledTag).attrs({
  theme: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "--tag-background": "transparent",
  },
})``;

const FilterTagList = ({
  formValueKeys,
  formValues,
  removeValue,
  getFormSubValueLabel,
}: FilterTagProps) => {
  const filterOrder = [
    "textSearch",
    "begin",
    "end",
    "after",
    "before",
    "duration",
    "minPersons",
    "maxPersons",
    "reservationUnitType",
    "unit",
    "purposes",
    "equipments",
  ];
  const multiSelectFilters = [
    "unit",
    "reservationUnitType",
    "purposes",
    "equipments",
  ];
  const { t } = useTranslation();
  const durationTranslation = (duration: number): string => {
    let unit = t("common:abbreviations.hour", { count: inHours(duration) });
    if (duration <= 90) {
      unit = t("common:abbreviations.minute", { count: duration });
    }
    return t("searchForm:filters.duration", { unit });
  };
  return (
    <TagControls>
      <FilterTags data-test-id="search-form__filter--tags">
        {formValueKeys
          .sort((a, b) => filterOrder.indexOf(a) - filterOrder.indexOf(b))
          .map((formValueKey) => {
            if (formValueKey === "showOnlyAvailable") return null;
            const label = t(`searchForm:filters.${formValueKey}`, {
              label: formValueKey,
              value: formValues[formValueKey],
              count: Number(formValues[formValueKey]),
            });
            return multiSelectFilters.includes(formValueKey) ? (
              (formValues[formValueKey] ?? "").split(",").map((subValue) => (
                <StyledTag
                  id={`filter-tag__${formValueKey}-${subValue}`}
                  onClick={() =>
                    removeValue && removeValue([subValue], formValueKey)
                  }
                  onDelete={() =>
                    removeValue && removeValue([subValue], formValueKey)
                  }
                  key={`${formValueKey}-${subValue}`}
                  deleteButtonAriaLabel={t(`searchForm:removeFilter`, {
                    value: getFormSubValueLabel(formValueKey, subValue),
                  })}
                >
                  {getFormSubValueLabel(formValueKey, subValue)}
                </StyledTag>
              ))
            ) : (
              <StyledTag
                id={`filter-tag__${formValueKey}`}
                onDelete={() => removeValue && removeValue([formValueKey])}
                key={formValueKey}
                deleteButtonAriaLabel={t(`searchForm:removeFilter`, {
                  value: label,
                })}
              >
                {formValueKey === "duration" &&
                !Number.isNaN(Number(formValues.duration))
                  ? durationTranslation(Number(formValues.duration))
                  : label}
              </StyledTag>
            );
          })}
      </FilterTags>
      {formValueKeys.length > 0 && (
        <ResetButton
          aria-label={t("searchForm:resetForm")}
          onClick={() => removeValue && removeValue()}
          onDelete={() => removeValue && removeValue()}
          data-test-id="search-form__reset-button"
        >
          {t("searchForm:resetForm")}
        </ResetButton>
      )}
    </TagControls>
  );
};

export default FilterTagList;
