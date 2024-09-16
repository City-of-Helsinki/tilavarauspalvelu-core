import React, { useEffect, useState } from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import type { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { createApolloClient } from "@/modules/apolloClient";
import {
  ReservationUnitPageDocument,
  type ReservationUnitPageQuery,
  type ReservationUnitPageQueryVariables,
  ReservationDocument,
  type ReservationQuery,
  type ReservationQueryVariables,
  type CurrentUserQuery,
  type Mutation,
  type MutationAdjustReservationTimeArgs,
  useAdjustReservationTimeMutation,
} from "@gql/gql-types";
import { base64encode, filterNonNullable } from "common/src/helpers";
import { toApiDate } from "common/src/common/util";
import { addYears } from "date-fns";
import { RELATED_RESERVATION_STATES } from "common/src/const";
import { CURRENT_USER } from "@/modules/queries/user";
import { type FetchResult } from "@apollo/client";
import { useRouter } from "next/router";
import { StepState, Stepper } from "hds-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { errorToast } from "common/src/common/toast";
import { reservationsPrefix } from "@/modules/const";
import { EditStep0 } from "@/components/reservation/EditStep0";
import { EditStep1 } from "@/components/reservation/EditStep1";
import {
  PendingReservationFormSchema,
  PendingReservationFormType,
} from "@/components/reservation-unit/schema";
import {
  Heading,
  ReservationPageWrapper,
} from "@/components/reservations/styles";
import { queryOptions } from "@/modules/queryOptions";
import {
  convertReservationFormToApi,
  isReservationEditable,
  transformReservation,
} from "@/modules/reservation";
import { NotModifiableReason } from "@/components/reservation/NotModifiableReason";

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];
type PropsNarrowed = Exclude<Props, { notFound: boolean }>;

// HDS pushes className into wrong element (sub not the outermost)
const StepperWrapper = styled.div`
  grid-column: 1 / -2;
`;
const StyledStepper = styled(Stepper)`
  margin: var(--spacing-layout-m) 0 var(--spacing-layout-m);
`;

// copy of ReservationCancellation but some changes to grid layoout
// see if we can refactor cancellation to use the same heading
const HeadingSection = styled.div`
  grid-column: 1 / -1;
  grid-row: 1;
`;

