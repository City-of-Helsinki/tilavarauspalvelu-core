import React, { useCallback, useMemo, useState } from "react";
import styled from "styled-components";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";
import { Stepper } from "hds-react";
import { FormProvider, useForm } from "react-hook-form";
import type { GetServerSidePropsContext } from "next";
import { useTranslation } from "next-i18next";
import { Flex, H1, H4 } from "common/styled";
import { breakpoints } from "common/src/const";
import {
  ReservationDocument,
  ReservationStateChoice,
  ReserveeType,
  useConfirmReservationMutation,
  useDeleteReservationMutation,
  useReservationLazyQuery,
  useUpdateReservationMutation,
} from "@gql/gql-types";
import type { ReservationQuery, ReservationQueryVariables, ReservationUpdateMutation } from "@gql/gql-types";
import type { Inputs } from "common/src/reservation-form/types";
import { createApolloClient } from "@/modules/apolloClient";
import NextError from "next/error";
import { getReservationPath, getReservationUnitPath, getSingleSearchPath } from "@/modules/urls";
import { Sanitize } from "common/src/components/Sanitize";
import { isReservationUnitFreeOfCharge } from "@/modules/reservationUnit";
import { getCheckoutUrl } from "@/modules/reservation";
import { ReservationInfoCard } from "@/components/reservation/ReservationInfoCard";
import { Step0 } from "@/components/reservation/Step0";
import { Step1 } from "@/components/reservation/Step1";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { useConfirmNavigation } from "@/hooks/useConfirmNavigation";
import { createNodeId, filterNonNullable, getNode, toNumber } from "common/src/helpers";
import { containsField } from "common/src/metaFieldsHelpers";
import { errorToast } from "common/src/components/toast";
import { getGeneralFields } from "@/components/reservation/SummaryFields";
import { queryOptions } from "@/modules/queryOptions";
import { convertLanguageCode, getTranslationSafe } from "common/src/common/util";
import { gql } from "@apollo/client";
import { PinkBox as PinkBoxBase } from "@/components/reservation/styles";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { ReservationPageWrapper } from "@/styled/reservation";
import { useDisplayError } from "common/src/hooks";
import { useRemoveStoredReservation } from "@/hooks/useRemoveStoredReservation";

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

const StyledForm = styled.form`
  grid-column: 1 / -1;
  grid-row: 3;
  @media (min-width: ${breakpoints.m}) {
    grid-column: span 1;
    grid-row: 2 / -1;
  }
`;

