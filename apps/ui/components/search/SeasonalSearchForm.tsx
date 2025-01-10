import React from "react";
import { useTranslation } from "next-i18next";
import {
  TextInput,
  IconSearch,
  LoadingSpinner,
  ButtonVariant,
} from "hds-react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { participantCountOptions } from "@/modules/const";
import { useSearchModify } from "@/hooks/useSearchValues";
import { FilterTagList } from "./FilterTagList";
import { ControlledSelect } from "common/src/components/form/ControlledSelect";
import { BottomContainer, Filters, StyledSubmitButton } from "./styled";
import {
  mapQueryParamToNumber,
  mapQueryParamToNumberArray,
  mapSingleParamToFormValue,
} from "@/modules/search";
import SingleLabelInputGroup from "@/components/common/SingleLabelInputGroup";
import { type URLSearchParams } from "node:url";
import { useSearchParams } from "next/navigation";

const filterOrder = [
  "applicationRound",
  "textSearch",
  "minPersons",
  "maxPersons",
  "reservationUnitTypes",
  "unit",
  "purposes",
] as const;

type FormValues = {
  minPersons: number | null;
  maxPersons: number | null;
  unit: number[];
  reservationUnitTypes: number[];
  purposes: number[];
  textSearch: string;
};

// TODO combine as much as possible with the one in single-search (move them to a common place)
function mapQueryToForm(query: URLSearchParams): FormValues {
  return {
    purposes: mapQueryParamToNumberArray(query.getAll("purposes")),
    unit: mapQueryParamToNumberArray(query.getAll("unit")),
    reservationUnitTypes: mapQueryParamToNumberArray(
      query.getAll("reservationUnitTypes")
    ),
    minPersons: mapQueryParamToNumber(query.getAll("minPersons")),
    maxPersons: mapQueryParamToNumber(query.getAll("maxPersons")),
    textSearch: mapSingleParamToFormValue(query.getAll("textSearch")) ?? "",
  };
}

type OptionType = { value: number; label: string };
export function SeasonalSearchForm({
  reservationUnitTypeOptions,
  purposeOptions,
  unitOptions,
  isLoading,
}: {
  reservationUnitTypeOptions: OptionType[];
  purposeOptions: OptionType[];
  unitOptions: OptionType[];
  isLoading: boolean;
}): JSX.Element | null {
  const { t } = useTranslation();

  const { handleSearch } = useSearchModify();

  const searchValues = useSearchParams();
  const { control, register, handleSubmit } = useForm<FormValues>({
    values: mapQueryToForm(searchValues),
  });

  const search: SubmitHandler<FormValues> = (criteria: FormValues) => {
    handleSearch(criteria, true);
  };

  const translateTag = (key: string, value: string): string | undefined => {
    switch (key) {
      case "unit":
        return unitOptions.find((n) => String(n.value) === value)?.label;
      case "reservationUnitTypes":
        return reservationUnitTypeOptions.find((n) => String(n.value) === value)
          ?.label;
      case "purposes":
        return purposeOptions.find((n) => String(n.value) === value)?.label;
      default:
        return "";
    }
  };

  const multiSelectFilters = [
    "unit",
    "reservationUnitTypes",
    "purposes",
  ] as const;
  const hideList = ["id", "order", "sort", "ref"] as const;

  return (
    <form noValidate onSubmit={handleSubmit(search)}>
      <Filters>
        <TextInput
          id="search"
          label={t("searchForm:textSearchLabel")}
          {...register("textSearch")}
          placeholder={t("searchForm:searchTermPlaceholder")}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSubmit(search)();
            }
          }}
        />
        {/* TODO this could be combined as a common search option */}
        <SingleLabelInputGroup label={t("searchForm:participantCountCombined")}>
          <ControlledSelect
            name="minPersons"
            control={control}
            clearable
            options={participantCountOptions}
            label={`${t("searchForm:participantCountCombined")} ${t("common:minimum")}`}
            placeholder={t("common:minimum")}
            className="inputSm inputGroupStart"
          />
          <ControlledSelect
            name="maxPersons"
            control={control}
            clearable
            options={participantCountOptions}
            label={`${t("searchForm:participantCountCombined")} ${t("common:maximum")}`}
            placeholder={t("common:maximum")}
            className="inputSm inputGroupEnd"
          />
        </SingleLabelInputGroup>
        <ControlledSelect
          multiselect
          name="reservationUnitTypes"
          control={control}
          options={reservationUnitTypeOptions}
          label={t("searchForm:typeLabel")}
        />
        <ControlledSelect
          multiselect
          name="unit"
          control={control}
          options={unitOptions}
          label={t("searchForm:unitFilter")}
        />
        <ControlledSelect
          multiselect
          name="purposes"
          control={control}
          options={purposeOptions}
          label={t("searchForm:purposesFilter")}
        />
      </Filters>
      <BottomContainer>
        <FilterTagList
          translateTag={translateTag}
          filters={filterOrder}
          multiSelectFilters={multiSelectFilters}
          hideList={hideList}
        />
        <StyledSubmitButton
          type="submit"
          variant={isLoading ? ButtonVariant.Clear : ButtonVariant.Primary}
          iconStart={
            isLoading ? (
              <LoadingSpinner small />
            ) : (
              <IconSearch aria-hidden="true" />
            )
          }
          disabled={isLoading}
        >
          {t("searchForm:searchButton")}
        </StyledSubmitButton>
      </BottomContainer>
    </form>
  );
}
