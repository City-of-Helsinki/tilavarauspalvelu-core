import React from "react";
import { IconEuroSign, IconCross, IconArrowRight } from "hds-react";
import { useTranslation } from "next-i18next";
import { trim } from "lodash";
import {
  type ListReservationsQuery,
  ReservationStateChoice,
} from "@gql/gql-types";
import { capitalize, formatDateTimeRange, getMainImage } from "@/modules/util";
import {
  isReservationCancellable,
  getNormalizedReservationOrderStatus,
} from "@/modules/reservation";
import {
  getPrice,
  getReservationUnitName,
  getUnitName,
} from "@/modules/reservationUnit";
import { ReservationOrderStatus } from "./ReservationOrderStatus";
import { ReservationStatus } from "./ReservationStatus";
import { ButtonLikeLink } from "../common/ButtonLikeLink";
import { getImageSource } from "common/src/helpers";
import Card from "common/src/components/Card";
import { getReservationPath } from "@/modules/urls";
import { convertLanguageCode } from "common/src/common/util";

type CardType = "upcoming" | "past" | "cancelled";

// TODO use a fragment
type QueryT = NonNullable<ListReservationsQuery["reservations"]>;
type EdgeT = NonNullable<QueryT["edges"][0]>;
type NodeT = NonNullable<EdgeT["node"]>;
interface PropsT {
  reservation: NodeT;
  type?: CardType;
}

function ReservationCard({ reservation, type }: PropsT): JSX.Element {
  const { t, i18n } = useTranslation();

  const reservationUnit = reservation.reservationUnits?.[0] ?? undefined;
  const link = reservation.pk ? `/reservations/${reservation.pk}` : "";

  const { begin, end } = reservation;
  const timeString = capitalize(
    formatDateTimeRange(t, new Date(begin), new Date(end))
  );

  const lang = convertLanguageCode(i18n.language);
  const price = getPrice(t, reservation, lang);

  const title = trim(
    `${getReservationUnitName(reservationUnit)}, ${getUnitName(
      reservationUnit?.unit ?? undefined
    )}`,
    ", "
  );

  const normalizedOrderStatus =
    getNormalizedReservationOrderStatus(reservation);

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
    <ReservationStatus
      data-testid="reservation-card__status"
      state={reservation.state ?? ReservationStateChoice.Confirmed}
      key="status"
    />
  );

  const infos = [
    {
      icon: <IconEuroSign aria-label={t("common:price")} />,
      value: price ?? "",
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
        {t("reservations:cancel.reservationAbbreviated")}
        <IconCross aria-hidden />
      </ButtonLikeLink>
    );
  }
  buttons.push(
    <ButtonLikeLink
      href={link}
      data-testid="reservation-card__button--goto-reservation"
      key="show"
      width="full"
    >
      {t("common:show")}
      <IconArrowRight aria-hidden />
    </ButtonLikeLink>
  );

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

export default ReservationCard;
