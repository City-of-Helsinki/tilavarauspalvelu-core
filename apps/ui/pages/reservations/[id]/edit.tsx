import React, { useEffect, useState } from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import type { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { createApolloClient } from "@/modules/apolloClient";
import {
  type ReservationEditPageQuery,
  type ReservationEditPageQueryVariables,
  ReservationEditPageDocument,
  MunicipalityChoice,
} from "@gql/gql-types";
import { base64encode, ignoreMaybeArray, toNumber } from "common/src/helpers";
import { toApiDate } from "common/src/common/util";
import { addYears } from "date-fns";
import { breakpoints } from "common/src/const";
import { H1 } from "common/styled";
import { gql } from "@apollo/client";
import { StepState, Stepper } from "hds-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { EditStep0 } from "@/components/reservation/EditStep0";
import { EditStep1 } from "@/components/reservation/EditStep1";
import { PendingReservationFormSchema, type PendingReservationFormType } from "@/components/reservation-unit/schema";
import { ReservationPageWrapper } from "@/styled/reservation";
import { queryOptions } from "@/modules/queryOptions";
import { isReservationEditable, transformReservation } from "@/modules/reservation";
import { getReservationPath, reservationsPrefix } from "@/modules/urls";
import { Breadcrumb } from "@/components/common/Breadcrumb";

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
  const { t, i18n } = useTranslation();
  const { reservation } = props;
  const options = {
    ...props.options,
    municipality: Object.values(MunicipalityChoice).map((value) => ({
      label: t(`Application.municipalities.${value.toUpperCase()}`),
      value: value,
    })),
  };

  const [step, setStep] = useState<0 | 1>(0);

  const form = useForm<PendingReservationFormType>({
    defaultValues: transformReservation(reservation),
    mode: "onChange",
    resolver: zodResolver(PendingReservationFormSchema),
  });

  const { reset } = form;
  useEffect(() => {
    reset(transformReservation(reservation));
  }, [reservation, reset]);

  const title = step === 0 ? "reservations:editReservationTime" : "reservationCalendar:heading.pendingReservation";

  const handleStepClick = (_: React.MouseEvent<HTMLButtonElement>, index: number) => {
    if (index === 0 || index === 1) {
      setStep(index);
    }
  };

  const {
    formState: { isValid, dirtyFields },
  } = form;
  // skip control fields
  const isDirty = dirtyFields.date || dirtyFields.time || dirtyFields.duration;
  const steps = [
    {
      label: `1. ${t("reservations:steps.1")}`,
      state: step === 0 ? StepState.available : StepState.completed,
    },
    {
      label: `2. ${t("reservations:steps.2")}`,
      state: step === 1 ? StepState.available : isValid && isDirty ? StepState.available : StepState.disabled,
    },
  ];

  return (
    <ReservationPageWrapper $nRows={5}>
      <StepperWrapper>
        <H1 $marginTop="none">{t(title)}</H1>
        <Stepper language={i18n.language} selectedStep={step} onStepClick={handleStepClick} steps={steps} />
      </StepperWrapper>
      {step === 0 ? (
        <EditStep0 reservation={reservation} reservationForm={form} nextStep={() => setStep(1)} />
      ) : (
        <EditStep1 reservation={reservation} options={options} onBack={() => setStep(0)} form={form} />
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
    const { data } = await client.query<ReservationEditPageQuery, ReservationEditPageQueryVariables>({
      query: ReservationEditPageDocument,
      variables: {
        id: base64encode(`ReservationNode:${pk}`),
        beginDate: toApiDate(new Date()) ?? "",
        endDate: toApiDate(addYears(new Date(), 2)) ?? "",
      },
    });
    const { reservation } = data;

    if (reservation == null) {
      return notFound;
    }

    if (!isReservationEditable(reservation)) {
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

    const reservationUnit = reservation.reservationUnits.find(() => true);
    if (reservationUnit?.pk == null) {
      return notFound;
    }

    const options = await queryOptions(client, locale ?? "");

    return {
      props: {
        ...commonProps,
        ...(await serverSideTranslations(locale ?? "fi")),
        reservation,
        options,
      },
    };
  }

  return notFound;
}

// NOTE fragment input parameters lack documentation IsReservableFields requires $beginDate and $endDate
export const RESERVATION_EDIT_PAGE_QUERY = gql`
  query ReservationEditPage($id: ID!, $beginDate: Date!, $endDate: Date!) {
    reservation(id: $id) {
      ...EditPageReservation
    }
  }
`;
