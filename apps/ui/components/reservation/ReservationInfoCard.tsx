import React, { useMemo } from "react";
import Link from "next/link";
import { differenceInMinutes, parseISO } from "date-fns";
import { trim } from "lodash";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import {
  getReservationPrice,
  formatters as getFormatters,
  type PendingReservation,
  type ReservationUnitNode,
} from "common";
import { breakpoints } from "common/src/common/style";
import { H4, Strong } from "common/src/common/typography";
import type { ReservationType } from "common/types/gql-types";
import { getReservationUnitPrice } from "@/modules/reservationUnit";
import {
  capitalize,
  formatDurationMinutes,
  getMainImage,
  getTranslation,
} from "@/modules/util";
import { reservationUnitPath } from "@/modules/const";

type Type = "pending" | "confirmed" | "complete";

type Props = {
  reservation: ReservationType | PendingReservation;
  reservationUnit: ReservationUnitNode | null;
  type: Type;
  shouldDisplayReservationUnitPrice?: boolean;
};

const Wrapper = styled.div<{ $type: Type }>`
  /* stylelint-disable custom-property-pattern */
  background-color: var(
    --color-${({ $type }) => ($type === "complete" ? "silver" : "gold")}-light
  );
`;

const MainImage = styled.img`
  display: none;

  @media (min-width: ${breakpoints.m}) {
    display: block;
    width: 100%;
    max-width: 100%;
    height: 291px;
    object-fit: cover;
  }
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

const ReservationInfoCard = ({
  reservation,
  reservationUnit,
  type,
  shouldDisplayReservationUnitPrice = false,
}: Props): JSX.Element | null => {
  const { t, i18n } = useTranslation();

  const { begin, end } = reservation || {};
  // NOTE can be removed after this has been refactored not to be used for PendingReservation
  const taxPercentageValue =
    "taxPercentageValue" in reservation
      ? reservation.taxPercentageValue
      : undefined;

  const beginDate = t("common:dateWithWeekday", {
    date: begin && parseISO(begin),
  });

  const beginTime = t("common:timeWithPrefixInForm", {
    date: begin && parseISO(begin),
  });

  const endDate = t("common:dateWithWeekday", {
    date: end && parseISO(end),
  });

  const endTime = t("common:timeInForm", {
    date: end && parseISO(end),
  });

  const duration = differenceInMinutes(new Date(end), new Date(begin));

  const timeString = trim(
    `${beginDate} ${beginTime}-${
      endDate !== beginDate ? endDate : ""
    }${endTime}`,
    " - "
  );

  const mainImage =
    reservationUnit != null ? getMainImage(reservationUnit) : null;

  const price: string | undefined =
    begin &&
    reservationUnit != null &&
    (reservation?.state === "REQUIRES_HANDLING" ||
      shouldDisplayReservationUnitPrice)
      ? getReservationUnitPrice({
          reservationUnit,
          pricingDate: new Date(begin),
          minutes: duration,
          trailingZeros: true,
        })
      : getReservationPrice(
          Number(reservation?.price),
          t("prices:priceFree"),
          i18n.language,
          true
        );

  const shouldDisplayTaxPercentage: boolean =
    reservationUnit != null &&
    reservation?.state === "REQUIRES_HANDLING" &&
    begin
      ? getReservationUnitPrice({
          reservationUnit,
          pricingDate: new Date(begin),
          minutes: 0,
          asInt: true,
        }) !== "0"
      : Number(reservation?.price) > 0;

  const formatters = useMemo(
    () => getFormatters(i18n.language),
    [i18n.language]
  );

  if (!reservation || !reservationUnit) return null;

  return (
    <Wrapper $type={type}>
      {mainImage?.mediumUrl && (
        <MainImage
          src={mainImage?.mediumUrl}
          alt={getTranslation(reservationUnit, "name")}
        />
      )}
      <Content data-testid="reservation__reservation-info-card__content">
        <Heading>
          <StyledLink
            data-testid="reservation__reservation-info-card__reservationUnit"
            href={reservationUnitPath(Number(reservationUnit.pk))}
          >
            {getTranslation(reservationUnit, "name")}
          </StyledLink>
        </Heading>
        {["confirmed", "complete"].includes(type) && (
          <Subheading>
            {t("reservations:reservationNumber")}:{" "}
            <span data-testid="reservation__reservation-info-card__reservationNumber">
              {reservation.pk}
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
            {capitalize(timeString)}, {formatDurationMinutes(duration)}
          </Strong>
        </Value>
        <Value data-testid="reservation__reservation-info-card__price">
          {t("reservationUnit:price")}: <Strong>{price}</Strong>{" "}
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
};

export default ReservationInfoCard;
