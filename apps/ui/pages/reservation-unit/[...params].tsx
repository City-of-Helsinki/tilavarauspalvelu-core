import React, { useCallback, useMemo, useState } from "react";
import styled from "styled-components";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";
import { Stepper } from "hds-react";
import { FormProvider, useForm } from "react-hook-form";
import type { GetServerSidePropsContext } from "next";
import { useTranslation } from "next-i18next";
import { breakpoints } from "common/src/common/style";
import { H1, H4 } from "common/src/common/typography";
import {
  useConfirmReservationMutation,
  useUpdateReservationMutation,
  useDeleteReservationMutation,
  type ReservationQuery,
  ReservationDocument,
  type ReservationQueryVariables,
  useReservationLazyQuery,
  ReservationStateChoice,
} from "@gql/gql-types";
import { type Inputs } from "common/src/reservation-form/types";
import { createApolloClient } from "@/modules/apolloClient";
import { default as NextError } from "next/error";
import {
  getReservationPath,
  getReservationUnitPath,
  getSingleSearchPath,
} from "@/modules/urls";
import { Sanitize } from "common/src/components/Sanitize";
import { isReservationUnitFreeOfCharge } from "@/modules/reservationUnit";
import { getCheckoutUrl } from "@/modules/reservation";
import { ReservationInfoCard } from "@/components/reservation/ReservationInfoCard";
import { Step0 } from "@/components/reservation/Step0";
import { Step1 } from "@/components/reservation/Step1";
import { ReservationStep } from "@/modules/types";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { useConfirmNavigation } from "@/hooks/useConfirmNavigation";
import { base64encode, filterNonNullable, toNumber } from "common/src/helpers";
import { containsField } from "common/src/metaFieldsHelpers";
import { errorToast } from "common/src/common/toast";
import { getGeneralFields } from "@/components/reservation/SummaryFields";
import { queryOptions } from "@/modules/queryOptions";
import {
  convertLanguageCode,
  getTranslationSafe,
} from "common/src/common/util";
import { gql } from "@apollo/client";
import { PinkBox as PinkBoxBase } from "@/components/reservation/styles";
import { Flex } from "common/styles/util";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { ReservationPageWrapper } from "@/styled/reservation";
import { useDisplayError } from "@/hooks/useDisplayError";
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

  const { options } = props;

  const [refetch, { data: resData }] = useReservationLazyQuery({
    variables: { id: props.reservation.id },
    fetchPolicy: "no-cache",
  });

  const reservation = resData?.reservation ?? props.reservation;
  const reservationUnit = reservation?.reservationUnits?.find(() => true);

  useRemoveStoredReservation();

  const [step, setStep] = useState(0);

  // Get prefilled profile user fields from the reservation (backend fills them when created).
  // NOTE Using pick makes the types way too complex; easier to just define the fields here.
  const defaultValues = {
    reserveeFirstName: reservation?.reserveeFirstName ?? "",
    reserveeLastName: reservation?.reserveeLastName ?? "",
    reserveePhone: reservation?.reserveePhone ?? "",
    reserveeEmail: reservation?.reserveeEmail ?? "",
    reserveeAddressStreet: reservation?.reserveeAddressStreet ?? "",
    reserveeAddressCity: reservation?.reserveeAddressCity ?? "",
    reserveeAddressZip: reservation?.reserveeAddressZip ?? "",
    // TODO is this correct? it used to just pick the homeCity (but that makes no sense since it's typed as a number)
    // no it's not correct, the types and MetaFields are based on a number but the front sets it as { label: string, value: number }
    // requires typing the useFormContext properly and refactoring all setters.
    homeCity: reservation?.homeCity?.pk ?? undefined,
  };
  // TODO is defaultValues correct? it's prefilled from the profile data and we are not refetching at any point.
  // If we would refetch values would be more correct with reset hook.
  // Also if this is ever initialised without the data it will not prefill the form.
  const form = useForm<Inputs>({ defaultValues, mode: "onChange" });
  const { handleSubmit, watch } = form;

  const reserveeType = watch("reserveeType");

  const requireHandling =
    reservationUnit?.requireReservationHandling ||
    reservation?.applyingForFreeOfCharge;

  const steps: ReservationStep[] = useMemo(() => {
    if (reservationUnit == null) {
      return [];
    }
    const isUnitFreeOfCharge = isReservationUnitFreeOfCharge(
      reservationUnit.pricings,
      new Date(reservation.begin)
    );

    const stepLength = isUnitFreeOfCharge || requireHandling ? 2 : 5;

    return Array.from(Array(stepLength)).map((_n, i) => {
      const state = i === step ? 0 : i < step ? 1 : 2;

      return {
        label: `${i + 1}. ${t(`reservations:steps.${i + 1}`)}`,
        state,
      };
    });
  }, [step, requireHandling, reservationUnit, reservation, t]);

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
    deleteReservation({
      variables: {
        input: {
          pk: reservation?.pk?.toString() ?? "",
        },
      },
    });
  }, [deleteReservation, reservation?.pk]);

  // whitelist to allow language change and confirmation
  const whitelist = [
    RegExp(`.*/reservations/${reservation?.pk}/confirmation`),
    RegExp(
      `.*/reservation-unit/${reservationUnit?.pk}/reservation/${reservation?.pk}`
    ),
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
    step === 0
      ? t("reservationCalendar:heading.newReservation")
      : t("reservationCalendar:heading.pendingReservation");

  // TODO all this is copy pasta from EditStep1
  const supportedFields = filterNonNullable(
    reservationUnit?.metadataSet?.supportedFields
  );

  const displayError = useDisplayError();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO: type the form
  const onSubmitStep0 = async (payload: any): Promise<void> => {
    const hasReserveeTypeField = containsField(supportedFields, "reserveeType");
    if (hasReserveeTypeField && !reserveeType) {
      throw new Error("Reservee type is required");
    }

    // TODO what is the purpose of this?
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO: type the form
    const input = Object.keys(payload).reduce<any>((acc, key) => {
      if (key === "showBillingAddress") {
        return acc;
      }
      acc[key] = {}.propertyIsEnumerable.call(payload[key] || {}, "value")
        ? payload[key].value
        : payload[key];
      return acc;
    }, {});

    try {
      const { data } = await updateReservation({
        variables: {
          input: {
            pk: reservationPk ?? 0,
            ...input,
          },
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

      if (
        state === ReservationStateChoice.Confirmed ||
        state === ReservationStateChoice.RequiresHandling
      ) {
        router.push(getReservationPath(pk, "confirmation"));
      } else if (state === ReservationStateChoice.WaitingForPayment) {
        const { order } = data?.confirmReservation ?? {};
        const checkoutUrl = getCheckoutUrl(order, i18n.language);
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
  }, [router, reservationUnit?.pk]);

  const generalFields = getGeneralFields({ supportedFields, reservation });
  const shouldDisplayReservationUnitPrice = useMemo(() => {
    switch (step) {
      case 0:
        return (
          reservationUnit?.canApplyFreeOfCharge &&
          generalFields?.includes("applyingForFreeOfCharge")
        );
      case 1:
      default:
        return (
          reservationUnit?.canApplyFreeOfCharge &&
          reservation?.applyingForFreeOfCharge === true
        );
    }
  }, [step, generalFields, reservation, reservationUnit]);

  const lang = convertLanguageCode(i18n.language);
  const termsOfUse =
    reservationUnit != null
      ? getTranslationSafe(reservationUnit, "termsOfUse", lang)
      : "";

  // TODO rework so we submit the form values here
  const onSubmit = (values: unknown) => {
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
        {termsOfUse && (
          <PinkBox>
            <H4 as="h2" $marginTop="none">
              {t("reservations:reservationInfoBoxHeading")}
            </H4>
            <Sanitize html={termsOfUse} />
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
            <Step0
              reservation={reservation}
              cancelReservation={cancelReservation}
              options={options}
            />
          )}
          {step === 1 && (
            <Step1
              reservation={reservation}
              supportedFields={supportedFields}
              options={options}
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
  const reservationUnit = reservation?.reservationUnits?.find(() => true);
  const reservationUnitName = reservationUnit
    ? getTranslationSafe(reservationUnit, "name", lang)
    : "";
  const routes = [
    {
      slug: getSingleSearchPath(),
      title: t("breadcrumb:search"),
    },
    {
      slug: getReservationUnitPath(reservationUnit?.pk),
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
  const [_, path, reservationPk] = params?.params ?? [];
  const commonProps = getCommonServerSideProps();
  const apolloClient = createApolloClient(commonProps.apiBaseUrl, ctx);

  const resPk = toNumber(reservationPk);
  if (resPk != null && resPk > 0 && path === "reservation") {
    const options = await queryOptions(apolloClient, locale ?? "");

    const { data: resData } = await apolloClient.query<
      ReservationQuery,
      ReservationQueryVariables
    >({
      query: ReservationDocument,
      variables: { id: base64encode(`ReservationNode:${resPk}`) },
      fetchPolicy: "no-cache",
    });

    const { reservation } = resData;

    if (
      reservation?.pk != null &&
      reservation.pk > 0 &&
      reservation?.state !== ReservationStateChoice.Created
    ) {
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

    if (reservation != null) {
      return {
        props: {
          ...commonProps,
          reservation,
          options,
          ...(await serverSideTranslations(locale ?? "fi")),
        },
      };
    }
  }

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

export const RESERVATION_IN_PROGRESS_QUERY = gql`
  query Reservation($id: ID!) {
    reservation(id: $id) {
      id
      pk
      name
      ...MetaFields
      ...ReservationInfoCard
      bufferTimeBefore
      bufferTimeAfter
      calendarUrl
      paymentOrder {
        ...OrderFields
      }
      reservationUnits {
        id
        canApplyFreeOfCharge
        ...CancellationRuleFields
        ...MetadataSets
        ...TermsOfUse
        requireReservationHandling
      }
    }
  }
`;
