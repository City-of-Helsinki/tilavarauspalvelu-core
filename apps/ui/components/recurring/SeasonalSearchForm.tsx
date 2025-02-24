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
import { FilterTagList } from "../FilterTagList";
import { ControlledSelect } from "common/src/components/form/ControlledSelect";
import { BottomContainer, Filters, StyledSubmitButton } from "../search/styled";
import { mapParamToNumber } from "@/modules/search";
import SingleLabelInputGroup from "@/components/common/SingleLabelInputGroup";
import { type ReadonlyURLSearchParams, useSearchParams } from "next/navigation";
import { AccessType } from "@gql/gql-types";
import { toNumber } from "common/src/helpers";

const filterOrder = [
  "applicationRound",
  "textSearch",
  "minPersons",
  "maxPersons",
  "reservationUnitTypes",
  "unit",
  "purposes",
  "accessType",
] as const;

type FormValues = {
  minPersons: number | null;
  maxPersons: number | null;
  unit: number[];
  reservationUnitTypes: number[];
  purposes: number[];
  textSearch: string;
  accessType: string[];
};

// TODO combine as much as possible with the one in single-search (move them to a common place)
function mapQueryToForm(params: ReadonlyURLSearchParams): FormValues {
  return {
    purposes: mapParamToNumber(params.getAll("purposes"), 1),
    unit: mapParamToNumber(params.getAll("unit"), 1),
    reservationUnitTypes: mapParamToNumber(
      params.getAll("reservationUnitTypes"),
      1
    ),
    minPersons: toNumber(params.get("minPersons")),
    maxPersons: toNumber(params.get("maxPersons")),
    textSearch: params.get("textSearch") ?? "",
    accessType: params.getAll("accessType"),
  };
}

type OptionType = { value: number; label: string };
export function SeasonalSearchForm({
  isLoading,
  options,
}: Readonly<{
  options: {
    reservationUnitTypeOptions: OptionType[];
    purposeOptions: OptionType[];
    unitOptions: OptionType[];
  };
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

  const accessTypeOptions = Object.values(AccessType).map((value) => ({
    value,
    label: t(`reservationUnit:accessTypes.${value}`),
  }));
  const { reservationUnitTypeOptions, purposeOptions, unitOptions } = options;

  const translateTag = (key: string, value: string): string | undefined => {
    switch (key) {
      case "unit":
        return unitOptions.find((n) => String(n.value) === value)?.label;
      case "reservationUnitTypes":
        return reservationUnitTypeOptions.find((n) => String(n.value) === value)
          ?.label;
      case "purposes":
        return purposeOptions.find((n) => String(n.value) === value)?.label;
      case "accessType":
        return accessTypeOptions.find((n) => String(n.value) === value)?.label;
      default:
        return "";
    }
  };

  const multiSelectFilters = [
    "unit",
    "reservationUnitTypes",
    "purposes",
    "accessType",
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
        <ControlledSelect
          multiselect
          clearable
          name="accessType"
          control={control}
          options={accessTypeOptions}
          label={t("searchForm:accessTypeFilter")}
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