function ReservationEditPage(props: PropsNarrowed): JSX.Element {
  const { reservation, reservationUnit, apiBaseUrl, options } = props;
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const [step, setStep] = useState<0 | 1>(0);

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

  const reservationForm = useForm<PendingReservationFormType>({
    defaultValues: transformReservation(reservation),
    mode: "onChange",
    resolver: zodResolver(PendingReservationFormSchema),
  });

  const { getValues, reset } = reservationForm;
  useEffect(() => {
    reset(transformReservation(reservation));
  }, [reservation, reset]);

  // TODO refactor to use form submit instead of getValues
  const handleSubmit = async () => {
    const formValues = getValues();
    const times = convertReservationFormToApi(formValues);
    if (reservation.pk == null || times == null) {
      return;
    }
    try {
      await adjustReservationTime({ pk: reservation.pk, ...times });
      router.push(`${reservationsPrefix}/${reservation.pk}/?timeUpdated=true`);
    } catch (e) {
      if (e instanceof Error) {
        // TODO don't print the error message to the user
        errorToast({ text: e.message });
      } else {
        errorToast({ text: "Unknown error occurred" });
      }
    }
  };

  const title =
    step === 0
      ? "reservations:editReservationTime"
      : "reservationCalendar:heading.pendingReservation";

  const handleStepClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const target = e.currentTarget;
    const s = target
      .getAttribute("data-testid")
      ?.replace("hds-stepper-step-", "");
    if (s != null) {
      const n = parseInt(s, 10);
      if (n === 0 || n === 1) {
        setStep(n);
      }
    }
  };

  if (!isReservationEditable({ reservation })) {
    return (
      <ReservationPageWrapper>
        <HeadingSection>
          <Heading>{t(title)}</Heading>
        </HeadingSection>
        <div style={{ gridColumn: "1 / -1" }}>
          <NotModifiableReason reservation={reservation} />
        </div>
      </ReservationPageWrapper>
    );
  }

  const {
    formState: { isValid, dirtyFields },
  } = reservationForm;
  // skip control fields
  const isDirty = dirtyFields.date || dirtyFields.time || dirtyFields.duration;
  const steps = [
    {
      label: `1. ${t("reservations:steps.1")}`,
      state: step === 0 ? StepState.available : StepState.completed,
    },
    {
      label: `2. ${t("reservations:steps.2")}`,
      state:
        step === 1
          ? StepState.available
          : isValid && isDirty
            ? StepState.available
            : StepState.disabled,
    },
  ];

  // TODO does this include non active application rounds?
  const activeApplicationRounds = reservationUnit.applicationRounds;

  return (
    <ReservationPageWrapper>
      <HeadingSection>
        <Heading>{t(title)}</Heading>
      </HeadingSection>
      <StepperWrapper>
        <StyledStepper
          language={i18n.language}
          selectedStep={step}
          onStepClick={handleStepClick}
          steps={steps}
        />
      </StepperWrapper>
      {step === 0 ? (
        <EditStep0
          reservation={reservation}
          reservationUnit={reservationUnit}
          activeApplicationRounds={activeApplicationRounds}
          reservationForm={reservationForm}
          nextStep={() => setStep(1)}
          apiBaseUrl={apiBaseUrl}
          isLoading={false}
        />
      ) : (
        <EditStep1
          reservation={reservation}
          options={options}
          reservationUnit={reservationUnit}
          onBack={() => setStep(0)}
          handleSubmit={handleSubmit}
          form={reservationForm}
          isSubmitting={isLoading}
        />
      )}
    </ReservationPageWrapper>
  );
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const { locale, params } = ctx;
  const pk = params?.id;

  const commonProps = getCommonServerSideProps();
  const client = createApolloClient(commonProps.apiBaseUrl, ctx);

  if (Number.isFinite(Number(pk))) {
    // TODO why are we doing two separate queries? the linked reservationUnit should be part of the reservation query
    const resId = base64encode(`ReservationNode:${pk}`);
    const { data } = await client.query<
      ReservationQuery,
      ReservationQueryVariables
    >({
      query: ReservationDocument,
      fetchPolicy: "no-cache",
      variables: { id: resId },
    });
    const reservation = data?.reservation ?? undefined;

    // TODO this is copy pasta from reservation-unit/[id].tsx
    const today = new Date();
    const startDate = today;
    const endDate = addYears(today, 2);

    const resUnitPk = reservation?.reservationUnit?.[0]?.pk;
    const id = resUnitPk
      ? base64encode(`ReservationUnitNode:${resUnitPk}`)
      : "";
    const { data: reservationUnitData } = await client.query<
      ReservationUnitPageQuery,
      ReservationUnitPageQueryVariables
    >({
      query: ReservationUnitPageDocument,
      fetchPolicy: "no-cache",
      variables: {
        id,
        pk: resUnitPk ?? 0,
        beginDate: toApiDate(startDate) ?? "",
        endDate: toApiDate(endDate) ?? "",
        state: RELATED_RESERVATION_STATES,
      },
    });
    const { reservationUnit } = reservationUnitData;

    const { data: userData } = await client.query<CurrentUserQuery>({
      query: CURRENT_USER,
      fetchPolicy: "no-cache",
    });
    const user = userData?.currentUser;

    const options = await queryOptions(client, locale ?? "");

    const timespans = filterNonNullable(reservationUnit?.reservableTimeSpans);
    const reservableTimeSpans = timespans;
    const doesReservationAffectReservationUnit = (
      res: (typeof affectingReservations)[0],
      reservationUnitPk: number
    ) => {
      return res.affectedReservationUnits?.some(
        (pk_) => pk_ === reservationUnitPk
      );
    };
    const reservationSet = filterNonNullable(
      reservationUnitData?.reservationUnit?.reservationSet
    );
    const affectingReservations = filterNonNullable(
      reservationUnitData?.affectingReservations
    );

    const reservations = filterNonNullable(
      reservationSet?.concat(
        affectingReservations?.filter((y) =>
          doesReservationAffectReservationUnit(y, resUnitPk ?? 0)
        ) ?? []
      )
    );

    // TODO check for nulls and return notFound if necessary
    if (
      reservation != null &&
      reservationUnit != null &&
      reservation.user?.pk === user?.pk
    ) {
      return {
        props: {
          ...commonProps,
          ...(await serverSideTranslations(locale ?? "fi")),
          key: `${pk}-edit-${locale}`,
          pk,
          reservation,
          options,
          // TODO the queries should be combined so that we don't need to do this
          reservationUnit: {
            ...reservationUnit,
            reservableTimeSpans: reservableTimeSpans ?? null,
            reservationSet: reservations ?? null,
          },
        },
      };
    }
  }

  return {
    notFound: true,
    props: {
      notFound: true,
      ...commonProps,
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

export default ReservationEditPage;
