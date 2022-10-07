import { getReservationPrice } from "common";
import { breakpoints } from "common/src/common/style";
import { differenceInMinutes, parseISO } from "date-fns";
import { trim } from "lodash";
import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import {
  ReservationType,
  ReservationUnitByPkType,
  ReservationUnitType,
} from "../../modules/gql-types";
import { H4 } from "../../modules/style/typography";
import {
  capitalize,
  formatDurationMinutes,
  getMainImage,
  getTranslation,
} from "../../modules/util";

type Props = {
  reservation: ReservationType;
  reservationUnit: ReservationUnitType | ReservationUnitByPkType;
};

const Wrapper = styled.div`
  background-color: var(--color-silver-light);
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

const ReservationInfoCard = ({
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

  const heading = trim(
    `${reservation.name} / ${getTranslation(reservationUnit, "name")}`,
    " / "
  );

  const ageGroup = trim(
    `${reservation.ageGroup?.minimum || ""} - ${
      reservation.ageGroup?.maximum || ""
    }`,
    " - "
  );

  const purpose = getTranslation(reservation.purpose, "name");

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
        <Value>
          {t("reservations:reservationNumber")}: {reservation.pk}
        </Value>
        <Value>{capitalize(timeString)} </Value>
        <Value>
          {t("reservationCalendar:duration")}:{" "}
          {t("common:duration", {
            duration: formatDurationMinutes(duration),
          })}
        </Value>
        <Value>
          {t("reservationCalendar:label.description")}:{" "}
          {reservation.description}
        </Value>
        <Value>
          {t("reservationUnit:price")}:{" "}
          {getReservationPrice(reservation.price, t("prices:priceFree"))}
        </Value>
        {purpose && (
          <Value>
            {t("reservations:purpose")}: {purpose}
          </Value>
        )}
        {ageGroup && (
          <Value>
            {t("reservations:ageGroup")}: {ageGroup}
          </Value>
        )}
        {reservation.numPersons && (
          <Value>
            {t("reservations:numPersons")}: {reservation.numPersons}
          </Value>
        )}
      </Content>
    </Wrapper>
  );
};

export default ReservationInfoCard;
