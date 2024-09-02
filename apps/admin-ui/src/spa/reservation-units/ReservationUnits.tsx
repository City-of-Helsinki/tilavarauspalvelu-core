import React from "react";
import { useTranslation } from "react-i18next";
import { H1 } from "common";
import { HR } from "@/component/Table";
import { Container } from "@/styles/layout";
import Filters from "./Filters";
import { ReservationUnitsDataReader } from "./ReservationUnitsDataLoader";

function ReservationUnits(): JSX.Element {
  const { t } = useTranslation();

  return (
    <Container>
      <div>
        <H1 $legacy>{t("ReservationUnits.reservationUnitListHeading")}</H1>
        <p>{t("ReservationUnits.reservationUnitListDescription")}</p>
      </div>
      <Filters />
      <HR />
      <ReservationUnitsDataReader />
    </Container>
  );
}

export default ReservationUnits;
