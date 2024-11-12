import React, { useMemo } from "react";
import Link from "next/link";
import { gql } from "@apollo/client";
import { differenceInMinutes } from "date-fns";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import {
  getReservationPrice,
  formatters as getFormatters,
  breakpoints,
} from "common";
import { H4, Strong } from "common/src/common/typography";
import {
  ReservationStateChoice,
  type ReservationInfoCardFragment,
} from "@gql/gql-types";
import {
  getReservationUnitPrice,
  isReservationUnitPaid,
} from "@/modules/reservationUnit";
import {
  capitalize,
  formatDuration,
  getMainImage,
  getTranslation,
  formatDateTimeRange,
} from "@/modules/util";
import { getImageSource } from "common/src/helpers";
import { getReservationUnitPath } from "@/modules/urls";

type Type = "pending" | "confirmed" | "complete";

export const RESERVATION_INFO_CARD_FRAGMENT = gql`
  fragment ReservationInfoCard on ReservationNode {
    pk
    taxPercentageValue
    begin
    end
    state
    price
    reservationUnits {
      id
      pk
      nameFi
      nameEn
      nameSv
      ...PriceReservationUnit
      images {
        ...Image
      }
      unit {
        id
        nameFi
        nameEn
        nameSv
      }
    }
  }
`;

type Props = {
  reservation: ReservationInfoCardFragment;
  type: Type;
  shouldDisplayReservationUnitPrice?: boolean;
  disableImage?: boolean;
};

const Wrapper = styled.div<{ $type: Type }>`
  /* stylelint-disable custom-property-pattern */
  background-color: var(
    --color-${({ $type }) => ($type === "complete" ? "silver" : "gold")}-light
  );

  width: 100%;
  @media (width > ${breakpoints.m}) {
    /* inside a grid so we need to force the size */
    width: 390px;
  }
`;

const MainImage = styled.img`
  display: block;
  width: 100%;
  max-width: 100%;
  height: 291px;
  object-fit: cover;
`;

const Content = styled.div`
  padding: 1px var(--spacing-m) var(--spacing-xs);
`;

const Heading = styled(H4).attrs({ as: "h3" })`
  margin-top: var(--spacing-m);
  margin-bottom: var(--spacing-xs);
`;

const StyledLink = styled(Link)`
  text-decoration: underline;
  color: var(--color-black-90);
  text-underline-offset: 4px;
`;

const Value = styled.div`
  margin-bottom: var(--spacing-s);
  line-height: var(--lineheight-l);
`;

const Subheading = styled(Value)`
  font-size: var(--fontsize-body-l);
  line-height: var(--lineheight-xl);
  margin-bottom: var(--spacing-xs);
`;

export function ReservationInfoCard({
  reservation,
  type,
  shouldDisplayReservationUnitPrice = false,
  disableImage = false,
}: Props): JSX.Element | null {
  const { t, i18n } = useTranslation();
  const reservationUnit = reservation.reservationUnits?.[0];

  const { begin, end } = reservation || {};
  // NOTE can be removed after this has been refactored not to be used for PendingReservation
  const taxPercentageValue = reservation.taxPercentageValue;

  const duration = differenceInMinutes(new Date(end), new Date(begin));
  const timeString = capitalize(
    formatDateTimeRange(t, new Date(begin), new Date(end))
  );

  const formatters = useMemo(
    () => getFormatters(i18n.language),
    [i18n.language]
  );

  if (!reservation || !reservationUnit) {
    return null;
  }

  const price: string | null =
    reservation.state === ReservationStateChoice.RequiresHandling ||
    shouldDisplayReservationUnitPrice
      ? getReservationUnitPrice({
          t,
          reservationUnit,
          pricingDate: new Date(begin),
          minutes: duration,
        })
      : getReservationPrice(
          reservation?.price,
          t("prices:priceFree"),
          true,
          i18n.language
        );

  const shouldDisplayTaxPercentage: boolean =
    reservation.state === ReservationStateChoice.RequiresHandling && begin
      ? isReservationUnitPaid(reservationUnit.pricings, new Date(begin))
      : Number(reservation?.price) > 0;

  const name = getTranslation(reservationUnit, "name");
  const img = getMainImage(reservationUnit);
  const imgSrc = getImageSource(img, "medium");

  return (
    <Wrapper $type={type}>
      {!disableImage && <MainImage src={imgSrc} alt={name} />}
      <Content data-testid="reservation__reservation-info-card__content">
        <Heading>
          <StyledLink
            data-testid="reservation__reservation-info-card__reservationUnit"
            href={getReservationUnitPath(reservationUnit.pk)}
          >
            {name}
          </StyledLink>
        </Heading>
        {(type === "confirmed" || type === "complete") && (
          <Subheading>
            {t("reservations:reservationNumber")}:{" "}
            <span data-testid="reservation__reservation-info-card__reservationNumber">
              {reservation.pk ?? "-"}
            </span>
          </Subheading>
        )}
        <Subheading>
          {reservationUnit.unit != null
            ? getTranslation(reservationUnit.unit, "name")
            : "-"}
        </Subheading>
        <Value data-testid="reservation__reservation-info-card__duration">
          <Strong>
            {capitalize(timeString)}, {formatDuration(duration, t)}
          </Strong>
        </Value>
        <Value data-testid="reservation__reservation-info-card__price">
          {t("common:price")}: <Strong>{price}</Strong>{" "}
          {taxPercentageValue &&
            shouldDisplayTaxPercentage &&
            `(${t("common:inclTax", {
              taxPercentage: formatters.strippedDecimal.format(
                parseFloat(taxPercentageValue)
              ),
            })})`}
        </Value>
      </Content>
    </Wrapper>
  );
}
