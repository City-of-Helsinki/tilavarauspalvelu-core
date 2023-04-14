import React, { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useMutation, useQuery } from "@apollo/client";
import router from "next/router";
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
  CityType,
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
  ReservationUnitByPkType,
  ReservationUnitType,
  ReservationUpdateMutationInput,
  ReservationUpdateMutationPayload,
  TermsOfUseType,
  TermsOfUseTermsOfUseTermsTypeChoices,
  ReservationsReservationStateChoices,
} from "common/types/gql-types";
import { Inputs, Reservation } from "common/src/reservation-form/types";
import { Subheading } from "common/src/reservation-form/styles";
import { getReservationApplicationFields } from "common/src/reservation-form/util";
import apolloClient from "../../modules/apolloClient";
import { isBrowser, reservationUnitPrefix } from "../../modules/const";
import { getTranslation } from "../../modules/util";
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
  getReservationApplicationMutationValues,
  profileUserFields,
} from "../../modules/reservation";
import { AGE_GROUPS, RESERVATION_PURPOSES } from "../../modules/queries/params";
import { ReservationProps } from "../../context/DataContext";
import Container from "../../components/common/Container";
import ReservationInfoCard from "../../components/reservation/ReservationInfoCard";
import ReservationConfirmation from "../../components/reservation/ReservationConfirmation";
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
  cities: CityType[];
  termsOfUse: Record<string, TermsOfUseType>;
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const getServerSideProps: GetServerSideProps = async ({
  locale,
  params,
}) => {
  const id = Number(params.params[0]);
  const path = params.params[1];
  let reservationPurposes = [];
  let ageGroups = [];
  let cities = [];

  if (isFinite(id) && path === "reservation") {
    const { data: reservationUnitData } = await apolloClient.query<
      Query,
      QueryReservationUnitByPkArgs
    >({
      query: RESERVATION_UNIT,
      variables: { pk: id },
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
        ?.map((n) => n.node)
        .find((n) => ["generic1"].includes(n.pk)) || {};

    if (reservationUnitData?.reservationUnitByPk) {
      if (reservationUnitData.reservationUnitByPk?.metadataSet) {
        const { data: reservationPurposesData } = await apolloClient.query<
          Query,
          QueryReservationPurposesArgs
        >({
          query: RESERVATION_PURPOSES,
          fetchPolicy: "no-cache",
        });
        reservationPurposes =
          reservationPurposesData.reservationPurposes.edges?.map(
            (edge) => edge.node
          );

        const { data: ageGroupsData } = await apolloClient.query<
          Query,
          QueryAgeGroupsArgs
        >({
          query: AGE_GROUPS,
          fetchPolicy: "no-cache",
        });
        ageGroups = ageGroupsData.ageGroups.edges?.map((edge) => edge.node);

        const { data: citiesData } = await apolloClient.query<
          Query,
          QueryCitiesArgs
        >({
          query: GET_CITIES,
          fetchPolicy: "no-cache",
        });
        cities = citiesData.cities.edges?.map((edge) => edge.node);
      }

      return {
        props: {
          reservationUnit: reservationUnitData.reservationUnitByPk,
          reservationPurposes,
          ageGroups,
          cities,
          termsOfUse: { genericTerms },
          ...(await serverSideTranslations(locale)),
        },
      };
    }

    return {
      notFound: true,
    };
  }

  return {
    notFound: true,
  };
};

const StyledContainer = styled(Container)`
  padding: var(--spacing-m) var(--spacing-m) var(--spacing-layout-m);

  @media (min-width: ${breakpoints.m}) {
    max-width: 1000px;
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
  font-size: 2rem;
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

const ReservationUnitReservation = ({
  reservationUnit,
  reservationPurposes,
  ageGroups,
  cities,
  termsOfUse,
}: Props): JSX.Element => {
  const { t, i18n } = useTranslation();
  const [reservationData, setPendingReservation] = useSessionStorage(
    "pendingReservation",
    null
  );

  const [storedReservation, , removeStoredReservation] =
    useLocalStorage<ReservationProps>("reservation");

  const [formStatus, setFormStatus] = useState<"pending" | "error" | "sent">(
    "pending"
  );
  const [step, setStep] = useState(0);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [reserveeType, setReserveeType] =
    useState<ReservationsReservationReserveeTypeChoices>(null);

  const form = useForm<Inputs>();
  const { handleSubmit, watch } = form;

  const { data: fetchedReservationData } = useQuery<
    Query,
    QueryReservationByPkArgs
  >(GET_RESERVATION, {
    variables: { pk: reservationData?.pk },
    skip: !reservationData?.pk,
  });

  const requireHandling =
    reservationUnit.requireReservationHandling ||
    reservation?.applyingForFreeOfCharge;

  const steps: ReservationStep[] = useMemo(() => {
    const price = getReservationUnitPrice({
      reservationUnit: reservationUnit as unknown as ReservationUnitByPkType,
      pricingDate: new Date(reservation?.begin),
      asInt: true,
    });

    const stepLength = price === "0" || requireHandling ? 2 : 5;

    return Array.from(Array(stepLength)).map((n, i) => {
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

  useEffect(() => {
    const data = fetchedReservationData?.reservationByPk;
    if (data?.pk && reservationUnit.pk) {
      const res: Reservation = {
        ...data,
        pk: data.pk,
        purpose: data.purpose?.pk,
        ageGroup: data.ageGroup?.pk,
        homeCity: data.homeCity?.pk,
        reservationUnitPks: [reservationUnit.pk],
      };
      setReservation(res);
    }
  }, [
    fetchedReservationData?.reservationByPk,
    reservationUnit?.pk,
    setPendingReservation,
  ]);

  const defaultValues = useMemo(() => {
    return reservation !== null ? pick(reservation, profileUserFields) : {};
  }, [reservation]);

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
          purpose: data.updateReservation.reservation.purpose?.pk,
          ageGroup: data.updateReservation.reservation.ageGroup?.pk,
          homeCity: data.updateReservation.reservation.homeCity?.pk,
          showBillingAddress: watch("showBillingAddress"),
        };
        setReservation({
          ...reservation,
          ...payload,
          calendarUrl: data.updateReservation?.reservation?.calendarUrl,
        });
        setStep(1);
        window.scrollTo(0, 0);
      }
    },
    onError: () => {
      const msg = t("errors:general_error");
      setErrorMsg(msg);
    },
  });

  const reservationConfirmSuccess = () => {
    setReservation({
      ...reservation,
      state: requireHandling
        ? ReservationsReservationStateChoices.RequiresHandling
        : ReservationsReservationStateChoices.Confirmed,
    });
    setFormStatus("sent");
    setStep(2);
    setPendingReservation(null);
  };

  const [confirmReservation] = useMutation<
    { confirmReservation: ReservationConfirmMutationPayload },
    { input: ReservationConfirmMutationInput }
  >(CONFIRM_RESERVATION, {
    onCompleted: (data) => {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      if (
        data?.confirmReservation?.state ===
        ReservationsReservationStateChoices.Confirmed
      ) {
        reservationConfirmSuccess();
      } else if (steps?.length > 2) {
        const order = data.confirmReservation?.order;
        const { checkoutUrl, receiptUrl } = order ?? {};
        const { origin, pathname, searchParams } = new URL(checkoutUrl) || {};
        const userId = searchParams?.get("user");

        if (checkoutUrl && receiptUrl && userId && origin && pathname) {
          const baseUrl = `${origin}${pathname}`;
          router.push(
            `${baseUrl}/paymentmethod?user=${userId}&lang=${i18n.language}`
          );
        } else {
          setErrorMsg(t("errors:general_error"));
        }
      } else {
        reservationConfirmSuccess();
      }
    },
    onError: () => {
      const msg = t("errors:general_error");
      setErrorMsg(msg);
    },
  });

  const { pk: reservationPk } = reservation || {};

  const options = useMemo(
    () => ({
      purpose: reservationPurposes.map((purpose) => ({
        label: getTranslation(purpose, "name"),
        value: purpose.pk,
      })),
      ageGroup: ageGroups.map((ageGroup) => ({
        label: `${ageGroup.minimum} - ${ageGroup.maximum}`,
        value: ageGroup.pk,
      })),
      homeCity: cities.map((city) => ({
        label: city.name,
        value: city.pk,
      })),
    }),
    [reservationPurposes, ageGroups, cities]
  );

  const pageTitle = useMemo(() => {
    if (formStatus === "sent") {
      return t("reservationUnit:reservationSuccessful");
    }
    if (step === 0) {
      return t("reservationCalendar:heading.newReservation");
    }
    return t("reservationCalendar:heading.pendingReservation");
  }, [step, formStatus, t]);

  const generalFields = useMemo(() => {
    return getReservationApplicationFields({
      supportedFields: reservationUnit.metadataSet?.supportedFields,
      reserveeType: "common",
      camelCaseOutput: true,
    }).filter((n) => n !== "reserveeType");
  }, [reservationUnit?.metadataSet?.supportedFields]);

  const reservationApplicationFields = useMemo(() => {
    const type = reservationUnit.metadataSet?.supportedFields?.includes(
      "reservee_type"
    )
      ? reserveeType
      : ReservationsReservationReserveeTypeChoices.Individual;

    return getReservationApplicationFields({
      supportedFields: reservationUnit.metadataSet?.supportedFields,
      reserveeType: type,
      camelCaseOutput: true,
    });
  }, [reservationUnit?.metadataSet?.supportedFields, reserveeType]);

  const onSubmitStep0 = useCallback(
    (payload): void => {
      if (
        reservationUnit?.metadataSet?.supportedFields.includes(
          "reservee_type"
        ) &&
        !reserveeType
      ) {
        setErrorMsg(t("reservationApplication:errors.noFormType"));
        return;
      }

      const normalizedPayload = Object.keys(payload).reduce((acc, key) => {
        if (["showBillingAddress"].includes(key)) return acc;
        acc[key] = {}.propertyIsEnumerable.call(payload[key] || {}, "value")
          ? payload[key].value
          : payload[key];
        return acc;
      }, {});

      const input = getReservationApplicationMutationValues(
        normalizedPayload,
        reservationUnit.metadataSet?.supportedFields,
        reservationUnit?.metadataSet?.supportedFields.includes("reservee_type")
          ? reserveeType
          : ReservationsReservationReserveeTypeChoices.Individual
      );

      updateReservation({
        variables: {
          input: {
            pk: reservationPk,
            ...input,
            reserveeLanguage: i18n.language,
          },
        },
      });
    },
    [
      i18n.language,
      reservationPk,
      reservationUnit.metadataSet?.supportedFields,
      reserveeType,
      t,
      updateReservation,
    ]
  );

  const onSubmitStep1 = () => {
    confirmReservation({
      variables: {
        input: {
          pk: reservationPk,
        },
      },
    });
  };

  const cancelReservation = () => {
    deleteReservation({
      variables: {
        input: {
          pk: reservationPk,
        },
      },
    });
    setPendingReservation(null);
  };

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

  return (
    <StyledContainer>
      <Columns>
        {formStatus === "sent" ? (
          <div>
            <ReservationInfoCard
              reservation={reservation as unknown as ReservationType}
              reservationUnit={reservationUnit}
              type="confirmed"
            />
          </div>
        ) : (
          <div>
            <ReservationInfoCard
              reservation={reservation || reservationData}
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
          {formStatus === "pending" && (
            <FormProvider {...form}>
              <div>
                <Title>{pageTitle}</Title>
                <StyledStepper
                  language={i18n.language}
                  selectedStep={step}
                  small={steps.length > 2}
                  onStepClick={(e) => {
                    const target = e.currentTarget;
                    const s = target
                      .getAttribute("data-testid")
                      .replace("hds-stepper-step-", "");
                    setStep(parseInt(s, 10));
                  }}
                  steps={steps}
                />
              </div>
              {step === 0 && (
                <Step0
                  reservationUnit={reservationUnit}
                  handleSubmit={handleSubmit(onSubmitStep0)}
                  generalFields={generalFields}
                  reservationApplicationFields={reservationApplicationFields}
                  reserveeType={reserveeType}
                  setReserveeType={setReserveeType}
                  cancelReservation={cancelReservation}
                  options={options}
                  defaultValues={defaultValues}
                />
              )}
              {step === 1 && (
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
                  setErrorMsg={setErrorMsg}
                />
              )}
            </FormProvider>
          )}
          {formStatus === "sent" && (
            <ReservationConfirmation
              reservation={reservation}
              reservationUnit={reservationUnit}
            />
          )}
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

export default ReservationUnitReservation;
