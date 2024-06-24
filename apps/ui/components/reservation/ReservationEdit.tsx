import { type FetchResult } from "@apollo/client";
import { breakpoints } from "common/src/common/style";
import {
  type Mutation,
  type MutationAdjustReservationTimeArgs,
  useAdjustReservationTimeMutation,
  useListReservationsQuery,
  useApplicationRoundsUiQuery,
  ReservationUnitPageQuery,
  ReservationQuery,
  ReservationTypeChoice,
} from "@gql/gql-types";
import { useRouter } from "next/router";
import { Stepper } from "hds-react";
import { differenceInMinutes, set } from "date-fns";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { fromUIDate, toApiDate, toUIDate } from "common/src/common/util";
import { Subheading } from "common/src/reservation-form/styles";
import { filterNonNullable } from "common/src/helpers";
import { useCurrentUser } from "@/hooks/user";
import { getTranslation } from "../../modules/util";
import Sanitize from "../common/Sanitize";
import { ReservationInfoCard } from "./ReservationInfoCard";
import { EditStep0 } from "./EditStep0";
import { EditStep1 } from "./EditStep1";
import { reservationsPrefix } from "@/modules/const";
import { Toast } from "@/styles/util";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  PendingReservationFormSchema,
  PendingReservationFormType,
} from "../reservation-unit/schema";
import { getTimeString } from "@/modules/reservationUnit";
import { UseFormReturn, useForm } from "react-hook-form";
import { RELATED_RESERVATION_STATES } from "common/src/const";
import {
  BylineSection,
  Heading,
  HeadingSection,
  ReservationPageWrapper,
} from "../reservations/styles";
import ClientOnly from "common/src/ClientOnly";

type ReservationUnitNodeT = NonNullable<
  ReservationUnitPageQuery["reservationUnit"]
>;
type ReservationNodeT = NonNullable<ReservationQuery["reservation"]>;
type Props = {
  reservation: ReservationNodeT;
  reservationUnit: ReservationUnitNodeT;
  apiBaseUrl: string;
  logout?: () => void;
};

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

function convertFormToApi(
  formValues: PendingReservationFormType
): { begin: string; end: string } | null {
  const time = formValues.time;
  const date = fromUIDate(formValues.date ?? "");
  const duration = formValues.duration;
  if (date == null || time == null || duration == null) {
    return null;
  }
  const [hours, minutes] = time.split(":").map(Number);
  const begin: Date = set(date, { hours, minutes });
  const end: Date = set(begin, { hours, minutes: minutes + duration });
  return { begin: begin.toISOString(), end: end.toISOString() };
}

/// First step shows the current time, next step shows the new time
function BylineContent({
  reservation,
  reservationUnit,
  form,
  step,
}: {
  reservation: ReservationNodeT;
  reservationUnit: ReservationUnitNodeT;
  form: UseFormReturn<PendingReservationFormType>;
  step: number;
}) {
  const { watch } = form;
  const formValues = watch();
  const times = convertFormToApi(formValues);
  const modifiedReservation =
    times && step !== 0 ? { ...reservation, ...times } : reservation;

  // NOTE have to do this manipualtion because the queries are separate in the SSR
  // could fix it by combining them and querying reservation.reservationUnit instead
  const info = {
    ...modifiedReservation,
    reservationUnit: [reservationUnit],
  };
  return <ReservationInfoCard reservation={info} type="confirmed" />;
}
function convertReservationEdit(
  reservation?: ReservationNodeT
): PendingReservationFormType {
  const originalBegin = new Date(reservation?.begin ?? "");
  const originalEnd = new Date(reservation?.end ?? "");
  return {
    date: toUIDate(originalBegin),
    duration: differenceInMinutes(originalEnd, originalBegin),
    time: getTimeString(originalBegin),
    isControlsVisible: false,
  };
}

