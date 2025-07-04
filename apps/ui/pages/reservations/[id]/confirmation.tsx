import React from "react";
import {
  ReservationConfirmationPageDocument,
  type ReservationConfirmationPageQuery,
  type ReservationConfirmationPageQueryVariables,
  ReservationStateChoice,
} from "@gql/gql-types";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import type { GetServerSidePropsContext } from "next";
import { useTranslation } from "next-i18next";
import { ReservationInfoCard } from "@/components/reservation/ReservationInfoCard";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { base64encode, ignoreMaybeArray, toNumber } from "common/src/helpers";
import { createApolloClient } from "@/modules/apolloClient";
import { InlineStyledLink } from "@/styled/util";
import { ReservationPageWrapper } from "@/styled/reservation";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { getReservationPath, getReservationUnitPath, reservationsPath, reservationsPrefix } from "@/modules/urls";
import { Button, ButtonVariant, IconCalendar, IconLinkExternal } from "hds-react";
import styled from "styled-components";
import { Flex, H1 } from "common/styled";
import { breakpoints } from "common/src/const";
import { ButtonLikeExternalLink } from "@/components/common/ButtonLikeLink";
import { BackLinkList } from "@/components/reservation/CancelledLinkSet";
import { Instructions } from "@/components/reservation/Instructions";
import { gql } from "@apollo/client";

function Confirmation({ apiBaseUrl, reservation }: PropsNarrowed) {
  const { t } = useTranslation();
  const routes = [
    {
      slug: reservationsPrefix,
      title: t("breadcrumb:reservations"),
    },
    {
      slug: getReservationPath(reservation.pk),
      title: t("reservations:reservationName", { id: reservation.pk }),
    },
    {
      title: t("breadcrumb:confirmation"),
    },
  ] as const;

  return (
    // TODO the info card used to be on top on mobile (now it's below)
    <>
      <Breadcrumb routes={routes} />
      <ReservationPageWrapper $nRows={4}>
        <ReservationInfoCard reservation={reservation} bgColor="gold" />
        <ReservationConfirmation apiBaseUrl={apiBaseUrl} reservation={reservation} />
      </ReservationPageWrapper>
    </>
  );
}

const Wrapper = styled(Flex)`
  @media (min-width: ${breakpoints.m}) {
    grid-row: 1 / -1;
  }
`;

function ReservationConfirmation({
  reservation,
  apiBaseUrl,
}: Pick<PropsNarrowed, "reservation" | "apiBaseUrl">): JSX.Element {
  const { t } = useTranslation();
  // NOTE typescript can't type array off index
  const requiresHandling = reservation.state === ReservationStateChoice.RequiresHandling;

  const titleKey = requiresHandling ? "reservationInHandling" : "reservationSuccessful";
  const title = t(`reservationUnit:${titleKey}`);

  const confirmPostfix = requiresHandling ? "Handling" : "";
  const confirmationText = t(`reservationUnit:reservationReminderText${confirmPostfix}`);
  return (
    <Wrapper>
      <div>
        <H1 $noMargin>{title}</H1>
        <p>{confirmationText}</p>
        <p>
          {t("reservationUnit:findYourReservations")}{" "}
          <InlineStyledLink href={reservationsPath}>{t("reservationUnit:myReservationsLink")}</InlineStyledLink>
        </p>
      </div>
      <Actions reservation={reservation} />
      <Instructions reservation={reservation} />
      <BackLinkList
        reservationUnitHome={getReservationUnitPath(reservation.reservationUnit.pk)}
        apiBaseUrl={apiBaseUrl}
      />
    </Wrapper>
  );
}

function Actions({
  reservation,
}: {
  reservation: Pick<PropsNarrowed["reservation"], "calendarUrl" | "paymentOrder" | "state">;
}) {
  const { t, i18n } = useTranslation();

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
        <IconCalendar />
      </ButtonLikeExternalLink>
      {reservation.paymentOrder?.receiptUrl && (
        <Button
          data-testid="reservation__confirmation--button__receipt-link"
          onClick={() => window.open(`${reservation.paymentOrder?.receiptUrl}&lang=${i18n.language}`, "_blank")}
          variant={ButtonVariant.Secondary}
          iconEnd={<IconLinkExternal />}
        >
          {t("reservations:downloadReceipt")}
        </Button>
      )}
    </Flex>
  );
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const { locale, params } = ctx;
  const pk = toNumber(ignoreMaybeArray(params?.id));

  const commonProps = getCommonServerSideProps();
  const client = createApolloClient(commonProps.apiBaseUrl, ctx);

  if (pk != null) {
    const typename = "ReservationNode";
    const id = base64encode(`${typename}:${pk}`);
    const { data: reservationData } = await client.query<
      ReservationConfirmationPageQuery,
      ReservationConfirmationPageQueryVariables
    >({
      query: ReservationConfirmationPageDocument,
      fetchPolicy: "no-cache",
      variables: { id },
    });
    const { reservation } = reservationData || {};

    if (reservation) {
      return {
        props: {
          reservation,
          ...commonProps,
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
    },
  };
}

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];
type PropsNarrowed = Exclude<Props, { notFound: boolean }>;

export const CONFIRMATION_QUERY = gql`
  query ReservationConfirmationPage($id: ID!) {
    reservation(id: $id) {
      id
      pk
      name
      ...ReserveeBillingFields
      ...ReservationInfoCard
      ...Instructions
      calendarUrl
      paymentOrder {
        id
        receiptUrl
      }
      reservationUnit {
        id
        canApplyFreeOfCharge
        ...CancellationRuleFields
      }
    }
  }
`;

export default Confirmation;
