import React, { ReactNode } from "react";
import { useTranslation } from "next-i18next";
import { IconSearch, TextInput } from "hds-react";
import { type SubmitHandler, useForm, Controller } from "react-hook-form";
import styled from "styled-components";
import { breakpoints } from "common/src/common/style";
import { addYears, startOfDay } from "date-fns";
import { ShowAllContainer } from "common/src/components";
import { TimeRangePicker } from "common/src/components/form";
import { toUIDate } from "common/src/common/util";
import { fromUIDate } from "@/modules/util";
import { getDurationOptions, participantCountOptions } from "@/modules/const";
import { MediumButton } from "@/styles/util";
import { Checkbox, DateRangePicker } from "@/components/form";
import { FilterTagList } from "./FilterTagList";
import SingleLabelInputGroup from "@/components/common/SingleLabelInputGroup";
import { useSearchModify, useSearchValues } from "@/hooks/useSearchValues";
import { type ParsedUrlQuery } from "node:querystring";
import { ControlledMultiSelect } from "../search/ControlledMultiSelect";
import { ControlledSelect } from "@/components/common/ControlledSelect";
import {
  mapQueryParamToNumber,
  mapSingleBooleanParamToFormValue,
  mapSingleParamToFormValue,
} from "@/modules/search";

const TopContainer = styled.div`
  display: flex;
  flex-flow: column nowrap;
  gap: var(--spacing-m);

  @media (min-width: ${breakpoints.m}) {
    grid-template-columns: 1fr 154px;
  }
`;

const Filters = styled.div`
  margin-top: 0;
  max-width: 100%;
  display: grid;
  grid-template-columns: auto;
  grid-template-rows: repeat(2, auto);
  grid-gap: var(--spacing-m);
  font-size: var(--fontsize-body-m);
  > div {
    grid-column: 1 / span 3;
  }

  label {
    font-family: var(--font-medium);
    font-weight: 500;
  }

  @media (min-width: ${breakpoints.m}) {
    margin-top: var(--spacing-s);
    grid-template-columns: repeat(3, auto);
    > div {
      grid-column: span 1;
    }
  }

  @media (min-width: ${breakpoints.l}) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const StyledCheckBox = styled(Checkbox)`
  &&& {
    @media (min-width: ${breakpoints.m}) {
      margin-top: calc(-70px + var(--spacing-layout-2-xs));
      grid-column: 3 / span 1;
      grid-row: 4;
    }
  }
`;

const OptionalFilters = styled(ShowAllContainer)`
  && {
    grid-column: 1 / span 3;
  }
  > [class="ShowAllContainer__Content"] {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--spacing-m);
    &:empty {
      row-gap: 0;
    }
  }
  /* If OptionalFilters is closed (== has no children), remove the row-gap and margin-top from the
  toggle button container. Otherwise the toggle button container will have an unwanted gap above it
  resulting from the empty grid row in breakpoints larger than mobile/s. */
  @media (min-width: ${breakpoints.m}) {
    grid-column: 1 / span 2;
    grid-row: 3 / span 1;
    > [class*="ShowAllContainer__ToggleButtonContainer"] {
      margin-top: var(--spacing-s);
    }
    > [class="ShowAllContainer__Content"] {
      grid-template-columns: repeat(2, 1fr);
      gap: var(--spacing-m);
      &:empty {
        row-gap: 0;
        ~ [class*="ShowAllContainer__ToggleButtonContainer"] {
          margin-top: 0;
        }
      }
    }

    > div {
      grid-column: span 1;
    }
  }
  @media (min-width: ${breakpoints.l}) {
    > [class*="ShowAllContainer__Content"] {
      grid-template-columns: repeat(3, 1fr);
      grid-column: 1 / span 3;
    }
  }
`;

const BottomContainer = styled.div`
  margin: var(--spacing-m) 0;
  display: flex;
  width: 100%;
  flex-flow: column nowrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-m);
  @media (min-width: ${breakpoints.m}) {
    flex-flow: row nowrap;
  }
`;

const SingleLabelRangeWrapper = styled(SingleLabelInputGroup)<{
  label: string;
  children: ReactNode;
}>`
  & > div:not(:first-child) {
    margin-top: var(--spacing-s);
  }
