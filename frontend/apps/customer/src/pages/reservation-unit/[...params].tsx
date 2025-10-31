import React, { useMemo } from "react";
import { gql } from "@apollo/client";
import type { GetServerSidePropsContext } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { default as NextError } from "next/error";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/router";
import styled from "styled-components";
import { Sanitize } from "ui/src/components/Sanitize";
import TimeZoneNotification from "ui/src/components/TimeZoneNotification";
import { breakpoints } from "ui/src/modules/const";
import { createNodeId, getLocalizationLang, toNumber } from "ui/src/modules/helpers";
import { getTranslation } from "ui/src/modules/util";
import { H1, H4 } from "ui/src/styled";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ReservationInfoCard } from "@/components/reservation/ReservationInfoCard";
import { useRemoveStoredReservation } from "@/hooks/useRemoveStoredReservation";
import { ReservationStep0, ReservationStep1 } from "@/lib/reservation-unit/[...params]";
import { createApolloClient } from "@/modules/apolloClient";
import { queryOptions } from "@/modules/queryOptions";
import { isReservationUnitFreeOfCharge } from "@/modules/reservationUnit";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import {
  getReservationInProgressPath,
  getReservationPath,
  getReservationUnitPath,
  getSingleSearchPath,
} from "@/modules/urls";
import { ReservationPageWrapper, ReservationTitleSection, PinkBox as PinkBoxBase } from "@/styled/reservation";
import { StyledStepper } from "@/styled/util";
import {
  ReservationDocument,
  type ReservationQuery,
  type ReservationQueryVariables,
  ReservationStateChoice,
  useDeleteReservationMutation,
} from "@gql/gql-types";

const StyledReservationInfoCard = styled(ReservationInfoCard)`
  grid-column: 1 / -1;
  grid-row: 2;
  @media (min-width: ${breakpoints.m}) {
    grid-column: span 1 / -1;
    grid-row: 1 / span 2;
  }
`;

const PinkBox = styled(PinkBoxBase)`
  grid-column: 1 / -1;
  grid-row: auto;
  @media (min-width: ${breakpoints.m}) {
    grid-column: span 1 / -1;
  }
`;

function filterStep(step: number | null): 0 | 1 {
  if (step === 0 || step === 1) {
    return step;
  }
  return 0;
}

// NOTE back / forward buttons (browser) do NOT work properly
// router.beforePopState could be used to handle them but it's super hackish
// the correct solution is to create separate pages (files) for each step (then next-router does this for free)
// Known issues with using beforePopState:
// - using back button changes the url but if the confirmation is cancelled the page is not changed
//   so it will break at least refresh (but next links still work like the url was correct)
// - it interfares with the confirmNavigation (incorrect url changes will break it)
// - using back multiple times breaks the confirmation hook (bypassing it or blocking the navigation while deleting the reservation)
// - requires complex logic to handle the steps and keep the url in sync with what's on the page
// - forward / backward navigation work differently
function NewReservation(props: PropsNarrowed): JSX.Element | null {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const reservation = props.reservation;
  const reservationUnit = reservation.reservationUnit;

  useRemoveStoredReservation();

  const params = useSearchParams();
  const step = filterStep(toNumber(params.get("step")));

  const requireHandling = reservationUnit.requireReservationHandling || reservation?.applyingForFreeOfCharge;

  const steps = useMemo(() => {
    if (reservationUnit == null) {
      return [];
    }
    const isUnitFreeOfCharge = isReservationUnitFreeOfCharge(reservationUnit.pricings, new Date(reservation.beginsAt));

    const stepLength = isUnitFreeOfCharge || requireHandling ? 2 : 5;

    return Array.from(Array(stepLength)).map((_n, i) => {
      const state = i === step ? 0 : i < step ? 1 : 2;

      return {
        label: `${i + 1}. ${t(`reservations:steps.${i + 1}`)}`,
        state,
      };
    });
  }, [reservationUnit, reservation.beginsAt, requireHandling, step, t]);

  const [deleteReservation] = useDeleteReservationMutation({
    errorPolicy: "all",
  });

  const pageTitle =
    step === 0 ? t("reservationCalendar:heading.newReservation") : t("reservationCalendar:heading.pendingReservation");

  const cancelReservation = () => {
    try {
      const input = { pk: reservation?.pk?.toString() ?? "" };
      deleteReservation({ variables: { input } });
    } finally {
      // ignore errors
      router.push(getReservationUnitPath(reservationUnit?.pk));
    }
  };

  const handleStepClick = async (_: unknown, index: number) => {
    const newStep = filterStep(index);
    if (newStep !== step) {
      await router.push(getReservationInProgressPath(reservation.reservationUnit.pk, reservation.pk, newStep));
    }
  };

  const shouldDisplayReservationUnitPrice =
    step === 0
      ? reservationUnit.canApplyFreeOfCharge
      : reservationUnit.canApplyFreeOfCharge && reservation.applyingForFreeOfCharge === true;

  const lang = getLocalizationLang(i18n.language);
  const notesWhenReserving = getTranslation(reservationUnit, "notesWhenApplying", lang);

  // it should be Created only here (SSR should have redirected)
  if (reservation.state !== ReservationStateChoice.Created) {
    return <NextError statusCode={404} />;
  }

  // If steps > 2 then it requires payment but the payment provider has a separate stepper so hide ours
  const shouldShowStepper = steps.length <= 2;

  return (
    <>
      <TimeZoneNotification />
      <ReservationPageWrapper>
        <StyledReservationInfoCard
          reservation={reservation}
          bgColor="gold"
          shouldDisplayReservationUnitPrice={shouldDisplayReservationUnitPrice}
        />
        {notesWhenReserving && (
          <PinkBox>
            <H4 as="h2" $marginTop="none">
              {t("reservations:reservationInfoBoxHeading")}
            </H4>
            <Sanitize html={notesWhenReserving} />
          </PinkBox>
        )}
        <ReservationTitleSection>
          <H1 $noMargin>{pageTitle}</H1>
          {shouldShowStepper && (
            <StyledStepper
              language={i18n.language}
              selectedStep={step}
              style={{ width: "100%" }}
              onStepClick={handleStepClick}
              steps={steps}
            />
          )}
        </ReservationTitleSection>
        {step === 0 && (
          <ReservationStep0 reservation={reservation} cancelReservation={cancelReservation} options={props.options} />
        )}
        {step === 1 && (
          <ReservationStep1 reservation={reservation} options={props.options} requiresPayment={steps.length > 2} />
        )}
      </ReservationPageWrapper>
    </>
  );
}

