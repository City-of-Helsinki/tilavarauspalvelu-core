import React from "react";
import { useTranslation } from "react-i18next";
import { H1 } from "common";
import { HR } from "@/component/Table";
import Filters from "./Filters";
import { ReservationUnitsDataReader } from "./ReservationUnitsDataLoader";

function ReservationUnits(): JSX.Element {
  const { t } = useTranslation();

  return (
    <>
      <div>
        <H1>{t("ReservationUnits.reservationUnitListHeading")}</H1>
        <p>{t("ReservationUnits.reservationUnitListDescription")}</p>
      </div>
      <Filters />
      <HR />
      <ReservationUnitsDataReader />
    </>
  );
}

export default ReservationUnits;
