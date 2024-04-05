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
} from "common";
import { breakpoints } from "common/src/common/style";
import { H4, Strong } from "common/src/common/typography";
import type {
  ReservationUnitNode,
  ReservationNode,
} from "common/types/gql-types";
import { getReservationUnitPrice } from "@/modules/reservationUnit";
import {
  capitalize,
  formatDuration,
  getMainImage,
  getTranslation,
} from "@/modules/util";
import { reservationUnitPath } from "@/modules/const";
import { getImageSource } from "common/src/helpers";

type Type = "pending" | "confirmed" | "complete";

type Props = {
  reservation: ReservationNode | PendingReservation;
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
  const formatters = useMemo(
    () => getFormatters(i18n.language),
    [i18n.language]
  );

  if (!reservation || !reservationUnit) {
    return null;
  }

  const price: string | undefined =
    begin &&
    (reservation?.state === "REQUIRES_HANDLING" ||
      shouldDisplayReservationUnitPrice)
      ? getReservationUnitPrice({
          reservationUnit,
          pricingDate: new Date(begin),
          minutes: duration,
          trailingZeros: true,
        })
      : getReservationPrice(
          reservation?.price,
          t("prices:priceFree"),
          i18n.language,
          true
        );

  const shouldDisplayTaxPercentage: boolean =
    reservation.state === "REQUIRES_HANDLING" && begin
      ? getReservationUnitPrice({
          reservationUnit,
          pricingDate: new Date(begin),
          minutes: 0,
          asNumeral: true,
        }) !== "0"
      : Number(reservation?.price) > 0;

  const name = getTranslation(reservationUnit, "name");
  const img = getMainImage(reservationUnit);
  const imgSrc = getImageSource(img, "medium");

  const link = reservationUnit.pk
    ? reservationUnitPath(reservationUnit.pk)
    : "";

  return (
    <Wrapper $type={type}>
      <MainImage src={imgSrc} alt={name} />
      <Content data-testid="reservation__reservation-info-card__content">
        <Heading>
          <StyledLink
            data-testid="reservation__reservation-info-card__reservationUnit"
            href={link}
          >
            {name}
          </StyledLink>
        </Heading>
        {["confirmed", "complete"].includes(type) && (
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
