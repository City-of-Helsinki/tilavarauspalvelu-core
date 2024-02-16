import {
  FetchResult,
  useLazyQuery,
  useMutation,
  useQuery,
} from "@apollo/client";
import { breakpoints } from "common/src/common/style";
import { H2 } from "common/src/common/typography";
import {
  type ApplicationRoundNode,
  type Mutation,
  type MutationAdjustReservationTimeArgs,
  type Query,
  type QueryReservationsArgs,
  type QueryReservationUnitByPkArgs,
  ReservationsReservationStateChoices,
  ReservationsReservationTypeChoices,
  type ReservationType,
  type ReservationUnitByPkType,
  type ReservationUnitByPkTypeReservableTimeSpansArgs,
  type ReservationUnitByPkTypeReservationsArgs,
} from "common/types/gql-types";
import { pick } from "lodash";
import { useRouter } from "next/router";
import { LoadingSpinner, Stepper } from "hds-react";
import { addYears } from "date-fns";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { PendingReservation } from "common/types/common";
import { toApiDate } from "common/src/common/util";
import { Subheading } from "common/src/reservation-form/styles";
import { Container } from "common";
import { filterNonNullable } from "common/src/helpers";
import { useCurrentUser } from "@/hooks/user";
import {
  ADJUST_RESERVATION_TIME,
  GET_RESERVATION,
  LIST_RESERVATIONS,
} from "@/modules/queries/reservation";
import { getTranslation } from "../../modules/util";
import Sanitize from "../common/Sanitize";
import ReservationInfoCard from "./ReservationInfoCard";
import {
  OPENING_HOURS,
  RESERVATION_UNIT,
} from "@/modules/queries/reservationUnit";
import { createMockOpeningTimes } from "@/modules/reservationUnit";
import EditStep0 from "./EditStep0";
import EditStep1 from "./EditStep1";
import { reservationsPrefix } from "@/modules/const";
import { APPLICATION_ROUNDS } from "@/modules/queries/applicationRound";
import { Toast } from "@/styles/util";

type Props = {
  id: number;
  apiBaseUrl: string;
  logout?: () => void;
};

const allowedReservationStates: ReservationsReservationStateChoices[] = [
  ReservationsReservationStateChoices.Created,
  ReservationsReservationStateChoices.Confirmed,
  ReservationsReservationStateChoices.RequiresHandling,
  ReservationsReservationStateChoices.WaitingForPayment,
];

/* TODO margins should be in page layout component, not custom for every page */
const Content = styled(Container)`
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: repeat(4, auto);
  grid-gap: var(--spacing-m);
  justify-content: space-between;
  margin-top: var(--spacing-l);

  @media (width > ${breakpoints.m}) {
    margin-top: var(--spacing-2-xl);
    grid-template-columns: repeat(6, 1fr);
  }
`;

/* There is no breadcrumbs on this page so remove the margin */
const Heading = styled(H2).attrs({ as: "h1" })`
  grid-column: 1 / -1;
  margin-top: 0;
`;

const StyledStepper = styled(Stepper)`
  margin: var(--spacing-layout-m) 0 var(--spacing-layout-m);

  @media (min-width: ${breakpoints.m}) {
    max-width: 50%;
  }
`;

const PinkBox = styled.div`
  padding: 1px var(--spacing-m) var(--spacing-m);
  background-color: var(--color-suomenlinna-light);
  grid-column: 1 / -1;
  grid-row: -1;
  @media (min-width: ${breakpoints.m}) {
    grid-column: span 3;
    grid-row: unset;
  }
  @media (min-width: ${breakpoints.l}) {
    grid-column: -3 / span 2;
  }
`;

const HeadingSection = styled.div`
  grid-column: 1 / -1;
  grid-row: 1;
  @media (min-width: ${breakpoints.l}) {
    grid-column: 1 / span 4;
  }
`;

const BylineSection = styled.div`
  grid-row: 2;
  @media (min-width: ${breakpoints.m}) {
    grid-column: span 3;
  }
  @media (min-width: ${breakpoints.l}) {
    grid-row: 1 / span 2;
    grid-column: -3 / span 2;
  }
`;

const EditCalendarSection = styled.div`
  grid-column: 1 / -1;
  grid-row: 4 / -1;

  @media (min-width: ${breakpoints.l}) {
    grid-column: 1 / span 4;
    grid-row: 2 / -1;
  }

  /* flex inside a grid breaks responsiveness, the sub component should be refactored */
  & .rbc-calendar {
    display: grid !important;
  }
`;

