import React from "react";
import { differenceInMinutes, parseISO } from "date-fns";
import { useTranslation } from "react-i18next";
import {
  getPriceUnitMinutes,
  getReservationPrice,
  getReservationVolume,
} from "common";
import styled from "styled-components";
import { IconCalendar } from "hds-react";
import { isFinite } from "lodash";
import { i18n } from "next-i18next";
import { fontMedium, H1, H2, Strongish } from "common/src/common/typography";
import { breakpoints } from "common/src/common/style";
import { capitalize, formatDurationMinutes } from "../../modules/util";
import {
  ReservationUnitByPkType,
  ReservationUnitsReservationUnitPriceUnitChoices,
} from "../../modules/gql-types";
import { getPrice } from "../../modules/reservationUnit";
import { NoWrap } from "../../styles/util";

export type TicketState = "incomplete" | "complete" | "error";

type Props = {
  state: TicketState;
  title: string;
  subtitle?: string;
  begin?: string;
  end?: string;
  isFree?: boolean;
  bgColor?: string;
  reservationPrice?: number;
  lowestPrice?: number;
  highestPrice?: number;
  priceUnit?: ReservationUnitsReservationUnitPriceUnitChoices;
  taxPercentage?: number;
};

const PunchHole = styled.div<{ $bgColor: string }>`
  &:last-of-type {
    right: -30px;
    left: auto;
  }

  position: absolute;
  width: 40px;
  height: 22px;
  bottom: -10px;
  left: -30px;
  border-radius: 50%;
  z-index: 1;
  background-color: ${({ $bgColor }) => $bgColor};

  @media (min-width: ${breakpoints.m}) {
    width: 22px;
    height: 40px;
    top: -30px;
    right: -10px;
    bottom: auto;
    left: auto;

    &:last-of-type {
      top: auto;
      right: -10px;
      bottom: -30px;
    }
  }
`;

const Wrapper = styled.div<{ $state: TicketState }>`
  &:after {
    content: "";
    width: 100%;
    height: 40px;
    position: absolute;
    bottom: -40px;
    left: 0;
    background-color: inherit;
    border-radius: 0 0 10px 10px;
    border-top: 2px dashed var(--color-white);

    @media (min-width: ${breakpoints.m}) {
      width: 60px;
      height: 100%;
      top: 0;
      left: auto;
      bottom: auto;
      right: -60px;
      border-top: none;
      border-left: 2px dashed var(--color-white);
      border-radius: 0 10px 10px 0;
    }
  }

  ${({ $state }) => {
    switch ($state) {
      case "complete":
        return "background-color: #e1f5f3";
      case "error":
        return "background-color: #ffe1e1";
      case "incomplete":
      default:
        return "background-color: #e5f3fd";
    }
  }};
  box-sizing: border-box;
  border-radius: 10px 10px 0 0;
  margin: 0 0 60px 0;
  padding: var(--spacing-m) var(--spacing-m);
  position: relative;
  width: 100%;

  @media (min-width: ${breakpoints.m}) {
    margin: 0;
    width: calc(100% - 60px);
    height: calc(100% + 40px);
    border-radius: 10px 0 0 10px;
  }
`;

const Content = styled.div``;

const Title = styled(H1)`
  font-size: 1.75rem;
  font-family: var(--font-bold);
  font-weight: 700;
  margin: 0 0 var(--spacing-s) 0;
`;

const Subtitle = styled(H2)`
  margin: 0 0 var(--spacing-m) 0;
  font-size: 22px;
`;

const Duration = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-xs);
  ${fontMedium}
`;

const Price = styled.div<{ $isFree: boolean }>`
  margin-top: var(--spacing-m);
  margin-bottom: var(--spacing-s);

  @media (min-width: ${breakpoints.m}) {
    margin-top: ${({ $isFree }) =>
      $isFree ? "var(--spacing-layout-xl)" : "var(--spacing-3-xl)"};
  }
`;

const PriceRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-m);
  margin-bottom: var(--spacing-2-xs);
`;

const Ticket = ({
  state,
  title,
  subtitle,
  begin,
  end,
  isFree,
  bgColor = "var(--color-white)",
  reservationPrice,
  lowestPrice,
  highestPrice,
  priceUnit,
  taxPercentage,
}: Props): JSX.Element => {
  const { t } = useTranslation();

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

  const reservationUnitPrices = {
    lowestPrice,
    highestPrice,
    priceUnit,
  };

  const duration = differenceInMinutes(new Date(end), new Date(begin));
  const timeString = `${beginDate} ${beginTime} - ${
    endDate !== beginDate ? endDate : ""
  }${endTime}`;

  const multiplier = getReservationVolume(duration, priceUnit);

  return (
    <Wrapper $state={state} data-testid="reservation__ticket--container">
      <PunchHole $bgColor={bgColor} />
      <Content>
        <Title data-test="reservation__title">{title}</Title>
        {subtitle && <Subtitle>{subtitle}</Subtitle>}
        {isFinite(duration) && (
          <Duration data-test="reservation__time-range">
            <IconCalendar />
            <span>
              {capitalize(timeString)}{" "}
              <NoWrap>
                (
                {t("common:duration", {
                  duration: formatDurationMinutes(duration),
                })}
                )
              </NoWrap>
            </span>
          </Duration>
        )}
        <Price $isFree={isFree} data-testid="reservation__price--container">
          {isFree ? (
            <Strongish>{t("reservationUnit:priceFree")}</Strongish>
          ) : (
            <>
              <PriceRow>
                <div>
                  <Strongish>
                    {t("reservations:reservationDuration", {
                      duration: formatDurationMinutes(duration),
                    })}
                  </Strongish>
                  {taxPercentage && (
                    <span>
                      (
                      {t("prices:taxPercentage", {
                        count: taxPercentage,
                      })}
                      )
                    </span>
                  )}
                </div>
                <div>
                  {reservationUnitPrices.highestPrice && (
                    <Strongish>
                      {priceUnit !== "FIXED" && `${multiplier} * `}
                      {getPrice(
                        reservationUnitPrices as ReservationUnitByPkType,
                        getPriceUnitMinutes(priceUnit),
                        true
                      )}
                    </Strongish>
                  )}
                </div>
              </PriceRow>
              <PriceRow>
                <div>
                  <Strongish>{t("prices:total")}</Strongish>
                </div>
                <div>
                  <Strongish>
                    {getReservationPrice(
                      reservationPrice,
                      i18n.t("prices:priceFree"),
                      i18n.language,
                      true
                    )}
                  </Strongish>
                </div>
              </PriceRow>
            </>
          )}
        </Price>
      </Content>
      <PunchHole $bgColor={bgColor} />
    </Wrapper>
  );
};

export default Ticket;
