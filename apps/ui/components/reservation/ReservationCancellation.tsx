import React from "react";
import styled, { css } from "styled-components";
import { IconClock, IconEuroSign, IconLocation } from "hds-react";
import { useTranslation } from "next-i18next";
import { H1 } from "common/styled";
import { breakpoints } from "common/src/const";
import {
  type CancelReasonFieldsFragment,
  type ReservationCancelPageQuery,
  useCancelReservationMutation,
} from "@gql/gql-types";
import { ReservationInfoCard } from "./ReservationInfoCard";
import { ReservationPageWrapper } from "@/styled/reservation";
import { convertLanguageCode, getTranslationSafe, toUIDate } from "common/src/common/util";
import { useDisplayError } from "common/src/hooks";
import { getApplicationPath, getReservationPath } from "@/modules/urls";
import { getPrice } from "@/modules/reservationUnit";
import { formatDateTimeStrings } from "@/modules/util";
import { type LocalizationLanguages } from "common/src/urlBuilder";
import { useRouter } from "next/router";
import { type CancelFormValues, CancellationForm } from "../CancellationForm";
import { Card } from "common/src/components";
import { gql } from "@apollo/client";

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
  apiBaseUrl: string;
  reasons: CancelReasonFieldsFragment[];
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
  const title = t("reservations:cancel.reservation");
  const ingress = isApplication ? t("reservations:cancel.ingressApplication") : t("reservations:cancel.ingress");
  const infoBody = isApplication ? t("reservations:cancel.infoBodyApplication") : t("reservations:cancel.infoBody");

  const lang = convertLanguageCode(i18n.language);
  const cancellationTerms = getTranslatedTerms(reservation, lang);

  return (
    <ReservationPageWrapper>
      <div>
        <H1 $noMargin>{title}</H1>
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
        cancelReasons={props.reasons}
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
  const lang = convertLanguageCode(i18n.language);
  const reservationUnitName = getTranslationSafe(reservation.reservationUnit, "name", lang);
  const price = getPrice(t, reservation, lang);

  const { dayOfWeek, time, date } = formatDateTimeStrings(t, reservation, undefined, true);

  const icons = [
    {
      icon: <IconClock aria-hidden="true" />,
      value: time,
    },
    {
      icon: <IconLocation aria-hidden="true" />,
      value: reservationUnitName,
    },
    {
      icon: <IconEuroSign aria-hidden="true" />,
      value: price ?? "",
    },
  ];

  const text = `${toUIDate(date)} - ${dayOfWeek}`;
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
      return getTranslationSafe(termsOfUse, "text", lang);
    }
    return null;
  }
  const reservationUnit = reservation.reservationUnit;
  if (reservationUnit.cancellationTerms != null) {
    return getTranslationSafe(reservationUnit.cancellationTerms, "text", lang);
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
