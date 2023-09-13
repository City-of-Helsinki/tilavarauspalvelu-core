import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import styled from "styled-components";
import { Container, Button } from "hds-react";
import { ErrorBoundary } from "react-error-boundary";
import { z } from "zod";
import { H1, H6 } from "common/src/common/typography";
import { breakpoints } from "common/src/common/style";
import RecurringReservationsView from "app/component/reservations/requested/RecurringReservationsView";
import { ActionsWrapper } from "./commonStyling";
import ReservationList from "../../ReservationsList";

const InfoSection = styled.p`
  margin: var(--spacing-l) 0;
`;

const StyledH6 = styled(H6)`
  margin-bottom: 0;
`;

const StyledContainer = styled(Container)`
  margin-top: var(--spacing-2-xl);
  @media (min-width: ${breakpoints.m}) {
    padding-left: var(--spacing-2-xl) !important;
    padding-right: var(--spacing-2-xl) !important;
  }
`;

const ReservationMadeSchema = z.object({
  reservationPk: z.number().optional(),
  startTime: z.string(),
  endTime: z.string(),
  date: z.date(),
  error: z.string().or(z.unknown()).optional(),
});
export type ReservationMade = z.infer<typeof ReservationMadeSchema>;

const RecurringReservationDoneParamsSchema = z.object({
  reservations: z.array(ReservationMadeSchema),
  recurringPk: z.number(),
});

const RecurringReservationDone = () => {
  const location = useLocation();
  const { t } = useTranslation("translation", {
    keyPrefix: "MyUnits.RecurringReservation.Confirmation",
  });
  const navigate = useNavigate();

  const props = RecurringReservationDoneParamsSchema.parse(location.state);

  const handleGoToReservation = (id: number) => {
    const url = `/reservations/${id}`;
    navigate(url);
  };

  const failed = props.reservations
    .filter(({ error }) => error != null)
    .map(({ error, ...x }) => ({ ...x, error: String(error) }));

  const successes = props.reservations.filter((x) => x.error == null);

  const reservationId = successes.map((x) => x.reservationPk).find(() => true);

  // TODO holidays not implemented
  const holidays = 0;

  return (
    <StyledContainer>
      <H1 $legacy>{successes.length > 0 ? t(`title`) : t("allFailedTitle")}</H1>
      <InfoSection>
        <span>
          {failed.length === 0
            ? t(`successInfo`)
            : t(`failureInfo`, {
                total: props.reservations.length,
                conflicts: failed.length,
              })}
        </span>
        {holidays > 0 && (
          <span>
            {t(`holidayInfo`, {
              total: props.reservations.length,
              holidays: 0,
            })}
          </span>
        )}
      </InfoSection>
      {failed.length > 0 && (
        <InfoSection>{t(`failureInfoSecondParagraph`)}</InfoSection>
      )}
      {failed.length > 0 && (
        <StyledH6 as="h2">
          {t("failedSubtitle")} ({failed.length})
        </StyledH6>
      )}
      <ReservationList items={failed} hasPadding />
      <StyledH6 as="h2">
        {t("successSubtitle")} ({successes.length})
      </StyledH6>
      <RecurringReservationsView recurringPk={props.recurringPk} />
      <ActionsWrapper>
        <Button
          variant="secondary"
          onClick={() => navigate("../..", { relative: "path" })}
          theme="black"
        >
          {t(`buttonToUnit`)}
        </Button>
        {reservationId != null && (
          <Button
            variant="secondary"
            onClick={() => handleGoToReservation(reservationId)}
            theme="black"
          >
            {t(`buttonToReservation`)}
          </Button>
        )}
      </ActionsWrapper>
    </StyledContainer>
  );
};

const ErrorComponent = () => {
  const { t } = useTranslation();
  return <div>{t("errors.errorRecurringReservationsDoneDisplay")}</div>;
};

const RecurringReservationDoneErrorWrapped = () => {
  return (
    <ErrorBoundary FallbackComponent={ErrorComponent}>
      <RecurringReservationDone />
    </ErrorBoundary>
  );
};

export default RecurringReservationDoneErrorWrapped;
