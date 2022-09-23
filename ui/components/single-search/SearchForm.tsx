import React, { ReactNode, useEffect, useMemo, useState } from "react";
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
import { OptionType, StringParameter } from "common/types/common";
import { breakpoint } from "../../modules/style";
import {
  mapOptions,
  getSelectedOption,
  getTranslation,
} from "../../modules/util";
import { emptyOption, participantCountOptions } from "../../modules/const";
import { MediumButton, truncatedText } from "../../styles/util";
import { Query, QueryUnitsArgs } from "../../modules/gql-types";
import MultiSelectDropdown from "../form/MultiselectDropdown";
import {
  SEARCH_FORM_PARAMS_PURPOSE,
  SEARCH_FORM_PARAMS_UNIT,
} from "../../modules/queries/params";
import { RESERVATION_UNIT_TYPES } from "../../modules/queries/reservationUnit";
import { getUnitName } from "../../modules/reservationUnit";
import { JustForDesktop, JustForMobile } from "../../modules/style/layout";

type Props = {
  onSearch: (search: Record<string, string>) => void;
  formValues: { [key: string]: string };
  removeValue: (key?: string[], subItemKey?: string) => void;
};

const desktopBreakpoint = "840px";

const TopContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-m);
  align-items: flex-end;

  @media (min-width: ${desktopBreakpoint}) {
    grid-template-columns: 1fr 154px;
  }
`;

const FilterToggleWrapper = styled.div`
  display: grid;
  justify-items: center;
  margin-top: var(--spacing-l);
  padding-bottom: var(--spacing-m);
`;

const Hr = styled.hr`
  border-color: var(--color-black-60);
  border-style: solid;
`;

const Filters = styled.div<{ $areFiltersVisible: boolean }>`
  margin-top: var(--spacing-l);
  max-width: 100%;
  display: grid;
  grid-template-columns: 1fr;
  grid-gap: var(--spacing-m);
  font-size: var(--fontsize-body-m);

  ${({ $areFiltersVisible }) =>
    !$areFiltersVisible &&
    `
    @media (max-width: ${desktopBreakpoint}) {
    & > *:nth-child(n + 2) {
      display: none;
    }}
  `}

  label {
    font-family: var(--font-medium);
    font-weight: 500;
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

  @media (min-width: ${breakpoint.m}) {
    grid-template-columns: 1fr 1fr;
  }

  @media (min-width: ${breakpoint.l}) {
    grid-template-columns: 1fr 1fr 1fr;
  }
`;

const StyledSelect = styled(Select)`
  button {
    display: grid;
    text-align: left;
  }

  span {
    ${truncatedText}
  }
`;

const Group = styled.div<{ children: ReactNode[]; $gap?: string }>`
  display: grid;
  grid-template-columns: repeat(${({ children }) => children.length}, 1fr);
  ${({ $gap }) => $gap && `gap: ${$gap};`}

  label {
    width: 200%;
  }
`;

const ButtonContainer = styled.div`
  margin: var(--spacing-l) 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-m);
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
    "--tag-background": "transparent",
  },
})``;

const StyledMultiSelectDropdown = styled(MultiSelectDropdown)`
  @media (min-width: ${breakpoint.m}) {
    grid-column: 2/4;
  }

  @media (min-width: ${breakpoint.l}) {
    grid-column: 2/3;
  }

  @media (min-width: ${breakpoint.xl}) {
    grid-column: 2/4;
  }
`;

