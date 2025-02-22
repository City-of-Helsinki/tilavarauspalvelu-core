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
  type Mutation,
  type MutationAdjustReservationTimeArgs,
  useAdjustReservationTimeMutation,
  type ReservationEditPageQuery,
  type ReservationEditPageQueryVariables,
  ReservationEditPageDocument,
} from "@gql/gql-types";
import {
  base64encode,
  filterNonNullable,
  ignoreMaybeArray,
  toNumber,
} from "common/src/helpers";
import { toApiDate } from "common/src/common/util";
import { addYears } from "date-fns";
import { RELATED_RESERVATION_STATES } from "common/src/const";
import { gql, type FetchResult } from "@apollo/client";
import { useRouter } from "next/router";
import { StepState, Stepper } from "hds-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { errorToast } from "common/src/common/toast";
import { EditStep0 } from "@/components/reservation/EditStep0";
import { EditStep1 } from "@/components/reservation/EditStep1";
import {
  PendingReservationFormSchema,
  PendingReservationFormType,
} from "@/components/reservation-unit/schema";
import { ReservationPageWrapper } from "@/components/reservations/styles";
import { queryOptions } from "@/modules/queryOptions";
import {
  convertReservationFormToApi,
  isReservationEditable,
  transformReservation,
} from "@/modules/reservation";
import { getReservationPath, reservationsPrefix } from "@/modules/urls";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { breakpoints, H1 } from "common";

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];
type PropsNarrowed = Exclude<Props, { notFound: boolean }>;

// HDS pushes className into wrong element (sub not the outermost)
const StepperWrapper = styled.div`
  grid-column: 1 / -1;
  grid-row: 1;
  @media (min-width: ${breakpoints.m}) {
    grid-column: 1 / span 1;
  }
`;

function ReservationEditPage(props: PropsNarrowed): JSX.Element {
  const {
    reservation,
    reservationUnit,
    apiBaseUrl,
    options,
    blockingReservations,
  } = props;
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
      router.push(`${getReservationPath(reservation.pk)}?timeUpdated=true`);
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
    <ReservationPageWrapper $nRows={5}>
      <StepperWrapper>
        <H1 $marginTop="none">{t(title)}</H1>
        <Stepper
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
          blockingReservations={blockingReservations}
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

function ReservationEditPageWrapper(props: PropsNarrowed): JSX.Element {
  const { t } = useTranslation();

  const { reservation } = props;
  const routes = [
    {
      slug: reservationsPrefix,
      title: t("breadcrumb:reservations"),
    },
    {
      slug: getReservationPath(reservation.pk),
      title: t("reservations:reservationName", { id: reservation.pk }),
    },
    {
      title: t("reservations:modifyReservationTime"),
    },
  ] as const;

  return (
    <>
      <Breadcrumb routes={routes} />
      <ReservationEditPage {...props} />
    </>
  );
}

export default ReservationEditPageWrapper;

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const { locale, params } = ctx;
  const pk = toNumber(ignoreMaybeArray(params?.id));

  const commonProps = getCommonServerSideProps();
  const client = createApolloClient(commonProps.apiBaseUrl, ctx);

  const notFound = {
    notFound: true,
    props: {
      notFound: true,
      ...commonProps,
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };

  if (pk != null && pk > 0) {
    // TODO why are we doing two separate queries? the linked reservationUnit should be part of the reservation query
    const resId = base64encode(`ReservationNode:${pk}`);
    const { data } = await client.query<
      ReservationEditPageQuery,
      ReservationEditPageQueryVariables
    >({
      query: ReservationEditPageDocument,
      variables: { id: resId },
    });
    const { reservation } = data;

    if (reservation == null) {
      return notFound;
    }

    if (!isReservationEditable({ reservation })) {
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

    // TODO this is copy pasta from reservation-unit/[id].tsx
    const today = new Date();
    const startDate = today;
    const endDate = addYears(today, 2);
    const resUnitPk = reservation.reservationUnits.find(() => true)?.pk;
    if (resUnitPk == null) {
      return notFound;
    }
    const id = base64encode(`ReservationUnitNode:${resUnitPk}`);
    const { data: reservationUnitData } = await client.query<
      ReservationUnitPageQuery,
      ReservationUnitPageQueryVariables
    >({
      query: ReservationUnitPageDocument,
      variables: {
        id,
        pk: resUnitPk ?? 0,
        beginDate: toApiDate(startDate) ?? "",
        endDate: toApiDate(endDate) ?? "",
        state: RELATED_RESERVATION_STATES,
      },
    });
    const { reservationUnit } = reservationUnitData;

    const options = await queryOptions(client, locale ?? "");

    const timespans = filterNonNullable(reservationUnit?.reservableTimeSpans);
    const reservations = filterNonNullable(
      reservationUnitData?.affectingReservations
    );

    if (reservation != null && reservationUnit != null) {
      return {
        props: {
          ...commonProps,
          ...(await serverSideTranslations(locale ?? "fi")),
          pk,
          reservation,
          options,
          reservationUnit,
          reservableTimeSpans: timespans,
          blockingReservations: reservations,
        },
      };
    }
  }

  return notFound;
}

export const EDIT_PAGE_QUERY = gql`
  query ReservationEditPage($id: ID!) {
    reservation(id: $id) {
      id
      pk
      name
      isHandled
      ...MetaFields
      ...ReservationInfoCard
      reservationUnits {
        id
        ...CancellationRuleFields
        ...MetadataSets
      }
    }
  }
`;
