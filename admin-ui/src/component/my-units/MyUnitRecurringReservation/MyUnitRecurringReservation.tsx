import { H1 } from "common/src/common/typography";
import { Button, IconAngleLeft } from "hds-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import { myUnitUrl } from "../../../common/urls";
import { Container } from "../../../styles/layout";
import { BasicLink } from "../../../styles/util";
import Loader from "../../Loader";
import withMainMenu from "../../withMainMenu";
import MyUnitRecurringReservationForm from "./MyUnitRecurringReservationForm";
import type { ReservationMade } from "./RecurringReservationDone";
import RecurringSuccess from "./RecurringReservationDone";
import { useRecurringReservationsUnits } from "./hooks";

const PreviousLinkWrapper = styled.div`
  padding: var(--spacing-xs);
`;

type Params = {
  unitId: string;
  reservationUnitId: string;
};

const BackLinkHeader = ({ unitId }: { unitId: number }) => {
  const { t } = useTranslation();
  const previousUrl = myUnitUrl(unitId);

  return (
    <PreviousLinkWrapper>
      <BasicLink to={previousUrl}>
        <Button
          aria-label={t("common.prev")}
          size="small"
          variant="supplementary"
          iconLeft={<IconAngleLeft />}
        >
          {t("common.prev")}
        </Button>
      </BasicLink>
    </PreviousLinkWrapper>
  );
};

const MyUnitRecurringReservation = ({ unitId }: { unitId: number }) => {
  const [reservationsMade, setReservationsMade] = useState<
    ReservationMade[] | null
  >(null);
  const { t } = useTranslation();

  const { loading, reservationUnits } = useRecurringReservationsUnits(unitId);

  if (loading) return <Loader />;

  return (
    <>
      <BackLinkHeader unitId={unitId} />
      <Container>
        {reservationsMade !== null ? (
          <RecurringSuccess reservations={reservationsMade} />
        ) : (
          <>
            <H1 $legacy>{t("MyUnits.RecurringReservation.pageTitle")}</H1>
            {reservationUnits !== undefined && reservationUnits?.length > 0 ? (
              <MyUnitRecurringReservationForm
                onReservation={setReservationsMade}
                reservationUnits={reservationUnits}
              />
            ) : (
              <p>
                {t("MyUnits.RecurringReservation.error.notPossibleForThisUnit")}
              </p>
            )}
          </>
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
        <BackLinkHeader unitId={0} />
        <Container>
          <div>{t("MyUnits.RecurringReservation.error.invalidUnitId")}</div>
        </Container>
      </>
    );
  }
  return <MyUnitRecurringReservation unitId={parseInt(unitId, 10)} />;
};

export default withMainMenu(MyUnitRecurringReservationRouteWrapper);
