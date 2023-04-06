import React from "react";
import type { ErrorType } from "common/types/gql-types";
import { Button } from "hds-react/components/Button";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import styled from "styled-components";
import { Container } from "hds-react";
import { z } from "zod";
import { H1, H6 } from "common/src/common/typography";
import { breakpoints } from "common/src/common/style";
import { ActionsWrapper } from "./commonStyling";
import ReservationList from "../../ReservationsList";
import withMainMenu from "../../withMainMenu";

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
  error: z.string().or(z.array(z.unknown())).optional(), // string | ErrorType[];
});

export type ReservationMade = {
  reservationPk?: number;
  startTime: string;
  endTime: string;
  date: Date;
  error?: string | ErrorType[];
};

// TODO just for testing the UI; requires another feature to be implemented.
const btn = [
  {
    callback: () => {
      // eslint-disable-next-line no-console
      console.log("TODO: NOT IMEPLENETED remove pressed");
    },
    type: "remove",
  },
  {
    callback: () => {
      // eslint-disable-next-line no-console
      console.log("TODO: NOT IMEPLENETED restore pressed");
    },
    type: "restore",
  },
] as const;

const RecurringReservationDone = () => {
  const location = useLocation();
  const props = z.array(ReservationMadeSchema).parse(location.state);

  const failed = props
    .filter(({ error }) => error != null)
    .map(({ error, ...x }) => ({ ...x, error: String(error) }));

  const successes = props
    .filter((x) => x.error == null)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(({ error, ...x }) => x)
    // TODO button is temp code till another feature is implemented
    .map((x, i) => ({ ...x, button: btn[i % 2] }));

  const { t } = useTranslation();

  const navigate = useNavigate();

  const locPrefix = "MyUnits.RecurringReservation.Confirmation";

  const reservationId = successes.map((x) => x.reservationPk).find(() => true);

  // TODO holidays not implemented
  const holidays = 0;

  const handleGoToReservation = (id: number) => {
    const url = `/reservations/${id}`;
    navigate(url);
  };

  if (!props) {
    return <div>No data in completed reservation: Should not be here</div>;
  }

  return (
    <StyledContainer>
      <H1 $legacy>{t(`${locPrefix}.title`)}</H1>
      <InfoSection>
        <span>
          {failed.length === 0
            ? t(`${locPrefix}.successInfo`)
            : t(`${locPrefix}.failureInfo`, {
                total: props.length,
                conflicts: failed.length,
              })}
        </span>
        {holidays > 0 && (
          <span>
            {t(`${locPrefix}.holidayInfo`, {
              total: props.length,
              holidays: 0,
            })}
          </span>
        )}
      </InfoSection>
      {failed.length > 0 && (
        <InfoSection>
          {t(`${locPrefix}.failureInfoSecondParagraph`)}
        </InfoSection>
      )}
      {failed.length > 0 && (
        <StyledH6 as="h2">
          {t(`${locPrefix}.failedTitle`)} ({failed.length})
        </StyledH6>
      )}
      <ReservationList items={failed} hasPadding />
      <StyledH6 as="h2">
        {t(`${locPrefix}.successTitle`)} ({successes.length})
      </StyledH6>
      <ReservationList items={successes} hasPadding />
      <ActionsWrapper>
        <Button
          variant="secondary"
          onClick={() => navigate("../..", { relative: "path" })}
          theme="black"
        >
          {t(`${locPrefix}.buttonToUnit`)}
        </Button>
        {reservationId != null && (
          <Button
            variant="secondary"
            onClick={() => handleGoToReservation(reservationId)}
            theme="black"
          >
            {t(`${locPrefix}.buttonToReservation`)}
          </Button>
        )}
      </ActionsWrapper>
    </StyledContainer>
  );
};

export default withMainMenu(RecurringReservationDone);
