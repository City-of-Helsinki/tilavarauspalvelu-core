import React, { Dispatch, SetStateAction, useState } from "react";
import styled from "styled-components";
import { Button, Checkbox, IconCross } from "hds-react";
import { useTranslation } from "react-i18next";
import { isEqual } from "lodash";
import { DataFilterConfig, DataFilterOption } from "../common/types";
import Accordion from "./Accordion";

interface IProps {
  filters: DataFilterOption[];
  visible: boolean;
  applyFilters: Dispatch<SetStateAction<DataFilterOption[]>>;
  config: DataFilterConfig[];
  className?: string;
}

const Wrapper = styled.div`
  position: absolute;
  top: 56px;
  left: 40px;
  min-width: 345px;
  background-color: var(--color-white);
  border: 1px solid var(--color-black-90);
  z-index: var(--tilavaraus-admin-stack-dialog);
  box-shadow: 2px 2px 30px 0px rgba(0, 0, 0, 0.11);
  user-select: none;
`;

const FilterAccordion = styled(Accordion).attrs({
  style: {
    "--header-font-size": "var(--fontsize-heading-xxs)",
    "--button-size": "var(--fontsize-heading-m)",
    "--border-color": "var(--color-silver)",
    "--content-padding-top": 0,
  } as React.CSSProperties,
})``;

const Content = styled.div`
  padding: var(--spacing-s) var(--spacing-m) 0;
`;

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
    let newFilters: DataFilterOption[];
    if (preliminaryFilters.find((n) => isEqual(filter, n))) {
      newFilters = preliminaryFilters.filter((n) => !isEqual(n, filter));
    } else {
      newFilters = [...preliminaryFilters, filter];
    }

    setPreliminaryFilters(newFilters);
  };

  const { t } = useTranslation();

  return visible ? (
    <Wrapper className={className}>
      <Content>
        {config.map((filterAccordion) => (
          <FilterAccordion
            heading={t(filterAccordion.title)}
            key={filterAccordion.title}
          >
            {filterAccordion.filters?.map((filter) => (
              <FilterCheckbox
                key={`${filterAccordion.title}${filter.key}${filter.value}`}
                id={`filter.${filterAccordion.title}.${filter.key}.${filter.value}`}
                label={t(filter.title)}
                checked={!!preliminaryFilters.find((n) => isEqual(n, filter))}
                onChange={() => toggleActiveFilter(filter)}
              />
            ))}
          </FilterAccordion>
        ))}
      </Content>
      <Footer>
        <ResetButton
          onClick={() => {
            setPreliminaryFilters([]);
            applyFilters([]);
          }}
          disabled={preliminaryFilters.length === 0}
          iconLeft={<IconCross />}
        >
          {t("common.resetFilters")}
        </ResetButton>
        <ApplyButton
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
