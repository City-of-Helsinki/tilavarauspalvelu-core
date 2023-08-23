import { H1 } from "common/src/common/typography";
import React from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import { Container } from "../../../styles/layout";
import Loader from "../../Loader";
import MyUnitRecurringReservationForm from "./MyUnitRecurringReservationForm";
import { useRecurringReservationsUnits } from "./hooks";
import LinkPrev from "../../LinkPrev";

const PreviousLinkWrapper = styled.div`
  padding: var(--spacing-s);
`;

type Params = {
  unitId: string;
  reservationUnitId: string;
};

const BackLinkHeader = () => {
  return (
    <PreviousLinkWrapper>
      <LinkPrev />
    </PreviousLinkWrapper>
  );
};

const MyUnitRecurringReservation = ({ unitId }: { unitId: number }) => {
  const { t } = useTranslation();

  const { loading, reservationUnits } = useRecurringReservationsUnits(unitId);

  if (loading) return <Loader />;

  return (
    <>
      <BackLinkHeader />
      <Container>
        <H1 $legacy>{t("MyUnits.RecurringReservation.pageTitle")}</H1>
        {reservationUnits !== undefined && reservationUnits?.length > 0 ? (
          <MyUnitRecurringReservationForm reservationUnits={reservationUnits} />
        ) : (
          <p>
            {t("MyUnits.RecurringReservation.error.notPossibleForThisUnit")}
          </p>
        )}
      </Container>
    </>
  );
};

// Handle invalid route params
const MyUnitRecurringReservationRouteWrapper = () => {
  const { t } = useTranslation();
  const { unitId } = useParams<Params>();

  if (unitId === undefined || Number.isNaN(parseInt(unitId, 10))) {
    return (
      <>
        <BackLinkHeader />
        <Container>
          <div>{t("MyUnits.RecurringReservation.error.invalidUnitId")}</div>
        </Container>
      </>
    );
  }
  return <MyUnitRecurringReservation unitId={parseInt(unitId, 10)} />;
};

export default MyUnitRecurringReservationRouteWrapper;
