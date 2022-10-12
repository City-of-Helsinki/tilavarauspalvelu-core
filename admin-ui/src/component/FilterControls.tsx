import React, { Dispatch, SetStateAction, useState } from "react";
import styled from "styled-components";
import { Button, Checkbox, IconCross } from "hds-react";
import { useTranslation } from "react-i18next";
import { isEqual } from "lodash";
import { breakpoints } from "common/src/common/style";
import { DataFilterConfig, DataFilterOption } from "../common/types";
import Accordion from "./Accordion";

interface IProps {
  filters: DataFilterOption[];
  visible: boolean;
  applyFilters: Dispatch<SetStateAction<DataFilterOption[]>>;
  config: DataFilterConfig[];
  className?: string;
}

const Content = styled.div`
  padding: var(--spacing-s) var(--spacing-m) 0;
`;

const Wrapper = styled.div<{ $wide: boolean }>`
  position: absolute;
  top: 56px;
  left: 40px;
  width: 100%;
  ${({ $wide }) => ($wide ? "max-width:  70vw" : "max-width: 400px")};
  background-color: var(--color-white);
  border: 1px solid var(--color-black-90);
  z-index: var(--tilavaraus-admin-stack-dialog);
  box-shadow: 2px 2px 30px 0px rgba(0, 0, 0, 0.11);
  user-select: none;

  ${Content} {
    ${({ $wide }) =>
      $wide &&
      `
    @media (min-width: 1080px) {
      display: grid;
      grid-template-columns: repeat(2, 48%);
      grid-gap: var(--spacing-m);
    }
  `}
  }

  ${({ $wide }) =>
    $wide &&
    `
    @media (min-width: ${breakpoints.m}) {
      max-width: 60vw;
      min-width: 345px;
    }

    @media (min-width: ${breakpoints.xl}) {
      max-width: 700px;
    }
  `}
`;

const FilterAccordion = styled(Accordion).attrs({
  style: {
    "--header-font-size": "var(--fontsize-heading-xxs)",
    "--button-size": "var(--fontsize-heading-m)",
    "--border-color": "var(--color-silver)",
    "--content-padding-top": 0,
  } as React.CSSProperties,
})``;

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid var(--color-silver);
  padding: var(--spacing-s) var(--spacing-m);
`;

const FilterCheckbox = styled(Checkbox).attrs({
  style: {
    "--background-selected": "transparent",
    "--background-unselected": "transparent",
    "--background-hover": "transparent",
    "--background-disabled": "transparent",
    "--border-color-selected": "transparent",
    "--border-color-selected-selected": "transparent",
    "--border-color-selected-hover": "transparent",
    "--border-color-unselected": "transparent",
    "--border-color-unselected-selected": "transparent",
    "--border-color-unselected-hover": "transparent",
    "--border-color-disabled": "transparent",
    "--icon-color-unselected": "transparent",
    "--icon-color-selected": "var(--tilavaraus-admin-content-text-color)",
    "--icon-color-disabled": "var(--tilavaraus-admin-content-text-color)",
    "--icon-size": "var(--fontsize-heading-l)",
  } as React.CSSProperties,
})``;

const ResetButton = styled(Button).attrs({
  variant: "supplementary",
  style: {
    "--color": "var(--tilavaraus-admin-content-text-color)",
  },
})`
  & > div {
    margin-left: 0 !important;
  }

  height: 44px;
  white-space: nowrap;
  margin-right: 1em;
`;

const ApplyButton = styled(Button)`
  font-family: var(--tilavaraus-admin-font-medium);
  font-weight: 500;
  height: 44px;
`;

function FilterControls({
  filters,
  visible,
  applyFilters,
  config,
  className,
}: IProps): JSX.Element | null {
  const [preliminaryFilters, setPreliminaryFilters] = useState<
    DataFilterOption[]
  >([]);

  const toggleActiveFilter = (filter: DataFilterOption): void => {
    let activeFilters: DataFilterOption[];
    if (preliminaryFilters.find((n) => isEqual(filter, n))) {
      activeFilters = preliminaryFilters.filter((n) => !isEqual(n, filter));
    } else {
      activeFilters = [...preliminaryFilters, filter];
    }

    setPreliminaryFilters(activeFilters);
  };

  const { t } = useTranslation();

  return visible ? (
    <Wrapper className={className} $wide={config.length > 3}>
      <Content>
        {config.map((filterAccordion) => {
          const activeFilters = filterAccordion.filters?.filter((n) =>
            filters.map((af) => af.value).includes(n.value)
          );
          const filterCount = filterAccordion.filters?.length || 0;
          const activeFiltersCount = activeFilters?.length || "";
          return (
            <FilterAccordion
              heading={`${t(filterAccordion.title)}${
                activeFiltersCount && ` (${activeFiltersCount})`
              }`}
              key={filterAccordion.title}
              disabled={filterCount < 1}
              data-testid="filter-controls__group"
            >
              {filterAccordion.filters?.map((filter) => (
                <FilterCheckbox
                  data-testid="filter-controls__filter--selector"
                  key={`${filterAccordion.title}${filter.key}${filter.value}`}
                  id={`filter.${filterAccordion.title}.${filter.key}.${filter.value}`}
                  label={filter?.title ? t(filter.title) : ""}
                  checked={!!preliminaryFilters.find((n) => isEqual(n, filter))}
                  onChange={() => toggleActiveFilter(filter)}
                />
              ))}
            </FilterAccordion>
          );
        })}
      </Content>
      <Footer>
        <ResetButton
          data-testid="filter-controls__button--reset"
          onClick={() => {
            setPreliminaryFilters([]);
            applyFilters([]);
          }}
          disabled={preliminaryFilters.length === 0}
          iconLeft={<IconCross aria-hidden />}
        >
          {t("common.resetFilters")}
        </ResetButton>
        <ApplyButton
          data-testid="filter-controls__button--submit"
          onClick={() => {
            applyFilters(preliminaryFilters);
          }}
          disabled={isEqual(filters, preliminaryFilters)}
        >
          {t("common.apply")}
        </ApplyButton>
      </Footer>
    </Wrapper>
  ) : null;
}

export default FilterControls;
