import React from "react";
import { useTranslation } from "next-i18next";
import {
  TextInput,
  IconSearch,
  LoadingSpinner,
  ButtonVariant,
} from "hds-react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { useSearchModify } from "@/hooks/useSearchValues";
import { FilterTagList } from "./FilterTagList";
import { ControlledSelect } from "common/src/components/form/ControlledSelect";
import { BottomContainer, Filters, StyledSubmitButton } from "./styled";
import {
  mapQueryParamToNumber,
  mapQueryParamToNumberArray,
  mapSingleParamToFormValue,
} from "@/modules/search";
import { type URLSearchParams } from "node:url";
import { useSearchParams } from "next/navigation";
import { ControlledNumberInput } from "common/src/components/form";

const filterOrder = [
  "applicationRound",
  "textSearch",
  "personsAllowed",
  "reservationUnitTypes",
  "unit",
  "purposes",
] as const;

type FormValues = {
  personsAllowed: number | null;
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
    personsAllowed: mapQueryParamToNumber(query.getAll("personsAllowed")),
    textSearch: mapSingleParamToFormValue(query.getAll("textSearch")) ?? "",
  };
}

type OptionType = { value: number; label: string };
export function SeasonalSearchForm({
  reservationUnitTypeOptions,
  purposeOptions,
  unitOptions,
  isLoading,
}: Readonly<{
  reservationUnitTypeOptions: OptionType[];
  purposeOptions: OptionType[];
  unitOptions: OptionType[];
  isLoading: boolean;
}>): JSX.Element | null {
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
  const hideList = [
    "id",
    "order",
    "sort",
    "ref",
    "selectedReservationUnits",
  ] as const;

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
        <ControlledNumberInput
          label={t("searchForm:participantCountCombined")}
          name="personsAllowed"
          control={control}
          min={1}
        />
        <ControlledSelect
          multiselect
          enableSearch
          clearable
          name="reservationUnitTypes"
          control={control}
          options={reservationUnitTypeOptions}
          label={t("searchForm:typeLabel")}
        />
        <ControlledSelect
          multiselect
          enableSearch
          clearable
          name="unit"
          control={control}
          options={unitOptions}
          label={t("searchForm:unitFilter")}
        />
        <ControlledSelect
          multiselect
          enableSearch
          clearable
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
          iconStart={isLoading ? <LoadingSpinner small /> : <IconSearch />}
          disabled={isLoading}
        >
          {t("searchForm:searchButton")}
        </StyledSubmitButton>
      </BottomContainer>
    </form>
  );
}
