import React, { useEffect } from "react";
import { useTranslation } from "next-i18next";
import { IconSearch, Select } from "hds-react";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import styled from "styled-components";
import { DocumentNode, useQuery } from "@apollo/client";
import { sortBy } from "lodash";
import { OptionType } from "common/types/common";
import { breakpoints } from "common/src/common/style";
import { Query, QueryUnitsArgs } from "common/types/gql-types";
import { addYears } from "date-fns";
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

type Props = {
  onSearch: (search: Record<string, string>) => void;
  formValues: { [key: string]: string | null };
  removeValue?: (key?: string[], subItemKey?: string) => void;
};

const desktopBreakpoint = "840px";

const TopContainer = styled.div`
  display: flex;
  flex-flow: column nowrap;
  gap: var(--spacing-m);

  @media (min-width: ${desktopBreakpoint}) {
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

const StyledSelect = styled(Select<OptionType>)`
  button {
    display: grid;
    text-align: left;
  }

  span {
    ${truncatedText}
  }
`;

const StyledCheckBox = styled(Checkbox)`
  &&& {
    @media (min-width: ${breakpoints.m}) {
      margin-top: -70px;
      grid-column: 3 / span 1;
      grid-row: 4;
    }
  }
`;

const TwInput = styled.div`
  display: grid;
  grid-template-columns: 50% 50%;
  .inputGroupStart {
    & > div {
      border-right-width: 0;
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

const DateRangeWrapper = styled.div`
  > div {
    display: flex;
    > div {
      width: 50%;
    }
    label {
      height: 24px;
    }
    /* Starting date picker */
    > div:first-child {
      input {
        border-right: 0;
      }
    }
    /* Ending date picker */
    > div:last-child {
      margin-top: 0;
    }
  }
`;

const TimeRangeWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto auto;
  gap: 0;
  .error-message {
    grid-column: span 2;
  }
  /* Starting date picker */
  > div:first-child > div {
    border-right: 0;
  }
  /* Hide the label text (but keep its height) for the end time select, since HDS adds a "*" to required field labels
  TODO: Make the displaying of the label text component conditional on having an empty text as before label, as it could possibly often be empty. Especially if the component to be is re-used. */
  /* Ending date picker */
  > div:nth-child(2) label {
    height: 24px;
    span {
      display: none;
    }
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
    const options =
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      data[queryNodeName]?.edges
        ?.map((e: { node: unknown }) => e?.node)
        .filter((n: null): n is NonNullable<typeof n> => n != null)
        .map((node: { pk: unknown }) => ({
          id: String(node.pk),
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
  const { options: unitOptions, isLoading: unitsLoading } = useMappedOptions(
    SEARCH_FORM_PARAMS_UNIT,
    "units",
    { publishedReservationUnits: true }
  );
  const { options: purposeOptions, isLoading: purposesLoading } =
    useMappedOptions(SEARCH_FORM_PARAMS_PURPOSE, "purposes");
  const { options: unitTypeOptions, isLoading: typesLoading } =
    useMappedOptions(RESERVATION_UNIT_TYPES, "reservationUnitTypes");
  const { options: equipmentsOptions, isLoading: equipmentsLoading } =
    useMappedOptions(SEARCH_FORM_PARAMS_EQUIPMENT, "equipments");
  const durationMinuteOptions = () => {
    const durations: OptionType[] = [];
    let minute = 15; // no zero duration option, as all available reservations have a positive/non-zero duration
    while (minute <= 90) {
      durations.push({
        label: t("common:minute_other", { count: minute }),
        value: minute,
      });
      minute += 15;
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
    dateBegin: "",
    dateEnd: "",
    timeBegin: null,
    timeEnd: null,
    duration: null,
    minPersons: "",
    maxPersons: "",
    reservationUnitType: "",
    showOnlyAvailable: true,
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
    register("dateBegin");
    register("dateEnd");
    register("timeBegin");
    register("timeEnd");
    register("duration");
    register("minPersons");
    register("maxPersons");
    register("reservationUnitType");
    register("textSearch");
    register("showOnlyAvailable");
  }, [register]);

  // TODO this is awful, don't set a random KeyValue map, use form.reset with a typed JS object
  useEffect(() => {
    Object.keys(formValues).forEach((p) =>
      setValue(
        p as keyof FormValues,
        p === "showOnlyAvailable"
          ? formValues[p as keyof FormValues] !== "false"
          : formValues[p as keyof FormValues]
      )
    );
  }, [formValues, setValue]);

  const getFormSubValueLabel = (
    key: string,
    value: string
  ): string | undefined => {
    switch (key) {
      case "unit":
        return unitOptions.find((n) => n.value === value)?.label;
      case "reservationUnitType":
        return unitTypeOptions.find((n) => n.value === value)?.label;
      case "purposes":
        return purposeOptions.find((n) => n.value === value)?.label;
      case "equipments":
        return equipmentsOptions.find((n) => n.value === value)?.label;
      case "duration":
        return durationOptions.find((n) => n.value === value)?.label;
      case "dateBegin":
      case "dateEnd":
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
  const areOptionsLoaded =
    !unitsLoading && !purposesLoading && !typesLoading && !equipmentsLoading;
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
            value={watch("purposes")?.split(",") || [""]}
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
            value={watch("unit")?.split(",") || [""]}
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
            value={watch("equipments")?.split(",") || [""]}
          />
          <DateRangeWrapper>
            <DateRangePicker
              startDate={fromUIDate(String(getValues("dateBegin")))}
              endDate={fromUIDate(String(getValues("dateEnd")))}
              onChangeStartDate={(date: Date | null) =>
                setValue("dateBegin", date != null ? toUIDate(date) : "")
              }
              onChangeEndDate={(date: Date | null) =>
                setValue("dateEnd", date != null ? toUIDate(date) : "")
              }
              labels={{
                begin: t("searchForm:dateFilter"),
                end: " ",
              }}
              required={{ begin: false, end: false }}
              limits={{
                startMinDate: new Date(),
                startMaxDate: getValues("dateEnd")
                  ? fromUIDate(String(getValues("dateEnd")))
                  : undefined,
                endMinDate: getValues("dateBegin")
                  ? fromUIDate(String(getValues("dateBegin")))
                  : undefined,
                endMaxDate: addYears(new Date(), 2),
              }}
            />
          </DateRangeWrapper>

          <TimeRangeWrapper>
            <TimeRangePicker
              control={control}
              name={{ begin: "timeBegin", end: "timeEnd" }}
              label={{ begin: t("searchForm:timeFilter"), end: " " }}
              placeholder={{
                begin: t("common:beginLabel"),
                end: t("common:endLabel"),
              }}
              clearable={{ begin: true, end: true }}
            />
          </TimeRangeWrapper>

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
            initiallyOpen={
              formValues.reservationUnitType != null ||
              formValues.minPersons != null ||
              formValues.maxPersons != null ||
              formValues.textSearch != null
            }
          >
            <TwInput>
              <StyledSelect
                id="participantMinCountFilter"
                placeholder={t("common:minimum")}
                options={[emptyOption(t("common:minimum"), "")].concat(
                  participantCountOptions
                )}
                label={t("searchForm:participantCountCombined")}
                onChange={(selection: OptionType): void => {
                  setValue("minPersons", String(selection.value));
                }}
                defaultValue={getSelectedOption(
                  getValues("minPersons"),
                  participantCountOptions
                )}
                key={`minPersons${getValues("minPersons")}`}
                className="inputSm inputGroupStart"
              />

              <StyledSelect
                id="participantMaxCountFilter"
                placeholder={t("common:maximum")}
                options={[emptyOption(t("common:maximum"))].concat(
                  participantCountOptions
                )}
                label="&nbsp;"
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
            </TwInput>
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
              defaultValue={
                formValues.textSearch != null
                  ? formValues.textSearch
                  : undefined
              }
            />
          </OptionalFilters>
          <StyledCheckBox
            id="showOnlyAvailable"
            name="showOnlyAvailable"
            label={t("searchForm:showOnlyAvailableLabel")}
            onChange={() =>
              setValue(
                "showOnlyAvailable",
                Boolean(!getValues("showOnlyAvailable"))
              )
            }
            checked={Boolean(watch("showOnlyAvailable"))}
          />
        </Filters>
      </TopContainer>

      <BottomContainer>
        {areOptionsLoaded && formValueKeys.length > 0 && (
          <FilterTagList
            formValueKeys={formValueKeys}
            formValues={formValues}
            removeValue={removeValue}
            getFormSubValueLabel={getFormSubValueLabel}
          />
        )}
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