const SubmitButton = styled(MediumButton)`
  width: 100%;

  @media (min-width: ${breakpoint.s}) {
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
];

const SearchForm = ({
  onSearch,
  formValues,
  removeValue,
}: Props): JSX.Element | null => {
  const { t } = useTranslation();

  const [unitOptions, setUnitOptions] = useState<OptionType[]>([]);
  const [purposeOptions, setPurposeOptions] = useState<OptionType[]>([]);
  const [reservationUnitTypeOptions, setReservationUnitTypeOptions] = useState<
    OptionType[]
  >([]);
  const [reservationTypeSearchInput, setReservationTypeSearchInput] =
    useState<string>("");
  const [unitSearchInput, setUnitSearchInput] = useState<string>("");
  const [purposeSearchInput, setPurposeSearchInput] = useState<string>("");
  const [areFiltersVisible, setAreFiltersVisible] = useState(false);

  useQuery<Query, QueryUnitsArgs>(SEARCH_FORM_PARAMS_UNIT, {
    variables: {
      publishedReservationUnits: true,
    },
    onCompleted: (res) => {
      const units = res?.units?.edges?.map(({ node }) => ({
        id: String(node.pk),
        name: getUnitName(node),
      }));
      setUnitOptions(mapOptions(sortBy(units, "name") as StringParameter[]));
    },
  });

  useQuery<Query>(SEARCH_FORM_PARAMS_PURPOSE, {
    onCompleted: (res) => {
      const purposes = res?.purposes?.edges?.map(({ node }) => ({
        id: String(node.pk),
        name: getTranslation(node, "name"),
      }));
      setPurposeOptions(
        mapOptions(sortBy(purposes, "name") as StringParameter[])
      );
    },
  });

  useQuery<Query>(RESERVATION_UNIT_TYPES, {
    onCompleted: (res) => {
      const types = res?.reservationUnitTypes?.edges?.map(({ node }) => ({
        id: String(node.pk),
        name: getTranslation(node, "name"),
      }));
      setReservationUnitTypeOptions(mapOptions(sortBy(types, "name")));
    },
  });

  const { register, watch, handleSubmit, setValue, getValues } = useForm();

  const getFormSubValueLabel = (key: string, value: string): string => {
    switch (key) {
      case "unit":
        return unitOptions.find((n) => n.value === value)?.label;
      case "reservationUnitType":
        return reservationUnitTypeOptions.find((n) => n.value === value)?.label;
      case "purposes":
        return purposeOptions.find((n) => n.value === value)?.label;
      default:
        return "";
    }
  };

  const multiSelectFilters = ["unit", "reservationUnitType", "purposes"];

  useEffect(() => {
    register({ name: "minPersons" });
    register({ name: "maxPersons" });
    register({ name: "unit" });
    register({ name: "reservationUnitType" });
    register({ name: "purposes" });
  }, [register]);

  useEffect(() => {
    Object.keys(formValues).forEach((p) => setValue(p, formValues[p]));
  }, [formValues, setValue]);

  const search = (criteria: Record<string, string>) => {
    onSearch(criteria);
  };

  const areOptionsLoaded = useMemo(
    () =>
      reservationUnitTypeOptions.length > 0 &&
      unitOptions.length > 0 &&
      purposeOptions.length > 0,
    [reservationUnitTypeOptions, unitOptions, purposeOptions]
  );

  return (
    <>
      <TopContainer>
        <Filters $areFiltersVisible={areFiltersVisible}>
          <TextInput
            id="search"
            name="textSearch"
            label={t("searchForm:textSearchLabel")}
            ref={register()}
            placeholder={t("searchForm:searchTermPlaceholder")}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSubmit(search)();
              }
            }}
            defaultValue={formValues.textSearch}
          />
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
          <StyledMultiSelectDropdown
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
        </Filters>
        <JustForDesktop customBreakpoint={desktopBreakpoint}>
          <SubmitButton
            id="searchButton-desktop"
            onClick={handleSubmit(search)}
            iconLeft={<IconSearch />}
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
      {areOptionsLoaded && (
        <ButtonContainer>
          <TagControls>
            {Object.keys(formValues).length > 0 && (
              <>
                <FilterTags data-test-id="search-form__filter--tags">
                  {Object.keys(formValues)
                    .sort(
                      (a, b) => filterOrder.indexOf(a) - filterOrder.indexOf(b)
                    )
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
                            deleteButtonAriaLabel={t(
                              `searchForm:removeFilter`,
                              {
                                value: getFormSubValueLabel(value, subValue),
                              }
                            )}
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
                {Object.keys(formValues).length > 0 && (
                  <ResetButton
                    onClick={() => removeValue()}
                    onDelete={() => removeValue()}
                    data-test-id="search-form__reset-button"
                  >
                    {t("searchForm:resetForm")}
                  </ResetButton>
                )}
              </>
            )}
          </TagControls>
          <JustForMobile
            style={{ width: "100%" }}
            customBreakpoint={desktopBreakpoint}
          >
            {" "}
            <SubmitButton
              id="searchButton"
              onClick={handleSubmit(search)}
              iconLeft={<IconSearch />}
            >
              {t("searchForm:searchButton")}
            </SubmitButton>
          </JustForMobile>
        </ButtonContainer>
      )}
    </>
  );
};

export default SearchForm;
