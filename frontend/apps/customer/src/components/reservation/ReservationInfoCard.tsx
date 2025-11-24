import React, { useMemo } from "react";
import { gql } from "@apollo/client";
import { differenceInMinutes } from "date-fns";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { Card } from "@ui/components";
import { formatters as getFormatters } from "@ui/index";
import { breakpoints } from "@ui/modules/const";
import { formatDateTimeRange, formatDuration } from "@ui/modules/date-utils";
import {
  createNodeId,
  capitalize,
  getImageSource,
  getLocalizationLang,
  getTranslation,
  getMainImage,
} from "@ui/modules/helpers";
import { Flex, fontMedium, Strong } from "@ui/styled";
import { getPrice, isReservationUnitPaid } from "@/modules/reservationUnit";
import { getReservationUnitPath } from "@/modules/urls";
import {
  AccessType,
  type ReservationInfoCardFragment,
  ReservationStateChoice,
  useAccessCodeQuery,
} from "@gql/gql-types";

const InfoCard = styled(Card)`
  && h2 {
    margin: 0;
    color: var(--color-black-90);
    font-size: var(--fontsize-heading-s);
    ${fontMedium};
    text-decoration: underline;
    text-underline-offset: 4px;
    @media (min-width: ${breakpoints.s}) {
      font-size: var(--fontsize-heading-m);
    }
  }
  [class*="Card__ImageWrapper"],
  img {
    height: 291px;
    max-height: 291px;
  }
  .card-with-image {
    gap: var(--spacing-xs);
  }
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
      includeWeekday: true,
    })
  );

  const formatters = useMemo(() => getFormatters(i18n.language), [i18n.language]);

  if (!reservation || !reservationUnit) {
    return null;
  }

  const duration = differenceInMinutes(new Date(endsAt), new Date(beginsAt));
  const lang = getLocalizationLang(i18n.language);
  const price: string | null = getPrice(t, reservation, lang, shouldDisplayReservationUnitPrice);

  const { taxPercentageValue, state } = reservation;

  const showReservationNumber = state != null && state !== ReservationStateChoice.Created;

  const shouldDisplayTaxPercentage: boolean =
    state === ReservationStateChoice.RequiresHandling
      ? isReservationUnitPaid(reservationUnit.pricings, new Date(beginsAt))
      : Number(reservation?.price) > 0;

  const name = getTranslation(reservationUnit, "name", lang);
  const img = getMainImage(reservationUnit);
  const imgSrc = getImageSource(img, "medium");

  const unitName = reservationUnit.unit != null ? getTranslation(reservationUnit.unit, "name", lang) : "-";

  return (
    <InfoCard
      variant="vertical"
      backgroundColor={bgColor === "gold" ? "var(--color-gold-light)" : "var(--color-silver-light)"}
      className={className}
      style={{ ...style, height: "auto" }}
      imageSrc={!disableImage ? imgSrc : undefined}
      imageAlt={!disableImage ? name : undefined}
      heading={name}
      headingLevel={2}
      link={getReservationUnitPath(reservationUnit.pk)}
    >
      <Flex data-testid="reservation__reservation-info-card__content" $gap="xs">
        {showReservationNumber && (
          <Subheading>
            {t("reservation:reservationNumber")}:{" "}
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
              taxPercentage: formatters.strippedDecimal?.format(Number.parseFloat(taxPercentageValue)),
            })})`}
        </div>
        {reservation.accessType !== AccessType.Unrestricted && (
          <div data-testid="reservation__reservation-info-card__accessType">
            {!shouldDisplayAccessCode && `${t("reservationUnit:accessType")}: `}
            {t(`reservationUnit:accessTypes.${reservation.accessType}`)}
            {shouldDisplayAccessCode && accessCode && `: ${accessCode}`}
          </div>
        )}
      </Flex>
    </InfoCard>
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
