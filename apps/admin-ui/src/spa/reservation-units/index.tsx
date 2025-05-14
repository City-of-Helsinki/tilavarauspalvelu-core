import React from "react";
import { useTranslation } from "react-i18next";
import { H1, HR } from "common/styled";
import Filters from "./Filters";
import { ReservationUnitsDataReader } from "./ReservationUnitsDataLoader";

function ReservationUnits(): JSX.Element {
  const { t } = useTranslation();

  return (
    <>
      <div>
        <H1 $marginTop="l">
          {t("ReservationUnits.reservationUnitListHeading")}
        </H1>
        <p>{t("ReservationUnits.reservationUnitListDescription")}</p>
      </div>
      <Filters />
      <HR />
      <ReservationUnitsDataReader />
    </>
  );
}

export default ReservationUnits;
