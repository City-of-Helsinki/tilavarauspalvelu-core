import React from "react";
import { useTranslation } from "next-i18next";
import { Checkbox, IconSearch, LoadingSpinner, TextInput } from "hds-react";
import { type SubmitHandler, useForm, Controller } from "react-hook-form";
import styled from "styled-components";
import { addYears, startOfDay } from "date-fns";
import {
  ControlledNumberInput,
  TimeRangePicker,
} from "common/src/components/form";
import { toUIDate } from "common/src/common/util";
import { fromUIDate } from "@/modules/util";
import { getDurationOptions } from "@/modules/const";
import { DateRangePicker } from "@/components/form";
import { FilterTagList } from "../FilterTagList";
import SingleLabelInputGroup from "@/components/common/SingleLabelInputGroup";
import { useSearchModify } from "@/hooks/useSearchValues";
import { ControlledSelect } from "common/src/components/form/ControlledSelect";
import { mapParamToNumber } from "@/modules/search";
import { SearchButtonContainer, StyledSubmitButton } from "./styled";
import { useSearchParams, type ReadonlyURLSearchParams } from "next/navigation";
import { AccessType } from "@gql/gql-types";
import { ignoreMaybeArray, toNumber } from "common/src/helpers";
import { Flex } from "common/styled";
import { ShowAllContainer } from "common/src/components";

const StyledCheckBox = styled(Checkbox)`
  margin: 0 !important;
  grid-column: -2 / span 1;
`;

type SearchFormValues = {
  // TODO there is some confusion on the types of these
  // they are actually an array of pks (number) but they are encoded as val1,val2,val3 string
  purposes: number[];
  units: number[];
  equipments: number[];
  reservationUnitTypes: number[];
  accessTypes: string[];
  timeBegin: string | null;
  timeEnd: string | null;
  startDate: string | null;
  endDate: string | null;
  duration: number | null;
  personsAllowed: number | null;
  showOnlyReservable: boolean;
  textSearch: string;
};

function mapQueryToForm(params: ReadonlyURLSearchParams): SearchFormValues {
  const dur = toNumber(params.get("duration"));
  const duration = dur != null && dur > 0 ? dur : null;
  const showOnlyReservable =
    ignoreMaybeArray(params.getAll("showOnlyReservable")) !== "false";
  return {
    purposes: mapParamToNumber(params.getAll("purposes"), 1),
    units: mapParamToNumber(params.getAll("units"), 1),
    equipments: mapParamToNumber(params.getAll("equipments"), 1),
    reservationUnitTypes: mapParamToNumber(
      params.getAll("reservationUnitTypes"),
      1
    ),
    accessTypes: params.getAll("accessTypes"),
    timeBegin: params.get("timeBegin"),
    timeEnd: params.get("timeEnd"),
    startDate: params.get("startDate"),
    endDate: params.get("endDate"),
    duration,
    personsAllowed: toNumber(params.get("personsAllowed")),
    showOnlyReservable,
    textSearch: params.get("textSearch") ?? "",
  };
}

// TODO is this the full list? can we filter out all the rest? (i.e. remove the hideList)
const filterOrder = [
  "textSearch",
  "timeBegin",
  "timeEnd",
  "startDate",
  "endDate",
  "duration",
  "personsAllowed",
  "reservationUnitTypes",
  "units",
  "purposes",
  "equipments",
  "accessTypes",
] as const;
const multiSelectFilters = [
  "units",
  "reservationUnitTypes",
  "purposes",
  "equipments",
  "accessTypes",
] as const;
// we don't want to show "showOnlyReservable" as a FilterTag, as it has its own checkbox in the form
const hideTagList = ["showOnlyReservable", "order", "sort", "ref"];

