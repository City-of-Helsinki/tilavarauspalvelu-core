import React, { useCallback, useMemo } from "react";
import TimeZoneNotification from "common/src/components/TimeZoneNotification";
import styled from "styled-components";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";
import type { GetServerSidePropsContext } from "next";
import { useTranslation } from "next-i18next";
import { H1, H4 } from "common/src/styled";
import { breakpoints } from "common/src/modules/const";
import {
  ReservationDocument,
  type ReservationQuery,
  type ReservationQueryVariables,
  ReservationStateChoice,
  useDeleteReservationMutation,
} from "@gql/gql-types";
import { createApolloClient } from "@/modules/apolloClient";
import { default as NextError } from "next/error";
import {
  getReservationInProgressPath,
  getReservationPath,
  getReservationUnitPath,
  getSingleSearchPath,
} from "@/modules/urls";
import { Sanitize } from "common/src/components/Sanitize";
import { isReservationUnitFreeOfCharge } from "@/modules/reservationUnit";
import { ReservationInfoCard } from "@/components/reservation/ReservationInfoCard";
import { Step0 } from "@/components/reservation/Step0";
import { Step1 } from "@/components/reservation/Step1";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { useConfirmNavigation } from "@/hooks/useConfirmNavigation";
import { createNodeId, toNumber } from "common/src/modules/helpers";
import { queryOptions } from "@/modules/queryOptions";
import { convertLanguageCode, getTranslationSafe } from "common/src/modules/util";
import { gql } from "@apollo/client";
import { PinkBox as PinkBoxBase } from "@/components/reservation/styles";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { ReservationPageWrapper, ReservationStepper, ReservationTitleSection } from "@/styled/reservation";
import { useRemoveStoredReservation } from "@/hooks/useRemoveStoredReservation";
import { useSearchParams } from "next/navigation";

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
  grid-row: 4;
  @media (min-width: ${breakpoints.m}) {
    grid-column: span 1 / -1;
    grid-row: 3;
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
    onError: () => {
      router.push(getReservationUnitPath(reservationUnit?.pk));
    },
  });

  const confirmMessage = t("reservations:confirmNavigation");
  // NOTE this is the only place where reservation is deleted, don't add a second place or it gets called repeatedly
  const onNavigationConfirmed = useCallback(() => {
    // TODO rewrite browser history so user will not end up here if they press next
    return deleteReservation({
      variables: {
        input: {
          pk: reservation?.pk?.toString() ?? "",
        },
      },
    });
  }, [deleteReservation, reservation?.pk]);

  // whitelist to allow language change and confirmation
  const whitelist = [
    RegExp(`.*/reservations/${reservation?.pk}\\?.+`),
    RegExp(`.*/reservation-unit/${reservationUnit?.pk}/reservation/${reservation?.pk}`),
  ];
  // only block nextjs navigation (we should not have any <a> links and we don't want to block refresh)
  useConfirmNavigation({
    confirm: true,
    confirmMessage,
    onNavigationConfirmed,
    whitelist,
  });

  const pageTitle =
    step === 0 ? t("reservationCalendar:heading.newReservation") : t("reservationCalendar:heading.pendingReservation");

  // NOTE: only navigate away from the page if the reservation is cancelled the confirmation hook handles delete
  const cancelReservation = useCallback(() => {
    router.push(getReservationUnitPath(reservationUnit?.pk));
  }, [router, reservationUnit]);

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

  const lang = convertLanguageCode(i18n.language);
  const notesWhenReserving = getTranslationSafe(reservationUnit, "notesWhenApplying", lang);

  // it should be Created only here (SSR should have redirected)
  if (reservation.state !== ReservationStateChoice.Created) {
    return <NextError statusCode={404} />;
  }

  return (
    <ReservationPageWrapper>
      <TimeZoneNotification />
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
        {/* TODO what's the logic here?
         * in what case are there more than 2 steps?
         * why do we not show that?
         * TODO why isn't this shown when creating a paid version? I think there was on purpose reason for that? maybe?
         */}
        {steps.length <= 2 && (
          <ReservationStepper
            language={i18n.language}
            selectedStep={step}
            style={{ width: "100%" }}
            onStepClick={handleStepClick}
            steps={steps}
          />
        )}
      </ReservationTitleSection>
      {step === 0 && <Step0 reservation={reservation} cancelReservation={cancelReservation} options={props.options} />}
      {step === 1 && <Step1 reservation={reservation} options={props.options} requiresPayment={steps.length > 2} />}
    </ReservationPageWrapper>
  );
}

function NewReservationWrapper(props: PropsNarrowed): JSX.Element | null {
  const { t, i18n } = useTranslation();
  const lang = convertLanguageCode(i18n.language);
  const { reservation } = props;
  const reservationUnitName = getTranslationSafe(reservation.reservationUnit, "name", lang);
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
      name
      ...ReservationFormFields
      ...ReservationInfoCard
      bufferTimeBefore
      bufferTimeAfter
      calendarUrl
      reservationUnit {
        id
        canApplyFreeOfCharge
        reservationForm
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
