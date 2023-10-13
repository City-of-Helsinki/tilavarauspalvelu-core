import React, { ReactNode, useEffect, useState } from "react";
import { useTranslation } from "next-i18next";
import {
  Select,
  TextInput,
  IconSearch,
  Tag,
  IconAngleUp,
  IconAngleDown,
  Button,
} from "hds-react";
import { useForm } from "react-hook-form";
import styled from "styled-components";
import { useQuery } from "@apollo/client";
import { sortBy } from "lodash";
import { OptionType } from "common/types/common";
import { breakpoints } from "common/src/common/style";
import { Query, QueryUnitsArgs } from "common/types/gql-types";
import { toApiDate } from "common/src/common/util";
import { addYears } from "date-fns";
import { ShowAllContainer } from "common/src/components";
import TimeRangePicker from "common/src/components/form/TimeRangePicker";
import {
  mapOptions,
  getSelectedOption,
  getTranslation,
  fromUIDate,
} from "../../modules/util";
import { emptyOption, participantCountOptions } from "../../modules/const";
import { MediumButton, truncatedText } from "../../styles/util";
import MultiSelectDropdown from "../form/MultiselectDropdown";
import {
  SEARCH_FORM_PARAMS_EQUIPMENT,
  SEARCH_FORM_PARAMS_PURPOSE,
  SEARCH_FORM_PARAMS_UNIT,
} from "../../modules/queries/params";
import { RESERVATION_UNIT_TYPES } from "../../modules/queries/reservationUnit";
import { getUnitName } from "../../modules/reservationUnit";
import { JustForDesktop, JustForMobile } from "../../modules/style/layout";
import DateRangePicker from "@/components/form/DateRangePicker";

type Props = {
  onSearch: (search: Record<string, string>) => void;
  formValues: { [key: string]: string };
  removeValue: (key?: string[], subItemKey?: string) => void;
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

const FilterToggleWrapper = styled.div`
  display: grid;
  justify-items: center;
  margin: var(--spacing-xs) 0;
`;

const Hr = styled.hr`
  border-color: var(--color-black-60);
  border-style: solid;
`;

const Filters = styled.div<{ children: ReactNode[] }>`
  margin-top: 0;
  max-width: 100%;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: repeat(${({ children }) => children.length}, auto);
  grid-gap: var(--spacing-m);
  font-size: var(--fontsize-body-m);

  label {
    font-family: var(--font-medium);
    font-weight: 500;
  }
  > div {
    grid-column: span 1;
  }

  @media (min-width: ${breakpoints.m}) {
    margin-top: var(--spacing-s);
    grid-template-columns: repeat(2, 1fr);
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

const Group = styled.div<{ children: ReactNode[]; $gap?: string }>`
  > div:first-of-type {
    label {
      width: calc(${({ children }) => children.length} * 100%);
    }
  }

  .inputGroupEnd {
    & > div {
      border-left-width: 0;
    }
    margin-left: 0;
  }

  .inputGroupStart {
    & > div {
      border-right-width: 0;
    }

    & + .inputGroupEnd > div {
      border-left-width: 2px;
    }

    margin-right: 0;
  }

  display: grid;
  grid-template-columns: repeat(${({ children }) => children.length}, 1fr);
  ${({ $gap }) => $gap && `gap: ${$gap};`}
`;

const OptionalFilters = styled(ShowAllContainer)<{
  children: ReactNode[];
  $gap?: string;
}>`
  && {
    grid-column: span 3;
  }
  > [class="ShowAllContainer__Content"] {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(3, auto);
    display: grid;
    gap: ${({ $gap }) => $gap ?? "var(--spacing-m)"};
  }
  @media (min-width: ${breakpoints.m}) {
    grid-template-rows: repeat(${({ children }) => children.length}, auto);
    grid-column: 1 / span 2;
    grid-row: span 1;
    margin-bottom: var(--spacing-m);
    > [class="ShowAllContainer__Content"] {
      grid-template-columns: repeat(2, 1fr);
      grid-template-rows: repeat(3, auto);
    }

    > div {
      grid-column: span 1;
    }

    [class*="OptionalFilters"] {
      grid-column: span 2;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
    }
  }
  @media (min-width: ${breakpoints.l}) {
    > [class="ShowAllContainer__Content"] {
      grid-template-columns: repeat(3, 1fr);
      grid-column: 1 / span 3;
    }
  }
`;

const BottomContainer = styled.div`
  margin: var(--spacing-m) 0;
  display: flex;
  width: 100%;
  flex-flow: row nowrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--spacing-m);
