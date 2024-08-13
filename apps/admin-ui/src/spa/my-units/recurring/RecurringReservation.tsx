import { H1 } from "common/src/common/typography";
import React from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import { Container } from "@/styles/layout";
import Loader from "@/component/Loader";
import { RecurringReservationForm } from "./RecurringReservationForm";
import { useRecurringReservationsUnits } from "./hooks";
import LinkPrev from "@/component/LinkPrev";

const PreviousLinkWrapper = styled.div`
  padding: var(--spacing-s);
`;

type Params = {
  unitId: string;
  reservationUnitId: string;
};

function BackLinkHeader() {
  return (
    <PreviousLinkWrapper>
      <LinkPrev />
    </PreviousLinkWrapper>
  );
}

function RecurringReservationInner({ unitId }: { unitId: number }) {
  const { t } = useTranslation();

  const { loading, reservationUnits } = useRecurringReservationsUnits(unitId);

  if (loading) {
    return <Loader />;
  }

  return (
    <>
      <BackLinkHeader />
      <Container>
        <H1 $legacy>{t("MyUnits.RecurringReservation.pageTitle")}</H1>
        {reservationUnits !== undefined && reservationUnits?.length > 0 ? (
          <RecurringReservationForm reservationUnits={reservationUnits} />
        ) : (
          <p>
            {t("MyUnits.RecurringReservation.error.notPossibleForThisUnit")}
          </p>
        )}
      </Container>
    </>
  );
}

// Handle invalid route params
export function RecurringReservation() {
  const { t } = useTranslation();
  const { unitId } = useParams<Params>();

  if (unitId == null || Number.isNaN(Number(unitId))) {
    return (
      <>
        <BackLinkHeader />
        <Container>
          <div>{t("MyUnits.RecurringReservation.error.invalidUnitId")}</div>
        </Container>
      </>
    );
  }
  return <RecurringReservationInner unitId={Number(unitId)} />;
}
