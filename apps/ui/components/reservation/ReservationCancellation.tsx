import React from "react";
import styled, { css } from "styled-components";
import { IconClock, IconEuroSign, IconLocation } from "hds-react";
import { useTranslation } from "next-i18next";
import { H1 } from "common/src/common/typography";
import {
  type CancelReasonFieldsFragment,
  useCancelReservationMutation,
  type ReservationCancelPageQuery,
} from "@gql/gql-types";
import { ReservationInfoCard } from "./ReservationInfoCard";
import { ReservationPageWrapper } from "../reservations/styles";
import {
  convertLanguageCode,
  getTranslationSafe,
  toUIDate,
} from "common/src/common/util";
import { errorToast } from "common/src/common/toast";
import { getApplicationPath, getReservationPath } from "@/modules/urls";
import { breakpoints } from "common";
import { getPrice } from "@/modules/reservationUnit";
import { formatDateTimeStrings } from "@/modules/util";
import { LocalizationLanguages } from "common/src/helpers";
import { useRouter } from "next/router";
import { type CancelFormValues, CancellationForm } from "../CancellationForm";
import { Card } from "common/src/components";

const infoCss = css`
  @media (min-width: ${breakpoints.m}) {
    grid-row: 1 / span 2;
    grid-column: 2;
  }
`;

const StyledInfoCard = styled(ReservationInfoCard)`
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

  const { reservation } = props;

  const [cancelReservation, { loading }] = useCancelReservationMutation();

  const backLink = getBackPath(reservation);
  const handleNext = () => {
    const queryParam = isPartOfApplication(reservation)
      ? `deletedReservationPk=${reservation.pk}`
      : "deleted=true";
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
    } catch (e) {
      errorToast({
        text: t("reservations:cancel.mutationFailed"),
      });
    }
  };

  const isApplication = isPartOfApplication(reservation);
  const title = t("reservations:cancel.reservation");
  const ingress = isApplication
    ? t("reservations:cancel.ingressApplication")
    : t("reservations:cancel.ingress");
  const infoBody = isApplication
    ? t("reservations:cancel.infoBodyApplication")
    : t("reservations:cancel.infoBody");

  const lang = convertLanguageCode(i18n.language);
  const cancellationTerms = getTranslatedTerms(reservation, lang);

  return (
    <ReservationPageWrapper>
      <div>
        <H1 $noMargin>{title}</H1>
        <p>{ingress}</p>
        <p>{infoBody}</p>
      </div>
      {reservation.recurringReservation ? (
        <ApplicationInfoCard reservation={reservation} />
      ) : (
        <StyledInfoCard reservation={reservation} type="confirmed" />
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

function ApplicationInfoCard({
  reservation,
}: {
  reservation: CancellationProps["reservation"];
}) {
  // NOTE assumes that the name of the recurringReservation is copied from applicationSection when it's created
  const name = reservation.recurringReservation?.name;
  const reservationUnit = reservation.reservationUnits.find(() => true);
  const { t, i18n } = useTranslation();
  const lang = convertLanguageCode(i18n.language);
  const reservationUnitName =
    reservationUnit != null
      ? getTranslationSafe(reservationUnit, "name", lang)
      : "-";
  const price = getPrice(t, reservation, lang);

  const { dayOfWeek, time, date } = formatDateTimeStrings(
    t,
    reservation,
    undefined,
    true
  );

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
  return (
    <ApplicationInfo
      heading={name ?? ""}
      text={text}
      variant="vertical"
      infos={icons}
    />
  );
}

function isPartOfApplication(
  reservation: Pick<NonNullable<NodeT>, "recurringReservation">
): boolean {
  return reservation?.recurringReservation != null;
}

function getBackPath(
  reservation: Pick<NonNullable<NodeT>, "recurringReservation" | "pk">
): string {
  if (reservation == null) {
    return "";
  }
  if (isPartOfApplication(reservation)) {
    const applicationPk =
      reservation.recurringReservation?.allocatedTimeSlot?.reservationUnitOption
        .applicationSection.application.pk;
    return getApplicationPath(applicationPk, "view");
  }
  return getReservationPath(reservation.pk);
}

/// For applications use application round terms of use
function getTranslatedTerms(
  reservation: Pick<
    NonNullable<NodeT>,
    "recurringReservation" | "reservationUnits" | "pk"
  >,
  lang: LocalizationLanguages
) {
  if (reservation.recurringReservation) {
    const round =
      reservation.recurringReservation?.allocatedTimeSlot?.reservationUnitOption
        ?.applicationSection?.application?.applicationRound;
    const { termsOfUse } = round ?? {};
    if (termsOfUse) {
      return getTranslationSafe(termsOfUse, "text", lang);
    }
    return null;
  }
  const reservationUnit = reservation.reservationUnits.find(() => true);
  if (reservationUnit?.cancellationTerms != null) {
    return getTranslationSafe(reservationUnit?.cancellationTerms, "text", lang);
  }
  return null;
}