const TitleSection = styled(Flex)`
  grid-column: 1 / -1;
  @media (min-width: ${breakpoints.m}) {
    grid-column: span 1;
  }
`;

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

  const [refetch, { data: resData }] = useReservationLazyQuery({
    variables: { id: props.reservation.id },
    fetchPolicy: "no-cache",
  });

  const reservation = resData?.node != null && "pk" in resData.node ? resData.node : props.reservation;
  const reservationUnit = reservation.reservationUnit;

  useRemoveStoredReservation();

  const [step, setStep] = useState(0);

  // Get prefilled profile user fields from the reservation (backend fills them when created).
  // NOTE this is only updated on load (not after mutation or refetch)
  const defaultValues: Inputs = {
    // NOTE never undefined (this page is not accessible without reservation)
    pk: reservation?.pk ?? 0,
    name: reservation?.name ?? "",
    description: reservation?.description ?? "",
    reserveeFirstName: reservation?.reserveeFirstName ?? "",
    reserveeLastName: reservation?.reserveeLastName ?? "",
    reserveePhone: reservation?.reserveePhone ?? "",
    reserveeEmail: reservation?.reserveeEmail ?? "",
    reserveeAddressStreet: reservation?.reserveeAddressStreet ?? "",
    reserveeAddressCity: reservation?.reserveeAddressCity ?? "",
    reserveeAddressZip: reservation?.reserveeAddressZip ?? "",
    reserveeIdentifier: reservation?.reserveeIdentifier ?? "",
    reserveeOrganisationName: reservation?.reserveeOrganisationName ?? "",
    municipality: reservation?.municipality ?? undefined,
    reserveeType: reservation?.reserveeType ?? ReserveeType.Individual,
    applyingForFreeOfCharge: reservation?.applyingForFreeOfCharge ?? false,
    freeOfChargeReason: reservation?.freeOfChargeReason ?? "",
    purpose: reservation?.purpose?.pk ?? undefined,
    numPersons: reservation?.numPersons ?? undefined,
    ageGroup: reservation?.ageGroup?.pk ?? undefined,
    showBillingAddress: false,
    reserveeIsUnregisteredAssociation: false,
    spaceTerms: false,
    resourceTerms: false,
  };
  // TODO is defaultValues correct? it's prefilled from the profile data and we are not refetching at any point.
  // If we would refetch values would be more correct with reset hook.
  // Also if this is ever initialised without the data it will not prefill the form.
  const form = useForm<Inputs>({ defaultValues, mode: "onChange" });
  const { handleSubmit, watch } = form;

  const reserveeType = watch("reserveeType");

  const requireHandling = reservationUnit.requireReservationHandling || reservation?.applyingForFreeOfCharge;

  const steps = useMemo(() => {
    if (reservationUnit == null) {
      return [];
    }
    const isUnitFreeOfCharge = isReservationUnitFreeOfCharge(reservationUnit.pricings, new Date(reservation.beginsAt));

    const stepLength = isUnitFreeOfCharge || requireHandling ? 2 : 5;

    return Array.from({ length: stepLength }).map((_n, i) => {
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
          pk: reservation.pk,
        },
      },
    });
  }, [deleteReservation, reservation?.pk]);

  // whitelist to allow language change and confirmation
  const whitelist = [
    new RegExp(`.*/reservations/${reservation?.pk}\\?.+`),
    new RegExp(`.*/reservation-unit/${reservationUnit?.pk}/reservation/${reservation?.pk}`),
  ];
  // only block nextjs navigation (we should not have any <a> links and we don't want to block refresh)
  useConfirmNavigation({
    confirm: true,
    confirmMessage,
    onNavigationConfirmed,
    whitelist,
  });

  const [updateReservation] = useUpdateReservationMutation();
  const [confirmReservation] = useConfirmReservationMutation();

  const { pk: reservationPk } = reservation || {};

  const pageTitle =
    step === 0 ? t("reservationCalendar:heading.newReservation") : t("reservationCalendar:heading.pendingReservation");

  // TODO all this is copy pasta from EditStep1
  const supportedFields = filterNonNullable(reservationUnit?.metadataSet?.supportedFields);

  const displayError = useDisplayError();

  const onSubmitStep0 = async (payload: Inputs): Promise<void> => {
    const {
      // boolean toggles
      applyingForFreeOfCharge,
      freeOfChargeReason,
      showBillingAddress,
      reserveeIsUnregisteredAssociation,
      reserveeIdentifier,
      // ignore on step 0
      spaceTerms,
      resourceTerms,
      ...rest
    } = payload;
    const hasReserveeTypeField = containsField(supportedFields, "reserveeType");
    if (hasReserveeTypeField && !reserveeType) {
      throw new Error("Reservee type is required");
    }
    if (reservationPk == null) {
      throw new Error("Reservation pk is required");
    }

    const input: ReservationUpdateMutation = {
      ...rest,
      // force update to empty -> NA
      reserveeIdentifier:
        !reserveeIsUnregisteredAssociation && reserveeType !== ReserveeType.Individual ? reserveeIdentifier : "",
      applyingForFreeOfCharge,
      freeOfChargeReason: applyingForFreeOfCharge ? freeOfChargeReason : "",
      pk: reservationPk,
    };

    try {
      const { data } = await updateReservation({
        variables: {
          input,
        },
      });
      if (data?.updateReservation?.state === "CANCELLED") {
        router.push(getReservationUnitPath(reservationUnit?.pk));
      } else {
        await refetch();
        setStep(1);
        window.scrollTo(0, 0);
      }
    } catch (err) {
      // TODO: NOT_FOUND at least is non-recoverable so we should redirect to the reservation unit page
      displayError(err);
    }
  };

  const onSubmitStep1 = async (): Promise<void> => {
    try {
      const { data } = await confirmReservation({
        variables: {
          input: {
            pk: reservationPk ?? 0,
          },
        },
      });
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      const { pk, state } = data?.confirmReservation ?? {};
      if (pk == null) {
        errorToast({ text: t("errors:general_error") });
        return;
      }

      if (state === ReservationStateChoice.Confirmed) {
        router.push(getReservationPath(pk, undefined, "confirmed"));
      } else if (state === ReservationStateChoice.RequiresHandling) {
        router.push(getReservationPath(pk, undefined, "requires_handling"));
      } else if (state === ReservationStateChoice.WaitingForPayment) {
        const { paymentOrder } = data?.confirmReservation ?? {};
        const lang = convertLanguageCode(i18n.language);
        const checkoutUrl = getCheckoutUrl(paymentOrder, lang);
        if (!checkoutUrl) {
          throw new Error("No checkout url found");
        }

        router.push(checkoutUrl);
      } else {
        throw new Error("Invalid state");
      }
    } catch (err) {
      // TODO: NOT_FOUND at least is non-recoverable so we should redirect to the reservation unit page
      displayError(err);
    }
  };

  // NOTE: only navigate away from the page if the reservation is cancelled the confirmation hook handles delete
  const cancelReservation = useCallback(() => {
    router.push(getReservationUnitPath(reservationUnit?.pk));
  }, [router, reservationUnit]);

  const generalFields = getGeneralFields({ supportedFields, reservation });
  const shouldDisplayReservationUnitPrice = useMemo(() => {
    switch (step) {
      case 0:
        return reservationUnit?.canApplyFreeOfCharge && generalFields?.includes("applyingForFreeOfCharge");
      case 1:
      default:
        return reservationUnit?.canApplyFreeOfCharge && reservation?.applyingForFreeOfCharge === true;
    }
  }, [step, generalFields, reservation, reservationUnit]);

  const lang = convertLanguageCode(i18n.language);
  const notesWhenReserving = getTranslationSafe(reservationUnit, "notesWhenApplying", lang);

  // TODO hacky should separate the submit handlers and form types
  const onSubmit = (values: Inputs) => {
    if (step === 0) {
      onSubmitStep0(values);
    }
    if (step === 1) {
      onSubmitStep1();
    }
  };

  // it should be Created only here (SSR should have redirected)
  if (reservation.state !== ReservationStateChoice.Created) {
    return <NextError statusCode={404} />;
  }

  return (
    <FormProvider {...form}>
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
        <TitleSection>
          <H1 $noMargin>{pageTitle}</H1>
          {/* TODO what's the logic here?
           * in what case are there more than 2 steps?
           * why do we not show that?
           * TODO why isn't this shown when creating a paid version? I think there was on purpose reason for that? maybe?
           */}
          {steps.length <= 2 && (
            <Stepper
              language={i18n.language}
              selectedStep={step}
              style={{ width: "100%" }}
              onStepClick={(_, index) => setStep(index)}
              steps={steps}
            />
          )}
        </TitleSection>
        <StyledForm onSubmit={handleSubmit(onSubmit)} noValidate>
          {step === 0 && (
            <Step0 reservation={reservation} cancelReservation={cancelReservation} options={props.options} />
          )}
          {step === 1 && (
            <Step1
              reservation={reservation}
              supportedFields={supportedFields}
              options={props.options}
              setStep={setStep}
              requiresPayment={steps.length > 2}
            />
          )}
        </StyledForm>
      </ReservationPageWrapper>
    </FormProvider>
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

  const reservation = getNode(resData);

  // Valid path but no reservation found -> redirect to reservation unit page
  if (reservation?.pk == null) {
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
  }
  // Valid reservation that is not in progress -> redirect to reservation page
  else if (reservation.state !== ReservationStateChoice.Created) {
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

export const RESERVATION_IN_PROGRESS_FRAGMENT = gql`
  fragment ReservationInProgress on ReservationNode {
    id
    pk
    name
    ...MetaFields
    ...ReservationInfoCard
    bufferTimeBefore
    bufferTimeAfter
    calendarUrl
    reservationUnit {
      id
      canApplyFreeOfCharge
      ...CancellationRuleFields
      ...MetadataSets
      ...TermsOfUse
      requireReservationHandling
    }
  }
`;

export const RESERVATION_IN_PROGRESS_QUERY = gql`
  query Reservation($id: ID!) {
    node(id: $id) {
      ... on ReservationNode {
        ...ReservationInProgress
      }
    }
  }
`;

export const UPDATE_RESERVATION = gql`
  mutation UpdateReservation($input: ReservationUpdateMutation!) {
    updateReservation(input: $input) {
      pk
      state
    }
  }
`;

export const CONFIRM_RESERVATION = gql`
  mutation ConfirmReservation($input: ReservationConfirmMutation!) {
    confirmReservation(input: $input) {
      pk
      state
      paymentOrder {
        id
        checkoutUrl
      }
    }
  }
`;

export const DELETE_RESERVATION = gql`
  mutation DeleteReservation($input: ReservationDeleteTentativeMutation!) {
    deleteTentativeReservation(input: $input) {
      pk
    }
  }
`;
