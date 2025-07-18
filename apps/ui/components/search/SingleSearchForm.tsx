import React from "react";
import { useTranslation } from "next-i18next";
import { Checkbox, IconSearch, LoadingSpinner, TextInput } from "hds-react";
import { type SubmitHandler, useForm, Controller } from "react-hook-form";
import styled from "styled-components";
import { addYears, startOfDay } from "date-fns";
import { ControlledNumberInput, TimeRangePicker } from "common/src/components/form";
import { toUIDate } from "common/src/common/util";
import { fromUIDate } from "@/modules/util";
import { getDurationOptions } from "@/modules/const";
import { DateRangePicker } from "@/components/form";
import { FilterTagList } from "../FilterTagList";
import SingleLabelInputGroup from "@/components/common/SingleLabelInputGroup";
import { useSearchModify } from "@/hooks/useSearchValues";
import { ControlledSelect } from "common/src/components/form/ControlledSelect";
import { mapParamToNumber, type OptionsT } from "@/modules/search";
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
  const showOnlyReservable = ignoreMaybeArray(params.getAll("showOnlyReservable")) !== "false";
  return {
    purposes: mapParamToNumber(params.getAll("purposes"), 1),
    units: mapParamToNumber(params.getAll("units"), 1),
    equipments: mapParamToNumber(params.getAll("equipments"), 1),
    reservationUnitTypes: mapParamToNumber(params.getAll("reservationUnitTypes"), 1),
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

// TODO is this the full list? can we filter out all the rest? (i.e. remove the hideTagList)
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
const multiSelectFilters = ["units", "reservationUnitTypes", "purposes", "equipments", "accessTypes"] as const;
// we don't want to show "showOnlyReservable" as a FilterTag, as it has its own checkbox in the form
const hideTagList = ["showOnlyReservable", "order", "sort", "ref"];

type SingleSearchFormProps = {
  options: OptionsT;
  isLoading: boolean;
};

// TODO rewrite this without the form state (use query params directly, but don't refresh the page)
export function SingleSearchForm({
  options: { reservationUnitTypes, purposes, units, equipments },
  isLoading,
}: Readonly<SingleSearchFormProps>): JSX.Element | null {
  const { handleSearch } = useSearchModify();
  const { t } = useTranslation();
  const searchValues = useSearchParams();
  // TODO the users of this should be using watch
  const formValues = mapQueryToForm(searchValues);
  const form = useForm<SearchFormValues>({
    values: formValues,
  });
  const { handleSubmit, setValue, getValues, control, register } = form;

  const durationOptions = getDurationOptions(t);
  const accessTypeOptions = Object.values(AccessType).map((value) => ({
    value,
    label: t(`reservationUnit:accessTypes.${value}`),
  }));

  const translateTag = (key: string, value: string): string | undefined => {
    // Handle possible number / string comparison
    const compFn = (a: { value: unknown }, b: string) => a != null && String(a.value) === b;

    // TODO should rework the find matcher (typing issues) (it works but it's confusing)
    switch (key) {
      case "units":
        return units.find((n) => compFn(n, value))?.label;
      case "reservationUnitTypes":
        return reservationUnitTypes.find((n) => compFn(n, value))?.label;
      case "purposes":
        return purposes.find((n) => compFn(n, value))?.label;
      case "equipments":
        return equipments.find((n) => compFn(n, value))?.label;
      case "duration":
        return durationOptions.find((n) => compFn(n, value))?.label;
      case "accessTypes":
        return accessTypeOptions.find((n) => compFn(n, value))?.label;
      // FIXME: Invalid date/time values are not validated and are shown in the tag list but not in the form
      case "startDate":
      case "endDate":
      case "timeBegin":
      case "timeEnd":
        return value;
      default:
        return "";
    }
  };

  const onSearch: SubmitHandler<SearchFormValues> = (criteria: SearchFormValues) => {
    // We need to pass all form values, even empty ones, to the search handler
    // to ensure that all search params are updated/cleared correctly
    handleSearch(criteria, true);
  };

  // All fields that are normally initially hidden
  const showOptionalFilters = !!(
    formValues.timeBegin ||
    formValues.timeEnd ||
    formValues.duration ||
    formValues.units.length ||
    formValues.personsAllowed ||
    formValues.purposes.length ||
    formValues.equipments.length ||
    formValues.accessTypes.length
  );

  return (
    <Flex as="form" noValidate onSubmit={handleSubmit(onSearch)}>
      <ShowAllContainer
        showAllLabel={t("searchForm:showMoreFilters")}
        showLessLabel={t("searchForm:showLessFilters")}
        maximumNumber={3}
        data-testid="search-form__filters--optional"
        initiallyOpen={showOptionalFilters}
        extraShowMoreContent={
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
        }
      >
        <TextInput
          id="search"
          label={t("searchForm:labels.textSearch")}
          placeholder={t("searchForm:placeholders.textSearch")}
          {...register("textSearch")}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSubmit(onSearch)();
            }
          }}
        />
        <ControlledSelect
          name="reservationUnitTypes"
          label={t("searchForm:labels.reservationUnitTypes")}
          control={control}
          options={reservationUnitTypes}
          multiselect
          clearable
          enableSearch
        />
        <SingleLabelInputGroup label={t("common:dateLabel")}>
          <DateRangePicker
            labels={{
              begin: t("dateSelector:labelStartDate"),
              end: t("dateSelector:labelEndDate"),
            }}
            placeholder={{
              begin: t("common:beginLabel"),
              end: t("common:endLabel"),
            }}
            startDate={fromUIDate(getValues("startDate") ?? "")}
            endDate={fromUIDate(getValues("endDate") ?? "")}
            onChangeStartDate={(date: Date | null) => setValue("startDate", date != null ? toUIDate(date) : null)}
            onChangeEndDate={(date: Date | null) => setValue("endDate", date != null ? toUIDate(date) : null)}
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
            names={{ begin: "timeBegin", end: "timeEnd" }}
            labels={{
              begin: `${t("common:timeLabelBegin")}`,
              end: `${t("common:timeLabelEnd")}`,
            }}
            placeholders={{
              begin: t("common:beginLabel"),
              end: t("common:endLabel"),
            }}
            control={control}
            clearable={{ begin: true, end: true }}
          />
        </SingleLabelInputGroup>
        <ControlledSelect
          name="duration"
          label={t("searchForm:labels.duration", { duration: "" })}
          control={control}
          options={durationOptions}
          clearable
        />
        <ControlledSelect
          name="units"
          label={t("searchForm:labels.units")}
          control={control}
          options={units}
          multiselect
          clearable
          enableSearch
        />

        <ControlledNumberInput
          name="personsAllowed"
          label={t("searchForm:labels.personsAllowed")}
          control={control}
          min={1}
        />
        <ControlledSelect
          name="purposes"
          label={t("searchForm:labels.purposes")}
          options={purposes}
          control={control}
          multiselect
          clearable
          enableSearch
        />
        <ControlledSelect
          name="equipments"
          label={t("searchForm:labels.equipments")}
          control={control}
          options={equipments}
          multiselect
          clearable
          enableSearch
        />

        <ControlledSelect
          name="accessTypes"
          label={t("searchForm:labels.accessTypes")}
          control={control}
          options={accessTypeOptions}
          multiselect
          clearable
        />
      </ShowAllContainer>
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
