import React from "react";
import { H1 } from "common/src/common/typography";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { Button, Tabs as HDSTabs } from "hds-react";
import { breakpoints } from "common/src/common/style";
import { parseAddress } from "@/common/util";
import { Container } from "@/styles/layout";
import { myUnitUrl } from "@/common/urls";
import { BasicLink } from "@/styles/util";
import BreadcrumbWrapper from "@/component/BreadcrumbWrapper";
import Loader from "@/component/Loader";
import { ReservationUnitCalendarView } from "./ReservationUnitCalendarView";
import UnitReservationsView from "./UnitReservationsView";
import { TabHeader, Tabs } from "../Tabs";
import { useNotification } from "@/context/NotificationContext";
import { useQuery } from "@apollo/client";
import { Query, QueryUnitArgs } from "common/types/gql-types";
import { UNIT_VIEW_QUERY } from "./hooks/queries";
import { base64encode } from "common/src/helpers";

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

function MyUnitView() {
  const { unitId: pk } = useParams<Params>();
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

  const { notifyError } = useNotification();

  const isPkValid = pk != null && !Number.isNaN(Number(pk));
  const id = base64encode(`UnitNode:${pk}`);
  const { loading, data } = useQuery<Query, QueryUnitArgs>(UNIT_VIEW_QUERY, {
    skip: !isPkValid,
    variables: { id },
    onError: (err) => {
      notifyError(err.message);
    },
  });

  const { unit } = data ?? {};

  if (loading) {
    return <Loader />;
  }
  // TODO improve the error reporting (404)
  if (!unit || !isPkValid) {
    return <div>{t("MyUnits.Calendar.error.unitNotFound")}</div>;
  }

  const recurringReservationUrl = `${myUnitUrl(
    parseInt(pk, 10)
  )}/recurring-reservation`;

  const routes = [
    {
      slug: "/my-units",
      alias: t("breadcrumb.my-units"),
    },
    {
      slug: "",
      alias: unit.nameFi ?? "unnamed unit",
    },
  ];

  return (
    <>
      <BreadcrumbWrapper route={routes} />
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
}

export default MyUnitView;
