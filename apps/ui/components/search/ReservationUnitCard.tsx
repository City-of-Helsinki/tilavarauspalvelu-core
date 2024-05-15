import {
  IconGroup,
  IconCheck,
  IconPlus,
  IconLinkExternal,
  Button,
} from "hds-react";
import React from "react";
import { useTranslation } from "next-i18next";
import NextImage from "next/image";
import styled from "styled-components";
import { breakpoints } from "common/src/common/style";
import { H5, fontMedium } from "common/src/common/typography";
import type { ReservationUnitNode } from "@gql/gql-types";
import { getMainImage, getTranslation } from "@/modules/util";
import IconWithText from "@/components/common/IconWithText";
import { truncatedText } from "@/styles/util";
import { reservationUnitPrefix } from "@/modules/const";
import { getReservationUnitName, getUnitName } from "@/modules/reservationUnit";
import { getImageSource } from "common/src/helpers";

interface IProps {
  reservationUnit: ReservationUnitNode;
  selectReservationUnit: (reservationUnit: ReservationUnitNode) => void;
  containsReservationUnit: (reservationUnit: ReservationUnitNode) => boolean;
  removeReservationUnit: (reservationUnit: ReservationUnitNode) => void;
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
`;

const Bottom = styled.div`
  display: flex;

  > div {
    :last-child {
      flex-grow: 1;
    }
  }

  flex-direction: column;
  align-items: flex-start;

  @media (min-width: ${breakpoints.s}) {
    flex-direction: row;
    align-items: center;
  }
`;

const Props = styled.div`
  display: block;

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
  flex-grow: 1;
  width: 100%;

  > button {
    white-space: nowrap;
  }

  @media (min-width: ${breakpoints.m}) {
    flex-direction: row;
    width: auto;
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

/* TODO something is overriding button font-family to be bold */
const StyledButton = styled(Button).attrs({ size: "small" })`
  && {
    ${fontMedium}
  }
`;

const ReservationUnitCard = ({
  reservationUnit,
  selectReservationUnit,
  containsReservationUnit,
  removeReservationUnit,
}: IProps): JSX.Element => {
  const { t, i18n } = useTranslation();

  const name = getReservationUnitName(reservationUnit);

  const localeString = i18n.language === "fi" ? "" : `/${i18n.language}`;
  const link = `${localeString}${reservationUnitPrefix}/${reservationUnit.pk}`;

  const unitName = reservationUnit.unit
    ? getUnitName(reservationUnit.unit)
    : "-";

  const reservationUnitTypeName =
    reservationUnit.reservationUnitType != null
      ? getTranslation(reservationUnit.reservationUnitType, "name")
      : undefined;

  const img = getMainImage(reservationUnit);
  const imgSrc = getImageSource(img, "small");

  return (
    <Container>
      <Image alt={name} src={imgSrc} />
      <MainContent>
        <Name>{name}</Name>
        <Description>{unitName}</Description>
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
              <StyledButton
                iconRight={<IconCheck />}
                onClick={() => removeReservationUnit(reservationUnit)}
                data-testid="reservation-unit-card__button--select"
              >
                {t("common:removeReservationUnit")}
              </StyledButton>
            ) : (
              <StyledButton
                variant="secondary"
                iconRight={<IconPlus />}
                onClick={() => selectReservationUnit(reservationUnit)}
                data-testid="reservation-unit-card__button--select"
              >
                {t("common:selectReservationUnit")}
              </StyledButton>
            )}
            <StyledButton
              variant="secondary"
              iconRight={<IconLinkExternal aria-hidden />}
              onClick={() => window.open(link, "_blank")}
              data-testid="reservation-unit-card__button--link"
            >
              {t("reservationUnitCard:seeMore")}
            </StyledButton>
          </Actions>
        </Bottom>
      </MainContent>
    </Container>
  );
};

export default ReservationUnitCard;