export function ReservationEdit({
  reservation,
  reservationUnit,
  apiBaseUrl,
}: Props): JSX.Element {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const [step, setStep] = useState(0);

  const [showSuccessMsg, setShowSuccessMsg] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const now = useMemo(() => new Date(), []);
  const { currentUser } = useCurrentUser();

  const { data } = useListReservationsQuery({
    fetchPolicy: "no-cache",
    skip: !currentUser || !reservationUnit,
    variables: {
      beginDate: toApiDate(now),
      user: currentUser?.pk ?? 0,
      reservationUnit: [reservationUnit?.pk ?? 0],
      state: RELATED_RESERVATION_STATES,
      reservationType: ReservationTypeChoice.Normal,
    },
  });

  const userReservations = filterNonNullable(
    data?.reservations?.edges?.map((e) => e?.node)
  );

  // TODO this should be redundant, use the reservationUnit.applicationRounds instead
  // TODO this is bad, we can get the application rounds from the reservationUnit
  const { data: applicationRoundsData } = useApplicationRoundsUiQuery({
    fetchPolicy: "no-cache",
  });
  const activeApplicationRounds = filterNonNullable(
    applicationRoundsData?.applicationRounds?.edges?.map((e) => e?.node)
  ).filter((ar) =>
    ar.reservationUnits?.map((n) => n?.pk).includes(reservationUnit.pk)
  );

  const [mutation, { loading: isLoading }] = useAdjustReservationTimeMutation();

  // TODO should rework this so we don't pass a string here (use Dates till we do the mutation)
  const adjustReservationTime = (
    input: MutationAdjustReservationTimeArgs["input"]
  ): Promise<FetchResult<Mutation>> => {
    if (!input.pk) {
      throw new Error("No reservation pk provided");
    }
    if (!input.begin || !input.end) {
      throw new Error("No begin or end time provided");
    }
    // NOTE backend throws errors in some cases if we accidentally send seconds or milliseconds that are not 0
    const { begin, end, ...rest } = input;
    const beginDate = new Date(begin);
    beginDate.setSeconds(0);
    beginDate.setMilliseconds(0);
    const endDate = new Date(end);
    endDate.setSeconds(0);
    endDate.setMilliseconds(0);
    return mutation({
      variables: {
        input: {
          begin: beginDate.toISOString(),
          end: endDate.toISOString(),
          ...rest,
        },
      },
    });
  };

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

  const reservationForm = useForm<PendingReservationFormType>({
    defaultValues: convertReservationEdit(reservation),
    mode: "onChange",
    resolver: zodResolver(PendingReservationFormSchema),
  });

  const { getValues, reset } = reservationForm;
  useEffect(() => {
    reset(convertReservationEdit(reservation));
  }, [reservation, reset]);

  // TODO refactor to use form submit instead of getValues
  const handleSubmit = async () => {
    const formValues = getValues();
    const times = convertFormToApi(formValues);
    if (reservation.pk == null || times == null) {
      return;
    }
    try {
      await adjustReservationTime({ pk: reservation.pk, ...times });
      setShowSuccessMsg(true);
    } catch (e) {
      if (e instanceof Error) {
        // TODO don't print the error message to the user
        setErrorMsg(e.message);
      } else {
        setErrorMsg("Unknown error");
      }
    }
  };

  const title =
    step === 0
      ? "reservations:editReservationTime"
      : "reservationCalendar:heading.pendingReservation";

  const termsOfUse = getTranslation(reservationUnit, "termsOfUse");

  return (
    <>
      <ReservationPageWrapper>
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
            form={reservationForm}
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
        <ClientOnly>
          <EditCalendarSection>
            {step === 0 && (
              <EditStep0
                reservation={reservation}
                reservationUnit={reservationUnit}
                userReservations={userReservations}
                activeApplicationRounds={activeApplicationRounds}
                reservationForm={reservationForm}
                setErrorMsg={setErrorMsg}
                nextStep={() => setStep(1)}
                apiBaseUrl={apiBaseUrl}
                isLoading={false}
              />
            )}
            {step === 1 && (
              <EditStep1
                reservation={reservation}
                reservationUnit={reservationUnit}
                setErrorMsg={setErrorMsg}
                setStep={setStep}
                handleSubmit={handleSubmit}
                isSubmitting={isLoading}
              />
            )}
          </EditCalendarSection>
        </ClientOnly>
      </ReservationPageWrapper>
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
}
