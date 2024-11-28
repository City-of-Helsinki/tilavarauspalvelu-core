import React from "react";
import {
  ReservationDocument,
  ReservationStateChoice,
  type ReservationQuery,
  type ReservationQueryVariables,
} from "@gql/gql-types";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import type { GetServerSidePropsContext } from "next";
import { useTranslation } from "next-i18next";
import { ReservationInfoCard } from "@/components/reservation/ReservationInfoCard";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { base64encode } from "common/src/helpers";
import { createApolloClient } from "@/modules/apolloClient";
import { ReservationPageWrapper } from "@/components/reservations/styles";
import BreadcrumbWrapper from "@/components/common/BreadcrumbWrapper";
import {
  getReservationPath,
  getReservationUnitPath,
  reservationsPath,
} from "@/modules/urls";
import { Button, IconCalendar, IconLinkExternal } from "hds-react";
import styled from "styled-components";
import { H1, H4 } from "common/src/common/typography";
import { getReservationUnitInstructionsKey } from "@/modules/reservationUnit";
import { ButtonLikeExternalLink } from "@/components/common/ButtonLikeLink";
import { Flex } from "common/styles/util";
import {
  convertLanguageCode,
  getTranslationSafe,
} from "common/src/common/util";
import { breakpoints } from "common";
import { InlineStyledLink } from "@/styles/util";
import { BackLinkList } from "@/components/reservation/CancelledLinkSet";

const StyledInfoCard = styled(ReservationInfoCard)`
  @media (min-width: ${breakpoints.m}) {
    grid-row: 1 / span 2;
    grid-column: -1;
  }
`;

function Confirmation({ apiBaseUrl, reservation }: PropsNarrowed) {
  const { t } = useTranslation();
  const routes = [
    {
      slug: "/reservations",
      title: t("breadcrumb:reservations"),
    },
    {
      slug: getReservationPath(reservation.pk),
      title: t("reservations:reservationName", { id: reservation.pk }),
    },
    {
      // NOTE Don't set slug. It hides the mobile breadcrumb
      slug: "",
      title: t("breadcrumb:confirmation"),
    },
  ];

  return (
    // TODO the info card used to be on top on mobile (now it's below)
    <>
      <BreadcrumbWrapper route={routes} />
      <ReservationPageWrapper $nRows={4}>
        <StyledInfoCard reservation={reservation} type="confirmed" />
        <ReservationConfirmation
          apiBaseUrl={apiBaseUrl}
          reservation={reservation}
        />
      </ReservationPageWrapper>
    </>
  );
}

const Wrapper = styled(Flex)`
  @media (min-width: ${breakpoints.m}) {
    grid-row: 1 / -1;
    grid-column: span 2;
  }
`;

function ReservationConfirmation({
  reservation,
  apiBaseUrl,
}: Pick<PropsNarrowed, "reservation" | "apiBaseUrl">): JSX.Element {
  const { t } = useTranslation();
  // NOTE typescript can't type array off index
  const reservationUnit = reservation.reservationUnits.find(() => true);
  const requiresHandling =
    reservation.state === ReservationStateChoice.RequiresHandling;

  const titleKey = requiresHandling
    ? "reservationInHandling"
    : "reservationSuccessful";
  const title = t(`reservationUnit:${titleKey}`);

  const confirmPostfix = requiresHandling ? "Handling" : "";
  const confirmationText = t(
    `reservationUnit:reservationReminderText${confirmPostfix}`
  );
  return (
    <Wrapper>
      <div>
        <H1 $noMargin>{title}</H1>
        <p>{confirmationText}</p>
        <p>
          {t("reservationUnit:findYourReservations")}{" "}
          <InlineStyledLink href={reservationsPath}>
            {t("reservationUnit:myReservationsLink")}
          </InlineStyledLink>
        </p>
      </div>
      <Actions reservation={reservation} />
      <Instructions reservation={reservation} />
      <BackLinkList
        reservationUnitHome={getReservationUnitPath(reservationUnit?.pk)}
        apiBaseUrl={apiBaseUrl}
      />
    </Wrapper>
  );
}

function Instructions({
  reservation,
}: {
  reservation: Pick<PropsNarrowed["reservation"], "reservationUnits" | "state">;
}) {
  const { t, i18n } = useTranslation();

  const reservationUnit = reservation.reservationUnits.find(() => true);
  const lang = convertLanguageCode(i18n.language);
  const instructionsKey = getReservationUnitInstructionsKey(reservation.state);
  const instructionsText =
    instructionsKey != null && reservationUnit != null
      ? getTranslationSafe(reservationUnit, instructionsKey, lang)
      : null;
  const showInstructions =
    reservationUnit != null &&
    instructionsKey != null &&
    instructionsText != null &&
    instructionsText !== "";

  return showInstructions ? (
    <div>
      <H4 $noMargin as="h2">
        {t("reservations:reservationInfo")}
      </H4>
      <p>{instructionsText}</p>
    </div>
  ) : null;
}

function Actions({
  reservation,
}: {
  reservation: Pick<
    PropsNarrowed["reservation"],
    "calendarUrl" | "paymentOrder" | "state"
  >;
}) {
  const { t, i18n } = useTranslation();
  const order = reservation.paymentOrder.find(() => true);

  // Reservation can be in either RequiresHandling or Confirmed state on this page
  if (reservation.state !== ReservationStateChoice.Confirmed) {
    return null;
  }

  // TODO this should be a ButtonContainer (we want two buttons side by side on mobile or similar)
  return (
    <Flex $direction="row">
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
            window.open(`${order.receiptUrl}&lang=${i18n.language}`, "_blank")
          }
          variant="secondary"
          iconRight={<IconLinkExternal aria-hidden />}
        >
          {t("reservations:downloadReceipt")}
        </Button>
      )}
    </Flex>
  );
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const { locale, params } = ctx;
  const pk = params?.id;

  const commonProps = getCommonServerSideProps();
  const client = createApolloClient(commonProps.apiBaseUrl, ctx);

  if (Number.isFinite(Number(pk))) {
    const typename = "ReservationNode";
    const id = base64encode(`${typename}:${pk}`);

    const { data: reservationData } = await client.query<
      ReservationQuery,
      ReservationQueryVariables
    >({
      query: ReservationDocument,
      fetchPolicy: "no-cache",
      variables: { id },
    });
    const { reservation } = reservationData || {};

    if (reservation) {
      return {
        props: {
          reservation,
          ...getCommonServerSideProps(),
          ...(await serverSideTranslations(locale ?? "fi")),
        },
      };
    }
  }

  return {
    notFound: true,
    props: {
      notFound: true,
      ...commonProps,
      ...(await serverSideTranslations(locale ?? "fi")),
      key: `${pk}-confirmation-${locale}`,
    },
  };
}

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];
type PropsNarrowed = Exclude<Props, { notFound: boolean }>;

export default Confirmation;
