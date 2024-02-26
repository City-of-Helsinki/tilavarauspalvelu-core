import React, { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useMutation, useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import { useLocalStorage } from "react-use";
import { Stepper } from "hds-react";
import { FormProvider, useForm } from "react-hook-form";
import type { GetServerSidePropsContext } from "next";
import { omit } from "lodash";
import { useTranslation } from "next-i18next";
import { breakpoints } from "common/src/common/style";
import { fontRegular, H2 } from "common/src/common/typography";
import {
  Query,
  QueryReservationUnitByPkArgs,
  QueryTermsOfUseArgs,
  QueryReservationByPkArgs,
  ReservationConfirmMutationInput,
  ReservationConfirmMutationPayload,
  ReservationDeleteMutationInput,
  ReservationDeleteMutationPayload,
  ReservationsReservationReserveeTypeChoices,
  ReservationType,
  ReservationUpdateMutationInput,
  ReservationUpdateMutationPayload,
  TermsOfUseTermsOfUseTermsTypeChoices,
  ReservationsReservationStateChoices,
} from "common/types/gql-types";
import { Inputs } from "common/src/reservation-form/types";
import { Subheading } from "common/src/reservation-form/styles";
import { getReservationApplicationFields } from "common/src/reservation-form/util";
import { Container } from "common";
import { createApolloClient } from "@/modules/apolloClient";
import {
  isBrowser,
  reservationUnitPath,
  reservationUnitPrefix,
} from "@/modules/const";
import {
  getTranslation,
  printErrorMessages,
  reservationsUrl,
} from "@/modules/util";
import {
  RESERVATION_UNIT,
  TERMS_OF_USE,
} from "@/modules/queries/reservationUnit";
import {
  CONFIRM_RESERVATION,
  DELETE_RESERVATION,
  GET_RESERVATION,
  UPDATE_RESERVATION,
} from "@/modules/queries/reservation";
import Sanitize from "@/components/common/Sanitize";
import { getReservationUnitPrice } from "@/modules/reservationUnit";
import {
  getCheckoutUrl,
  getReservationApplicationMutationValues,
} from "@/modules/reservation";
import { ReservationProps } from "@/context/DataContext";
import ReservationInfoCard from "@/components/reservation/ReservationInfoCard";
import Step0 from "@/components/reservation/Step0";
import Step1 from "@/components/reservation/Step1";
import { ReservationStep } from "@/modules/types";
import { JustForDesktop } from "@/modules/style/layout";
import { PinkBox } from "@/components/reservation-unit/ReservationUnitStyles";
import { Toast } from "@/styles/util";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { filterNonNullable } from "common/src/helpers";
import { OPTIONS_QUERY } from "@/hooks/useOptions";

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];
type PropsNarrowed = Exclude<Props, { notFound: boolean }>;

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const { locale, params } = ctx;
  const [reservationUnitPk, path, reservationPk] = params?.params ?? [];
  const commonProps = getCommonServerSideProps();
  const apolloClient = createApolloClient(commonProps.apiBaseUrl, ctx);

  if (Number.isFinite(Number(reservationUnitPk)) && path === "reservation") {
    const { data: reservationUnitData } = await apolloClient.query<
      Query,
      QueryReservationUnitByPkArgs
    >({
      query: RESERVATION_UNIT,
      variables: { pk: Number(reservationUnitPk) },
      fetchPolicy: "no-cache",
    });

    const { data: genericTermsData } = await apolloClient.query<
      Query,
      QueryTermsOfUseArgs
    >({
      query: TERMS_OF_USE,
      fetchPolicy: "no-cache",
      variables: {
        termsType: TermsOfUseTermsOfUseTermsTypeChoices.GenericTerms,
      },
    });
    const genericTerms =
      genericTermsData.termsOfUse?.edges
        ?.map((n) => n?.node)
        .find((n) => n?.pk === "booking") ?? null;

    const { data: paramsData } = await apolloClient.query<Query>({
      query: OPTIONS_QUERY,
      fetchPolicy: "no-cache",
    });

    const reservationPurposes = filterNonNullable(
      paramsData.reservationPurposes?.edges?.map((e) => e?.node)
    );
    const ageGroups = filterNonNullable(
      paramsData.ageGroups?.edges?.map((e) => e?.node)
    );
    const cities = filterNonNullable(
      paramsData.cities?.edges?.map((e) => e?.node)
    );

    return {
      props: {
        ...commonProps,
        key: `${reservationUnitPk}${locale}`,
        reservationUnit: reservationUnitData.reservationUnitByPk ?? null,
        // TODO check for NaN
        reservationPk: Number(reservationPk),
        reservationPurposes,
        ageGroups,
        cities,
        termsOfUse: { genericTerms },
        ...(await serverSideTranslations(locale ?? "fi")),
      },
    };
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
};

