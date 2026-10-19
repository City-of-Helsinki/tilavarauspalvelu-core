import React from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addYears, isBefore, startOfDay } from "date-fns";
import { Checkbox, TextInput } from "hds-react";
import { useTranslation } from "next-i18next/pages";
import { useSearchParams } from "next/navigation";
import styled from "styled-components";
import { z } from "zod";
import type { ReadonlyURLSearchParams } from "next/navigation";
import { ShowAllContainer } from "ui/src/components";
import { ControlledNumberInput, TimeRangePicker } from "ui/src/components/form";
import { ControlledSelect } from "ui/src/components/form/ControlledSelect";
import { SearchButton, SearchButtonContainer } from "ui/src/components/SearchButton";
import { formatDate, parseUIDate, timeToMinutes } from "ui/src/modules/date-utils";
import { ignoreMaybeArray, mapParamToInteger, toNumber } from "ui/src/modules/helpers";
import type { OptionsListT } from "ui/src/modules/search";
import { Flex } from "ui/src/styled";
import { AccessType } from "@gql/gql-types";
import { FilterTagList } from "@/components/FilterTagList";
import { DateRangePicker } from "@/components/form";
import { SingleLabelInputGroup } from "@/components/SingleLabelInputGroup";
import { useSearchModify } from "@/hooks/useSearchValues";
import { getDurationOptions } from "@/modules/const";

const StyledCheckBox = styled(Checkbox)`
  margin: 0 !important;
  grid-column: -2 / span 1;
`;

function getDateLimits() {
  const today = startOfDay(new Date());
  return { min: today, max: addYears(today, 2) };
}

// Returns a translation key if the date is not valid
function checkDate(value: string): string | null {
  const date = parseUIDate(value);
  const { min, max } = getDateLimits();
  if (date == null) {
    return "dateSelector:errors.dateInvalid";
  }
  if (date < min) {
    return "dateSelector:errors.dateIsTooSmall";
  }
  if (date > max) {
    return "dateSelector:errors.dateIsTooBig";
  }
  return null;
}

const SearchFormSchema = z
  .object({
    intendedUses: z.array(z.number()),
    units: z.array(z.number()),
    equipments: z.array(z.number()),
    reservationUnitTypes: z.array(z.number()),
    accessTypes: z.array(z.string()),
    timeBegin: z.string().nullable(),
    timeEnd: z.string().nullable(),
    startDate: z.string().nullable(),
    endDate: z.string().nullable(),
    duration: z.number().nullable(),
    personsAllowed: z
      .number()
      .int({ error: "forms:integerNumPersons" })
      .min(1, { error: "forms:minNumPersons" })
      .nullable(),
    showOnlyReservable: z.boolean(),
    textSearch: z.string(),
  })
  .superRefine((val, ctx) => {
    // The message is not displayed. TimeRangePicker shows its own error.
    if (val.timeBegin && val.timeEnd && timeToMinutes(val.timeBegin) >= timeToMinutes(val.timeEnd)) {
      ctx.addIssue({
        code: "custom",
        path: ["timeEnd"],
        message: "searchForm:beginTimeIsBeforeEndTime",
      });
    }
    const startDateError = val.startDate ? checkDate(val.startDate) : null;
    if (startDateError != null) {
      ctx.addIssue({ code: "custom", path: ["startDate"], message: startDateError });
    }
    const endDateError = val.endDate ? checkDate(val.endDate) : null;
    if (endDateError != null) {
      ctx.addIssue({ code: "custom", path: ["endDate"], message: endDateError });
    }
    const startDate = parseUIDate(val.startDate ?? "");
    const endDate = parseUIDate(val.endDate ?? "");
    if (startDate != null && endDate != null && isBefore(endDate, startDate)) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "dateSelector:errors.endDateBeforeStartDate",
      });
    }
  });

type SearchFormValues = z.infer<typeof SearchFormSchema>;