`;

const SubmitButton = styled(MediumButton)`
  width: 100%;
  @media (min-width: ${breakpoints.s}) {
    width: 120px;
    white-space: nowrap;
  }
`;

type FormValues = {
  // TODO there is some confusion on the types of these
  // they are actually an array of pks (number) but they are encoded as val1,val2,val3 string
  purposes: string;
  unit: string;
  equipments: string;
  reservationUnitTypes: string;
  timeBegin: string | null;
  timeEnd: string | null;
  startDate: string | null;
  endDate: string | null;
  duration: number | null;
  minPersons: number | null;
  maxPersons: number | null;
  showOnlyReservable?: boolean;
  textSearch: string;
};

function mapQueryToForm(query: ParsedUrlQuery): FormValues {
  const dur = mapQueryParamToNumber(query.duration);
  const duration = dur != null && dur > 0 ? dur : null;
  const showOnlyReservable =
    mapSingleBooleanParamToFormValue(query.showOnlyReservable) ?? true;
  return {
    // array parameters (string encoded with ',' separator)
    purposes: mapSingleParamToFormValue(query.purposes) ?? "",
    unit: mapSingleParamToFormValue(query.unit) ?? "",
    equipments: mapSingleParamToFormValue(query.equipments) ?? "",
    reservationUnitTypes:
      mapSingleParamToFormValue(query.reservationUnitType) ?? "",
    // ?
    timeBegin: mapSingleParamToFormValue(query.timeBegin) ?? null,
    timeEnd: mapSingleParamToFormValue(query.timeEnd) ?? null,
    startDate: mapSingleParamToFormValue(query.startDate) ?? null,
    endDate: mapSingleParamToFormValue(query.endDate) ?? null,
    // number params
    duration,
    minPersons: mapQueryParamToNumber(query.minPersons) ?? null,
    maxPersons: mapQueryParamToNumber(query.maxPersons) ?? null,
    showOnlyReservable,
    textSearch: mapSingleParamToFormValue(query.textSearch) ?? "",
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
// we don't want to show "showOnlyReservable" as a FilterTag, as it has its own checkbox in the form
const hideTagList = ["showOnlyReservable", "order", "sort"];

// TODO rewrite this witout the form state (use query params directly, but don't refresh the page)
export function SingleSearchForm({
  reservationUnitTypeOptions,
  purposeOptions,
  unitOptions,
  equipmentsOptions,
  isLoading,
}: {
  reservationUnitTypeOptions: Array<{ value: string; label: string }>;
  purposeOptions: Array<{ value: string; label: string }>;
  unitOptions: Array<{ value: number; label: string }>;
  equipmentsOptions: Array<{ value: number; label: string }>;
  isLoading: boolean;
}): JSX.Element | null {
  const { handleSearch } = useSearchModify();

  const { t } = useTranslation();
  const unitTypeOptions = reservationUnitTypeOptions;
  const durationOptions = getDurationOptions(t);

  const searchValues = useSearchValues();
  // TODO the users of this should be using watch
  const formValues = mapQueryToForm(searchValues);
  const { handleSubmit, setValue, getValues, control, register } =
    useForm<FormValues>({
      values: formValues,
    });

  const translateTag = (key: string, value: string): string | undefined => {
    // Handle possible number / string comparison
    const compFn = (a: { value: unknown }, b: string) =>
      a != null && String(a.value) === b;
    // TODO should rework the find matcher (typing issues) (it works but it's confusing)
    switch (key) {
      case "unit":
        return unitOptions.find((n) => compFn(n, value))?.label;
      case "reservationUnitType":
        return unitTypeOptions.find((n) => n.value === value)?.label;
      case "purposes":
        return purposeOptions.find((n) => n.value === value)?.label;
      case "equipments":
        return equipmentsOptions.find((n) => compFn(n, value))?.label;
      case "duration":
        return durationOptions.find((n) => compFn(n, value))?.label;
      case "startDate":
      case "endDate":
      case "timeBegin":
      case "timeEnd":
        return value;
      default:
        return "";
    }
  };

  const search: SubmitHandler<FormValues> = (criteria: FormValues) => {
    // Remove empty (null || "") values from the criteria
    const searchCriteria = Object.entries(criteria).reduce((c, cv) => {
      if (cv[1] == null || cv[1] === "") return c;
      return { ...c, [cv[0]]: cv[1] };
    }, {});
    handleSearch(searchCriteria);
  };

  const showOptionalFilters =
    formValues.reservationUnitTypes !== "" ||
    formValues.minPersons != null ||
    formValues.maxPersons != null ||
    formValues.textSearch != null;

  return (
    <form noValidate onSubmit={handleSubmit(search)}>
      <TopContainer>
        <Filters>
          <ControlledMultiSelect
            name="purposes"
            control={control}
            options={purposeOptions}
            label={t("searchForm:purposesFilter")}
          />
          <ControlledMultiSelect
            name="unit"
            control={control}
            options={unitOptions}
            label={t("searchForm:unitFilter")}
          />
          <ControlledMultiSelect
            name="equipments"
            control={control}
            options={equipmentsOptions}
            label={t("searchForm:equipmentsFilter")}
          />
          <SingleLabelRangeWrapper label={t("searchForm:dateFilter")}>
            <DateRangePicker
              startDate={fromUIDate(String(getValues("startDate")))}
              endDate={fromUIDate(String(getValues("endDate")))}
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
          </SingleLabelRangeWrapper>
          <SingleLabelRangeWrapper label={t("searchForm:timeFilter")}>
            <TimeRangePicker
              control={control}
              names={{ begin: "timeBegin", end: "timeEnd" }}
              labels={{
                begin: `${t("searchForm:timeFilter")}: ${t("common:beginLabel")}`,
                end: `${t("searchForm:timeFilter")}: ${t("common:endLabel")}`,
              }}
              placeholders={{
                begin: t("common:beginLabel"),
                end: t("common:endLabel"),
              }}
              clearable={{ begin: true, end: true }}
            />
          </SingleLabelRangeWrapper>
          <ControlledSelect
            name="duration"
            control={control}
            clearable
            options={durationOptions}
            label={t("searchForm:durationFilter", { duration: "" })}
          />
          <OptionalFilters
            showAllLabel={t("searchForm:showMoreFilters")}
            showLessLabel={t("searchForm:showLessFilters")}
            maximumNumber={0}
            data-testid="search-form__filters--optional"
            initiallyOpen={showOptionalFilters}
          >
            <SingleLabelInputGroup
              label={t("searchForm:participantCountCombined")}
            >
              <ControlledSelect
                name="minPersons"
                control={control}
                options={participantCountOptions}
                clearable
                label={`${t("searchForm:participantCountCombined")} ${t("common:minimum")}`}
                placeholder={t("common:minimum")}
                className="inputSm inputGroupStart"
              />
              <ControlledSelect
                name="maxPersons"
                control={control}
                options={participantCountOptions}
                clearable
                label={`${t("searchForm:participantCountCombined")} ${t("common:maximum")}`}
                placeholder={t("common:maximum")}
                className="inputSm inputGroupEnd"
              />
            </SingleLabelInputGroup>
            <ControlledMultiSelect
              name="reservationUnitTypes"
              control={control}
              options={unitTypeOptions}
              label={t("searchForm:typeLabel")}
            />
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
          </OptionalFilters>
          <Controller
            name="showOnlyReservable"
            control={control}
            render={({ field: { value, onChange } }) => (
              <StyledCheckBox
                id="showOnlyReservable"
                name="showOnlyReservable"
                label={t("searchForm:showOnlyReservableLabel")}
                onChange={onChange}
                checked={value}
              />
            )}
          />
        </Filters>
      </TopContainer>
      <BottomContainer>
        <FilterTagList
          translateTag={translateTag}
          filters={filterOrder}
          multiSelectFilters={multiSelectFilters}
          hideList={hideTagList}
        />
        <SubmitButton
          id="searchButton"
          type="submit"
          iconLeft={<IconSearch />}
          isLoading={isLoading}
        >
          {t("searchForm:searchButton")}
        </SubmitButton>
      </BottomContainer>
    </form>
  );
}
