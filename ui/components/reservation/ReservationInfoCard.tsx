import { getReservationPrice, formatters as getFormatters } from "common";
import { breakpoints } from "common/src/common/style";
import { H4, Strong } from "common/src/common/typography";
import { differenceInMinutes, parseISO } from "date-fns";
import Link from "next/link";
import { trim } from "lodash";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import {
  ReservationType,
  ReservationUnitByPkType,
  ReservationUnitType,
} from "common/types/gql-types";
import { getReservationUnitPrice } from "../../modules/reservationUnit";
import {
  capitalize,
  formatDurationMinutes,
  getMainImage,
  getTranslation,
} from "../../modules/util";
import { reservationUnitPath } from "../../modules/const";

type Type = "pending" | "confirmed" | "complete";

type Props = {
  reservation: ReservationType;
  reservationUnit: ReservationUnitType | ReservationUnitByPkType;
  type: Type;
  shouldDisplayReservationUnitPrice?: boolean;
};

const Wrapper = styled.div<{ $type: Type }>`
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

const Anchor = styled.a`
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
}: Props): JSX.Element => {
  const { t, i18n } = useTranslation();

  const { begin, end, taxPercentageValue } = reservation || {};

  const beginDate = t("common:dateWithWeekday", {
    date: begin && parseISO(begin),
  });

  const beginTime = t("common:timeWithPrefix", {
    date: begin && parseISO(begin),
  });

  const endDate = t("common:dateWithWeekday", {
    date: end && parseISO(end),
  });

  const endTime = t("common:time", {
    date: end && parseISO(end),
  });

  const duration = differenceInMinutes(new Date(end), new Date(begin));

  const timeString = trim(
    `${beginDate} ${beginTime} - ${
      endDate !== beginDate ? endDate : ""
    }${endTime}`,
    " - "
  );

  const mainImage = getMainImage(reservationUnit);

  const ageGroup = trim(
    `${reservation?.ageGroup?.minimum || ""} - ${
      reservation?.ageGroup?.maximum || ""
    }`,
    " - "
  );

  const headingContent =
    type === "confirmed" ? (
      <Link passHref href={reservationUnitPath(reservationUnit.pk)}>
        <Anchor>{getTranslation(reservationUnit, "name")}</Anchor>
      </Link>
    ) : (
      getTranslation(reservationUnit, "name")
    );

  const purpose = getTranslation(reservation?.purpose, "name");

  const price: string =
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
    reservation?.state === "REQUIRES_HANDLING" && begin
      ? getReservationUnitPrice({
          reservationUnit,
          pricingDate: new Date(begin),
          minutes: 0,
          asInt: true,
        }) !== "0"
      : reservation?.price > 0;

  const formatters = useMemo(
    () => getFormatters(i18n.language),
    [i18n.language]
  );

  return (
    <Wrapper $type={type}>
      {mainImage?.mediumUrl && (
        <MainImage
          src={mainImage?.mediumUrl}
          alt={getTranslation(reservationUnit, "name")}
        />
      )}
      <Content data-testid="reservation__reservation-info-card__content">
        <Heading>{headingContent}</Heading>
        {["confirmed", "complete"].includes(type) && (
          <Subheading>
            {t("reservations:reservationNumber")}: {reservation?.pk}
          </Subheading>
        )}
        <Subheading>{getTranslation(reservationUnit.unit, "name")}</Subheading>
        <Value>
          <Strong>
            {capitalize(timeString)}, {formatDurationMinutes(duration)}
          </Strong>
        </Value>
        {reservation?.description && ["confirmed", "complete"].includes(type) && (
          <Value>
            {t("reservationCalendar:label.description")}:{" "}
            {reservation?.description}
          </Value>
        )}
        <Value>
          {t("reservationUnit:price")}: <Strong>{price}</Strong>{" "}
          {taxPercentageValue &&
            shouldDisplayTaxPercentage &&
            `(${t("common:inclTax", {
              taxPercentage: formatters.strippedDecimal.format(
                reservation?.taxPercentageValue
              ),
            })})`}
        </Value>
        {purpose && ["complete"].includes(type) && (
          <Value>
            {t("reservations:purpose")}: {purpose}
          </Value>
        )}
        {ageGroup && ["complete"].includes(type) && (
          <Value>
            {t("reservations:ageGroup")}: {ageGroup}
          </Value>
        )}
        {reservation?.numPersons > 0 && ["complete"].includes(type) && (
          <Value>
            {t("reservations:numPersons")}: {reservation?.numPersons}
          </Value>
        )}
      </Content>
    </Wrapper>
  );
};

export default ReservationInfoCard;
