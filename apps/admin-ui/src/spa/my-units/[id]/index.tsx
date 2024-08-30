import React from "react";
import { H1 } from "common/src/common/typography";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { Tabs as HDSTabs } from "hds-react";
import { breakpoints } from "common/src/common/style";
import { parseAddress } from "@/common/util";
import { Container } from "@/styles/layout";
import { getRecurringReservationUrl } from "@/common/urls";
import Loader from "@/component/Loader";
import { ReservationUnitCalendarView } from "./ReservationUnitCalendarView";
import { UnitReservations } from "./UnitReservations";
import { TabHeader, Tabs } from "@/component/Tabs";
import { base64encode, filterNonNullable } from "common/src/helpers";
import { errorToast } from "common/src/common/toast";
import { UserPermissionChoice, useUnitViewQuery } from "@gql/gql-types";
import { useCheckPermission } from "@/hooks";
import { ButtonLikeLink } from "@/component/ButtonLikeLink";

type Params = {
  unitId: string;
  reservationUnitId: string;
};

// HDS tabs aren't responsive inside a grid container
// flex and block cause problems on other pages (tables overflowing).
// seems they or something else is not responsive without max-width hack also
const ContainerHack = styled(Container)`
  display: block;
  max-width: 92vw;
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

export function MyUnitView() {
  const { unitId: pk } = useParams<Params>();
  const { t } = useTranslation();

  const TabHeaders: TabHeader[] = [
    {
      key: "unit-reservations",
      label: t("MyUnits.Calendar.Tabs.byReservationUnit"),
    },
    {
      key: "reservation-unit",
      label: t("MyUnits.Calendar.Tabs.byUnit"),
    },
  ];

  const isPkValid = pk != null && Number(pk) > 0;
  const id = base64encode(`UnitNode:${pk}`);
  const { loading, data } = useUnitViewQuery({
    skip: !isPkValid,
    variables: { id },
    onError: (err) => {
      errorToast({
        text: err.message,
      });
    },
  });

  const { unit } = data ?? {};

  const { hasPermission: canCreateReservations } = useCheckPermission({
    units: [Number(pk)],
    permission: UserPermissionChoice.CanCreateStaffReservations,
  });

  if (loading) {
    return <Loader />;
  }
  // TODO improve the error reporting (404)
  if (!unit || !isPkValid) {
    return <div>{t("MyUnits.Calendar.error.unitNotFound")}</div>;
  }

  const recurringReservationUrl = getRecurringReservationUrl(pk);

  const reservationUnitOptions = filterNonNullable(
    data?.unit?.reservationunitSet
  ).map((reservationUnit) => ({
    label: reservationUnit?.nameFi ?? "",
    value: reservationUnit?.pk ?? 0,
  }));

  return (
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
        <ButtonLikeLink
          to={canCreateReservations ? recurringReservationUrl : ""}
          disabled={!canCreateReservations}
        >
          {t("MyUnits.Calendar.header.recurringReservation")}
        </ButtonLikeLink>
      </ContainerWithSpacing>
      <Tabs headers={TabHeaders}>
        <ReservationTabPanel key="unit-reservations">
          <UnitReservations />
        </ReservationTabPanel>
        <UnitCalendarTabPanel key="reservation-unit">
          <ReservationUnitCalendarView
            reservationUnitOptions={reservationUnitOptions}
            unitPk={Number(pk)}
          />
        </UnitCalendarTabPanel>
      </Tabs>
    </ContainerHack>
  );
}
