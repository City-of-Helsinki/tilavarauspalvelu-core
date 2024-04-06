import React, { ReactNode, useState } from "react";
import { useTranslation } from "next-i18next";
import {
  TextInput,
  IconSearch,
  Button,
  IconAngleUp,
  IconAngleDown,
} from "hds-react";
import { type SubmitHandler, useForm } from "react-hook-form";
import styled from "styled-components";
import { breakpoints } from "common/src/common/style";
import { participantCountOptions } from "@/modules/const";
import { MediumButton } from "@/styles/util";
import { JustForDesktop, JustForMobile } from "@/modules/style/layout";
import { useSearchModify, useSearchValues } from "@/hooks/useSearchValues";
import { FilterTagList } from "../single-search/FilterTagList";
import { ParsedUrlQuery } from "node:querystring";
import { ControlledSelect } from "@/components/common/ControlledSelect";
import { ControlledMultiSelect } from "./ControlledMultiSelect";
import {
  mapQueryParamToNumber,
  mapSingleParamToFormValue,
} from "@/modules/search";

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
  margin: var(--spacing-xs) 0;
`;

const Hr = styled.hr`
  border-color: var(--color-black-60);
  border-style: solid;
`;

const Filters = styled.div<{ $areFiltersVisible: boolean }>`
  margin-top: 0;
  max-width: 100%;
  display: grid;
  grid-template-columns: 1fr;
  grid-gap: var(--spacing-m);
  font-size: var(--fontsize-body-m);

  ${({ $areFiltersVisible }) =>
    !$areFiltersVisible &&
    `
    @media (max-width: ${desktopBreakpoint}) {
    & > *:nth-child(n + 3) {
      display: none;
    }}
  `}

  label {
    font-family: var(--font-medium);
    font-weight: 500;
  }

  @media (min-width: ${breakpoints.m}) {
    margin-top: var(--spacing-s);
    grid-template-columns: 1fr 1fr;
  }

  @media (min-width: ${breakpoints.l}) {
    grid-template-columns: 1fr 1fr 1fr;
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

const ButtonContainer = styled.div`
  margin: var(--spacing-m) 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-m);
`;

const SubmitButton = styled(MediumButton)`
  width: 100%;

  @media (min-width: ${breakpoints.s}) {
    width: auto;
    white-space: nowrap;
  }
`;

const filterOrder = [
  "applicationRound",
  "textSearch",
  "minPersons",
  "maxPersons",
  "reservationUnitType",
  "unit",
  "purposes",
];

type FormValues = {
  applicationRound: number;
  minPersons: number | null;
  maxPersons: number | null;
  unit: string;
  reservationUnitTypes: string;
  purposes: string;
  textSearch: string;
};

// TODO combine as much as possible with the one in single-search (move them to a common place)
function mapQueryToForm(query: ParsedUrlQuery): FormValues {
  return {
    applicationRound: mapQueryParamToNumber(query.applicationRound) ?? 0,
    unit: mapSingleParamToFormValue(query.unit) ?? "",
    purposes: mapSingleParamToFormValue(query.purposes) ?? "",
    reservationUnitTypes:
      mapSingleParamToFormValue(query.reservationUnitType) ?? "",
    minPersons: mapQueryParamToNumber(query.minPersons) ?? null,
    maxPersons: mapQueryParamToNumber(query.maxPersons) ?? null,
    textSearch: mapSingleParamToFormValue(query.textSearch) ?? "",
  };
}

export function SeasonalSearchForm({
  applicationRoundOptions,
  reservationUnitTypeOptions,
  purposeOptions,
  unitOptions,
  isLoading,
}: {
  applicationRoundOptions: Array<{ value: number; label: string }>;
  reservationUnitTypeOptions: Array<{ value: string; label: string }>;
  purposeOptions: Array<{ value: string; label: string }>;
  unitOptions: Array<{ value: number; label: string }>;
  isLoading: boolean;
}): JSX.Element | null {
  const { t } = useTranslation();

  const [areFiltersVisible, setAreFiltersVisible] = useState(false);
  const { handleSearch } = useSearchModify();

  const searchValues = useSearchValues();
  const { control, register, handleSubmit } = useForm<FormValues>({
    values: mapQueryToForm(searchValues),
  });

  const search: SubmitHandler<FormValues> = (criteria: FormValues) => {
    // Remove empty (null || "") values from the criteria
    const searchCriteria = Object.entries(criteria).reduce((c, cv) => {
      if (cv[1] == null || cv[1] === "") return c;
      return { ...c, [cv[0]]: cv[1] };
    }, {});
    handleSearch(searchCriteria);
  };

  const translateTag = (key: string, value: string): string | undefined => {
    switch (key) {
      case "unit":
        return unitOptions.find((n) => String(n.value) === value)?.label;
      case "reservationUnitType":
        return reservationUnitTypeOptions.find((n) => String(n.value) === value)
          ?.label;
      case "purposes":
        return purposeOptions.find((n) => String(n.value) === value)?.label;
      default:
        return "";
    }
  };

  const multiSelectFilters = ["unit", "reservationUnitType", "purposes"];
  const hideList = ["applicationRound", "order", "sort"];

  return (
    <form noValidate onSubmit={handleSubmit(search)}>
      <TopContainer>
        <Filters $areFiltersVisible={areFiltersVisible}>
          <ControlledSelect
            name="applicationRound"
            control={control}
            options={applicationRoundOptions}
            label={t("searchForm:roundLabel")}
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
          <Group>
            <ControlledSelect
              name="minPersons"
              control={control}
              clearable
              options={participantCountOptions}
              label={t("searchForm:participantCountCombined")}
              className="inputSm inputGroupStart"
            />
            <ControlledSelect
              name="maxPersons"
              control={control}
              clearable
              options={participantCountOptions}
              label="&nbsp;"
              className="inputSm inputGroupEnd"
            />
          </Group>
          <ControlledMultiSelect
            name="reservationUnitTypes"
            control={control}
            options={reservationUnitTypeOptions}
            label={t("searchForm:typeLabel")}
          />
          <ControlledMultiSelect
            name="unit"
            control={control}
            options={unitOptions}
            label={t("searchForm:unitFilter")}
          />
          <ControlledMultiSelect
            name="purposes"
            control={control}
            options={purposeOptions}
            label={t("searchForm:purposesFilter")}
          />
        </Filters>
        <JustForDesktop customBreakpoint={desktopBreakpoint}>
          <SubmitButton
            id="searchButton-desktop"
            type="submit"
            isLoading={isLoading}
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
      <ButtonContainer>
        <FilterTagList
          translateTag={translateTag}
          filters={filterOrder}
          multiSelectFilters={multiSelectFilters}
          hideList={hideList}
        />
        <JustForMobile
          style={{ width: "100%" }}
          customBreakpoint={desktopBreakpoint}
        >
          <SubmitButton
            id="searchButton-mobile"
            type="submit"
            isLoading={isLoading}
            iconLeft={<IconSearch />}
          >
            {t("searchForm:searchButton")}
          </SubmitButton>
        </JustForMobile>
      </ButtonContainer>
    </form>
  );
}
