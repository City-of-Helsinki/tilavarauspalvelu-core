import React from "react";
import { Button, IconPlus, Select } from "hds-react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { breakpoints } from "../../styles/util";
import SecondaryNavigation from "../SecondaryNavigation";
import { ReactComponent as RecurringReservation } from "../../images/icon_recurring-reservation.svg";
import { ReactComponent as IndividualReservation } from "../../images/icon_individual-reservation.svg";

const Wrapper = styled.div`
  padding: var(--spacing-m) var(--spacing-m) 0 var(--spacing-m);
  border-bottom: 1px solid var(--color-silver);
`;

const Top = styled.div`
  @media (min-width: ${breakpoints.m}) {
    display: flex;
    justify-content: space-between;
  }
`;

const MainTabs = styled.div``;

const Tab = styled(Button).attrs({ variant: "secondary" })<{
  selected?: boolean;
}>`
  span {
    border-bottom: 2px solid
      ${({ selected }) => (selected ? "var(--color-black)" : "transparent")};
    padding: 0 0 4px 0;
    margin: 6px 8px 3px 1.25em;
  }

  &:hover,
  &:focus {
    background-color: transparent !important;
    color: var(--color-black) !important;
  }

  font-family: var(--tilavaraus-admin-font-medium);
  font-size: 1rem;
  color: var(--color-black);
  margin: 0 var(--spacing-m) var(--spacing-s) 0;
  background: transparent;
  border: 0;
  white-space: nowrap;
`;

const StyledSelect = styled(Select)`
  width: 270px;

  button {
    font-weight: 700;

    svg {
      top: 6px;
    }
  }
`;

const Bottom = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;

  @media (min-width: ${breakpoints.m}) {
    flex-wrap: nowrap;
  }
`;

const ExpandBtn = styled.button`
  & > svg {
    margin-right: var(--spacing-xs);
    position: relative;
    top: -1px;
  }

  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: var(--tilavaraus-admin-content-text-color);
  background: none;
  border: 0;
  white-space: nowrap;
  padding: var(--spacing-s);

  @media (min-width: ${breakpoints.m}) {
    padding-right: 0;
  }
`;

function Heading(): JSX.Element {
  const { t } = useTranslation();

  const typeOptions = [
    {
      value: "1",
      label: "Nuorisotilat",
    },
  ];

  const selectTheme = {
    "--dropdown-background-default": "var(--tilavaraus-admin-blue)",
    "--dropdown-color-default": "var(--color-white)",
    "--dropdown-border-color-default": "var(--tilavaraus-admin-blue)",
    "--fontsize-body-l": "16px",
    "--dropdown-height": "44px",
  };

  return (
    <Wrapper>
      <Top>
        <MainTabs>
          <Tab selected iconLeft={<RecurringReservation />}>
            {t("HeadingMenu.recurringReservations")}
          </Tab>
          <Tab disabled iconLeft={<IndividualReservation />}>
            {t("HeadingMenu.singleReservations")}
          </Tab>
        </MainTabs>
        <StyledSelect
          label=""
          options={typeOptions}
          defaultValue={typeOptions[0]}
          theme={selectTheme}
        />
      </Top>
      <Bottom>
        <SecondaryNavigation
          items={[
            { title: t("ApplicationRound.pastRounds") },
            { title: t("ApplicationRound.roundsInProcessing") },
            {
              title: t("ApplicationRound.roundsOpenForApplication"),
            },
            { title: t("ApplicationRound.futureRounds") },
          ]}
        />
        <ExpandBtn>
          <IconPlus />
          {t("ApplicationRound.expandSearch")}
        </ExpandBtn>
      </Bottom>
    </Wrapper>
  );
}

export default Heading;
