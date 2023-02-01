import React from "react";
import { H1 } from "common/src/common/typography";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { LocationType, Query, QueryUnitsArgs } from "common/types/gql-types";
import { LoadingSpinner } from "hds-react";
import { useQuery } from "@apollo/client";
import { publicUrl } from "../../common/const";
import { parseAddress } from "../../common/util";
import { useNotification } from "../../context/NotificationContext";
import { Container } from "../../styles/layout";
import BreadcrumbWrapper from "../BreadcrumbWrapper";
import withMainMenu from "../withMainMenu";
import { UNIT_QUERY } from "./queries";
import ReservationUnitCalendarView from "./ReservationUnitCalendarView";
import UnitReservationsView from "./UnitReservationsView";
import { TabHeader, TabPanel, Tabs } from "../Tabs";

type Params = {
  unitId: string;
  reservationUnitId: string;
};

const MyUnitView = () => {
  const { notifyError } = useNotification();
  const { unitId } = useParams<Params>();
  const { t } = useTranslation();

  const TabHeaders: TabHeader[] = [
    {
      key: "unit-reservations",
      label: `${t("MyUnits.Calendar.Tabs.byReservationUnit")}`,
    },
    { key: "reservation-unit", label: `${t("MyUnits.Calendar.Tabs.byUnit")}` },
  ];

  const { loading, data: unitData } = useQuery<Query, QueryUnitsArgs>(
    UNIT_QUERY,
    {
      skip: !unitId,
      onError: (err) => {
        notifyError(err.message);
      },
      variables: { pk: [unitId as string], offset: 0 },
    }
  );

  const unit = unitData?.units?.edges[0];

  if (loading || !unit) return <LoadingSpinner />;

  return (
    <>
      <BreadcrumbWrapper
        route={[`${publicUrl}/my-units`, "unit"]}
        aliases={[{ slug: "unit", title: unit?.node?.nameFi as string }]}
      />
      <Container>
        <div>
          <H1 $legacy>{unit?.node?.nameFi}</H1>
          <p>{parseAddress(unit?.node?.location as LocationType)}</p>
        </div>
        <Tabs headers={TabHeaders}>
          <TabPanel key="unit-reservations">
            <UnitReservationsView />
          </TabPanel>
          <TabPanel key="reservation-unit">
            <ReservationUnitCalendarView />
          </TabPanel>
        </Tabs>
      </Container>
    </>
  );
};

export default withMainMenu(MyUnitView);
