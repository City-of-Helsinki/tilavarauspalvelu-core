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
import { ReservationUnit } from "../../modules/types";
import { getAddress, getMainImage, localizedValue } from "../../modules/util";
import IconWithText from "../common/IconWithText";
import { MediumButton, pixel } from "../../styles/util";

interface Props {
  reservationUnit: ReservationUnit;
  selectReservationUnit: (reservationUnit: ReservationUnit) => void;
  containsReservationUnit: (reservationUnit: ReservationUnit) => boolean;
  removeReservationUnit: (reservationUnit: ReservationUnit) => void;
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
  const { t, i18n } = useTranslation();

  return (
    <Container>
      <Image
        alt={t("common:imgAltForSpace", {
          name: localizedValue(reservationUnit.name, i18n.language),
        })}
        src={getMainImage(reservationUnit)?.mediumUrl || pixel}
      />
      <MainContent>
        <Name>
          <Link href={`../reservation-unit/${reservationUnit.id}`} passHref>
            <Anchor>
              {localizedValue(reservationUnit.name, i18n.language)}
            </Anchor>
          </Link>
        </Name>
        <Description>
          {localizedValue(reservationUnit.building?.name, i18n.language)}
        </Description>
        <Bottom>
          {reservationUnit.reservationUnitType ? (
            <StyledIconWithText
              icon={
                <IconInfoCircle aria-label={t("reservationUnitCard:type")} />
              }
              text={localizedValue(
                reservationUnit.reservationUnitType?.name,
                i18n.language
              )}
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
          {getAddress(reservationUnit) ? (
            <StyledIconWithText
              className="grow"
              icon={
                <IconLocation aria-label={t("reservationUnitCard:address")} />
              }
              text={getAddress(reservationUnit) || ""}
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
