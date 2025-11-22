import React from "react";
import { gql } from "@apollo/client";
import { IconClock, IconLocation } from "hds-react";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import styled, { css } from "styled-components";
import { Card } from "ui/src/components";
import { useDisplayError } from "ui/src/hooks";
import { breakpoints } from "ui/src/modules/const";
import { formatDate, applicationReservationDateTime } from "ui/src/modules/date-utils";
import { type LocalizationLanguages } from "ui/src/modules/urlBuilder";
import { H1 } from "ui/src/styled";
import { getLocalizationLang, getTranslation } from "@ui/modules/helpers";
import { type CancelFormValues, CancellationForm } from "@/components/CancellationForm";
import { ReservationInfoCard } from "@/components/reservation";
import { getApplicationPath, getReservationPath } from "@/modules/urls";
import { ReservationPageWrapper } from "@/styled/reservation";
import { type ReservationCancelPageQuery, useCancelReservationMutation } from "@gql/gql-types";

const infoCss = css`
  @media (min-width: ${breakpoints.m}) {
    grid-row: 1 / span 2;
    grid-column: 2;
  }
`;

const StyledReservationInfoCard = styled(ReservationInfoCard)`
  ${infoCss}
`;

type NodeT = ReservationCancelPageQuery["reservation"];
type CancellationProps = {
  reservation: NonNullable<NodeT>;
};

export function ReservationCancellation(props: CancellationProps): JSX.Element {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const displayError = useDisplayError();

  const { reservation } = props;

  const [cancelReservation, { loading }] = useCancelReservationMutation();

  const backLink = getBackPath(reservation);

  const handleNext = () => {
    const queryParam = isPartOfApplication(reservation) ? `deletedReservationPk=${reservation.pk}` : "deleted=true";
    if (backLink) {
      router.push(`${backLink}?${queryParam}`);
    }
  };

  const onSubmit = async (formData: CancelFormValues) => {
    if (!reservation.pk || !formData.reason) {
      return;
    }
    const { reason } = formData;
    try {
      await cancelReservation({
        variables: {
          input: {
            pk: reservation.pk,
            cancelReason: reason,
          },
        },
      });
      handleNext();
    } catch (err: unknown) {
      displayError(err);
    }
  };

  const isApplication = isPartOfApplication(reservation);
  const title = t("reservation:cancel.reservation");
  const ingress = isApplication ? t("reservation:cancel.ingressApplication") : t("reservation:cancel.ingress");
  const infoBody = isApplication ? t("reservation:cancel.infoBodyApplication") : t("reservation:cancel.infoBody");

  const lang = getLocalizationLang(i18n.language);
  const cancellationTerms = getTranslatedTerms(reservation, lang);

  return (
    <ReservationPageWrapper>
      <div>
        <H1 $marginTop="none">{title}</H1>
        <p>{ingress}</p>
        <p>{infoBody}</p>
      </div>
      {reservation.reservationSeries ? (
        <ApplicationInfoCard reservation={reservation} />
      ) : (
        <StyledReservationInfoCard reservation={reservation} />
      )}
      <CancellationForm
        onNext={onSubmit}
        isLoading={loading}
        cancellationTerms={cancellationTerms}
        backLink={backLink}
      />
    </ReservationPageWrapper>
  );
}

const ApplicationInfo = styled(Card)`
  ${infoCss}
`;

function ApplicationInfoCard({ reservation }: { reservation: CancellationProps["reservation"] }) {
  // NOTE assumes that the name of the reservationSeries is copied from applicationSection when it's created
  const name = reservation.reservationSeries?.name;
  const { t, i18n } = useTranslation();
  const lang = getLocalizationLang(i18n.language);
  const reservationUnitName = getTranslation(reservation.reservationUnit, "name", lang);

  const { dayOfWeek, time, date } = applicationReservationDateTime({ t, reservation, trailingMinutes: true });

  const icons = [
    {
      icon: <IconClock aria-hidden="true" />,
      value: time,
    },
    {
      icon: <IconLocation aria-hidden="true" />,
      value: reservationUnitName,
    },
  ];

  const text = `${formatDate(date)} - ${dayOfWeek}`;
  return <ApplicationInfo heading={name ?? ""} text={text} variant="vertical" infos={icons} />;
}

function isPartOfApplication(reservation: Pick<NonNullable<NodeT>, "reservationSeries">): boolean {
  return reservation?.reservationSeries != null;
}

function getBackPath(reservation: Pick<NonNullable<NodeT>, "reservationSeries" | "pk">): string {
  if (reservation == null) {
    return "";
  }
  if (isPartOfApplication(reservation)) {
    const applicationPk =
      reservation.reservationSeries?.allocatedTimeSlot?.reservationUnitOption.applicationSection.application.pk;
    return getApplicationPath(applicationPk, "view");
  }
  return getReservationPath(reservation.pk);
}

/// For applications use application round terms of use
function getTranslatedTerms(
  reservation: Pick<NonNullable<NodeT>, "reservationSeries" | "reservationUnit" | "pk">,
  lang: LocalizationLanguages
) {
  if (reservation.reservationSeries) {
    const round =
      reservation.reservationSeries?.allocatedTimeSlot?.reservationUnitOption?.applicationSection?.application
        ?.applicationRound;
    const { termsOfUse } = round ?? {};
    if (termsOfUse) {
      return getTranslation(termsOfUse, "text", lang);
    }
    return null;
  }
  const reservationUnit = reservation.reservationUnit;
  if (reservationUnit.cancellationTerms != null) {
    return getTranslation(reservationUnit.cancellationTerms, "text", lang);
  }
  return null;
}

export const CANCEL_RESERVATION = gql`
  mutation CancelReservation($input: ReservationCancellationMutationInput!) {
    cancelReservation(input: $input) {
      pk
    }
  }
`;
