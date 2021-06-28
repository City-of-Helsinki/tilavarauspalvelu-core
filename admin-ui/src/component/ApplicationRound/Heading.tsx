import React from "react";
import { Button } from "hds-react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { BasicLink, breakpoints } from "../../styles/util";
import { H3 } from "../../styles/typography";
import SecondaryNavigation from "../SecondaryNavigation";
import { ReactComponent as RecurringReservation } from "../../images/icon_recurring-reservation.svg";
import { ReactComponent as IndividualReservation } from "../../images/icon_individual-reservation.svg";
import { ReactComponent as IconList } from "../../images/icon_list.svg";

interface IProps {
  hideAllRoundsLink?: boolean;
}

const Wrapper = styled.div`
  padding: var(--spacing-m) var(--spacing-m) 0 var(--spacing-m);
  border-bottom: 1px solid var(--color-silver);
`;

const Top = styled.div`
  display: flex;
  justify-content: space-between;
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

  &[disabled] {
    svg {
      opacity: 0.4;
    }
  }

  font-family: var(--tilavaraus-admin-font-medium);
  font-size: 1rem;
  color: var(--color-black);
  margin: 0 var(--spacing-m) var(--spacing-s) 0;
  background: transparent;
  border: 0;
  white-space: nowrap;
`;

const Subheading = styled(H3)`
  margin-top: var(--spacing-4-xs);
`;

const Bottom = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  padding-bottom: var(--spacing-m);

  @media (min-width: ${breakpoints.m}) {
    flex-wrap: nowrap;
  }
`;

function Heading({ hideAllRoundsLink }: IProps): JSX.Element {
  const { t } = useTranslation();

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
        <Subheading>{t("common.youthServices")}</Subheading>
      </Top>
      <Bottom>
        <SecondaryNavigation items={[]} />
        {!hideAllRoundsLink && (
          <BasicLink to="/applicationRounds">
            <IconList style={{ marginTop: "-2px" }} />{" "}
            {t("ApplicationRound.browseAllApplicationRounds")}
          </BasicLink>
        )}
      </Bottom>
    </Wrapper>
  );
}

export default Heading;
