import {
  IconGroup,
  IconInfoCircle,
  IconLocation,
  IconCheck,
  IconPlus,
} from "hds-react";
import React from "react";
import { useTranslation } from "next-i18next";
import Link from "next/link";
import styled from "styled-components";
import { breakpoint } from "../../modules/style";
import {
  getAddressAlt,
  getMainImage,
  getTranslation,
} from "../../modules/util";
import IconWithText from "../common/IconWithText";
import { MediumButton, pixel } from "../../styles/util";
import { ReservationUnitType } from "../../modules/gql-types";

interface Props {
  reservationUnit: ReservationUnitType;
  selectReservationUnit: (reservationUnit: ReservationUnitType) => void;
  containsReservationUnit: (reservationUnit: ReservationUnitType) => boolean;
  removeReservationUnit: (reservationUnit: ReservationUnitType) => void;
}

const Container = styled.div`
  display: grid;
  background-color: var(--color-white);
  margin-top: var(--spacing-s);
  grid-template-columns: 250px 5fr 3fr;

  @media (max-width: ${breakpoint.m}) {
    grid-template-columns: 1fr 1fr;
  }

  @media (max-width: ${breakpoint.s}) {
    display: block;
  }
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  margin: var(--spacing-m);

  @media (max-width: ${breakpoint.s}) {
    margin: var(--spacing-xs);
  }
`;

const Name = styled.span`
  font-size: var(--fontsize-heading-m);
  font-weight: 700;
  margin-bottom: var(--spacing-2-xs);
`;

const Description = styled.span`
  font-family: var(--font-regular);
  font-size: var(--fontsize-body-l);
  flex-grow: 1;
`;

const Bottom = styled.span`
  display: flex;
  font-weight: 500;
  align-items: center;
  gap: var(--spacing-l);
  font-size: var(--fontsize-body-m);
  font-family: var(--font-medium);

  > div {
    margin: 5px;

    :last-child {
      flex-grow: 1;
    }
  }

  @media (max-width: ${breakpoint.xl}) {
    display: block;
  }
`;

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  padding: var(--spacing-s) var(--spacing-m);
  align-items: flex-end;

  > button {
    white-space: nowrap;
  }

  @media (max-width: ${breakpoint.m}) {
    display: block;
  }

  @media (max-width: ${breakpoint.m}) {
    padding: 0 var(--spacing-xs) var(--spacing-xs) var(--spacing-xs);
  }
`;

const Image = styled.img`
  width: 240px;
  object-fit: cover;
  height: 156px;

  @media (max-width: ${breakpoint.s}) {
    width: 100%;
    height: 50vw;
  }
`;

const Anchor = styled.a`
  color: var(--color-black-90);
`;

const StyledIconWithText = styled(IconWithText)`
  span {
    margin-left: var(--spacing-2-xs);
  }
`;

const ReservationUnitCard = ({
  reservationUnit,
  selectReservationUnit,
  containsReservationUnit,
  removeReservationUnit,
}: Props): JSX.Element => {
  const { t } = useTranslation();

  return (
    <Container>
      <Link href={`../reservation-unit/${reservationUnit.pk}`} passHref>
        <Anchor>
          <Image
            alt={t("common:imgAltForSpace", {
              name: getTranslation(reservationUnit, "name"),
            })}
            src={getMainImage(reservationUnit)?.smallUrl || pixel}
          />
        </Anchor>
      </Link>
      <MainContent>
        <Name>
          <Link href={`../reservation-unit/${reservationUnit.pk}`} passHref>
            <Anchor>{getTranslation(reservationUnit, "name")}</Anchor>
          </Link>
        </Name>
        <Description>
          {getTranslation(reservationUnit.unit, "name")}
        </Description>
        <Bottom>
          {reservationUnit.reservationUnitType ? (
            <StyledIconWithText
              icon={
                <IconInfoCircle aria-label={t("reservationUnitCard:type")} />
              }
              text={getTranslation(reservationUnit.reservationUnitType, "name")}
            />
          ) : null}
          {reservationUnit.maxPersons ? (
            <StyledIconWithText
              icon={
                <IconGroup
                  aria-label={t("reservationUnitCard:maxPersons", {
                    maxPersons: reservationUnit.maxPersons,
                  })}
                />
              }
              text={`${reservationUnit.maxPersons}`}
            />
          ) : null}
          {getAddressAlt(reservationUnit) ? (
            <StyledIconWithText
              className="grow"
              icon={
                <IconLocation aria-label={t("reservationUnitCard:address")} />
              }
              text={getAddressAlt(reservationUnit)}
            />
          ) : null}{" "}
        </Bottom>
      </MainContent>
      <Actions>
        <div style={{ flexGrow: 1 }} />
        {containsReservationUnit(reservationUnit) ? (
          <MediumButton
            iconLeft={<IconCheck />}
            onClick={() => removeReservationUnit(reservationUnit)}
          >
            {t("common:removeReservationUnit")}
          </MediumButton>
        ) : (
          <MediumButton
            iconLeft={<IconPlus />}
            onClick={() => selectReservationUnit(reservationUnit)}
            variant="secondary"
          >
            {t("common:selectReservationUnit")}
          </MediumButton>
        )}
      </Actions>
    </Container>
  );
};

export default ReservationUnitCard;