function NewReservationWrapper(props: PropsNarrowed): JSX.Element | null {
  const { t, i18n } = useTranslation();
  const lang = getLocalizationLang(i18n.language);
  const { reservation } = props;
  const reservationUnitName = getTranslation(reservation.reservationUnit, "name", lang);
  const routes = [
    {
      slug: getSingleSearchPath(),
      title: t("breadcrumb:searchSingle"),
    },
    {
      slug: getReservationUnitPath(reservation.reservationUnit.pk),
      title: reservationUnitName,
    },
    {
      title: t("reservations:reservationName", { id: reservation.pk }),
    },
  ] as const;

  return (
    <>
      <Breadcrumb routes={routes} />
      <NewReservation {...props} />
    </>
  );
}

export default NewReservationWrapper;

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];
type PropsNarrowed = Exclude<Props, { notFound: boolean }>;

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const { locale, params } = ctx;
  const [reservationUnitPkStr, path, reservationPkStr] = params?.params ?? [];
  const commonProps = getCommonServerSideProps();
  const apolloClient = createApolloClient(commonProps.apiBaseUrl, ctx);

  const reservationPk = toNumber(reservationPkStr);
  const reservationUnitPk = toNumber(reservationUnitPkStr);
  const isInvalidReservationUnitPk = reservationUnitPk == null || reservationUnitPk <= 0;
  const isInvalidReservationPk = reservationPk == null || reservationPk <= 0;
  const isInvalidPath = isInvalidReservationUnitPk || isInvalidReservationPk || path !== "reservation";

  if (isInvalidPath) {
    return {
      props: {
        // have to double up notFound inside the props to get TS types dynamically
        notFound: true,
        ...commonProps,
        ...(await serverSideTranslations(locale ?? "fi")),
      },
      notFound: true,
    };
  }

  const { data: resData } = await apolloClient.query<ReservationQuery, ReservationQueryVariables>({
    query: ReservationDocument,
    variables: { id: createNodeId("ReservationNode", reservationPk) },
  });

  const { reservation } = resData;

  if (reservation?.pk == null) {
    // Valid path but no reservation found -> redirect to reservation unit page
    const params = new URLSearchParams();
    params.set("invalidReservation", reservationPk.toString());
    return {
      redirect: {
        permanent: false,
        destination: getReservationUnitPath(reservationUnitPk, params),
      },
      props: {
        notFound: true, // for prop narrowing
      },
    };
  } else if (reservation.state !== ReservationStateChoice.Created) {
    // Valid reservation that is not in progress -> redirect to reservation page
    return {
      redirect: {
        permanent: false,
        destination: getReservationPath(reservation.pk),
      },
      props: {
        notFound: true, // for prop narrowing
      },
    };
  }

  const options = await queryOptions(apolloClient, locale ?? "");

  return {
    props: {
      ...commonProps,
      reservation,
      options,
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

export const RESERVATION_IN_PROGRESS_QUERY = gql`
  query Reservation($id: ID!) {
    reservation(id: $id) {
      id
      pk
      ...ReservationFormFields
      ...ReservationInfoCard
      bufferTimeBefore
      bufferTimeAfter
      calendarUrl
      reservationUnit {
        id
        canApplyFreeOfCharge
        reservationForm
        minPersons
        maxPersons
        ...CancellationRuleFields
        ...TermsOfUse
        requireReservationHandling
      }
    }
  }
`;

export const DELETE_RESERVATION = gql`
  mutation DeleteReservation($input: ReservationDeleteTentativeMutationInput!) {
    deleteTentativeReservation(input: $input) {
      deleted
    }
  }
`;
