import React, { ReactNode, useEffect, useState } from "react";
import { useTranslation } from "next-i18next";
import { Select, TextInput, IconSearch, Tag } from "hds-react";
import { useForm } from "react-hook-form";
import styled from "styled-components";
import { useQuery } from "@apollo/client";
import { sortBy } from "lodash";
import { breakpoint } from "../../modules/style";
import {
  mapOptions,
  getSelectedOption,
  getTranslation,
} from "../../modules/util";
import { emptyOption, participantCountOptions } from "../../modules/const";
import { MediumButton, truncatedText } from "../../styles/util";
import { OptionType, StringParameter } from "../../modules/types";
import { Query } from "../../modules/gql-types";
import MultiSelectDropdown from "../form/MultiselectDropdown";
import {
  SEARCH_FORM_PARAMS_PURPOSE,
  SEARCH_FORM_PARAMS_UNIT,
} from "../../modules/queries/params";
import { RESERVATION_UNIT_TYPES } from "../../modules/queries/reservationUnit";

type Props = {
  onSearch: (search: Record<string, string>) => void;
  formValues: { [key: string]: string };
  removeValue: (key?: string[]) => void;
};

const Container = styled.div`
  margin-top: var(--spacing-l);
  max-width: 100%;
  display: grid;
  grid-template-columns: 1fr;
  grid-gap: var(--spacing-m);
  font-size: var(--fontsize-body-m);
  height: 450px;
  overflow: visible;

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
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr);
    height: 180px;
  }

  @media (min-width: ${breakpoint.xl}) {
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr);
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

const Hr = styled.hr`
  margin-top: var(--spacing-l);
`;

const ButtonContainer = styled.div`
  margin: var(--spacing-l) 0;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--spacing-m);
`;

const TagControls = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
`;

const Filters = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-s);
  margin-right: var(--spacing-m);
  margin-bottom: var(--spacing-s);
`;

const ResetButton = styled.button`
  &:hover {
    text-decoration: none;
    cursor: pointer;
  }

  font-family: var(--font-medium);
  font-weight: 500;
  border: 0;
  text-decoration: underline;
  background: transparent;
  margin-bottom: var(--spacing-s);
`;

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
  }
`;

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

  useQuery<Query>(SEARCH_FORM_PARAMS_UNIT, {
    onCompleted: (res) => {
      const units = res?.units?.edges?.map(({ node }) => ({
        id: String(node.pk),
        name: getTranslation(node, "name"),
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

  return (
    <>
      <Container>
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
      </Container>
      <Hr />
      <ButtonContainer>
        <TagControls>
          {Object.keys(formValues).length > 0 && (
            <>
              <Filters data-test-id="search-form__filter--tags">
                {Object.keys(formValues).map((value) => {
                  const label = t(`searchForm:filters.${value}`, {
                    value: formValues[value],
                  });
                  return (
                    <Tag
                      id={`filter-tag__${value}`}
                      onDelete={() => removeValue([value])}
                      key={value}
                      deleteButtonAriaLabel={t(`searchForm:removeFilter`, {
                        value: label,
                      })}
                      theme={{
                        "--tag-background": "var(--color-black-80)",
                        "--tag-color": "var(--color-white)",
                        "--tag-focus-outline-color": "var(--color-black-80)",
                      }}
                    >
                      {label}
                    </Tag>
                  );
                })}
              </Filters>
              <ResetButton
                disabled={Object.keys(formValues).length < 1}
                onClick={() => removeValue()}
                data-test-id="search-form__reset-button"
              >
                {t("searchForm:resetForm")}
              </ResetButton>
            </>
          )}
        </TagControls>
        <SubmitButton
          id="searchButton"
          onClick={handleSubmit(search)}
          iconLeft={<IconSearch />}
        >
          {t("searchForm:searchButton")}
        </SubmitButton>
      </ButtonContainer>
    </>
  );
};

export default SearchForm;
