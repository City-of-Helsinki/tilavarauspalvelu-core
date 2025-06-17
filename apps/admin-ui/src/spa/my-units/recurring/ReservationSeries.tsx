import React from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { ReservationSeriesForm } from "./ReservationSeriesForm";
import { useSeriesReservationsUnits } from "./hooks";
import { LinkPrev } from "@/component/LinkPrev";
import { CenterSpinner, H1 } from "common/styled";
import { toNumber } from "common/src/helpers";

type Params = {
  unitId: string;
  reservationUnitId: string;
};

function ReservationSeriesInner({ unitPk }: { unitPk: number }) {
  const { t } = useTranslation();

  const { loading, reservationUnits } = useSeriesReservationsUnits(unitPk);

  return (
    <>
      <H1 $noMargin>{t("MyUnits.ReservationSeries.pageTitle")}</H1>
      {loading ? (
        <CenterSpinner />
      ) : reservationUnits.length > 0 ? (
        <ReservationSeriesForm reservationUnits={reservationUnits} />
      ) : (
        <p>{t("MyUnits.ReservationSeries.error.notPossibleForThisUnit")}</p>
      )}
    </>
  );
}

function ReservationSeriesErrorPage() {
  const { t } = useTranslation();
  return <div>{t("MyUnits.ReservationSeries.error.invalidUnitId")}</div>;
}

// Handle invalid route params
export function ReservationSeries() {
  const { unitId } = useParams<Params>();

  const unitPk = toNumber(unitId);
  const isInvalid = unitPk == null || unitPk < 1;
  return (
    <>
      <LinkPrev />
      {isInvalid ? <ReservationSeriesErrorPage /> : <ReservationSeriesInner unitPk={unitPk} />}
    </>
  );
}
