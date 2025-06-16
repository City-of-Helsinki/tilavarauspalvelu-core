import React from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { RecurringReservationForm } from "./RecurringReservationForm";
import { useRecurringReservationsUnits } from "./hooks";
import { LinkPrev } from "@/component/LinkPrev";
import { CenterSpinner, H1 } from "common/styled";
import { toNumber } from "common/src/helpers";

type Params = {
  unitId: string;
  reservationUnitId: string;
};

function RecurringReservationInner({ unitPk }: { unitPk: number }) {
  const { t } = useTranslation();

  const { loading, reservationUnits } = useRecurringReservationsUnits(unitPk);

  return (
    <>
      <H1 $noMargin>{t("MyUnits.RecurringReservation.pageTitle")}</H1>
      {loading ? (
        <CenterSpinner />
      ) : reservationUnits.length > 0 ? (
        <RecurringReservationForm reservationUnits={reservationUnits} />
      ) : (
        <p>{t("MyUnits.RecurringReservation.error.notPossibleForThisUnit")}</p>
      )}
    </>
  );
}

function RecurringErrorPage() {
  const { t } = useTranslation();
  return <div>{t("MyUnits.RecurringReservation.error.invalidUnitId")}</div>;
}

// Handle invalid route params
export function RecurringReservation() {
  const { unitId } = useParams<Params>();

  const unitPk = toNumber(unitId);
  const isInvalid = unitPk == null || unitPk < 1;
  return (
    <>
      <LinkPrev />
      {isInvalid ? <RecurringErrorPage /> : <RecurringReservationInner unitPk={unitPk} />}
    </>
  );
}
