import { getReservationPrice } from "common";
import { breakpoints } from "common/src/common/style";
import { differenceInMinutes, parseISO } from "date-fns";
import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { H4, Strong } from "common/src/common/typography";
import {
  ReservationType,
  ReservationUnitByPkType,
  ReservationUnitType,
} from "../../modules/gql-types";
import {
  capitalize,
  formatDurationMinutes,
  getMainImage,
  getTranslation,
} from "../../modules/util";
import { getReservationUnitPrice } from "../../modules/reservationUnit";

type Props = {
  reservation: ReservationType;
  reservationUnit: ReservationUnitType | ReservationUnitByPkType;
};

const Wrapper = styled.div`
  background-color: var(--color-gold-light);
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
`;

const Value = styled.div`
  margin-bottom: var(--spacing-s);
`;

const PendingReservationInfoCard = ({
  reservation,
  reservationUnit,
}: Props): JSX.Element => {
  const { t } = useTranslation();

  const { begin, end } = reservation;

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

  const timeString = `${beginDate} ${beginTime} - ${
    endDate !== beginDate ? endDate : ""
  }${endTime}`;

  const mainImage = getMainImage(reservationUnit);

  const heading = getTranslation(reservationUnit, "name");

  const price =
    reservation.state === "REQUIRES_HANDLING"
      ? getReservationUnitPrice(reservationUnit)
      : getReservationPrice(reservation.price, t("prices:priceFree"));

  return (
    <Wrapper>
      {mainImage?.mediumUrl && (
        <MainImage
          src={mainImage?.mediumUrl}
          alt={getTranslation(reservationUnit, "name")}
        />
      )}
      <Content data-testid="reservation__reservation-info-card__content">
        <Heading>{heading}</Heading>
        <Value>{getTranslation(reservationUnit, "name")}</Value>
        <Value>
          {getTranslation(reservationUnit?.unit?.location, "addressStreet")}
        </Value>
        <Value>
          <Strong>{capitalize(timeString)}</Strong>
        </Value>
        <Value>
          {t("reservationCalendar:duration")}:{" "}
          <Strong>{formatDurationMinutes(duration)}</Strong>
        </Value>
        <Value>
          {t("reservationUnit:price")}: <Strong>{price}</Strong>
        </Value>
      </Content>
    </Wrapper>
  );
};

export default PendingReservationInfoCard;
