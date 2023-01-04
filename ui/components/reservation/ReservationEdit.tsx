import { useLazyQuery, useMutation, useQuery } from "@apollo/client";
import { breakpoints } from "common/src/common/style";
import { H1 } from "common/src/common/typography";
import {
  ApplicationRoundType,
  Query,
  QueryReservationsArgs,
  QueryReservationUnitByPkArgs,
  ReservationAdjustTimeMutationInput,
  ReservationAdjustTimeMutationPayload,
  ReservationsReservationStateChoices,
  ReservationType,
  ReservationUnitByPkType,
  ReservationUnitByPkTypeOpeningHoursArgs,
  ReservationUnitByPkTypeReservationsArgs,
} from "common/types/gql-types";
import { pick } from "lodash";
import { useRouter } from "next/router";
import { LoadingSpinner, Notification, Stepper } from "hds-react";
import { addYears } from "date-fns";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { PendingReservation } from "common/types/common";
import { toApiDate } from "common/src/common/util";
import { Subheading } from "common/src/reservation-form/styles";
import {
  ADJUST_RESERVATION_TIME,
  GET_RESERVATION,
  LIST_RESERVATIONS,
} from "../../modules/queries/reservation";
import { JustForDesktop, JustForMobile } from "../../modules/style/layout";
import { getTranslation } from "../../modules/util";
import Sanitize from "../common/Sanitize";
import ReservationInfoCard from "./ReservationInfoCard";
import { CURRENT_USER } from "../../modules/queries/user";
import {
  RESERVATION_UNIT,
  OPENING_HOURS,
} from "../../modules/queries/reservationUnit";
import Container from "../common/Container";
import {
  mockOpeningTimePeriods,
  mockOpeningTimes,
} from "../../modules/reservationUnit";
import EditStep0 from "./EditStep0";
import EditStep1 from "./EditStep1";
import { reservationsPrefix } from "../../modules/const";
import { APPLICATION_ROUNDS } from "../../modules/queries/applicationRound";

type Props = {
  id: number;
};

const allowedReservationStates: ReservationsReservationStateChoices[] = [
  ReservationsReservationStateChoices.Created,
  ReservationsReservationStateChoices.Confirmed,
  ReservationsReservationStateChoices.RequiresHandling,
  ReservationsReservationStateChoices.WaitingForPayment,
];

const Wrapper = styled.div`
  background-color: var(--color-white);
`;

const Content = styled(Container)`
  display: block;
`;

const Columns = styled.div`
  display: block;

  @media (min-width: ${breakpoints.l}) {
    & > div:nth-of-type(1) {
      order: 2;
    }

    display: grid;
    align-items: flex-start;
    gap: var(--spacing-l);
    margin-top: var(--spacing-xl);
    grid-template-columns: 7fr 390px;
  }
`;

const BylineContent = styled.div`
  max-width: 390px;
`;

const StyledStepper = styled(Stepper)`
  margin: var(--spacing-layout-m) 0 var(--spacing-layout-m);

  @media (min-width: ${breakpoints.m}) {
    max-width: 50%;
  }
`;

const PinkBox = styled.div`
  margin-top: var(--spacing-m);
  padding: 1px var(--spacing-m) var(--spacing-m);
  background-color: var(--color-suomenlinna-light);

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
    display: block;
  }
`;

