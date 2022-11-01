import { ReservationState } from "common/types/common";
import { IconArrowRight, IconCalendar, IconSignout } from "hds-react";
import { useRouter } from "next/router";
import React, { useMemo } from "react";
import { Trans, useTranslation } from "react-i18next";
import styled from "styled-components";
import { H2 } from "common/src/common/typography";
import {
  ReservationsReservationStateChoices,
  ReservationUnitType,
} from "../../modules/gql-types";
import { getReservationUnitInstructionsKey } from "../../modules/reservationUnit";
import { Reservation } from "../../modules/types";
import { getTranslation, reservationsUrl } from "../../modules/util";
import { MediumButton } from "../../styles/util";
import { Paragraph, Subheading } from "./styles";

type Props = {
  reservation: Reservation;
  reservationUnit: ReservationUnitType;
};

const Wrapper = styled.div`
  align-items: flex-start;
`;

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
        <H2>
          {t(
            `reservationUnit:${
              requiresHandling
                ? "reservationInHandling"
                : "reservationSuccessful"
            }`
          )}
        </H2>
        <Paragraph style={{ margin: "var(--spacing-xl) 0" }}>
          <Trans
            i18nKey={`reservationUnit:reservationReminderText${
              requiresHandling ? "Handling" : ""
            }`}
            t={t}
            values={{ user: reservation?.user.email }}
            components={{
              link: <a href={reservationsUrl}> </a>,
            }}
          />
        </Paragraph>
        <ActionContainer1 style={{ marginBottom: "var(--spacing-2-xl)" }}>
          <MediumButton
            data-testid="reservation__confirmation--button__calendar-url"
            onClick={() => router.push(reservation.calendarUrl)}
            variant="secondary"
            iconRight={<IconCalendar aria-hidden />}
          >
            {t("reservations:saveToCalendar")}
          </MediumButton>
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
          <MediumButton
            variant="supplementary"
            onClick={() => router.push("/")}
            iconRight={<IconArrowRight aria-hidden />}
          >
            {t("common:gotoFrontpage")}
          </MediumButton>{" "}
          <MediumButton
            variant="supplementary"
            onClick={() => router.push(reservationsUrl)}
            iconRight={<IconSignout aria-hidden />}
          >
            {t("common:logout")}
          </MediumButton>
        </ActionContainer2>
      </div>
    </Wrapper>
  );
};

export default ReservationConfirmation;