// TODO rewrite this witout the form state (use query params directly, but don't refresh the page)
export function SingleSearchForm({
  reservationUnitTypeOptions,
  purposeOptions,
  unitOptions,
  equipmentsOptions,
  isLoading,
}: Readonly<{
  reservationUnitTypeOptions: Array<{ value: number; label: string }>;
  purposeOptions: Array<{ value: number; label: string }>;
  unitOptions: Array<{ value: number; label: string }>;
  equipmentsOptions: Array<{ value: number; label: string }>;
  isLoading: boolean;
}>): JSX.Element | null {
  const { handleSearch } = useSearchModify();
  const { t } = useTranslation();
  const searchValues = useSearchParams();
  // TODO the users of this should be using watch
  const formValues = mapQueryToForm(searchValues);
  const form = useForm<SearchFormValues>({
    values: formValues,
  });
  const accessTypeOptions = Object.values(AccessType).map((value) => ({
    value,
    label: t(`reservationUnit:accessTypes.${value}`),
  }));

  const { handleSubmit, setValue, getValues, control, register } = form;
  const durationOptions = getDurationOptions(t);

  const translateTag = (key: string, value: string): string | undefined => {
    // Handle possible number / string comparison
    const compFn = (a: { value: unknown }, b: string) =>
      a != null && String(a.value) === b;
    // TODO should rework the find matcher (typing issues) (it works but it's confusing)
    switch (key) {
      case "units":
        return unitOptions.find((n) => compFn(n, value))?.label;
      case "reservationUnitTypes":
        return reservationUnitTypeOptions.find((n) => compFn(n, value))?.label;
      case "purposes":
        return purposeOptions.find((n) => compFn(n, value))?.label;
      case "equipments":
        return equipmentsOptions.find((n) => compFn(n, value))?.label;
      case "duration":
        return durationOptions.find((n) => compFn(n, value))?.label;
      case "accessTypes":
        return accessTypeOptions.find((n) => compFn(n, value))?.label;
      case "startDate":
      case "endDate":
      case "timeBegin":
      case "timeEnd":
        return value;
      default:
        return "";
    }
  };

  const onSearch: SubmitHandler<SearchFormValues> = (
    criteria: SearchFormValues
  ) => {
    handleSearch(criteria, true);
  };

  const showOptionalFilters =
    formValues.reservationUnitTypes.length !== 0 ||
    formValues.personsAllowed != null ||
    formValues.textSearch !== "";

  return (
    <Flex as="form" noValidate onSubmit={handleSubmit(onSearch)}>
      <ShowAllContainer
        showAllLabel={t("searchForm:showMoreFilters")}
        showLessLabel={t("searchForm:showLessFilters")}
        maximumNumber={6}
        data-testid="search-form__filters--optional"
        initiallyOpen={showOptionalFilters}
      >
        <ControlledSelect
          multiselect
          clearable
          enableSearch
          name="purposes"
          control={control}
          options={purposeOptions}
          label={t("searchForm:labels.purposes")}
        />
        <ControlledSelect
          multiselect
          clearable
          enableSearch
          name="units"
          control={control}
          options={unitOptions}
          label={t("searchForm:labels.units")}
        />
        <ControlledSelect
          multiselect
          clearable
          enableSearch
          name="equipments"
          control={control}
          options={equipmentsOptions}
          label={t("searchForm:labels.equipments")}
        />
        <SingleLabelInputGroup label={t("common:dateLabel")}>
          <DateRangePicker
            startDate={fromUIDate(getValues("startDate") ?? "")}
            endDate={fromUIDate(getValues("endDate") ?? "")}
            onChangeStartDate={(date: Date | null) =>
              setValue("startDate", date != null ? toUIDate(date) : null)
            }
            onChangeEndDate={(date: Date | null) =>
              setValue("endDate", date != null ? toUIDate(date) : null)
            }
            labels={{
              begin: t("dateSelector:labelStartDate"),
              end: t("dateSelector:labelEndDate"),
            }}
            placeholder={{
              begin: t("common:beginLabel"),
              end: t("common:endLabel"),
            }}
            limits={{
              startMinDate: startOfDay(new Date()),
              startMaxDate: addYears(new Date(), 2),
              endMinDate: startOfDay(new Date()),
              endMaxDate: addYears(new Date(), 2),
            }}
          />
        </SingleLabelInputGroup>
        <SingleLabelInputGroup label={t("common:timeLabel")}>
          <TimeRangePicker
            control={control}
            names={{ begin: "timeBegin", end: "timeEnd" }}
            labels={{
              begin: `${t("common:timeLabelBegin")}`,
              end: `${t("common:timeLabelEnd")}`,
            }}
            placeholders={{
              begin: t("common:beginLabel"),
              end: t("common:endLabel"),
            }}
            clearable={{ begin: true, end: true }}
          />
        </SingleLabelInputGroup>
        <ControlledSelect
          name="duration"
          control={control}
          clearable
          options={durationOptions}
          label={t("searchForm:labels.duration", { duration: "" })}
        />
        <ControlledNumberInput
          label={t("searchForm:labels.personsAllowed")}
          name="personsAllowed"
          control={control}
          min={1}
        />
        <ControlledSelect
          name="reservationUnitTypes"
          multiselect
          control={control}
          options={reservationUnitTypeOptions}
          enableSearch
          clearable
          label={t("searchForm:labels.reservationUnitTypes")}
        />
        <TextInput
          id="search"
          label={t("searchForm:labels.textSearch")}
          {...register("textSearch")}
          placeholder={t("searchForm:placeholders.textSearch")}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSubmit(onSearch)();
            }
          }}
        />
        <ControlledSelect
          multiselect
          clearable
          name="accessTypes"
          control={control}
          options={accessTypeOptions}
          label={t("searchForm:labels.accessTypes")}
        />
      </ShowAllContainer>
      <Flex $direction="row-reverse">
        <Controller
          name="showOnlyReservable"
          control={control}
          render={({ field: { value, onChange } }) => (
            <StyledCheckBox
              id="showOnlyReservable"
              name="showOnlyReservable"
              label={t("searchForm:labels.showOnlyReservable")}
              onChange={onChange}
              checked={value}
            />
          )}
        />
      </Flex>
      <SearchButtonContainer>
        <FilterTagList
          translateTag={translateTag}
          filters={filterOrder}
          multiSelectFilters={multiSelectFilters}
          hideList={hideTagList}
        />
        <StyledSubmitButton
          id="searchButton"
          type="submit"
          iconStart={isLoading ? <LoadingSpinner small /> : <IconSearch />}
          disabled={isLoading}
        >
          {t("searchForm:searchButton")}
        </StyledSubmitButton>
      </SearchButtonContainer>
    </Flex>
  );
}