const ReservationEdit = ({ id }: Props): JSX.Element => {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const [reservation, setReservation] = useState<ReservationType>(null);
  const [reservationUnit, setReservationUnit] =
    useState<ReservationUnitByPkType>(null);
  const [activeApplicationRounds, setActiveApplicationRounds] =
    useState<ApplicationRoundType[]>(null);
  const [step, setStep] = useState(0);

  const [initialReservation, setInitialReservation] =
    useState<PendingReservation | null>(null);
  const [userReservations, setUserReservations] = useState<
    ReservationType[] | null
  >(null);
  const [showSuccessMsg, setShowSuccessMsg] = useState<boolean>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const now = useMemo(() => new Date().toISOString(), []);

  const { data: userData } = useQuery<Query>(CURRENT_USER, {
    fetchPolicy: "no-cache",
  });

  const currentUser = useMemo(() => userData?.currentUser, [userData]);

  useQuery(GET_RESERVATION, {
    fetchPolicy: "no-cache",
    variables: {
      pk: id,
    },
    onCompleted: (data) => {
      setReservation(data.reservationByPk);
    },
  });

  const { data: reservationUnitData } = useQuery<
    Query,
    QueryReservationUnitByPkArgs
  >(RESERVATION_UNIT, {
    fetchPolicy: "no-cache",
    variables: {
      pk: reservation?.reservationUnits[0]?.pk,
    },
    skip: !reservation,
  });

  const [fetchAdditionalData, { data: additionalData }] = useLazyQuery<
    Query,
    QueryReservationUnitByPkArgs &
      ReservationUnitByPkTypeOpeningHoursArgs &
      ReservationUnitByPkTypeReservationsArgs
  >(OPENING_HOURS, {
    fetchPolicy: "no-cache",
  });

  useEffect(() => {
    if (reservationUnitData?.reservationUnitByPk) {
      const { reservationUnitByPk } = reservationUnitData;
      fetchAdditionalData({
        variables: {
          pk: reservationUnitByPk?.pk,
          startDate: toApiDate(new Date(now)),
          endDate: toApiDate(addYears(new Date(), 1)),
          from: toApiDate(new Date(now)),
          to: toApiDate(addYears(new Date(), 1)),
          state: allowedReservationStates,
          includeWithSameComponents: true,
        },
      });
    }
  }, [reservationUnitData, fetchAdditionalData, now]);

  useEffect(() => {
    const allowReservationsWithoutOpeningHours =
      reservationUnitData?.reservationUnitByPk
        ?.allowReservationsWithoutOpeningHours;

    setReservationUnit({
      ...reservationUnitData?.reservationUnitByPk,
      openingHours: {
        ...reservationUnitData?.reservationUnitByPk?.openingHours,
        openingTimePeriods: allowReservationsWithoutOpeningHours
          ? mockOpeningTimePeriods
          : reservationUnitData?.reservationUnitByPk?.openingHours
              ?.openingTimePeriods || [],
        openingTimes: allowReservationsWithoutOpeningHours
          ? mockOpeningTimes
          : additionalData?.reservationUnitByPk?.openingHours?.openingTimes ||
            [],
      },
      reservations: additionalData?.reservationUnitByPk?.reservations,
    });
  }, [additionalData, reservationUnitData?.reservationUnitByPk]);

  const { data: userReservationsData } = useQuery<Query, QueryReservationsArgs>(
    LIST_RESERVATIONS,
    {
      fetchPolicy: "no-cache",
      skip: !currentUser || !reservationUnit,
      variables: {
        begin: now,
        user: currentUser?.pk?.toString(),
        reservationUnit: [reservationUnit?.pk?.toString()],
        state: allowedReservationStates,
      },
    }
  );

  useEffect(() => {
    const reservations = userReservationsData?.reservations?.edges
      ?.map(({ node }) => node)
      .filter((n) => allowedReservationStates.includes(n.state));
    setUserReservations(reservations || []);
  }, [userReservationsData]);

  const { data: applicationRoundsData } = useQuery<Query>(APPLICATION_ROUNDS, {
    fetchPolicy: "no-cache",
  });

  useEffect(() => {
    if (applicationRoundsData && reservationUnit) {
      setActiveApplicationRounds(
        applicationRoundsData.applicationRounds.edges
          .map(({ node }) => node)
          .filter((applicationRound) =>
            applicationRound.reservationUnits
              .map((n) => n.pk)
              .includes(reservationUnit.pk)
          ) || []
      );
    }
  }, [applicationRoundsData, reservationUnit]);

  const [
    adjustReservationTime,
    {
      data: adjustReservationTimeData,
      error: adjustReservationTimeError,
      loading: adjustReservationTimeLoading,
    },
  ] = useMutation<
    { adjustReservationTime: ReservationAdjustTimeMutationPayload },
    { input: ReservationAdjustTimeMutationInput }
  >(ADJUST_RESERVATION_TIME, {
    errorPolicy: "all",
  });

  useEffect(() => {
    if (adjustReservationTimeError) {
      setErrorMsg(adjustReservationTimeError.message);
    } else if (adjustReservationTimeData) {
      setShowSuccessMsg(true);
    }
  }, [adjustReservationTimeData, adjustReservationTimeError]);

  const steps = useMemo(() => {
    return [
      {
        label: `1. ${t("reservations:steps.1")}`,
        state: step === 0 ? 0 : 1,
      },
      {
        label: `2. ${t("reservations:steps.2")}`,
        state: step === 1 ? 0 : 2,
      },
    ];
  }, [t, step]);

  const bylineContent = useMemo(() => {
    const reservationData =
      step === 1
        ? { ...reservation, ...pick(initialReservation, ["begin", "end"]) }
        : reservation;

    return (
      reservation &&
      reservationUnit && (
        <BylineContent>
          <ReservationInfoCard
            reservation={reservationData}
            reservationUnit={reservationUnit}
            type="confirmed"
          />
          {step === 0 && (
            <PinkBox>
              <Subheading>
                {t("reservations:reservationInfoBoxHeading")}
              </Subheading>
              <Sanitize html={getTranslation(reservationUnit, "termsOfUse")} />
            </PinkBox>
          )}
        </BylineContent>
      )
    );
  }, [reservationUnit, reservation, initialReservation, t, step]);

  if (
    !reservation ||
    !reservationUnit ||
    !additionalData ||
    activeApplicationRounds === null
  ) {
    return (
      <Wrapper>
        <Content>
          <LoadingSpinner style={{ margin: "var(--spacing-layout-xl) auto" }} />
        </Content>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <Content>
        <Columns>
          <div>
            <JustForDesktop customBreakpoint={breakpoints.l}>
              {bylineContent}
            </JustForDesktop>
          </div>
          <div>
            <H1>
              {t(
                `${
                  step === 0
                    ? "reservations:editReservationTime"
                    : "reservationCalendar:heading.pendingReservation"
                }`
              )}
            </H1>
            <StyledStepper
              language={i18n.language}
              selectedStep={step}
              onStepClick={(e) => {
                const target = e.currentTarget;
                const s = target
                  .getAttribute("data-testid")
                  .replace("hds-stepper-step-", "");
                setStep(parseInt(s, 10));
              }}
              steps={steps}
            />
            <JustForMobile customBreakpoint={breakpoints.l}>
              {bylineContent}
            </JustForMobile>
            {step === 0 && (
              <EditStep0
                reservation={reservation}
                reservationUnit={reservationUnit}
                userReservations={userReservations}
                initialReservation={initialReservation}
                setInitialReservation={setInitialReservation}
                activeApplicationRounds={activeApplicationRounds}
                setErrorMsg={setErrorMsg}
                setStep={setStep}
              />
            )}
            {step === 1 && (
              <EditStep1
                reservation={reservation}
                reservationUnit={reservationUnit}
                setErrorMsg={setErrorMsg}
                setStep={setStep}
                handleSubmit={() => {
                  adjustReservationTime({
                    variables: {
                      input: {
                        pk: reservation.pk,
                        begin: initialReservation.begin,
                        end: initialReservation.end,
                      },
                    },
                  });
                }}
                isSubmitting={adjustReservationTimeLoading}
              />
            )}
          </div>
        </Columns>
      </Content>
      {errorMsg && (
        <Notification
          type="error"
          label={t("reservations:reservationEditFailed")}
          position="top-center"
          autoClose={false}
          displayAutoCloseProgress={false}
          onClose={() => setErrorMsg(null)}
          dismissible
          closeButtonLabelText={t("common:error.closeErrorMsg")}
        >
          {errorMsg}
        </Notification>
      )}
      {showSuccessMsg && (
        <Notification
          type="success"
          label={t("reservations:saveNewTimeSuccess")}
          position="top-center"
          autoClose
          autoCloseDuration={3000}
          displayAutoCloseProgress
          onClose={() => router.push(`${reservationsPrefix}/${reservation.pk}`)}
          dismissible
          closeButtonLabelText={t("common:error.closeErrorMsg")}
        >
          {errorMsg}
        </Notification>
      )}
    </Wrapper>
  );
};

export default ReservationEdit;