const BylineContent = ({
  reservation,
  reservationUnit,
  step,
  initialReservation,
}: {
  reservation: ReservationType;
  reservationUnit: ReservationUnitByPkType;
  step: number;
  initialReservation: PendingReservation | null;
}) => {
  const reservationData =
    step === 1
      ? { ...reservation, ...pick(initialReservation, ["begin", "end"]) }
      : reservation;

  return (
    <ReservationInfoCard
      // @ts-expect-error: TODO: fix this
      reservation={reservationData}
      reservationUnit={reservationUnit}
      type="confirmed"
    />
  );
};

const ReservationEdit = ({ id, apiBaseUrl }: Props): JSX.Element => {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const [reservationUnit, setReservationUnit] =
    useState<ReservationUnitByPkType | null>(null);
  const [activeApplicationRounds, setActiveApplicationRounds] = useState<
    ApplicationRoundNode[]
  >([]);
  const [step, setStep] = useState(0);

  const [initialReservation, setInitialReservation] =
    useState<PendingReservation | null>(null);
  const [userReservations, setUserReservations] = useState<ReservationType[]>(
    []
  );
  const [showSuccessMsg, setShowSuccessMsg] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const now = useMemo(() => new Date(), []);
  const { currentUser } = useCurrentUser();

  const { data } = useQuery<Query>(GET_RESERVATION, {
    fetchPolicy: "no-cache",
    variables: {
      pk: id,
    },
  });
  const reservation = data?.reservationByPk ?? undefined;

  const { data: reservationUnitData } = useQuery<
    Query,
    QueryReservationUnitByPkArgs
  >(RESERVATION_UNIT, {
    fetchPolicy: "no-cache",
    skip: !reservation?.reservationUnits?.[0]?.pk,
    variables: {
      pk: reservation?.reservationUnits?.[0]?.pk ?? 0,
    },
  });

  // TODO why is this needed? why isn't it part of the reservationUnit query?
  const [fetchAdditionalData, { data: additionalData }] = useLazyQuery<
    Query,
    QueryReservationUnitByPkArgs &
      ReservationUnitByPkTypeReservableTimeSpansArgs &
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
          startDate: String(toApiDate(new Date(now))),
          endDate: String(toApiDate(addYears(new Date(), 1))),
          from: toApiDate(new Date(now)),
          to: toApiDate(addYears(new Date(), 1)),
          state: allowedReservationStates,
          includeWithSameComponents: true,
        },
      });
    }
  }, [reservationUnitData, fetchAdditionalData, now]);

  useEffect(() => {
    if (reservationUnitData?.reservationUnitByPk == null) {
      return;
    }

    const { allowReservationsWithoutOpeningHours } =
      reservationUnitData?.reservationUnitByPk ?? {};

    const timespans = filterNonNullable(
      reservationUnitData?.reservationUnitByPk?.reservableTimeSpans
    );
    const moreTimespans = filterNonNullable(
      additionalData?.reservationUnitByPk?.reservableTimeSpans
    ).filter((n) => n?.startDatetime != null && n?.endDatetime != null);
    const reservableTimeSpans = [
      ...timespans,
      ...(allowReservationsWithoutOpeningHours
        ? createMockOpeningTimes(id)
        : moreTimespans),
    ];
    setReservationUnit({
      ...reservationUnitData?.reservationUnitByPk,
      reservableTimeSpans,
      reservations: additionalData?.reservationUnitByPk?.reservations,
    });
  }, [additionalData, reservationUnitData?.reservationUnitByPk, id]);

  const { data: userReservationsData } = useQuery<Query, QueryReservationsArgs>(
    LIST_RESERVATIONS,
    {
      fetchPolicy: "no-cache",
      skip: !currentUser || !reservationUnit,
      variables: {
        beginDate: toApiDate(now),
        user: currentUser?.pk?.toString(),
        reservationUnit: [reservationUnit?.pk?.toString() ?? ""],
        state: allowedReservationStates,
      },
    }
  );

  useEffect(() => {
    const reservations = filterNonNullable(
      userReservationsData?.reservations?.edges?.map((e) => e?.node)
    )
      .filter((n) => n.type === ReservationsReservationTypeChoices.Normal)
      .filter((n) => allowedReservationStates.includes(n.state));
    setUserReservations(reservations);
  }, [userReservationsData]);

  // TODO this should be redundant, use the reservationUnit.applicationRounds instead
  const { data: applicationRoundsData } = useQuery<Query>(APPLICATION_ROUNDS, {
    fetchPolicy: "no-cache",
  });

  useEffect(() => {
    // TODO this is bad, we can get the application rounds from the reservationUnit
    if (applicationRoundsData && reservationUnit) {
      const appRounds = filterNonNullable(
        applicationRoundsData?.applicationRounds?.edges?.map((e) => e?.node)
      ).filter((ar) =>
        ar.reservationUnits?.map((n) => n?.pk).includes(reservationUnit.pk)
      );
      setActiveApplicationRounds(appRounds);
    }
  }, [applicationRoundsData, reservationUnit]);

  const [
    adjustReservationTimeMutation,
    {
      data: adjustReservationTimeData,
      error: adjustReservationTimeError,
      loading: adjustReservationTimeLoading,
    },
  ] = useMutation<Mutation, MutationAdjustReservationTimeArgs>(
    ADJUST_RESERVATION_TIME,
    {
      errorPolicy: "all",
    }
  );

  // TODO should rework this so we don't pass a string here (use Dates till we do the mutation)
  const adjustReservationTime = (
    input: MutationAdjustReservationTimeArgs["input"]
  ): Promise<FetchResult<Mutation>> => {
    // NOTE backend throws errors in some cases if we accidentally send seconds or milliseconds that are not 0
    const { begin, end, ...rest } = input;
    const beginDate = new Date(begin);
    beginDate.setSeconds(0);
    beginDate.setMilliseconds(0);
    const endDate = new Date(end);
    endDate.setSeconds(0);
    endDate.setMilliseconds(0);
    return adjustReservationTimeMutation({
      variables: {
        input: {
          begin: beginDate.toISOString(),
          end: endDate.toISOString(),
          ...rest,
        },
      },
    });
  };

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

  const isLoading = !reservation || !reservationUnit || !additionalData;
  if (isLoading) {
    return (
      <Content>
        <LoadingSpinner style={{ margin: "var(--spacing-layout-xl) auto" }} />
      </Content>
    );
  }

  const handleSubmit = () => {
    const pk = reservation.pk;
    // TODO refactor: using initial reservation when we only need time information is bad
    const begin = initialReservation?.begin;
    const end = initialReservation?.end;
    if (pk && begin && end) {
      adjustReservationTime({ pk, begin, end });
    }
  };

  const title =
    step === 0
      ? "reservations:editReservationTime"
      : "reservationCalendar:heading.pendingReservation";

  const termsOfUse = getTranslation(reservationUnit, "termsOfUse");

  return (
    <>
      <Content>
        <HeadingSection>
          <Heading>{t(title)}</Heading>
          <StyledStepper
            language={i18n.language}
            selectedStep={step}
            onStepClick={(e) => {
              const target = e.currentTarget;
              const s = target
                .getAttribute("data-testid")
                ?.replace("hds-stepper-step-", "");
              if (s != null) {
                setStep(parseInt(s, 10));
              }
            }}
            steps={steps}
          />
        </HeadingSection>
        <BylineSection>
          <BylineContent
            reservation={reservation}
            reservationUnit={reservationUnit}
            initialReservation={initialReservation}
            step={step}
          />
        </BylineSection>
        {/* TODO on mobile in the design this is after the calendar but before action buttons */}
        {step === 0 && termsOfUse && (
          <PinkBox>
            <Subheading>
              {t("reservations:reservationInfoBoxHeading")}
            </Subheading>
            <Sanitize html={termsOfUse} />
          </PinkBox>
        )}
        <EditCalendarSection>
          {step === 0 && (
            <EditStep0
              reservation={reservation}
              reservationUnit={reservationUnit}
              userReservations={userReservations}
              initialReservation={initialReservation}
              setInitialReservation={setInitialReservation}
              activeApplicationRounds={activeApplicationRounds}
              setErrorMsg={setErrorMsg}
              nextStep={() => setStep(1)}
              apiBaseUrl={apiBaseUrl}
            />
          )}
          {step === 1 && (
            <EditStep1
              reservation={reservation}
              reservationUnit={reservationUnit}
              setErrorMsg={setErrorMsg}
              setStep={setStep}
              handleSubmit={handleSubmit}
              isSubmitting={adjustReservationTimeLoading}
            />
          )}
        </EditCalendarSection>
      </Content>
      {errorMsg && (
        <Toast
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
        </Toast>
      )}
      {showSuccessMsg && (
        <Toast
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
        </Toast>
      )}
    </>
  );
};

export default ReservationEdit;
