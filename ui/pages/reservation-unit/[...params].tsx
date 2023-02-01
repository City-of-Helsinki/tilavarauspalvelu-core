import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import styled from "styled-components";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useMutation, useQuery } from "@apollo/client";
import router from "next/router";
import { useLocalStorage, useSessionStorage } from "react-use";
import { Notification, Stepper } from "hds-react";
import { useForm } from "react-hook-form";
import { GetServerSideProps } from "next";
import { isFinite, omit } from "lodash";
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
} from "common/types/gql-types";
import { Inputs, Reservation } from "common/src/reservation-form/types";
import { Subheading } from "common/src/reservation-form/styles";
import { getReservationApplicationFields } from "common/src/reservation-form/util";
import apolloClient from "../../modules/apolloClient";
import { isBrowser, reservationUnitPrefix } from "../../modules/const";
import { getTranslation, printErrorMessages } from "../../modules/util";
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
import { getReservationApplicationMutationValues } from "../../modules/reservation";
import { AGE_GROUPS, RESERVATION_PURPOSES } from "../../modules/queries/params";
import { DataContext, ReservationProps } from "../../context/DataContext";
import Container from "../../components/common/Container";
import ReservationInfoCard from "../../components/reservation/ReservationInfoCard";
import ReservationConfirmation from "../../components/reservation/ReservationConfirmation";
import Step0 from "../../components/reservation/Step0";
import Step1 from "../../components/reservation/Step1";
import { ReservationStep } from "../../modules/types";

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
      variables: {
        termsType: "generic_terms",
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
        });
        ageGroups = ageGroupsData.ageGroups.edges?.map((edge) => edge.node);

        const { data: citiesData } = await apolloClient.query<
          Query,
          QueryCitiesArgs
        >({
          query: GET_CITIES,
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

const PinkBox = styled.div<{ $isHiddenOnMobile: boolean }>`
  margin-top: var(--spacing-m);
  padding: 1px var(--spacing-m) var(--spacing-m);
  background-color: var(--color-suomenlinna-light);
  line-height: var(--lineheight-l);

  p {
    &:last-of-type {
      margin-bottom: 0;
    }

    margin-bottom: var(--spacing-s);
  }

  ${Subheading} {
    margin-top: var(--spacing-m);
  }

  @media (max-width: ${breakpoints.m}) {
    display: ${({ $isHiddenOnMobile }) =>
      $isHiddenOnMobile ? "none" : "block"};
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

  const { setReservation: setDataContext } = useContext(DataContext);

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

  useEffect(() => () => setDataContext(null), [setDataContext]);

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
    setDataContext,
    setPendingReservation,
  ]);

  const [
    deleteReservation,
    { data: deleteData, loading: deleteLoading, error: deleteError },
  ] = useMutation<
    { deleteReservation: ReservationDeleteMutationPayload },
    { input: ReservationDeleteMutationInput }
  >(DELETE_RESERVATION, {
    errorPolicy: "all",
  });

  const [
    updateReservation,
    { data: updateData, loading: updateLoading, error: updateError },
  ] = useMutation<
    { updateReservation: ReservationUpdateMutationPayload },
    { input: ReservationUpdateMutationInput }
  >(UPDATE_RESERVATION, {
    errorPolicy: "all",
  });

  const [
    confirmReservation,
    { data: confirmData, loading: confirmLoading, error: confirmError },
  ] = useMutation<
    { confirmReservation: ReservationConfirmMutationPayload },
    { input: ReservationConfirmMutationInput }
  >(CONFIRM_RESERVATION);

  useEffect(() => {
    if (!deleteLoading) {
      if (deleteError) {
        setDataContext(null);
        setPendingReservation(null);
        router.push(`${reservationUnitPrefix}/${reservationUnit.pk}`);
      } else if (deleteData) {
        setDataContext(null);
        setPendingReservation(null);
        router.push(`${reservationUnitPrefix}/${reservationUnit.pk}`);
      }
    }
  }, [
    deleteLoading,
    deleteError,
    deleteData,
    reservationUnit.pk,
    setDataContext,
    setPendingReservation,
    t,
  ]);

  useEffect(() => {
    if (!updateLoading) {
      if (updateError) {
        const msg = printErrorMessages(updateError);
        setErrorMsg(msg);
      } else if (updateData) {
        if (updateData.updateReservation?.reservation?.state === "CANCELLED") {
          setDataContext(null);
          setPendingReservation(null);
          router.push(`${reservationUnitPrefix}/${reservationUnit.pk}`);
        } else {
          const payload = {
            ...omit(updateData.updateReservation.reservation, "__typename"),
            purpose: updateData.updateReservation.reservation.purpose?.pk,
            ageGroup: updateData.updateReservation.reservation.ageGroup?.pk,
            homeCity: updateData.updateReservation.reservation.homeCity?.pk,
            showBillingAddress: watch("showBillingAddress"),
          };
          setReservation({
            ...reservation,
            ...payload,
            calendarUrl: updateData.updateReservation?.reservation?.calendarUrl,
          });
          setStep(1);
          window.scrollTo(0, 0);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateData, updateLoading, updateError]);

  const steps: ReservationStep[] = useMemo(() => {
    const price = getReservationUnitPrice({
      reservationUnit: reservationUnit as unknown as ReservationUnitByPkType,
      pricingDate: new Date(reservation?.begin),
      asInt: true,
    });

    const stepLength = price === "0" ? 2 : 5;

    return Array.from(Array(stepLength)).map((n, i) => {
      const state = i === step ? 0 : i < step ? 1 : 2;

      return {
        label: `${i + 1}. ${t(`reservations:steps.${i + 1}`)}`,
        state,
      };
    });
  }, [step, reservationUnit, reservation, t]);

  useEffect(() => {
    if (!confirmLoading) {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });

      if (confirmError) {
        const msg = printErrorMessages(confirmError);
        setErrorMsg(msg);
      } else if (confirmData) {
        if (steps?.length > 2) {
          const order = confirmData.confirmReservation?.order;
          const { checkoutUrl, receiptUrl } = order ?? {};
          const userId = new URL(receiptUrl)?.searchParams?.get("user");

          if (checkoutUrl && receiptUrl && userId) {
            router.push(
              `${confirmData.confirmReservation?.order?.checkoutUrl}/paymentmethod?user=${userId}&lang=${i18n.language}`
            );
          } else {
            const msg = printErrorMessages(confirmError);
            setErrorMsg(msg);
          }
        } else {
          setReservation({
            ...reservation,
            state: "CONFIRMED",
          });
          setFormStatus("sent");
          setStep(2);
          setPendingReservation(null);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmData, confirmLoading, confirmError]);

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

  const onSubmitApplication1 = useCallback(
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

  const onSubmitOpen2 = () => {
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
            <PinkBox $isHiddenOnMobile={step > 0}>
              <Subheading>
                {t("reservations:reservationInfoBoxHeading")}
              </Subheading>
              <Sanitize html={getTranslation(reservationUnit, "termsOfUse")} />
            </PinkBox>
          </div>
        )}
        <BodyContainer>
          {formStatus === "pending" && (
            <>
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
                  reservation={reservation}
                  reservationUnit={reservationUnit}
                  handleSubmit={handleSubmit(onSubmitApplication1)}
                  generalFields={generalFields}
                  reservationApplicationFields={reservationApplicationFields}
                  reserveeType={reserveeType}
                  setReserveeType={setReserveeType}
                  cancelReservation={cancelReservation}
                  options={options}
                  form={form}
                />
              )}
              {step === 1 && (
                <Step1
                  reservation={reservation}
                  reservationUnit={reservationUnit}
                  handleSubmit={handleSubmit(onSubmitOpen2)}
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
            </>
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
        <Notification
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
        </Notification>
      )}
    </StyledContainer>
  );
};

export default ReservationUnitReservation;
