import React, { useMemo } from "react";
import Link from "next/link";
import { gql } from "@apollo/client";
import { differenceInMinutes } from "date-fns";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { formatters as getFormatters } from "common";
import { H4, Strong } from "common/src/common/typography";
import {
  ReservationStateChoice,
  type ReservationInfoCardFragment,
} from "@gql/gql-types";
import { getPrice, isReservationUnitPaid } from "@/modules/reservationUnit";
import {
  capitalize,
  formatDuration,
  getMainImage,
  getTranslation,
  formatDateTimeRange,
} from "@/modules/util";
import { getImageSource } from "common/src/helpers";
import { getReservationUnitPath } from "@/modules/urls";
import { Flex } from "common/styles/util";
import {
  convertLanguageCode,
  getTranslationSafe,
} from "common/src/common/util";

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

const Wrapper = styled.div<{ $type: Type }>`
  /* stylelint-disable custom-property-pattern */
  background-color: var(
    --color-${({ $type }) => ($type === "complete" ? "silver" : "gold")}-light
  );
`;

const MainImage = styled.img`
  display: block;
  width: 100%;
  max-width: 100%;
  height: 291px;
  object-fit: cover;
`;

const Content = styled(Flex).attrs({
  $gap: "xs",
})`
  padding: 1px var(--spacing-m) var(--spacing-xs);
`;

const StyledLink = styled(Link)`
  text-decoration: underline;
  color: var(--color-black-90);
  text-underline-offset: 4px;
`;

const Subheading = styled.p`
  margin: 0;
`;

type Props = {
  reservation: ReservationInfoCardFragment;
  type: Type;
  shouldDisplayReservationUnitPrice?: boolean;
  disableImage?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

export function ReservationInfoCard({
  reservation,
  type,
  shouldDisplayReservationUnitPrice = false,
  disableImage = false,
  className,
  style,
}: Props): JSX.Element | null {
  const { t, i18n } = useTranslation();
  const reservationUnit = reservation.reservationUnits?.[0];

  const { begin, end } = reservation || {};
  // NOTE can be removed after this has been refactored not to be used for PendingReservation
  const taxPercentageValue = reservation.taxPercentageValue;

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

  const duration = differenceInMinutes(new Date(end), new Date(begin));
  const lang = convertLanguageCode(i18n.language);
  const price: string | null = getPrice(
    t,
    reservation,
    lang,
    shouldDisplayReservationUnitPrice
  );
  const shouldDisplayTaxPercentage: boolean =
    reservation.state === ReservationStateChoice.RequiresHandling && begin
      ? isReservationUnitPaid(reservationUnit.pricings, new Date(begin))
      : Number(reservation?.price) > 0;

  const name = getTranslation(reservationUnit, "name");
  const img = getMainImage(reservationUnit);
  const imgSrc = getImageSource(img, "medium");

  const unitName =
    reservationUnit.unit != null
      ? getTranslationSafe(reservationUnit.unit, "name", lang)
      : "-";

  // TODO why does this not use the Card component?
  return (
    <Wrapper $type={type} className={className} style={style}>
      {!disableImage && <MainImage src={imgSrc} alt={name} />}
      <Content data-testid="reservation__reservation-info-card__content">
        <H4 as="h2" $marginBottom="none">
          <StyledLink
            data-testid="reservation__reservation-info-card__reservationUnit"
            href={getReservationUnitPath(reservationUnit.pk)}
          >
            {name}
          </StyledLink>
        </H4>
        {(type === "confirmed" || type === "complete") && (
          <Subheading>
            {t("reservations:reservationNumber")}:{" "}
            <span data-testid="reservation__reservation-info-card__reservationNumber">
              {reservation.pk ?? "-"}
            </span>
          </Subheading>
        )}
        <Subheading>{unitName}</Subheading>
        <div data-testid="reservation__reservation-info-card__duration">
          <Strong>
            {capitalize(timeString)}, {formatDuration(duration, t)}
          </Strong>
        </div>
        <div data-testid="reservation__reservation-info-card__price">
          {t("common:price")}: <Strong>{price}</Strong>{" "}
          {taxPercentageValue &&
            shouldDisplayTaxPercentage &&
            `(${t("common:inclTax", {
              taxPercentage: formatters.strippedDecimal.format(
                parseFloat(taxPercentageValue)
              ),
            })})`}
        </div>
      </Content>
    </Wrapper>
  );
}