`;

const DateRangeWrapper = styled.div`
  > div {
    display: flex;
    // Starting date picker
    > div:first-child {
      input {
        border-right: 0;
      }
    }
    // Ending date picker
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
  // Starting date picker
  > div:first-child > div {
    border-right: 0;
  }
  // Hide the label text (but keep its height) for the end time select, since HDS adds a "*" to required field labels
  // TODO: Make the displaying of the label text component conditional on having an empty text as endTime label, as it could possibly often be empty. Especially if the component to be is re-used.
  > div:nth-child(2) label {
    height: 24px;
    span {
      display: none;
    }
  }
`;

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

const SubmitButton = styled(MediumButton)`
  width: 100%;

  @media (min-width: ${breakpoints.s}) {
    width: auto;
    white-space: nowrap;
  }
`;

const filterOrder = [
  "textSearch",
  "minPersons",
  "maxPersons",
  "reservationUnitType",
  "unit",
  "purposes",
  // TODO: add the new filters here - order is unclear
];

const SearchForm = ({
  onSearch,
  formValues,
  removeValue,
}: Props): JSX.Element | null => {
  const { t } = useTranslation();

  const [reservationTypeSearchInput, setReservationTypeSearchInput] =
    useState<string>("");
  const [reservationEquipmentSearchInput, setReservationEquipmentSearchInput] =
    useState<string>("");
  const [reservationStartDate, setReservationStartDate] = useState<Date | null>(
    new Date()
  );
  const [reservationEndDate, setReservationEndDate] = useState<Date | null>(
    null
  );
  const [reservationEquipmentOptions, setReservationEquipmentOptions] =
    useState<OptionType[]>([]);
  const [unitSearchInput, setUnitSearchInput] = useState<string>("");
  const [purposeSearchInput, setPurposeSearchInput] = useState<string>("");
  const [areFiltersVisible, setAreFiltersVisible] = useState(false);

  const { data: unitQueryData, loading: unitsLoading } = useQuery<
    Query,
    QueryUnitsArgs
  >(SEARCH_FORM_PARAMS_UNIT, {
    variables: {
      publishedReservationUnits: true,
    },
  });
  const units =
    unitQueryData?.units?.edges
      ?.map((e) => e?.node)
      .filter((n): n is NonNullable<typeof n> => n != null)
      .map((node) => ({
        id: String(node.pk),
        name: getUnitName(node),
      })) ?? [];
  const unitOptions = mapOptions(sortBy(units, "name"));

  const { data: purposesQueryData, loading: purposesLoading } = useQuery<Query>(
    SEARCH_FORM_PARAMS_PURPOSE
  );
  const purposes =
    purposesQueryData?.purposes?.edges
      ?.map((e) => e?.node)
      .filter((n): n is NonNullable<typeof n> => n != null)
      .map((node) => ({
        id: String(node.pk),
        name: getTranslation(node, "name"),
      })) ?? [];
  const purposeOptions = mapOptions(sortBy(purposes, "name"));

  const { data: unitTypeQueryData, loading: typesLoading } = useQuery<Query>(
    RESERVATION_UNIT_TYPES
  );
  const unitTypes =
    unitTypeQueryData?.reservationUnitTypes?.edges
      ?.map((e) => e?.node)
      .filter((n): n is NonNullable<typeof n> => n != null)
      .map((node) => ({
        id: String(node.pk),
        name: getTranslation(node, "name"),
      })) ?? [];
  const reservationUnitTypeOptions = mapOptions(sortBy(unitTypes, "name"));

  const { data: equipmentQueryData, loading: equipmentsLoading } =
    useQuery<Query>(SEARCH_FORM_PARAMS_EQUIPMENT);
  const equipments =
    equipmentQueryData?.equipments?.edges
      ?.map((e) => e?.node)
      .filter((n): n is NonNullable<typeof n> => n != null)
      .map((node) => ({
        id: String(node.pk),
        name: getTranslation(node, "name"),
      })) ?? [];
  const equipmentOptions = mapOptions(sortBy(equipments, "name"));

  const minuteDurations = [
    {
      label: t("common:minute_other", { count: 15 }),
      value: 0.25,
    },
    {
      label: t("common:minute_other", { count: 30 }),
      value: 0.5,
    },
    {
      label: t("common:minute_other", { count: 45 }),
      value: 0.75,
    },
    {
      label: t("common:minute_other", { count: 60 }),
      value: 1,
    },
    {
      label: t("common:minute_other", { count: 90 }),
      value: 1.5,
    },
  ] as OptionType[];
  const durationMinuteOptions = () => {
    const durations: OptionType[] = [];
    let minute = 15;
    while (minute <= 90) {
      durations.push({
        label: t("common:minute_other", { count: minute }),
        value: 60 / minute,
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
        value: hour + minute / 60,
      });
      minute += 30;
      // Reset the minute counter, and increment the hour counter if necessary
      if (minute === 60) {
        minute = 0;
        hour++;
      }
    }
    // we need to add the minute times to the beginning of the duration options
    return durationMinuteOptions().concat(...times) as OptionType[];
  };

  const { register, watch, handleSubmit, setValue, getValues, control } =
    useForm({
      defaultValues: {
        purposes: "",
        unit: "",
        equipment: "",
        dateBegin: todayDate,
        dateEnd: null,
        timeBegin: null,
        timeEnd: null,
        duration: null,
        minPersons: 1,
        maxPersons: null,
        reservationUnitType: "",
      },
    });

  const getFormSubValueLabel = (
    key: string,
    value: string
  ): string | undefined => {
    switch (key) {
      case "unit":
        return unitOptions.find((n) => n.value === value)?.label;
      case "reservationUnitType":
        return reservationUnitTypeOptions.find((n) => n.value === value)?.label;
      case "purposes":
        return purposeOptions.find((n) => n.value === value)?.label;
      case "equipment":
        return equipmentOptions.find((n) => n.value === value)?.label;
      default:
        return "";
    }
  };

  const multiSelectFilters = [
    "unit",
    "reservationUnitType",
    "purposes",
    "equipment",
  ];

  useEffect(() => {
    register("purposes");
    register("unit");
    register("equipment");
    register("dateBegin");
    register("dateEnd");
    register("timeBegin");
    register("timeEnd");
    register("duration");
    register("minPersons");
    register("maxPersons");
    register("reservationUnitType");
  }, [register]);

  // TODO this is awful, don't set a random KeyValue map, use form.reset with a typed JS object
  useEffect(() => {
    Object.keys(formValues).forEach((p) => setValue(p, formValues[p]));
  }, [formValues, setValue]);

  const search = (criteria: Record<string, string>) => {
    onSearch(criteria);
  };

  const areOptionsLoaded = !unitsLoading && !purposesLoading && !typesLoading;
  const formValueKeys = Object.keys(formValues);

  return (
    <>
      <TopContainer>
        <Filters>
          <MultiSelectDropdown
            id="purposeFilter"
            checkboxName="purposeFilter"
            inputValue={purposeSearchInput}
            name="purposes"
            onChange={(selection: string[]): void => {
              setValue("purposes", selection.filter((n) => n !== "").join(","));
            }}
            options={purposeOptions}
            setInputValue={setPurposeSearchInput}
            showSearch
            title={t("searchForm:purposesFilter")}
            value={watch("purposes")?.split(",") || [""]}
          />
          <MultiSelectDropdown
            id="unitFilter"
            checkboxName="unitFilter"
            inputValue={unitSearchInput}
            name="unit"
            onChange={(selection: string[]): void => {
              setValue("unit", selection.filter((n) => n !== "").join(","));
            }}
            options={unitOptions}
            setInputValue={setUnitSearchInput}
            showSearch
            title={t("searchForm:unitFilter")}
            value={watch("unit")?.split(",") || [""]}
          />
          <MultiSelectDropdown
            id="reservationUnitEquipmentFilter"
            checkboxName="reservationUnitEquipmentFilter"
            inputValue={reservationEquipmentSearchInput}
            name="equipment"
            onChange={(selection: string[]): void => {
              setValue(
                "equipment",
                selection.filter((n) => n !== "").join(",")
              );
            }}
            options={equipmentOptions}
            setInputValue={setReservationEquipmentSearchInput}
            showSearch
            title={t("searchForm:equipmentFilter")}
            value={watch("equipment")?.split(",") || [""]}
          />
          <DateRangeWrapper>
            <DateRangePicker
              startDate={
                getValues("dateStart") != null
                  ? new Date(fromUIDate(getValues("dateStart")))
                  : null
              }
              endDate={
                getValues("dateEnd") != null
                  ? new Date(fromUIDate(getValues("dateEnd")))
                  : null
              }
              onChangeStartDate={(date: Date | null) =>
                setValue("dateStart", date != null ? toUIDate(date) : "")
              }
              onChangeEndDate={(date: Date | null) =>
                setValue("dateEnd", date != null ? toUIDate(date) : "")
              }
              labels={{
                begin: t("common:beginLabel"),
                end: t("common:endLabel"),
              }}
              required={{
                begin: true,
                end: false,
              }}
              limits={{
                startMinDate: new Date(),
                startMaxDate: getValues("dateEnd")
                  ? fromApiDate(String(getValues("dateEnd")))
                  : undefined,
                endMinDate: getValues("dateStart")
                  ? fromUIDate(String(getValues("dateStart")))
                  : undefined,
                endMaxDate: addYears(new Date(), 2),
              }}
            />
          </DateRangeWrapper>
          <TimeRangeWrapper>
            <TimeRangePicker
              control={control}
              name={{ begin: "timeBegin", end: "timeEnd" }}
              label={{ begin: t("searchForm:intervalFilter"), end: " " }}
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
            options={populateDurationOptions()}
            label={t("common:duration", { duration: "" })}
            onChange={(selection: OptionType): void => {
              setValue("duration", selection?.value);
            }}
            defaultValue={getSelectedOption(
              getValues("duration"),
              populateDurationOptions()
            )}
            key={`duration${getValues("duration")}`}
          />
          <OptionalFilters
            showAllLabel={t("searchForm:showMoreFilters")}
            showLessLabel={t("searchForm:showLessFilters")}
            maximumNumber={0}
          >
            <Group>
              <StyledSelect
                id="participantMinCountFilter"
                placeholder={t("common:minimum")}
                options={[emptyOption(t("common:select"))].concat(
                  participantCountOptions
                )}
                label={t("searchForm:participantCountCombined")}
                onChange={(selection: OptionType): void => {
                  setValue("minPersons", selection.value);
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
                options={[emptyOption(t("common:select"))].concat(
                  participantCountOptions
                )}
                label="&nbsp;"
                onChange={(selection: OptionType): void => {
                  setValue("maxPersons", selection.value);
                }}
                defaultValue={getSelectedOption(
                  getValues("maxPersons"),
                  participantCountOptions
                )}
                key={`maxPersons${getValues("maxPersons")}`}
                className="inputSm inputGroupEnd"
              />
            </Group>
            <MultiSelectDropdown
              id="reservationUnitTypeFilter"
              checkboxName="reservationUnitTypeFilter"
              inputValue={reservationTypeSearchInput}
              name="reservationType"
              onChange={(selection: string[]): void => {
                setValue(
                  "reservationUnitType",
                  selection.filter((n) => n !== "").join(",")
                );
              }}
              options={reservationUnitTypeOptions}
              setInputValue={setReservationTypeSearchInput}
              showSearch
              title={t("searchForm:typeLabel")}
              value={watch("reservationUnitType")?.split(",") || [""]}
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
              defaultValue={formValues.textSearch}
            />
          </OptionalFilters>
        </Filters>
        <JustForDesktop
          style={{
            display: "flex",
            width: "100%",
            flexFlow: "row nowrap",
            justifyContent: "space-between",
          }}
          customBreakpoint={desktopBreakpoint}
        >
          <SubmitButton
            id="searchButton-desktop"
            onClick={handleSubmit(search)}
            iconLeft={<IconSearch />}
            style={{ marginLeft: "auto" }}
          >
            {t("searchForm:searchButton")}
          </SubmitButton>
        </JustForDesktop>
      </TopContainer>
      <JustForMobile customBreakpoint={desktopBreakpoint}>
        <FilterToggleWrapper>
          <Button
            data-testid="search-form__button--toggle-filters"
            variant="supplementary"
            onClick={() => setAreFiltersVisible(!areFiltersVisible)}
            iconLeft={areFiltersVisible ? <IconAngleUp /> : <IconAngleDown />}
          >
            {t(`searchForm:show${areFiltersVisible ? "Less" : "More"}Filters`)}
          </Button>
        </FilterToggleWrapper>
        <Hr />
      </JustForMobile>
      <BottomContainer>
        {areOptionsLoaded && formValueKeys.length > 0 && (
          <TagControls>
            <FilterTags data-test-id="search-form__filter--tags">
              {formValueKeys
                .sort((a, b) => filterOrder.indexOf(a) - filterOrder.indexOf(b))
                .map((value) => {
                  const label = t(`searchForm:filters.${value}`, {
                    label: value,
                    value: formValues[value],
                    count: Number(formValues[value]),
                  });
                  const result = multiSelectFilters.includes(value) ? (
                    formValues[value].split(",").map((subValue) => (
                      <StyledTag
                        id={`filter-tag__${value}-${subValue}`}
                        onClick={() => removeValue([subValue], value)}
                        onDelete={() => removeValue([subValue], value)}
                        key={`${value}-${subValue}`}
                        deleteButtonAriaLabel={t(`searchForm:removeFilter`, {
                          value: getFormSubValueLabel(value, subValue),
                        })}
                      >
                        {getFormSubValueLabel(value, subValue)}
                      </StyledTag>
                    ))
                  ) : (
                    <StyledTag
                      id={`filter-tag__${value}`}
                      onDelete={() => removeValue([value])}
                      key={value}
                      deleteButtonAriaLabel={t(`searchForm:removeFilter`, {
                        value: label,
                      })}
                    >
                      {label}
                    </StyledTag>
                  );
                  return result;
                })}
            </FilterTags>
            {formValueKeys.length > 0 && (
              <ResetButton
                aria-label={t("searchForm:resetForm")}
                onClick={() => removeValue()}
                onDelete={() => removeValue()}
                data-test-id="search-form__reset-button"
              >
                {t("searchForm:resetForm")}
              </ResetButton>
            )}
          </TagControls>
        )}
        <JustForMobile
          style={{ width: "100%" }}
          customBreakpoint={desktopBreakpoint}
        >
          <SubmitButton
            id="searchButton"
            onClick={handleSubmit(search)}
            iconLeft={<IconSearch />}
          >
            {t("searchForm:searchButton")}
          </SubmitButton>
        </JustForMobile>
      </BottomContainer>
    </>
  );
};

export default SearchForm;