const StyledContainer = styled(Container)`
  padding-top: var(--spacing-m);

  @media (min-width: ${breakpoints.m}) {
    margin-bottom: var(--spacing-layout-l);
  }
`;

const Columns = styled.div`
  grid-template-columns: 1fr;
  display: grid;
  align-items: flex-start;
  gap: var(--spacing-m);

  @media (min-width: ${breakpoints.m}) {
    & > div:nth-of-type(1) {
      order: 2;
    }

    margin-top: var(--spacing-xl);
    grid-template-columns: 1fr 378px;
  }
`;

const Title = styled(H2).attrs({ as: "h1" })`
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin-top: 0;

  svg {
    color: var(--color-tram);
  }
`;

const BodyContainer = styled.div`
  ${fontRegular}

  a {
    color: var(--color-bus);
  }
`;

const StyledStepper = styled(Stepper)<{ small: boolean }>`
  ${({ small }) => !small && "max-width: 300px;"}
`;

/// We want to get rid of the local storage
/// but there is still code that requires it to be used.
/// Other pages (ex. login + book) get confused if we don't clear it here.
const useRemoveStoredReservation = () => {
  const [storedReservation, , removeStoredReservation] =
    useLocalStorage<ReservationProps>("reservation");

  useEffect(() => {
    if (storedReservation) removeStoredReservation();
  }, [storedReservation, removeStoredReservation]);
};

