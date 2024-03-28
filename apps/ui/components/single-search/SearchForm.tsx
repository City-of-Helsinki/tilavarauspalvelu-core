import React, { ReactNode, useEffect } from "react";
import { useTranslation } from "next-i18next";
import { IconSearch, Select } from "hds-react";
import { type FieldValues, type SubmitHandler, useForm } from "react-hook-form";
import styled from "styled-components";
import { DocumentNode, useQuery } from "@apollo/client";
import { sortBy } from "lodash";
import { OptionType } from "common/types/common";
import { breakpoints } from "common/src/common/style";
import { Query, QueryUnitsArgs } from "common/types/gql-types";
import { addYears, startOfDay } from "date-fns";
import { ShowAllContainer } from "common/src/components";
import { TextInput, TimeRangePicker } from "common/src/components/form";
import { toUIDate } from "common/src/common/util";
import { type FormValues } from "common/src/components/single-search/types";
import {
  fromUIDate,
  getSelectedOption,
  getTranslation,
  mapOptions,
} from "@/modules/util";
import { emptyOption, participantCountOptions } from "@/modules/const";
import { MediumButton, truncatedText } from "@/styles/util";
import {
  SEARCH_FORM_PARAMS_EQUIPMENT,
  SEARCH_FORM_PARAMS_PURPOSE,
  SEARCH_FORM_PARAMS_UNIT,
} from "@/modules/queries/params";
import { RESERVATION_UNIT_TYPES } from "@/modules/queries/reservationUnit";
import {
  Checkbox,
  DateRangePicker,
  MultiSelectDropdown,
} from "@/components/form";
import FilterTagList from "./FilterTagList";
import SingleLabelInputGroup from "@/components/common/SingleLabelInputGroup";

type Props = {
  onSearch: (search: Record<string, string>) => void;
  formValues: { [key: string]: string | null };
  removeValue?: (key?: string[], subItemKey?: string) => void;
};

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

