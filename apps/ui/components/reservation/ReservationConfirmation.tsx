import React from "react";
import {
  Button,
  IconArrowRight,
  IconCalendar,
  IconLinkExternal,
  IconSignout,
} from "hds-react";
import { Trans, useTranslation } from "next-i18next";
import Link from "next/link";
import styled from "styled-components";
import { fontRegular, H1 } from "common/src/common/typography";
import {
  type PaymentOrderNode,
  type ReservationQuery,
  ReservationStateChoice,
} from "@gql/gql-types";
import { Subheading } from "common/src/reservation-form/styles";
import { IconButton } from "common/src/components";
import { signOut } from "common/src/browserHelpers";
import { getReservationUnitInstructionsKey } from "@/modules/reservationUnit";
import { getTranslation } from "@/modules/util";
import { ButtonLikeExternalLink } from "../common/ButtonLikeLink";
import { getReservationUnitPath, reservationsPath } from "@/modules/urls";
import { Flex } from "common/styles/util";

type Node = NonNullable<ReservationQuery["reservation"]>;
type Props = {
  reservation: Node;
  apiBaseUrl: string;
  order?: PaymentOrderNode;
};

// TODO there should be a styled component for this (if not move this to common)
const InlineStyledLink = styled(Link)`
  && {
    display: inline;
    color: var(--color-black);
    text-decoration: underline;
    ${fontRegular};
  }
`;

// TODO this is nearly identical to CancelledLinkSet (except for the first link)
function ReturnLinkList({
  reservationUnitHome,
  apiBaseUrl,
}: {
  reservationUnitHome: string;
  apiBaseUrl: string;
}): JSX.Element {
  const { t } = useTranslation();
  return (
    <Flex>
      <IconButton
        href={reservationUnitHome}
        label={t("reservations:backToReservationUnit")}
        icon={<IconArrowRight aria-hidden />}
      />
      <IconButton
        href="/"
        label={t("common:gotoFrontpage")}
        icon={<IconArrowRight aria-hidden />}
      />
      <IconButton
        icon={<IconSignout aria-hidden />}
        onClick={() => signOut(apiBaseUrl)}
        label={t("common:logout")}
      />
    </Flex>
  );
}

function ReservationConfirmation({
  reservation,
  apiBaseUrl,
  order,
}: Props): JSX.Element {
  const { t, i18n } = useTranslation();

  const reservationUnit = reservation.reservationUnits?.[0];
  const instructionsKey = getReservationUnitInstructionsKey(reservation?.state);
  const requiresHandling =
    reservation.state === ReservationStateChoice.RequiresHandling;

  const titleKey = requiresHandling
    ? "reservationInHandling"
    : "reservationSuccessful";
  const title = t(`reservationUnit:${titleKey}`);
  const showInstructions =
    reservationUnit != null &&
    instructionsKey != null &&
    getTranslation(reservationUnit, instructionsKey);

  return (
    <Flex>
      {/* TODO the H1 margin-bottom and the gap are fighting */}
      <H1>{title}</H1>
      <p>
        <Trans
          i18nKey={`reservationUnit:reservationReminderText${
            requiresHandling ? "Handling" : ""
          }`}
          t={t}
          components={{
            br: <br />,
            lnk: (
              <InlineStyledLink href={reservationsPath}>
                Omat varaukset -sivulta
              </InlineStyledLink>
            ),
          }}
        >
          {" "}
        </Trans>
      </p>
      {reservation.state === ReservationStateChoice.Confirmed && (
        // TODO this should be a ButtonContainer (we want two buttons side by side on mobile or similar)
        <Flex>
          <ButtonLikeExternalLink
            size="large"
            disabled={!reservation.calendarUrl}
            data-testid="reservation__confirmation--button__calendar-url"
            href={reservation.calendarUrl ?? ""}
          >
            {t("reservations:saveToCalendar")}
            <IconCalendar aria-hidden />
          </ButtonLikeExternalLink>
          {order?.receiptUrl && (
            <Button
              data-testid="reservation__confirmation--button__receipt-link"
              // TODO should be a link
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
            </Button>
          )}
        </Flex>
      )}
      {showInstructions && (
        <>
          <Subheading>{t("reservations:reservationInfo")}</Subheading>
          <p>{getTranslation(reservationUnit, instructionsKey)}</p>
        </>
      )}
      {reservationUnit != null && (
        <ReturnLinkList
          reservationUnitHome={getReservationUnitPath(reservationUnit?.pk)}
          apiBaseUrl={apiBaseUrl}
        />
      )}
    </Flex>
  );
}

export default ReservationConfirmation;