const ReservationUnitReservationWithReservationProp = ({
  fetchedReservation,
  reservationUnit,
  reservationPurposes,
  ageGroups,
  cities,
  termsOfUse,
}: PropsNarrowed & {
  fetchedReservation: ReservationType;
}): JSX.Element | null => {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  useRemoveStoredReservation();

  const [step, setStep] = useState(0);
  const [reservation, setReservation] =
    useState<ReservationType>(fetchedReservation);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
    homeCity: reservation?.homeCity?.pk ?? 0,
  };
  // TODO don't use defaultValues, use values (and reset on fetch) from the form
  const form = useForm<Inputs>({ defaultValues, mode: "onBlur" });
  const { handleSubmit, watch } = form;

  const reserveeType = watch("reserveeType");

  const requireHandling =
    reservationUnit?.requireReservationHandling ||
    reservation?.applyingForFreeOfCharge;

  const steps: ReservationStep[] = useMemo(() => {
    const price = getReservationUnitPrice({
      reservationUnit,
      pricingDate: reservation?.begin
        ? new Date(reservation?.begin)
        : undefined,
      asInt: true,
    });

    const stepLength = price === "0" || requireHandling ? 2 : 5;

    return Array.from(Array(stepLength)).map((_n, i) => {
      const state = i === step ? 0 : i < step ? 1 : 2;

      return {
        label: `${i + 1}. ${t(`reservations:steps.${i + 1}`)}`,
        state,
      };
    });
  }, [step, requireHandling, reservationUnit, reservation, t]);

  const [deleteReservation] = useMutation<
    { deleteReservation: ReservationDeleteMutationPayload },
    { input: ReservationDeleteMutationInput }
  >(DELETE_RESERVATION, {
    errorPolicy: "all",
    onCompleted: () => {
      router.push(`${reservationUnitPrefix}/${reservationUnit?.pk}`);
    },
    onError: () => {
      router.push(`${reservationUnitPrefix}/${reservationUnit?.pk}`);
    },
  });

  const [updateReservation] = useMutation<
    { updateReservation: ReservationUpdateMutationPayload },
    { input: ReservationUpdateMutationInput }
  >(UPDATE_RESERVATION, {
    errorPolicy: "all",
    onCompleted: (data) => {
      if (data.updateReservation?.reservation?.state === "CANCELLED") {
        router.push(`${reservationUnitPrefix}/${reservationUnit?.pk}`);
      } else {
        const payload = {
          ...omit(data.updateReservation.reservation, "__typename"),
          purpose: data.updateReservation.reservation?.purpose?.pk,
          ageGroup: data.updateReservation.reservation?.ageGroup?.pk,
          homeCity: data.updateReservation.reservation?.homeCity?.pk,
          showBillingAddress: watch("showBillingAddress"),
        };
        // ???
        if (reservation == null) {
          return;
        }
        const { calendarUrl } = data.updateReservation?.reservation ?? {};
        // TODO cache updates are not a good idea, just do an old fashioned refetch
        // especially if we router push a new url and load another page we don't even need to refetch
        // @ts-expect-error: TODO: the types for reservation are wrong (old rest types)
        setReservation({
          ...reservation,
          ...payload,
          calendarUrl,
        });
        setStep(1);
        window.scrollTo(0, 0);
      }
    },
    onError: (error) => {
      const msg = printErrorMessages(error);
      setErrorMsg(msg);
    },
  });

  const [confirmReservation] = useMutation<
    { confirmReservation: ReservationConfirmMutationPayload },
    { input: ReservationConfirmMutationInput }
  >(CONFIRM_RESERVATION, {
    onCompleted: (data) => {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      const { pk, state } = data.confirmReservation;
      if (pk == null) {
        setErrorMsg(t("errors:general_error"));
        return;
      }
      if (
        state === ReservationsReservationStateChoices.Confirmed ||
        state === ReservationsReservationStateChoices.RequiresHandling
      ) {
        router.push(`${reservationsUrl}${pk}/confirmation`);
      } else if (steps?.length > 2) {
        const order = data.confirmReservation?.order;
        const checkoutUrl = getCheckoutUrl(order ?? undefined, i18n.language);

        if (checkoutUrl) {
          router.push(checkoutUrl);
        } else {
          // eslint-disable-next-line no-console
          console.warn("No checkout url found");
          setErrorMsg(t("errors:general_error"));
        }
      } else {
        // eslint-disable-next-line no-console
        console.warn("Confirm reservation mutation returning something odd");
        setErrorMsg(t("errors:general_error"));
      }
    },
    onError: (error) => {
      const msg = printErrorMessages(error);
      setErrorMsg(msg);
    },
  });

  const { pk: reservationPk } = reservation || {};
  if (!ageGroups || ageGroups.length < 1) {
    // eslint-disable-next-line no-console
    console.warn("No ageGroups received!");
  }

  // TODO why isn't this on the SSR side?
  const sortedAgeGroups = ageGroups.sort((a, b) => a.minimum - b.minimum);
  const options = useMemo(
    () => ({
      purpose: reservationPurposes.map((purpose) => ({
        label: getTranslation(purpose, "name"),
        value: purpose.pk ?? 0,
      })),
      // the sortedAgeGroups array has "1 - 99" as the first element, so let's move it to the end for correct order
      ageGroup: [
        ...sortedAgeGroups.slice(1),
        ...sortedAgeGroups.slice(0, 1),
      ].map((ageGroup) => ({
        label: `${ageGroup.minimum} - ${ageGroup.maximum ?? ""}`,
        value: ageGroup.pk ?? 0,
      })),
      homeCity: cities.map((city) => ({
        label: getTranslation(city, "name"),
        value: city.pk ?? 0,
      })),
    }),
    [reservationPurposes, cities, sortedAgeGroups]
  );

  const pageTitle =
    step === 0
      ? t("reservationCalendar:heading.newReservation")
      : t("reservationCalendar:heading.pendingReservation");

  // TODO all this is copy pasta from EditStep1
  const supportedFields = filterNonNullable(
    reservationUnit?.metadataSet?.supportedFields
  );
  const generalFields = getReservationApplicationFields({
    supportedFields,
    reserveeType: "common",
  }).filter((n) => n !== "reserveeType");

  const type = supportedFields.includes("reservee_type")
    ? reserveeType
    : ReservationsReservationReserveeTypeChoices.Individual;
  const reservationApplicationFields = getReservationApplicationFields({
    supportedFields,
    reserveeType: type,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO: type the form
  const onSubmitStep0 = (payload: any): Promise<void> => {
    if (supportedFields.includes("reservee_type") && !reserveeType) {
      return Promise.resolve();
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO: type the form
    const normalizedPayload = Object.keys(payload).reduce<any>((acc, key) => {
      if (["showBillingAddress"].includes(key)) {
        return acc;
      }
      acc[key] = {}.propertyIsEnumerable.call(payload[key] || {}, "value")
        ? payload[key].value
        : payload[key];
      return acc;
    }, {});

    const input = getReservationApplicationMutationValues(
      normalizedPayload,
      supportedFields,
      supportedFields.includes("reservee_type")
        ? reserveeType
        : ReservationsReservationReserveeTypeChoices.Individual
    );

    return updateReservation({
      variables: {
        input: {
          pk: reservationPk ?? 0,
          ...input,
          reserveeLanguage: i18n.language,
        },
      },
    }).then(() => {
      return Promise.resolve();
    });
  };

  const onSubmitStep1 = (): Promise<void> => {
    return confirmReservation({
      variables: {
        input: {
          pk: reservationPk ?? 0,
        },
      },
    }).then(() => {
      return Promise.resolve();
    });
  };

  const cancelReservation = useCallback(async () => {
    await deleteReservation({
      variables: {
        input: {
          pk: reservationPk ?? 0,
        },
      },
    });
  }, [deleteReservation, reservationPk]);

  useEffect(() => {
    router.beforePopState(({ as }) => {
      if (
        reservationUnit?.pk != null &&
        as === reservationUnitPath(reservationUnit.pk)
      ) {
        cancelReservation();
      }
      return true;
    });

    return () => {
      router.beforePopState(() => true);
    };
  }, [router, reservationUnit?.pk, cancelReservation]);

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

  const termsOfUseContent =
    reservationUnit != null
      ? getTranslation(reservationUnit, "termsOfUse")
      : null;

  if (!isBrowser) {
    return null;
  }

  return (
    <StyledContainer>
      <Columns>
        {reservation != null && (
          <div>
            <ReservationInfoCard
              reservation={reservation}
              reservationUnit={reservationUnit}
              type="pending"
              shouldDisplayReservationUnitPrice={
                shouldDisplayReservationUnitPrice
              }
            />
            {termsOfUseContent && (
              <JustForDesktop>
                <PinkBox>
                  <Subheading>
                    {t("reservations:reservationInfoBoxHeading")}
                  </Subheading>
                  <Sanitize html={termsOfUseContent} />
                </PinkBox>
              </JustForDesktop>
            )}
          </div>
        )}
        <BodyContainer>
          <FormProvider {...form}>
            <div>
              <Title>{pageTitle}</Title>
              {/* TODO what's the logic here?
               * in what case are there more than 2 steps?
               * why do we not show that?
               * TODO why isn't this shown when creating a paid version? I think there was on purpose reason for that? maybe?
               */}
              {steps.length <= 2 && (
                <StyledStepper
                  language={i18n.language}
                  selectedStep={step}
                  small={false}
                  onStepClick={(e) => {
                    const target = e.currentTarget;
                    const s = target
                      .getAttribute("data-testid")
                      ?.replace("hds-stepper-step-", "");
                    if (s) {
                      setStep(parseInt(s, 10));
                    }
                  }}
                  steps={steps}
                />
              )}
            </div>
            {step === 0 && reservationUnit != null && (
              <Step0
                reservationUnit={reservationUnit}
                handleSubmit={handleSubmit(onSubmitStep0)}
                generalFields={generalFields}
                reservationApplicationFields={reservationApplicationFields}
                cancelReservation={cancelReservation}
                options={options}
              />
            )}
            {step === 1 && reservation != null && reservationUnit != null && (
              <Step1
                reservation={reservation}
                reservationUnit={reservationUnit}
                handleSubmit={handleSubmit(onSubmitStep1)}
                generalFields={generalFields}
                reservationApplicationFields={reservationApplicationFields}
                options={options}
                reserveeType={reserveeType}
                // TODO this is correct but confusing.
                // There used to be 5 steps for payed reservations but the stepper is hidden for them now.
                requiresHandling={steps.length > 2}
                setStep={setStep}
                genericTerms={termsOfUse.genericTerms}
              />
            )}
          </FormProvider>
        </BodyContainer>
      </Columns>
      {errorMsg && (
        <Toast
          type="error"
          label={t("reservationUnit:reservationUpdateFailed")}
          position="top-center"
          autoClose
          autoCloseDuration={4000}
          displayAutoCloseProgress={false}
          onClose={() => setErrorMsg(null)}
          dismissible
          closeButtonLabelText={t("common:error.closeErrorMsg")}
        >
          {errorMsg}
        </Toast>
      )}
    </StyledContainer>
  );
};

// TODO this is wrong. Use getServerSideProps and export the Page component directly without this wrapper
const ReservationUnitReservation = (props: PropsNarrowed) => {
  const { reservationPk } = props;

  // TODO show an error if this fails
  // TODO show an error if the pk is not a number
  const { data, loading } = useQuery<Query, QueryReservationByPkArgs>(
    GET_RESERVATION,
    {
      variables: { pk: reservationPk },
      skip: !reservationPk || !Number.isInteger(reservationPk),
      onError: () => {},
    }
  );

  // TODO errors vs loading
  if (loading || !data?.reservationByPk?.pk) {
    return null;
  }

  const { reservationByPk } = data;

  return (
    <ReservationUnitReservationWithReservationProp
      {...props}
      fetchedReservation={reservationByPk}
    />
  );
};

export default ReservationUnitReservation;