const StyledSelect = styled(Select<OptionType>)<{ $hideLabel?: boolean }>`
  button {
    display: grid;
    text-align: left;
  }

  span {
    ${truncatedText}
  }
  label {
    ${(props) => (props.$hideLabel ? `color: transparent !important;` : ``)}
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

// Custom hook for fetching options from the backend and mapping them to the format used by the Select component
const useMappedOptions = (
  queryName: DocumentNode,
  queryNodeName: string,
  queryOptions?: { publishedReservationUnits: boolean }
): { options: OptionType[]; isLoading: boolean } => {
  const { data, loading } = useQuery<Query, QueryUnitsArgs>(queryName, {
    variables: { ...queryOptions },
  });
  if (data != null && queryNodeName in data) {
    const options: { pk: number; name: string }[] =
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      data[queryNodeName]?.edges
        ?.map((e: { node: unknown }) => e?.node)
        .filter((n: null): n is NonNullable<typeof n> => n != null)
        .map((node: { pk: number }) => ({
          pk: String(node.pk),
          name: getTranslation(node, "name"),
        })) ?? [];
    return {
      options: mapOptions(sortBy(options, "name")),
      isLoading: loading,
    };
  }
  return { options: [], isLoading: loading };
};

const SearchForm = ({
  onSearch,
  formValues,
  removeValue,
}: Props): JSX.Element | null => {
  const formValueKeys = Object.keys(formValues);
  const { t } = useTranslation();
  const { options: unitOptions } = useMappedOptions(
    SEARCH_FORM_PARAMS_UNIT,
    "units",
    { publishedReservationUnits: true }
  );
  const { options: purposeOptions } = useMappedOptions(
    SEARCH_FORM_PARAMS_PURPOSE,
    "purposes"
  );
  const { options: unitTypeOptions } = useMappedOptions(
    RESERVATION_UNIT_TYPES,
    "reservationUnitTypes"
  );
  const { options: equipmentsOptions } = useMappedOptions(
    SEARCH_FORM_PARAMS_EQUIPMENT,
    "equipments"
  );
  const durationMinuteOptions = () => {
    const durations: OptionType[] = [];
    let minute = 30; // no zero duration option, as all available reservations have a positive/non-zero duration
    while (minute <= 90) {
      durations.push({
        label: t("common:minute_other", { count: minute }),
        value: minute,
      });
      minute += 30;
    }
    return durations;
  };

  const populateDurationOptions = (): OptionType[] => {
    const times: OptionType[] = [];
    let hour = 2;
    let minute = 0;

    while (hour < 24) {
      times.push({
        label: t("common:hour_other", { count: hour + minute / 60 }),
        value: hour * 60 + minute,
      });
      minute += 30;
      // Reset the minute counter, and increment the hour counter if necessary
      if (minute === 60) {
        minute = 0;
        hour++;
      }
    }
    // we need to add the minute times to the beginning of the duration options
    return durationMinuteOptions().concat(times);
  };
  const durationOptions = populateDurationOptions();

  const initialValues = {
    unit: "",
    equipments: "",
    startDate: null,
    endDate: null,
    timeBegin: null,
    timeEnd: null,
    duration: null,
    minPersons: "",
    maxPersons: "",
    reservationUnitType: "",
    showOnlyReservable: true,
    textSearch: "",
  };

  const { register, watch, handleSubmit, setValue, getValues, control } =
    useForm<FormValues>({
      defaultValues: {
        ...initialValues,
        ...formValues,
      },
    });

  useEffect(() => {
    register("purposes");
    register("unit");
    register("equipments");
    register("startDate");
    register("endDate");
    register("timeBegin");
    register("timeEnd");
    register("duration");
    register("minPersons");
    register("maxPersons");
    register("reservationUnitType");
    register("textSearch");
    register("showOnlyReservable");
  }, [register]);

  // FIXME this is awful, don't set a random KeyValue map, use form.reset with a typed JS object
  useEffect(() => {
    Object.keys(formValues).forEach((p) =>
      setValue(
        p as keyof FormValues,
        p === "showOnlyReservable"
          ? formValues[p as keyof FormValues] !== "false"
          : formValues[p as keyof FormValues]
      )
    );
  }, [formValues, setValue]);

  const getFormSubValueLabel = (
    key: string,
    value: string
  ): string | undefined => {
    const compFn = (a: (typeof unitOptions)[0], b: string) =>
      a != null && String(a.value) === b;
    switch (key) {
      case "unit":
        return unitOptions.find((n) => compFn(n, value))?.label;
      case "reservationUnitType":
        return unitTypeOptions.find((n) => compFn(n, value))?.label;
      case "purposes":
        return purposeOptions.find((n) => compFn(n, value))?.label;
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
    onSearch(searchCriteria);
  };

  return (
    <>
      <TopContainer>
        <Filters>
          <MultiSelectDropdown
            id="purposeFilter"
            checkboxName="purposeFilter"
            name="purposes"
            onChange={(selection: string[]): void => {
              setValue("purposes", selection.filter((n) => n !== "").join(","));
            }}
            options={purposeOptions}
            showSearch
            title={t("searchForm:purposesFilter")}
            value={watch("purposes")?.split(",") ?? [""]}
          />
          <MultiSelectDropdown
            id="unitFilter"
            checkboxName="unitFilter"
            name="unit"
            onChange={(selection: string[]): void => {
              setValue("unit", selection.filter((n) => n !== "").join(","));
            }}
            options={unitOptions}
            showSearch
            title={t("searchForm:unitFilter")}
            value={watch("unit")?.split(",") ?? [""]}
          />
          <MultiSelectDropdown
            id="reservationUnitEquipmentsFilter"
            checkboxName="reservationUnitEquipmentsFilter"
            name="equipments"
            onChange={(selection: string[]): void => {
              setValue(
                "equipments",
                selection.filter((n) => n !== "").join(",")
              );
            }}
            options={equipmentsOptions}
            showSearch
            title={t("searchForm:equipmentsFilter")}
            value={watch("equipments")?.split(",") ?? [""]}
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

          <StyledSelect
            id="durationFilter"
            placeholder={t("common:minimum")}
            options={[emptyOption(t("common:minimum"))].concat(durationOptions)}
            label={t("searchForm:durationFilter", { duration: "" })}
            onChange={(selection: OptionType): void => {
              setValue(
                "duration",
                !Number.isNaN(Number(selection.value))
                  ? Math.round(Number(selection.value) * 10) / 10
                  : null
              );
            }}
            defaultValue={getSelectedOption(
              getValues("duration"),
              durationOptions
            )}
            key={`duration${getValues("duration")}`}
          />

          <OptionalFilters
            showAllLabel={t("searchForm:showMoreFilters")}
            showLessLabel={t("searchForm:showLessFilters")}
            maximumNumber={0}
            data-testid="search-form__filters--optional"
            initiallyOpen={
              formValues.reservationUnitType != null ||
              formValues.minPersons != null ||
              formValues.maxPersons != null ||
              formValues.textSearch != null
            }
          >
            <SingleLabelInputGroup
              label={t("searchForm:participantCountCombined")}
            >
              <StyledSelect
                id="participantMinCountFilter"
                placeholder={t("common:minimum")}
                options={[emptyOption(t("common:minimum"), "")].concat(
                  participantCountOptions
                )}
                label={`${t("searchForm:participantCountCombined")} ${t("common:minimum")}`}
                onChange={(selection: OptionType): void => {
                  setValue("minPersons", String(selection.value));
                }}
                defaultValue={getSelectedOption(
                  getValues("minPersons"),
                  participantCountOptions
                )}
                key={`minPersons${getValues("minPersons")}`}
                className="inputSm inputGroupStart"
                $hideLabel
              />

              <StyledSelect
                id="participantMaxCountFilter"
                placeholder={t("common:maximum")}
                options={[emptyOption(t("common:maximum"))].concat(
                  participantCountOptions
                )}
                label={`${t("searchForm:participantCountCombined")} ${t("common:maximum")}`}
                onChange={(selection: OptionType): void => {
                  setValue("maxPersons", String(selection.value));
                }}
                defaultValue={getSelectedOption(
                  getValues("maxPersons"),
                  participantCountOptions
                )}
                key={`maxPersons${getValues("maxPersons")}`}
                className="inputSm inputGroupEnd"
              />
            </SingleLabelInputGroup>
            <MultiSelectDropdown
              id="reservationUnitTypeFilter"
              checkboxName="reservationUnitTypeFilter"
              name="reservationType"
              onChange={(selection: string[]): void => {
                setValue(
                  "reservationUnitType",
                  selection.filter((n) => n !== "").join(",")
                );
              }}
              options={unitTypeOptions}
              showSearch
              title={t("searchForm:typeLabel")}
              value={watch("reservationUnitType")?.split(",") || [""]}
              key={`minPersons${getValues("minPersons")}`}
            />
            <TextInput
              control={control}
              id="search"
              name="textSearch"
              label={t("searchForm:textSearchLabel")}
              placeholder={t("searchForm:searchTermPlaceholder")}
              onEnterKeyPress={() => handleSubmit(search)()}
              defaultValue={formValues.textSearch ?? undefined}
            />
          </OptionalFilters>
          <StyledCheckBox
            id="showOnlyReservable"
            name="showOnlyReservable"
            label={t("searchForm:showOnlyReservableLabel")}
            onChange={() =>
              setValue(
                "showOnlyReservable",
                Boolean(!getValues("showOnlyReservable"))
              )
            }
            checked={Boolean(watch("showOnlyReservable"))}
          />
        </Filters>
      </TopContainer>

      <BottomContainer>
        <FilterTagList
          formValueKeys={formValueKeys}
          formValues={formValues}
          removeValue={removeValue}
          getFormSubValueLabel={getFormSubValueLabel}
        />
        <SubmitButton
          id="searchButton"
          onClick={handleSubmit(search) as SubmitHandler<FieldValues>}
          iconLeft={<IconSearch />}
        >
          {t("searchForm:searchButton")}
        </SubmitButton>
      </BottomContainer>
    </>
  );
};

export default SearchForm;
