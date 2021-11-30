import React from "react";
import { IconLocation, IconHome, IconTicket, IconPlusCircle } from "hds-react";
import { useTranslation } from "next-i18next";
import { parseISO } from "date-fns";
import router from "next/router";
import styled from "styled-components";
import { breakpoint } from "../../modules/style";
import {
  getMainImage,
  getTranslation,
  reservationsUrl,
} from "../../modules/util";
import IconWithText from "../common/IconWithText";
import { MediumButton } from "../../styles/util";
import { ReservationType } from "../../modules/gql-types";
import { reservationUnitSinglePrefix } from "../../modules/const";
import { canUserCancelReservation } from "../../modules/reservation";

type CardType = "upcoming" | "past";

interface Props {
  reservation: ReservationType;
  type?: CardType;
}

const Container = styled.div`
  background-color: var(--color-white);
  margin-top: var(--spacing-s);
  position: relative;

  @media (min-width: ${breakpoint.s}) {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  @media (min-width: ${breakpoint.m}) {
    grid-template-columns: 250px 5fr 3fr;
  }
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  margin: var(--spacing-m) var(--spacing-m) var(--spacing-s) var(--spacing-m);

  @media (max-width: ${breakpoint.s}) {
    margin: var(--spacing-xs);
  }
`;

const Name = styled.span`
  font-size: var(--fontsize-heading-m);
  font-weight: 700;
  margin-bottom: var(--spacing-2-xs);

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

  > div {
    margin: 5px;
  }
`;

const StyledIconWithText = styled(IconWithText)`
  span {
    margin-left: var(--spacing-2-xs);
    font-family: var(--font-medium);
    font-weight: 500;
  }
`;

const Actions = styled.div`
  display: block;
  padding: 0 var(--spacing-xs) var(--spacing-xs) var(--spacing-xs);

  button {
    width: 100%;
    height: 45px;
    font-family: var(--font-medium);
    font-weight: 500;
    margin-top: var(--spacing-s);
    white-space: nowrap;
  }

  @media (min-width: ${breakpoint.m}) {
    display: flex;
    align-self: flex-end;
    flex-direction: column;

    button {
      min-width: 170px;
    }
  }

  @media (min-width: ${breakpoint.l}) {
    padding: var(--spacing-s) var(--spacing-m);
    flex-direction: row;
    gap: var(--spacing-m);

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
  }

  @media (min-width: ${breakpoint.l}) {
    height: 156px;
  }
`;

const TimeStrip = styled.div<{ $type: CardType }>`
  background-color: ${({ $type }) =>
    $type === "upcoming" ? "var(--color-summer)" : "var(--color-black-10)"};
  position: absolute;
  top: 0;
  right: 0;
  padding: var(--spacing-3-xs) var(--spacing-2-xs);
  font-size: var(--fontsize-body-s);
`;

const ReservationCard = ({ reservation, type }: Props): JSX.Element => {
  const { t } = useTranslation();

  const reservationUnit = reservation.reservationUnits[0];
  const link = `/reservations/${reservation.pk}`;
  const address = `${
    getTranslation(reservationUnit.location, "addressStreet") || ""
  }`;

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

  const timeStripContent = `${t(
    `reservations:${type}Slug`
  )} ${beginDate} ${beginTime} -${
    endDate !== beginDate ? ` ${endDate}` : ""
  } ${endTime}`;

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
        <Name>{getTranslation(reservationUnit, "name")}</Name>
        <Bottom>
          <StyledIconWithText
            icon={<IconHome aria-label={t("reservationUnitCard:type")} />}
            text={getTranslation(reservationUnit.unit, "name")}
          />
          {address && (
            <StyledIconWithText
              className="grow"
              icon={
                <IconLocation aria-label={t("reservationUnitCard:address")} />
              }
              text={address}
            />
          )}
          <StyledIconWithText
            icon={<IconTicket aria-label={t("reservationUnit:price")} />}
            text={t("reservationUnit:priceFree")}
          />
        </Bottom>
      </MainContent>
      <Actions>
        {type === "upcoming" ? (
          <MediumButton
            variant="secondary"
            onClick={() =>
              router.push(`${reservationsUrl}${reservation.pk}/cancel`)
            }
            disabled={!canUserCancelReservation(reservation)}
            data-testid="reservation-card__button--cancel-reservation"
          >
            {t("reservations:cancelReservation")}
          </MediumButton>
        ) : (
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
      <TimeStrip $type={type} data-testid="reservation-card__time">
        {timeStripContent}
      </TimeStrip>
    </Container>
  );
};

export default ReservationCard;
