import React, { useMemo } from "react";
import { IconTicket, IconPlusCircle } from "hds-react";
import { useTranslation } from "next-i18next";
import { parseISO } from "date-fns";
import router from "next/router";
import styled, { css } from "styled-components";
import { breakpoint } from "../../modules/style";
import {
  getMainImage,
  getTranslation,
  reservationsUrl,
} from "../../modules/util";
import IconWithText from "../common/IconWithText";
import { MediumButton, truncatedText } from "../../styles/util";
import { ReservationType } from "../../modules/gql-types";
import { reservationUnitSinglePrefix } from "../../modules/const";
import {
  canUserCancelReservation,
  getReservationPrice,
} from "../../modules/reservation";
import { fontMedium } from "../../modules/style/typography";

type CardType = "upcoming" | "past" | "requiresHandling";

interface Props {
  reservation: ReservationType;
  type?: CardType;
}

const Container = styled.div`
  background-color: var(--color-white);
  margin-top: var(--spacing-s);
  position: relative;

  @media (min-width: ${breakpoint.m}) {
    display: grid;
    grid-template-columns: 300px 1fr;
  }

  @media (min-width: ${breakpoint.l}) {
    display: grid;
    grid-template-columns: 300px auto;

    & > div:nth-of-type(2) {
      grid-column: unset;
    }
  }
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  margin: var(--spacing-xs);

  @media (min-width: ${breakpoint.s}) {
    margin: var(--spacing-m);
  }

  @media (min-width: ${breakpoint.m}) {
    justify-content: space-between;
    flex-direction: column;
  }

  @media (min-width: ${breakpoint.l}) {
    white-space: pre;
    flex-direction: row;
  }
`;

const Details = styled.div`
  width: 10px;
  white-space: pre;
`;

const Name = styled.span`
  font-size: var(--fontsize-heading-m);
  font-weight: 700;
  margin-bottom: 0;

  a,
  a:visited {
    color: var(--color-black-90);
    text-decoration: none;
  }
`;

const Bottom = styled.span`
  display: flex;
  flex-direction: column;
  column-gap: var(--spacing-m);
  font-weight: 500;
  font-size: var(--fontsize-body-m);
  flex-wrap: wrap;
  margin-top: var(--spacing-2-xs);
`;

const Address = styled.div`
  ${fontMedium};
  margin-bottom: var(--spacing-s);
`;

const Price = styled(IconWithText)`
  span {
    margin-left: var(--spacing-2-xs);
    font-family: var(--font-medium);
    font-weight: 500;
  }
  margin-bottom: var(--spacing-2-xs);
`;

const Actions = styled.div`
  display: flex;
  padding-bottom: var(--spacing-s);
  flex-direction: column-reverse;

  button {
    width: 100%;
    font-family: var(--font-medium);
    font-weight: 500;
    margin-top: var(--spacing-s);
    white-space: nowrap;
    ${truncatedText};
  }

  @media (min-width: ${breakpoint.s}) {
    flex-direction: row;
    padding-bottom: var(--spacing-m);
    gap: var(--spacing-m);
  }

  @media (min-width: ${breakpoint.m}) {
    align-self: flex-end;
    justify-self: flex-end;
    padding: 0;

    button {
      width: 170px;
    }
  }

  @media (min-width: ${breakpoint.l}) {
    margin-top: 120px;

    button {
      width: unset;
    }
  }
`;

const Image = styled.img`
  object-fit: cover;
  max-width: 100%;
  width: 100%;
  height: 60vw;

  @media (min-width: ${breakpoint.s}) {
    height: 100%;
    max-height: 200px;
  }

  @media (min-width: ${breakpoint.m}) {
    max-width: 300px;
    max-height: unset;
  }

  @media (min-width: ${breakpoint.l}) {
    max-height: 240px;
  }
`;

const TimeStrip = styled.div<{ $type: CardType }>`
  ${({ $type }) => {
    switch ($type) {
      case "requiresHandling":
        return css`
          background-color: var(--color-summer);
        `;
      case "upcoming":
        return css`
          background-color: var(--color-copper);
        `;
      default:
        return css`
          background-color: var(--color-black-10);
        `;
    }
  }}
  padding: var(--spacing-2-xs) var(--spacing-s);
  font-size: var(--fontsize-body-s);
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  text-align: center;
  ${truncatedText};

  @media (min-width: ${breakpoint.m}) {
    position: relative;
    max-width: fit-content;
  }
`;

const ReservationCard = ({ reservation, type }: Props): JSX.Element => {
  const { t } = useTranslation();

  const reservationUnit = reservation.reservationUnits[0];
  const link = `/reservations/${reservation.pk}`;
  const address = `${
    getTranslation(reservationUnit.location, "addressStreet") || ""
  }`;

  const timeStripContent = useMemo(() => {
    const beginDate = t("common:dateWithWeekday", {
      date: reservation.begin && parseISO(reservation.begin),
    });

    const beginTime = t("common:timeWithPrefix", {
      date: reservation.begin && parseISO(reservation.begin),
    });

    const endDate = t("common:dateWithWeekday", {
      date: reservation.end && parseISO(reservation.end),
    });

    const endTime = t("common:time", {
      date: reservation.end && parseISO(reservation.end),
    });

    if (type === "requiresHandling") {
      return t("reservationApplication:processLabels.handlingRequired");
    }
    return `${t(`reservations:${type}Slug`)} ${beginDate} ${beginTime} -${
      endDate !== beginDate ? ` ${endDate}` : ""
    } ${endTime}`;
  }, [reservation, type, t]);

  return (
    <Container data-testid="reservation__card--container">
      <Image
        alt={t("common:imgAltForSpace", {
          name: getTranslation(reservation, "name"),
        })}
        src={
          getMainImage(reservationUnit)?.mediumUrl ||
          "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="
        }
      />
      <MainContent>
        <Details>
          <Name>{getTranslation(reservationUnit, "name")}</Name>
          <Bottom>
            <Address data-testid="reservation__card--unit">
              {getTranslation(reservationUnit.unit, "name")}
              {address && (
                <span data-testid="reservation__card--address">
                  , {address}
                </span>
              )}
            </Address>
            <TimeStrip $type={type} data-testid="reservation__card--time">
              {timeStripContent}
            </TimeStrip>
            <Price
              icon={<IconTicket aria-label={t("reservationUnit:price")} />}
              text={getReservationPrice(reservation.price)}
              data-testid="reservation__card--price"
            />
          </Bottom>
        </Details>
        <Actions>
          {["upcoming"].includes(type) &&
            canUserCancelReservation(reservation) && (
              <MediumButton
                variant="secondary"
                onClick={() =>
                  router.push(`${reservationsUrl}${reservation.pk}/cancel`)
                }
                data-testid="reservation-card__button--cancel-reservation"
              >
                {t("reservations:cancelReservation")}
              </MediumButton>
            )}
          {["past"].includes(type) && (
            <MediumButton
              variant="secondary"
              onClick={() =>
                router.push(
                  `${reservationUnitSinglePrefix}/${reservationUnit.pk}`
                )
              }
              iconLeft={<IconPlusCircle />}
              data-testid="reservation-card__button--redo-reservation"
            >
              {t("reservations:redoReservation")}
            </MediumButton>
          )}
          <MediumButton
            variant="primary"
            onClick={() => router.push(link)}
            data-testid="reservation-card__button--goto-reservation"
          >
            {t("reservationUnitCard:seeMore")}
          </MediumButton>
        </Actions>
      </MainContent>
    </Container>
  );
};

export default ReservationCard;
