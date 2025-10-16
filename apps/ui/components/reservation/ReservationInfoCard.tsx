import React, { useMemo } from "react";
import Link from "next/link";
import { gql } from "@apollo/client";
import { differenceInMinutes } from "date-fns";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { formatters as getFormatters } from "common";
import { Flex, H4, Strong } from "common/styled";
import {
  AccessType,
  type ReservationInfoCardFragment,
  ReservationStateChoice,
  useAccessCodeQuery,
} from "@gql/gql-types";
import { getPrice, isReservationUnitPaid } from "@/modules/reservationUnit";
import { createNodeId, capitalize, getImageSource, getLocalizationLang, getMainImage } from "common/src/helpers";
import { formatDateTimeRange, formatDuration } from "common/src/date-utils";
import { getReservationUnitPath } from "@/modules/urls";
import { convertLanguageCode, getTranslationSafe } from "common/src/common/util";

const Wrapper = styled.div<{ $color: "gold" | "silver" }>`
  --bg-color: var(${({ $color }) => ($color === "gold" ? "--color-gold-light" : "--color-silver-light")});
  background-color: var(--bg-color);
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
  shouldDisplayReservationUnitPrice?: boolean;
  // Background color of the card
  bgColor?: "gold" | "silver";
  // Hide the reservation unit image
  disableImage?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

export function ReservationInfoCard({
  reservation,
  bgColor = "silver",
  shouldDisplayReservationUnitPrice = false,
  disableImage = false,
  className,
  style,
}: Readonly<Props>): JSX.Element | null {
  const { t, i18n } = useTranslation();
  const reservationUnit = reservation.reservationUnit;
  const { data: accessCodeData } = useAccessCodeQuery({
    skip: !reservation || reservation.accessType !== AccessType.AccessCode,
    variables: {
      id: createNodeId("ReservationNode", reservation.pk ?? 0),
    },
  });
  const { accessCode } = accessCodeData?.reservation?.pindoraInfo ?? {};
  const shouldDisplayAccessCode = accessCodeData?.reservation?.pindoraInfo?.accessCodeIsActive;

  const { beginsAt, endsAt } = reservation || {};
  // NOTE can be removed after this has been refactored not to be used for PendingReservation

  const timeString = capitalize(
    formatDateTimeRange(new Date(beginsAt), new Date(endsAt), {
      locale: getLocalizationLang(i18n.language),
      includeWeekday: false,
    })
  );

  const formatters = useMemo(() => getFormatters(i18n.language), [i18n.language]);

  if (!reservation || !reservationUnit) {
    return null;
  }

  const duration = differenceInMinutes(new Date(endsAt), new Date(beginsAt));
  const lang = convertLanguageCode(i18n.language);
  const price: string | null = getPrice(t, reservation, lang, shouldDisplayReservationUnitPrice);

  const { taxPercentageValue, state } = reservation;

  const showReservationNumber = state != null && state !== ReservationStateChoice.Created;

  const shouldDisplayTaxPercentage: boolean =
    state === ReservationStateChoice.RequiresHandling
      ? isReservationUnitPaid(reservationUnit.pricings, new Date(beginsAt))
      : Number(reservation?.price) > 0;

  const name = getTranslationSafe(reservationUnit, "name", lang);
  const img = getMainImage(reservationUnit);
  const imgSrc = getImageSource(img, "medium");

  const unitName = reservationUnit.unit != null ? getTranslationSafe(reservationUnit.unit, "name", lang) : "-";

  // TODO why does this not use the Card component?
  return (
    <Wrapper $color={bgColor} className={className} style={style}>
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
        {showReservationNumber && (
          <Subheading>
            {t("reservations:reservationNumber")}:{" "}
            <span data-testid="reservation__reservation-info-card__reservationNumber">{reservation.pk ?? "-"}</span>
          </Subheading>
        )}
        <Subheading>{unitName}</Subheading>
        <div data-testid="reservation__reservation-info-card__duration">
          <Strong>
            {capitalize(timeString)}, {formatDuration(t, { minutes: duration })}
          </Strong>
        </div>
        <div data-testid="reservation__reservation-info-card__price">
          {t("common:price")}: <Strong>{price}</Strong>{" "}
          {taxPercentageValue &&
            shouldDisplayTaxPercentage &&
            `(${t("common:inclTax", {
              taxPercentage: formatters.strippedDecimal?.format(parseFloat(taxPercentageValue)),
            })})`}
        </div>
        {reservation.accessType !== AccessType.Unrestricted && (
          <div data-testid="reservation__reservation-info-card__accessType">
            {!shouldDisplayAccessCode && `${t("reservationUnit:accessType")}: `}
            {t(`reservationUnit:accessTypes.${reservation.accessType}`)}
            {shouldDisplayAccessCode && accessCode && `: ${accessCode}`}
          </div>
        )}
      </Content>
    </Wrapper>
  );
}

export const RESERVATION_INFO_CARD_FRAGMENT = gql`
  fragment ReservationInfoCard on ReservationNode {
    id
    pk
    ...ReservationPriceFields
    taxPercentageValue
    state
    accessType
    pindoraInfo {
      accessCode
    }
    reservationUnit {
      id
      pk
      nameFi
      nameEn
      nameSv
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
