import { ReservationState } from "common/types/common";
import { IconArrowRight, IconCalendar, IconSignout } from "hds-react";
import { useRouter } from "next/router";
import React, { useMemo } from "react";
import { Trans, useTranslation } from "next-i18next";
import Link from "next/link";
import styled from "styled-components";
import { fontMedium, fontRegular, H2 } from "common/src/common/typography";
import { Reservation } from "common/src/reservation-form/types";
import {
  ReservationsReservationStateChoices,
  ReservationUnitType,
} from "common/types/gql-types";
import { Subheading } from "common/src/reservation-form/styles";
import { getReservationUnitInstructionsKey } from "../../modules/reservationUnit";
import { getTranslation, reservationsUrl } from "../../modules/util";
import { BlackButton } from "../../styles/util";
import { Paragraph } from "./styles";
import { reservationUnitPath } from "../../modules/const";

type Props = {
  reservation: Reservation;
  reservationUnit: ReservationUnitType;
};

const Wrapper = styled.div`
  align-items: flex-start;
`;

const Heading = styled(H2).attrs({ as: "h1" })``;

const ActionContainer1 = styled.div`
  margin: var(--spacing-m) 0 var(--spacing-l);
  display: flex;
  gap: var(--spacing-m);
`;

const ActionContainer2 = styled.div`
  display: flex;
  gap: var(--spacing-m);
  flex-direction: column;
  align-items: flex-start;
`;

const StyledLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: var(--spacing-2-xs);
  text-decoration: underline;
  color: var(--color-black) !important;
  ${fontMedium}
`;

const InlineStyledLink = styled(Link)`
  display: inline;
  ${fontRegular};
`;

const ReservationConfirmation = ({
  reservation,
  reservationUnit,
}: Props): JSX.Element => {
  const { t } = useTranslation();
  const router = useRouter();

  const instructionsKey = useMemo(
    () =>
      getReservationUnitInstructionsKey(reservation?.state as ReservationState),
    [reservation?.state]
  );

  const requiresHandling =
    reservation.state === ReservationsReservationStateChoices.RequiresHandling;

  return (
    <Wrapper>
      <div>
        <Heading>
          {t(
            `reservationUnit:${
              requiresHandling
                ? "reservationInHandling"
                : "reservationSuccessful"
            }`
          )}
        </Heading>
        <Paragraph style={{ margin: "var(--spacing-xl) 0" }}>
          <Trans
            i18nKey={`reservationUnit:reservationReminderText${
              requiresHandling ? "Handling" : ""
            }`}
            t={t}
            values={{ user: reservation?.user.email }}
            components={{ bold: <strong />, br: <br /> }}
          >
            <InlineStyledLink href={reservationsUrl}> </InlineStyledLink>
          </Trans>
        </Paragraph>
        <ActionContainer1 style={{ marginBottom: "var(--spacing-2-xl)" }}>
          <BlackButton
            data-testid="reservation__confirmation--button__calendar-url"
            onClick={() => router.push(reservation.calendarUrl)}
            variant="secondary"
            iconRight={<IconCalendar aria-hidden />}
          >
            {t("reservations:saveToCalendar")}
          </BlackButton>
        </ActionContainer1>
        {getTranslation(reservationUnit, instructionsKey) && (
          <>
            <Subheading>{t("reservations:reservationInfo")}</Subheading>
            <Paragraph style={{ margin: "var(--spacing-xl) 0" }}>
              {getTranslation(reservationUnit, instructionsKey)}
            </Paragraph>
          </>
        )}
        <ActionContainer2
          style={{
            marginTop: "var(--spacing-3-xl)",
          }}
        >
          <StyledLink href={reservationUnitPath(reservationUnit.pk)}>
            {t("reservations:backToReservationUnit")}
            <IconArrowRight aria-hidden size="m" />
          </StyledLink>
          <StyledLink href="/">
            {t("common:gotoFrontpage")}
            <IconArrowRight aria-hidden size="m" />
          </StyledLink>
          <StyledLink href={reservationsUrl}>
            {t("common:logout")} <IconSignout size="m" aria-hidden />
          </StyledLink>
        </ActionContainer2>
      </div>
    </Wrapper>
  );
};

export default ReservationConfirmation;