function mapQueryToForm(params: ReadonlyURLSearchParams): SearchFormValues {
  const dur = toNumber(params.get("duration"));
  const duration = dur != null && dur > 0 ? dur : null;
  const showOnlyReservable = ignoreMaybeArray(params.getAll("showOnlyReservable")) !== "false";
  return {
    intendedUses: mapParamToInteger(params.getAll("intendedUses"), 1),
    units: mapParamToInteger(params.getAll("units"), 1),
    equipments: mapParamToInteger(params.getAll("equipments"), 1),
    reservationUnitTypes: mapParamToInteger(params.getAll("reservationUnitTypes"), 1),
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
  "intendedUses",
  "equipments",
  "accessTypes",
] as const;
const multiSelectFilters = ["units", "reservationUnitTypes", "intendedUses", "equipments", "accessTypes"] as const;
// we don't want to show "showOnlyReservable" as a FilterTag, as it has its own checkbox in the form
const hideTagList = ["showOnlyReservable", "order", "sort", "ref"];

type SingleSearchFormProps = {
  options: Readonly<OptionsListT>;
  isLoading: boolean;
};

// Handle possible number / string comparison
const compFn = (a: { value: unknown }, b: string) => a != null && String(a.value) === b;

export function SingleSearchForm({
  options: { reservationUnitTypes, intendedUses, units, equipments },
  isLoading,
}: Readonly<SingleSearchFormProps>): React.ReactElement | null {
  const { handleSearch } = useSearchModify();
  const { t } = useTranslation();
  const searchValues = useSearchParams();
  const formValues = mapQueryToForm(searchValues);
  const form = useForm<SearchFormValues>({
    values: formValues,
    resolver: zodResolver(SearchFormSchema),
  });
  const {
    handleSubmit,
    setValue,
    trigger,
    control,
    register,
    formState: { errors },
  } = form;
  const [startDate, endDate] = useWatch({ control, name: ["startDate", "endDate"] });
  const dateLimits = getDateLimits();

  const translateDateError = (message: string | undefined): string | undefined =>
    message != null
      ? t(message, {
          minDate: formatDate(dateLimits.min),
          maxDate: formatDate(dateLimits.max),
        })
      : undefined;

  const handleDateChange = async (name: "startDate" | "endDate", value: string) => {
    setValue(name, value !== "" ? value : null);
    // validate both, because the end date is compared to the start date
    await trigger(["startDate", "endDate"]);
  };

  const durationOptions = getDurationOptions(t);
  const accessTypeOptions = Object.values(AccessType).map((value) => ({
    value,
    label: t(`reservationUnit:accessTypes.${value}`),
  }));

  const translateTag = (key: string, value: string): string | undefined => {
    switch (key) {
      case "units":
        return units.find((n) => compFn(n, value))?.label;
      case "reservationUnitTypes":
        return reservationUnitTypes.find((n) => compFn(n, value))?.label;
      case "intendedUses":
        return intendedUses.find((n) => compFn(n, value))?.label;
      case "equipments":
        return equipments.find((n) => compFn(n, value))?.label;
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

  const onSearch: SubmitHandler<SearchFormValues> = async (criteria: SearchFormValues) => {
    // We need to pass all form values, even empty ones, to the search handler
    // to ensure that all search params are updated/cleared correctly
    await handleSearch(criteria, true);
  };

  // All fields that are normally initially hidden
  const showOptionalFilters = !!(
    formValues.timeBegin ||
    formValues.timeEnd ||
    formValues.duration ||
    formValues.units.length > 0 ||
    formValues.personsAllowed != null ||
    formValues.intendedUses.length > 0 ||
    formValues.equipments.length > 0 ||
    formValues.accessTypes.length > 0
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
          onKeyDown={async (e) => {
            if (e.key === "Enter") {
              await handleSubmit(onSearch)();
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
            startDate={startDate ?? ""}
            endDate={endDate ?? ""}
            onChangeStartDate={(date) => handleDateChange("startDate", date)}
            onChangeEndDate={(date) => handleDateChange("endDate", date)}
            errors={{
              begin: translateDateError(errors.startDate?.message),
              end: translateDateError(errors.endDate?.message),
            }}
            limits={{
              startMinDate: dateLimits.min,
              startMaxDate: dateLimits.max,
              endMinDate: dateLimits.min,
              endMaxDate: dateLimits.max,
            }}
          />
        </SingleLabelInputGroup>

        <SingleLabelInputGroup label={t("common:timeLabel")}>
          <TimeRangePicker
            names={{ begin: "timeBegin", end: "timeEnd" }}
            labels={{
              begin: t("common:timeLabelBegin"),
              end: t("common:timeLabelEnd"),
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
          integerOnly
          errorText={
            errors.personsAllowed?.message != null ? t(errors.personsAllowed.message, { minValue: 1 }) : undefined
          }
        />
        <ControlledSelect
          name="intendedUses"
          label={t("searchForm:labels.intendedUses")}
          options={intendedUses}
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
        <SearchButton isLoading={isLoading} labelKey="searchForm:searchButton" />
      </SearchButtonContainer>
    </Flex>
  );
}
