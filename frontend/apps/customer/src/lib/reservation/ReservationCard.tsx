import React from "react";
import { gql } from "@apollo/client";
import { ButtonVariant, IconArrowRight, IconCross, IconEuroSign, IconLock } from "hds-react";
import { trim } from "lodash-es";
import { useTranslation } from "next-i18next";
import { ButtonLikeExternalLink, ButtonLikeLink } from "ui/src/components/ButtonLikeLink";
import Card from "ui/src/components/Card";
import { ReservationStatusLabel } from "ui/src/components/statuses";
import { formatDateTimeRange } from "ui/src/modules/date-utils";
import { capitalize, getImageSource, getLocalizationLang, getTranslation, getMainImage } from "ui/src/modules/helpers";
import { ReservationOrderStatus } from "@/components/reservation";
import { getNormalizedReservationOrderStatus, getPaymentUrl, isReservationCancellable } from "@/modules/reservation";
import { getPrice } from "@/modules/reservationUnit";
import { getReservationPath } from "@/modules/urls";
import { type ReservationCardFragment, ReservationStateChoice } from "@gql/gql-types";

type CardType = "upcoming" | "past" | "cancelled";

interface PropsT {
  reservation: ReservationCardFragment;
  type?: CardType;
  apiBaseUrl: string;
}

export function ReservationCard({ reservation, type, apiBaseUrl }: Readonly<PropsT>): JSX.Element | null {
  const { t, i18n } = useTranslation();

  const reservationUnit = reservation.reservationUnit;
  const link = reservation.pk ? `/reservations/${reservation.pk}` : "";

  const { beginsAt, endsAt } = reservation;
  const timeString = capitalize(
    formatDateTimeRange(new Date(beginsAt), new Date(endsAt), { locale: getLocalizationLang(i18n.language) })
  );

  const lang = getLocalizationLang(i18n.language);
  const price = getPrice(t, reservation, lang);

  if (!reservationUnit) {
    return null;
  }

  const name = getTranslation(reservationUnit, "name", lang);
  const unitName = getTranslation(reservationUnit.unit, "name", lang);
  const title = trim(`${name}, ${unitName}`, ", ");

  const normalizedOrderStatus = getNormalizedReservationOrderStatus(reservation);

  const img = getMainImage(reservationUnit);
  const imgSrc = getImageSource(img, "medium");
  const tags = [];
  if (normalizedOrderStatus != null)
    tags.push(
      <ReservationOrderStatus
        orderStatus={normalizedOrderStatus}
        data-testid="reservation-card__order-status"
        key="order-status"
      />
    );
  tags.push(
    <ReservationStatusLabel
      data-testid="reservation-card__status"
      state={reservation.state ?? ReservationStateChoice.Created}
      key="status"
    />
  );

  const infos = [
    {
      icon: <IconEuroSign aria-label={t("common:price")} aria-hidden="false" />,
      value: price ?? "",
    },
    {
      icon: <IconLock aria-label={t("reservationUnit:accessType")} aria-hidden="false" />,
      value: t(`reservationUnit:accessTypes.${reservation.accessType}`),
    },
  ];

  const buttons = [];
  if (type === "upcoming" && isReservationCancellable(reservation)) {
    buttons.push(
      <ButtonLikeLink
        href={getReservationPath(reservation.pk, "cancel")}
        data-testid="reservation-card__button--cancel-reservation"
        key="cancel"
        width="full"
      >
        {t("reservation:cancel.reservationAbbreviated")}
        <IconCross />
      </ButtonLikeLink>
    );
  }
  buttons.push(
    <ButtonLikeLink href={link} data-testid="reservation-card__button--goto-reservation" key="show" width="full">
      {t("common:show")}
      <IconArrowRight />
    </ButtonLikeLink>
  );

  const paymentUrl = getPaymentUrl(reservation, lang, apiBaseUrl);
  if (paymentUrl) {
    buttons.push(
      <ButtonLikeExternalLink
        variant={ButtonVariant.Primary}
        href={paymentUrl}
        data-testid="reservation-card__button--goto-payment"
        key="payment"
        width="full"
      >
        {t("reservation:payReservation")}
        <IconArrowRight />
      </ButtonLikeExternalLink>
    );
  }
  return (
    <Card
      heading={title}
      headingTestId="reservation-card__name"
      headingLevel={2}
      text={timeString}
      textTestId="reservation-card__time"
      imageSrc={imgSrc}
      link={link}
      testId="reservation-card__container"
      tags={tags}
      infos={infos}
      buttons={buttons}
    />
  );
}

export const RESERVATION_CARD_FRAGMENT = gql`
  fragment ReservationCard on ReservationNode {
    pk
    beginsAt
    endsAt
    state
    accessType
    reservationUnit {
      id
      nameFi
      nameSv
      nameEn
      images {
        ...Image
      }
      unit {
        id
        nameFi
        nameSv
        nameEn
      }
    }
    ...ReservationPriceFields
    ...ReservationOrderStatus
    ...ReservationPaymentUrl
    ...CanUserCancelReservation
  }
`;
