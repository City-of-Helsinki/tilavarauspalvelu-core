import {
  Button,
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
`;

const Description = styled.span`
  font-size: var(--fontsize-body-l);
  flex-grow: 1;
`;

const Bottom = styled.span`
  display: flex;
  font-weight: 500;
  align-items: center;
  font-size: var(--fontsize-body-m);

  > div {
    margin: 5px;

    :last-child {
      flex-grow: 1;
    }
  }

  @media (max-width: ${breakpoint.l}) {
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
        src={
          getMainImage(reservationUnit)?.mediumUrl ||
          "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="
        }
      />
      <MainContent>
        <Name>
          <Link href={`../reservation-unit/${reservationUnit.id}`}>
            {localizedValue(reservationUnit.name, i18n.language)}
          </Link>
        </Name>
        <Description>
          {localizedValue(reservationUnit.building.name, i18n.language)}
        </Description>
        <Bottom>
          {reservationUnit.reservationUnitType ? (
            <IconWithText
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
            <IconWithText
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
            <IconWithText
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
          <Button
            iconLeft={<IconCheck />}
            onClick={() => removeReservationUnit(reservationUnit)}
          >
            {t("common:removeReservationUnit")}
          </Button>
        ) : (
          <Button
            iconLeft={<IconPlus />}
            onClick={() => selectReservationUnit(reservationUnit)}
            variant="secondary"
          >
            {t("common:selectReservationUnit")}
          </Button>
        )}
      </Actions>
    </Container>
  );
};

export default ReservationUnitCard;
