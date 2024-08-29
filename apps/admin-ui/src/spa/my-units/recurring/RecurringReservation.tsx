import { H1 } from "common/src/common/typography";
import React from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { Container } from "@/styles/layout";
import Loader from "@/component/Loader";
import { RecurringReservationForm } from "./RecurringReservationForm";
import { useRecurringReservationsUnits } from "./hooks";
import { LinkPrev } from "@/component/LinkPrev";

type Params = {
  unitId: string;
  reservationUnitId: string;
};

function RecurringReservationInner({ unitId }: { unitId: number }) {
  const { t } = useTranslation();

  const { loading, reservationUnits } = useRecurringReservationsUnits(unitId);

  if (loading) {
    return <Loader />;
  }

  return (
    <>
      <H1 $legacy>{t("MyUnits.RecurringReservation.pageTitle")}</H1>
      {reservationUnits !== undefined && reservationUnits?.length > 0 ? (
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

  const isError = unitId == null || Number.isNaN(Number(unitId));
  return (
    <>
      <LinkPrev />
      <Container>
        {isError ? (
          <RecurringErrorPage />
        ) : (
          <RecurringReservationInner unitId={Number(unitId)} />
        )}
      </Container>
    </>
  );
}
