import React from "react";
import {
  IconArrowRight,
  IconCalendar,
  IconLinkExternal,
  IconSignout,
} from "hds-react";
import { useRouter } from "next/router";
import { Trans, useTranslation } from "next-i18next";
import Link from "next/link";
import styled from "styled-components";
import { fontRegular, H2 } from "common/src/common/typography";
import {
  PaymentOrderType,
  ReservationsReservationStateChoices,
  ReservationType,
  ReservationUnitType,
} from "common/types/gql-types";
import { Subheading } from "common/src/reservation-form/styles";
import { breakpoints } from "common/src/common/style";
import { IconButton } from "common/src/components";
import { getReservationUnitInstructionsKey } from "../../modules/reservationUnit";
import { getTranslation, reservationsUrl } from "../../modules/util";
import { BlackButton } from "../../styles/util";
import { Paragraph } from "./styles";
import { reservationUnitPath } from "../../modules/const";
import { signOut } from "@/hooks/auth";

type Props = {
  reservation: ReservationType;
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

const InlineStyledLink = styled(Link)`
  && {
    display: inline;
    color: var(--color-black);
    text-decoration: underline;
    ${fontRegular};
  }
`;

const ReturnLinkContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const ReturnLinkList = ({
  reservationUnitHome,
  style,
}: {
  reservationUnitHome: string;
  style: React.CSSProperties;
}): JSX.Element => {
  const { t } = useTranslation();
  return (
    <ReturnLinkContainer style={style}>
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
        onClick={() => signOut()}
        label={t("common:logout")}
      />
    </ReturnLinkContainer>
  );
};

const ReservationConfirmation = ({
  reservation,
  reservationUnit,
  order,
}: Props): JSX.Element => {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const instructionsKey = getReservationUnitInstructionsKey(reservation?.state);

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
              onClick={() => router.push(String(reservation.calendarUrl))}
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
        {getTranslation(reservationUnit, String(instructionsKey)) && (
          <>
            <Subheading>{t("reservations:reservationInfo")}</Subheading>
            <Paragraph style={{ margin: "var(--spacing-xl) 0" }}>
              {getTranslation(reservationUnit, String(instructionsKey))}
            </Paragraph>
          </>
        )}
        <ReturnLinkList
          reservationUnitHome={reservationUnitPath(Number(reservationUnit.pk))}
          style={{
            marginTop: "var(--spacing-3-xl)",
          }}
        />
      </div>
    </Wrapper>
  );
};

export default ReservationConfirmation;
