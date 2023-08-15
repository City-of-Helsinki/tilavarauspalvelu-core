import { ReservationState } from "common/types/common";
import {
  IconArrowRight,
  IconCalendar,
  IconLinkExternal,
  IconSignout,
} from "hds-react";
import { useRouter } from "next/router";
import React, { useMemo } from "react";
import { Trans, useTranslation } from "next-i18next";
import Link from "next/link";
import styled from "styled-components";
import { fontRegular, H2 } from "common/src/common/typography";
import { useSession } from "next-auth/react";
import { Reservation } from "common/src/reservation-form/types";
import {
  PaymentOrderType,
  ReservationsReservationStateChoices,
  ReservationType,
  ReservationUnitType,
} from "common/types/gql-types";
import { Subheading } from "common/src/reservation-form/styles";
import { breakpoints } from "common/src/common/style";
import { getReservationUnitInstructionsKey } from "../../modules/reservationUnit";
import { getTranslation, reservationsUrl } from "../../modules/util";
import { BlackButton } from "../../styles/util";
import { Paragraph } from "./styles";
import { reservationUnitPath } from "../../modules/const";
import IconButton from "../common/IconButton";
import { signOut } from "../../modules/auth";

type Props = {
  reservation: Reservation | ReservationType;
  reservationUnit: ReservationUnitType;
  order?: PaymentOrderType;
};

const Wrapper = styled.div`
  align-items: flex-start;
  margin-bottom: var(--spacing-layout-l);
`;

const Heading = styled(H2).attrs({ as: "h1" })``;

const ActionContainer1 = styled.div`
  margin: var(--spacing-m) 0 var(--spacing-l);
  display: flex;
  gap: var(--spacing-m);
  flex-direction: column;

  > button {
    max-width: 20rem;
  }

  @media (min-width: ${breakpoints.l}) {
    flex-direction: row;
  }
`;

const ActionContainer2 = styled.div`
  display: flex;
  gap: var(--spacing-m);
  flex-direction: column;
  align-items: flex-start;
`;

const StyledLink = styled(IconButton)`
  color: var(--color-black) !important;
`;

const InlineStyledLink = styled(Link)`
  && {
    display: inline;
    color: var(--color-black);
    text-decoration: underline;
    ${fontRegular};
  }
`;

const ReservationConfirmation = ({
  reservation,
  reservationUnit,
  order,
}: Props): JSX.Element => {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { data: session } = useSession();

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
            components={{
              br: <br />,
              lnk: (
                <InlineStyledLink href={reservationsUrl}>
                  Omat varaukset -sivulta
                </InlineStyledLink>
              ),
            }}
          >
            {" "}
          </Trans>
        </Paragraph>
        {reservation.state ===
          ReservationsReservationStateChoices.Confirmed && (
          <ActionContainer1 style={{ marginBottom: "var(--spacing-2-xl)" }}>
            <BlackButton
              data-testid="reservation__confirmation--button__calendar-url"
              onClick={() => router.push(reservation.calendarUrl)}
              variant="secondary"
              iconRight={<IconCalendar aria-hidden />}
            >
              {t("reservations:saveToCalendar")}
            </BlackButton>
            {order?.receiptUrl && (
              <BlackButton
                data-testid="reservation__confirmation--button__receipt-link"
                onClick={() =>
                  window.open(
                    `${order.receiptUrl}&lang=${i18n.language}`,
                    "_blank"
                  )
                }
                variant="secondary"
                iconRight={<IconLinkExternal aria-hidden />}
              >
                {t("reservations:downloadReceipt")}
              </BlackButton>
            )}
          </ActionContainer1>
        )}
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
          <StyledLink
            href={reservationUnitPath(reservationUnit.pk)}
            label={t("reservations:backToReservationUnit")}
            icon={<IconArrowRight aria-hidden />}
          />
          <StyledLink
            href="/"
            label={t("common:gotoFrontpage")}
            icon={<IconArrowRight aria-hidden />}
          />
          <StyledLink
            icon={<IconSignout aria-hidden />}
            onClick={() => signOut({ session })}
            label={t("common:logout")}
          />
        </ActionContainer2>
      </div>
    </Wrapper>
  );
};

export default ReservationConfirmation;
