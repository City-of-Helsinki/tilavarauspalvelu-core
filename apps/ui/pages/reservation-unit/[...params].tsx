import React, { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useMutation, useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import { useLocalStorage, useSessionStorage } from "react-use";
import { Stepper } from "hds-react";
import { FormProvider, useForm } from "react-hook-form";
import { GetServerSideProps } from "next";
import { isFinite, omit, pick } from "lodash";
import { useTranslation } from "next-i18next";
import { breakpoints } from "common/src/common/style";
import { fontRegular, H2 } from "common/src/common/typography";
import {
  AgeGroupType,
  CityNode,
  Query,
  QueryAgeGroupsArgs,
  QueryCitiesArgs,
  QueryReservationPurposesArgs,
  QueryReservationUnitByPkArgs,
  QueryTermsOfUseArgs,
  QueryReservationByPkArgs,
  ReservationConfirmMutationInput,
  ReservationConfirmMutationPayload,
  ReservationDeleteMutationInput,
  ReservationDeleteMutationPayload,
  ReservationPurposeType,
  ReservationsReservationReserveeTypeChoices,
  ReservationType,
  ReservationUnitType,
  ReservationUpdateMutationInput,
  ReservationUpdateMutationPayload,
  TermsOfUseType,
  TermsOfUseTermsOfUseTermsTypeChoices,
  ReservationsReservationStateChoices,
} from "common/types/gql-types";
import { Inputs } from "common/src/reservation-form/types";
import { Subheading } from "common/src/reservation-form/styles";
import { getReservationApplicationFields } from "common/src/reservation-form/util";
import { Container, PendingReservation } from "common";

import { createApolloClient } from "../../modules/apolloClient";
import {
  isBrowser,
  reservationUnitPath,
  reservationUnitPrefix,
} from "../../modules/const";
import {
  getTranslation,
  printErrorMessages,
  reservationsUrl,
} from "../../modules/util";
import {
  RESERVATION_UNIT,
  TERMS_OF_USE,
} from "../../modules/queries/reservationUnit";
import {
  CONFIRM_RESERVATION,
  DELETE_RESERVATION,
  GET_CITIES,
  GET_RESERVATION,
  UPDATE_RESERVATION,
} from "../../modules/queries/reservation";
import Sanitize from "../../components/common/Sanitize";
import { getReservationUnitPrice } from "../../modules/reservationUnit";
import {
  getCheckoutUrl,
  getReservationApplicationMutationValues,
  profileUserFields,
} from "../../modules/reservation";
import { AGE_GROUPS, RESERVATION_PURPOSES } from "../../modules/queries/params";
import { ReservationProps } from "../../context/DataContext";
import ReservationInfoCard from "../../components/reservation/ReservationInfoCard";
import Step0 from "../../components/reservation/Step0";
import Step1 from "../../components/reservation/Step1";
import { ReservationStep } from "../../modules/types";
import { JustForDesktop } from "../../modules/style/layout";
import { PinkBox } from "../../components/reservation-unit/ReservationUnitStyles";
import { Toast } from "../../styles/util";

type Props = {
  reservationUnit: ReservationUnitType;
  reservationPurposes: ReservationPurposeType[];
  ageGroups: AgeGroupType[];
  cities: CityNode[];
  termsOfUse: Record<string, TermsOfUseType>;
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { locale, params } = ctx;
  const reservationUnitPk = Number(params?.params?.[0]);
  const path = params?.params?.[1];
  const apolloClient = createApolloClient(ctx);

  if (isFinite(reservationUnitPk) && path === "reservation") {
    const { data: reservationUnitData } = await apolloClient.query<
      Query,
      QueryReservationUnitByPkArgs
    >({
      query: RESERVATION_UNIT,
      variables: { pk: reservationUnitPk },
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
        .find((n) => n?.pk === "booking") || {};

    const { data: reservationPurposesData } = await apolloClient.query<
      Query,
      QueryReservationPurposesArgs
    >({
      query: RESERVATION_PURPOSES,
      fetchPolicy: "no-cache",
    });

    const reservationPurposes =
      reservationPurposesData.reservationPurposes?.edges?.map(
        (edge) => edge?.node
      ) || [];

    const { data: ageGroupsData } = await apolloClient.query<
      Query,
      QueryAgeGroupsArgs
    >({
      query: AGE_GROUPS,
      fetchPolicy: "no-cache",
    });
    const ageGroups = ageGroupsData.ageGroups?.edges?.map((edge) => edge?.node);

    const { data: citiesData } = await apolloClient.query<
      Query,
      QueryCitiesArgs
    >({
      query: GET_CITIES,
      fetchPolicy: "no-cache",
    });
    const cities = citiesData.cities?.edges?.map((edge) => edge?.node);

    return {
      props: {
        key: `${reservationUnitPk}${locale}`,
        reservationUnit: reservationUnitData.reservationUnitByPk,
        reservationPurposes,
        ageGroups,
        cities,
        termsOfUse: { genericTerms },
        ...(await serverSideTranslations(locale ?? "fi")),
      },
    };
  }

  return {
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

const ReservationUnitReservationWithReservationProp = ({
  fetchedReservation,
  reservationUnit,
  reservationPurposes,
  ageGroups,
  cities,
  termsOfUse,
}: Props & { fetchedReservation: ReservationType }): JSX.Element | null => {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const [reservationData, setPendingReservation] =
    useSessionStorage<PendingReservation | null>("pendingReservation", null);

  const [storedReservation, , removeStoredReservation] =
    useLocalStorage<ReservationProps>("reservation");

  const [step, setStep] = useState(0);
  const [reservation, setReservation] = useState<ReservationType | null>(
    fetchedReservation
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const defaultValues = pick(reservation || {}, profileUserFields);
  const form = useForm<Inputs>({ defaultValues, mode: "onBlur" });
  const { handleSubmit, watch } = form;

  const reserveeType = watch("reserveeType");

  const requireHandling =
    reservationUnit.requireReservationHandling ||
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

  useEffect(() => {
    if (storedReservation) removeStoredReservation();
  }, [storedReservation, removeStoredReservation]);

  const [deleteReservation] = useMutation<
    { deleteReservation: ReservationDeleteMutationPayload },
    { input: ReservationDeleteMutationInput }
  >(DELETE_RESERVATION, {
    errorPolicy: "all",
    onCompleted: () => {
      setPendingReservation(null);
      router.push(`${reservationUnitPrefix}/${reservationUnit.pk}`);
    },
    onError: () => {
      setPendingReservation(null);
      router.push(`${reservationUnitPrefix}/${reservationUnit.pk}`);
    },
  });

  const [updateReservation] = useMutation<
    { updateReservation: ReservationUpdateMutationPayload },
    { input: ReservationUpdateMutationInput }
  >(UPDATE_RESERVATION, {
    errorPolicy: "all",
    onCompleted: (data) => {
      if (data.updateReservation?.reservation?.state === "CANCELLED") {
        setPendingReservation(null);
        router.push(`${reservationUnitPrefix}/${reservationUnit.pk}`);
      } else {
        const payload = {
          ...omit(data.updateReservation.reservation, "__typename"),
          purpose: data.updateReservation.reservation?.purpose?.pk,
          ageGroup: data.updateReservation.reservation?.ageGroup?.pk,
          homeCity: data.updateReservation.reservation?.homeCity?.pk,
          showBillingAddress: watch("showBillingAddress"),
        };
        if (reservation == null) {
          return;
        }
        // @ts-expect-error: TODO: the types for reservation are wrong (old rest types)
        setReservation({
          ...reservation,
          ...payload,
          calendarUrl:
            data.updateReservation?.reservation?.calendarUrl ?? undefined,
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
  if (!ageGroups || ageGroups.length < 1)
    // eslint-disable-next-line no-console
    console.warn("No ageGroups received!");
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

  const pageTitle = useMemo(() => {
    if (step === 0) {
      return t("reservationCalendar:heading.newReservation");
    }
    return t("reservationCalendar:heading.pendingReservation");
  }, [step, t]);

  // TODO all this is copy pasta from EditStep1
  const supportedFields =
    reservationUnit.metadataSet?.supportedFields?.filter(
      (n): n is NonNullable<typeof n> => !!n
    ) ?? [];
  const generalFields = getReservationApplicationFields({
    supportedFields,
    reserveeType: "common",
    camelCaseOutput: true,
  }).filter((n) => n !== "reserveeType");

  const type = supportedFields.includes("reservee_type")
    ? reserveeType
    : ReservationsReservationReserveeTypeChoices.Individual;
  const reservationApplicationFields = getReservationApplicationFields({
    supportedFields,
    reserveeType: type,
    camelCaseOutput: true,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO: type the form
  const onSubmitStep0 = (payload: any): void => {
    if (supportedFields.includes("reservee_type") && !reserveeType) {
      return;
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

    updateReservation({
      variables: {
        input: {
          pk: reservationPk ?? 0,
          ...input,
          reserveeLanguage: i18n.language,
        },
      },
    });
  };

  const onSubmitStep1 = () => {
    confirmReservation({
      variables: {
        input: {
          pk: reservationPk ?? 0,
        },
      },
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
    setPendingReservation(null);
  }, [deleteReservation, reservationPk, setPendingReservation]);

  useEffect(() => {
    router.beforePopState(({ as }) => {
      if (
        reservationUnit.pk != null &&
        as === reservationUnitPath(reservationUnit.pk)
      ) {
        cancelReservation();
      }
      return true;
    });

    return () => {
      router.beforePopState(() => true);
    };
  }, [router, reservationUnit.pk, cancelReservation]);

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

  const termsOfUseContent = getTranslation(reservationUnit, "termsOfUse");

  if (!isBrowser) {
    return null;
  }

  const pendingReservation = reservation || reservationData;
  return (
    <StyledContainer>
      <Columns>
        {pendingReservation != null && (
          <div>
            <ReservationInfoCard
              reservation={pendingReservation}
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
            {step === 0 && (
              <Step0
                reservationUnit={reservationUnit}
                handleSubmit={handleSubmit(onSubmitStep0)}
                generalFields={generalFields}
                reservationApplicationFields={reservationApplicationFields}
                cancelReservation={cancelReservation}
                options={options}
              />
            )}
            {step === 1 && reservation != null && (
              <Step1
                reservation={reservation}
                reservationUnit={reservationUnit}
                handleSubmit={handleSubmit(onSubmitStep1)}
                generalFields={generalFields}
                reservationApplicationFields={reservationApplicationFields}
                options={options}
                reserveeType={reserveeType}
                steps={steps}
                setStep={setStep}
                termsOfUse={termsOfUse}
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
const ReservationUnitReservation = (props: Props) => {
  const [reservationData] = useSessionStorage<PendingReservation | null>(
    "pendingReservation",
    null
  );

  const { data, loading } = useQuery<Query, QueryReservationByPkArgs>(
    GET_RESERVATION,
    {
      variables: { pk: reservationData?.pk },
      skip: !reservationData?.pk,
      onError: () => {},
    }
  );

  if (loading || !data?.reservationByPk?.pk) return null;

  const { reservationByPk } = data;

  return (
    <ReservationUnitReservationWithReservationProp
      {...props}
      fetchedReservation={reservationByPk}
    />
  );
};

export default ReservationUnitReservation;
