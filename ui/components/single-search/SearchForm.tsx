import React, { ReactNode, useEffect, useState } from "react";
import { useTranslation } from "next-i18next";
import {
  Select,
  TextInput,
  Button as HDSButton,
  IconSearch,
  Tag,
  Combobox,
} from "hds-react";
import { useForm } from "react-hook-form";
import styled from "styled-components";
import { gql, useQuery } from "@apollo/client";
import { pick, sortBy } from "lodash";
import { breakpoint } from "../../modules/style";
import { getParameters } from "../../modules/api";
import {
  mapOptions,
  getSelectedOption,
  getComboboxValues,
} from "../../modules/util";
import { emptyOption, participantCountOptions } from "../../modules/const";
import { OptionType } from "../../modules/types";

type Props = {
  onSearch: (search: Record<string, string>) => void;
  formValues: { [key: string]: string };
  removeValue: (key?: string[]) => void;
};

const SEARCH_FORM_PARAMS = gql`
  query SearchFormParams {
    units {
      edges {
        node {
          id: pk
          name
        }
      }
    }
  }
`;

const Button = styled(HDSButton)``;

const Container = styled.div`
  margin-top: var(--spacing-l);
  max-width: 100%;
  display: grid;
  grid-template-columns: 1fr;
  grid-gap: var(--spacing-m);
  font-size: var(--fontsize-body-m);
  height: 384px;
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
    grid-template-columns: 1fr 1fr;
    height: 180px;
  }

  @media (min-width: ${breakpoint.xl}) {
    grid-template-columns: 2fr 1fr 1fr;
  }
`;

const Group = styled.div<{ children: ReactNode[]; $gap?: string }>`
  display: grid;
  grid-template-columns: repeat(${({ children }) => children.length}, 1fr);
  ${({ $gap }) => $gap && `gap: ${$gap};`}
`;

const Hr = styled.hr`
  margin-top: var(--spacing-l);
`;

const ButtonContainer = styled.div`
  margin-top: var(--spacing-l);
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
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

const SearchForm = ({
  onSearch,
  formValues,
  removeValue,
}: Props): JSX.Element | null => {
  const { t, i18n } = useTranslation();

  const [unitOptions, setUnitOptions] = useState<OptionType[]>([]);
  const [reservationUnitTypeOptions, setReservationUnitTypeOptions] = useState<
    OptionType[]
  >([]);

  useQuery(SEARCH_FORM_PARAMS, {
    onCompleted: (res) => {
      const units = res?.units?.edges?.map((edge) =>
        pick(edge.node, ["id", "name"])
      );
      setUnitOptions(mapOptions(sortBy(units, "name")));
    },
  });

  const { register, handleSubmit, setValue, getValues } = useForm();

  useEffect(() => {
    register({ name: "district" });
    register({ name: "minPersons" });
    register({ name: "maxPersons" });
    register({ name: "unit" });
    register({ name: "reservationUnitType" });
  }, [register]);

  useEffect(() => {
    async function fetchData() {
      const fetchedReservationUnitTypes = await getParameters(
        "reservation_unit_type"
      );

      setReservationUnitTypeOptions(
        mapOptions(
          fetchedReservationUnitTypes,
          t("common:select"),
          i18n.language
        )
      );
    }

    fetchData();
  }, [i18n.language, t]);

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
          name="search"
          label={t("searchForm:textSearchLabel")}
          ref={register()}
          placeholder={t("searchForm:searchTermPlaceholder")}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSubmit(search)();
            }
          }}
          defaultValue={formValues.search}
        />
        <Group>
          <Select
            id="participantMinCountFilter"
            placeholder={t("common:beginningWith")}
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
          <Select
            id="participantMaxCountFilter"
            placeholder={t("common:endingWith")}
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
        <Select
          id="reservationUnitTypeFilter"
          placeholder={t("common:select")}
          options={reservationUnitTypeOptions}
          label={t("searchForm:typeLabel")}
          onChange={(selection: OptionType): void => {
            setValue("reservationUnitType", selection.value);
          }}
          defaultValue={getSelectedOption(
            getValues("reservationUnitType"),
            reservationUnitTypeOptions
          )}
          key={`reservationUnitType${getValues(
            "reservationUnitType"
          )}${reservationUnitTypeOptions.map((n) => n.value).join(",")}`}
        />
        <Combobox<OptionType>
          id="unitFilter"
          clearButtonAriaLabel={t("searchForm:clearSelections")}
          label={t("searchForm:unitFilter")}
          multiselect
          onChange={(selection: OptionType[]): void => {
            setValue("unit", selection.map((sel) => sel.value).join(","));
          }}
          options={unitOptions}
          placeholder={t("common:select")}
          selectedItemRemoveButtonAriaLabel={`${t(
            "searchForm:removeSelection"
          )} {value}`}
          selectedItemSrLabel={`${t("searchForm:selectedElement")} {value}`}
          toggleButtonAriaLabel={t("searchForm:openCombobox")}
          defaultValue={getComboboxValues(getValues("unit"), unitOptions)}
          key={`unit${getValues("unit")}`}
          style={{ zIndex: 1 }}
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
        <Button
          id="searchButton"
          onClick={handleSubmit(search)}
          iconLeft={<IconSearch />}
        >
          {t("searchForm:searchButton")}
        </Button>
      </ButtonContainer>
    </>
  );
};

export default SearchForm;
