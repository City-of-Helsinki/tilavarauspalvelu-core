import { IconGroup, IconCheck, IconPlus, IconLinkExternal } from "hds-react";
import React from "react";
import { useTranslation } from "next-i18next";
import NextImage from "next/image";
import styled from "styled-components";
import { breakpoints } from "common/src/common/style";
import { H5, Strongish } from "common/src/common/typography";
import { ReservationUnitType } from "common/types/gql-types";
import {
  getAddressAlt,
  getMainImage,
  getTranslation,
} from "../../modules/util";
import IconWithText from "../common/IconWithText";
import {
  BlackButton,
  MediumButton,
  pixel,
  truncatedText,
} from "../../styles/util";
import { reservationUnitPrefix } from "../../modules/const";
import {
  getReservationUnitName,
  getUnitName,
} from "../../modules/reservationUnit";

interface Props {
  reservationUnit: ReservationUnitType;
  selectReservationUnit: (reservationUnit: ReservationUnitType) => void;
  containsReservationUnit: (reservationUnit: ReservationUnitType) => boolean;
  removeReservationUnit: (reservationUnit: ReservationUnitType) => void;
}

const Container = styled.div`
  display: block;
  background-color: var(--color-white);
  margin-top: var(--spacing-m);

  @media (min-width: ${breakpoints.s}) {
    display: grid;
    grid-template-columns: 226px auto;
  }
`;

const MainContent = styled.div`
  display: grid;
  margin: var(--spacing-s);

  @media (min-width: ${breakpoints.s}) and (max-width: ${breakpoints.m}) {
    margin-bottom: 0;
  }
`;

const Name = styled(H5).attrs({ as: "h2" })`
  font-family: var(--font-bold);
  font-weight: 700;
  margin: 0 0 var(--spacing-2-xs);
  line-height: var(--lineheight-m);

  @media (min-width: ${breakpoints.s}) {
    ${truncatedText};
  }
`;

const Description = styled.span`
  font-family: var(--font-regular);
  font-size: var(--fontsize-body-m);
  flex-grow: 1;
  height: 40px;

  @media (min-width: ${breakpoints.m}) {
    height: unset;
  }
`;

const Bottom = styled.span`
  display: block;

  > div {
    :last-child {
      flex-grow: 1;
    }
  }

  @media (min-width: ${breakpoints.l}) {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: var(--spacing-l);
  }
`;

const Props = styled.div`
  display: block;
  margin-bottom: var(--spacing-s);

  @media (min-width: ${breakpoints.m}) {
    display: flex;
    gap: var(--spacing-l);
  }
`;

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  padding: var(--spacing-s) 0 var(--spacing-s) 0;
  gap: var(--spacing-s);

  > button {
    white-space: nowrap;
  }

  @media (min-width: ${breakpoints.m}) {
    flex-direction: row;
    padding: 0;
    justify-content: flex-end;
  }
`;

const Image = styled.img`
  width: 100%;
  height: 50vw;
  object-fit: cover;
  max-width: 100%;

  @media (min-width: ${breakpoints.s}) {
    max-height: 250px;
    height: 100%;
  }

  @media (min-width: ${breakpoints.m}) {
    max-height: 182px;
  }

  @media (min-width: ${breakpoints.l}) {
    max-height: 150px;
  }
`;

const StyledIconWithText = styled(IconWithText)`
  margin-top: var(--spacing-xs);

  span {
    margin-left: var(--spacing-2-xs);
    font-size: var(--fontsize-body-s);
    ${truncatedText}
  }
`;

const ReservationUnitCard = ({
  reservationUnit,
  selectReservationUnit,
  containsReservationUnit,
  removeReservationUnit,
}: Props): JSX.Element => {
  const { t } = useTranslation();

  const name = getReservationUnitName(reservationUnit);

  const addressString = getAddressAlt(reservationUnit);

  const link = `${reservationUnitPrefix}/${reservationUnit.pk}`;

  const unitName = getUnitName(reservationUnit.unit);

  const reservationUnitTypeName = getTranslation(
    reservationUnit.reservationUnitType,
    "name"
  );

  return (
    <Container>
      <Image
        alt={name}
        src={getMainImage(reservationUnit)?.smallUrl || pixel}
      />
      <MainContent>
        <Name>{name}</Name>
        <Description>
          {unitName}
          {addressString && (
            <>
              {", "}
              <Strongish>{addressString}</Strongish>
            </>
          )}
        </Description>
        <Bottom>
          <Props>
            {reservationUnitTypeName && (
              <StyledIconWithText
                icon={
                  <NextImage
                    src="/icons/icon_premises.svg"
                    alt=""
                    width="24"
                    height="24"
                    aria-hidden="true"
                  />
                }
                text={reservationUnitTypeName}
              />
            )}
            {reservationUnit.maxPersons ? (
              <StyledIconWithText
                icon={
                  <IconGroup
                    aria-label={t("reservationUnitCard:maxPersons", {
                      maxPersons: reservationUnit.maxPersons,
                    })}
                    size="s"
                  />
                }
                text={`${t("reservationUnitCard:maxPersons", {
                  count: reservationUnit.maxPersons,
                })}`}
              />
            ) : null}
          </Props>
          <Actions>
            {containsReservationUnit(reservationUnit) ? (
              <MediumButton
                iconRight={<IconCheck />}
                onClick={() => removeReservationUnit(reservationUnit)}
                data-testid="reservation-unit-card__button--select"
              >
                {t("common:removeReservationUnit")}
              </MediumButton>
            ) : (
              <BlackButton
                iconRight={<IconPlus />}
                onClick={() => selectReservationUnit(reservationUnit)}
                variant="secondary"
                data-testid="reservation-unit-card__button--select"
              >
                {t("common:selectReservationUnit")}
              </BlackButton>
            )}
            <BlackButton
              variant="secondary"
              iconRight={<IconLinkExternal aria-hidden />}
              onClick={() => window.open(link, "_blank")}
              data-testid="reservation-unit-card__button--link"
            >
              {t("reservationUnitCard:seeMore")}
            </BlackButton>
          </Actions>
        </Bottom>
      </MainContent>
    </Container>
  );
};

export default ReservationUnitCard;
