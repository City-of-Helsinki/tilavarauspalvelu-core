import React from "react";
import { H1 } from "common/src/common/typography";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { Button, Tabs as HDSTabs } from "hds-react";
import { breakpoints } from "common/src/common/style";
import { publicUrl } from "../../common/const";
import { parseAddress } from "../../common/util";
import { Container } from "../../styles/layout";
import BreadcrumbWrapper from "../BreadcrumbWrapper";
import { myUnitUrl } from "../../common/urls";
import { BasicLink } from "../../styles/util";
import ReservationUnitCalendarView from "./ReservationUnitCalendarView";
import UnitReservationsView from "./UnitReservationsView";
import { TabHeader, Tabs } from "../Tabs";
import { useUnitQuery } from "./hooks";
import Loader from "../Loader";

type Params = {
  unitId: string;
  reservationUnitId: string;
};

// HDS tabs aren't responsive inside a grid container
// flex and block cause problems on other pages (tables overflowing).
const ContainerHack = styled(Container)`
  display: block;
`;

const LocationOnlyOnDesktop = styled.p`
  display: none;
  @media (min-width: ${breakpoints.s}) {
    display: block;
  }
`;

const ContainerWithSpacing = styled.div`
  margin: var(--spacing-s) 0;
  @media (min-width: ${breakpoints.m}) {
    margin: var(--spacing-m) 0;
  }
`;

// NOTE overflow-x if the children of the 1st aren't grid and 2nd block
const UnitCalendarTabPanel = styled(HDSTabs.TabPanel)`
  padding-block: var(--spacing-m);
`;
const ReservationTabPanel = styled(UnitCalendarTabPanel)`
  & > div {
    display: grid;
  }
`;

const MyUnitView = () => {
  const { unitId } = useParams<Params>();
  const { t } = useTranslation();

  const TabHeaders: TabHeader[] = [
    {
      key: "unit-reservations",
      label: `${t("MyUnits.Calendar.Tabs.byReservationUnit")}`,
    },
    {
      key: "reservation-unit",
      label: `${t("MyUnits.Calendar.Tabs.byUnit")}`,
    },
  ];

  const { loading, data: unitData } = useUnitQuery(unitId);

  const unit = unitData?.units?.edges.find(() => true)?.node ?? undefined;

  if (loading || !unit || !unitId) {
    return <Loader />;
  }

  const recurringReservationUrl = `${myUnitUrl(
    parseInt(unitId, 10)
  )}/recurring-reservation`;

  return (
    <>
      <BreadcrumbWrapper
        route={[`${publicUrl}/my-units`, "unit"]}
        aliases={[{ slug: "unit", title: unit.nameFi ?? "unnamed unit" }]}
      />
      <ContainerHack>
        <ContainerWithSpacing>
          <H1 $legacy>{unit?.nameFi}</H1>
          {unit.location && (
            <LocationOnlyOnDesktop>
              {parseAddress(unit.location)}
            </LocationOnlyOnDesktop>
          )}
        </ContainerWithSpacing>
        <ContainerWithSpacing>
          <BasicLink to={recurringReservationUrl ?? ""}>
            <Button
              disabled={!recurringReservationUrl}
              variant="secondary"
              theme="black"
              size="small"
            >
              {t("MyUnits.Calendar.header.recurringReservation")}
            </Button>
          </BasicLink>
        </ContainerWithSpacing>
        <Tabs headers={TabHeaders}>
          <ReservationTabPanel key="unit-reservations">
            <UnitReservationsView />
          </ReservationTabPanel>
          <UnitCalendarTabPanel key="reservation-unit">
            <ReservationUnitCalendarView />
          </UnitCalendarTabPanel>
        </Tabs>
      </ContainerHack>
    </>
  );
};

export default MyUnitView;
