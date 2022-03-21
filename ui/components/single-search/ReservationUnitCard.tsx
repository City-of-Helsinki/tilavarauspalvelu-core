import { IconGroup, IconLocation, IconHome, IconTicket } from "hds-react";
import React from "react";
import { useTranslation } from "next-i18next";
import router from "next/router";
import Link from "next/link";
import styled from "styled-components";
import { breakpoint } from "../../modules/style";
import { getMainImage, getTranslation } from "../../modules/util";
import IconWithText from "../common/IconWithText";
import { MediumButton } from "../../styles/util";
import { ReservationUnitType } from "../../modules/gql-types";
import { getPrice } from "../../modules/reservationUnit";

interface Props {
  reservationUnit: ReservationUnitType;
}

const Container = styled.div`
  background-color: var(--color-white);
  margin-top: var(--spacing-s);

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

const Description = styled.span`
  font-size: var(--fontsize-body-l);
  font-family: var(--font-regular);
  font-weight: 400;
  flex-grow: 1;
`;

const Bottom = styled.span`
  display: flex;
  column-gap: var(--spacing-m);
  font-weight: 500;
  font-size: var(--fontsize-body-m);
  flex-wrap: wrap;
  margin-top: var(--spacing-m);

  > div {
    margin: 5px;

    :last-child {
      flex-grow: 1;
    }
  }
`;

const StyledIconWithText = styled(IconWithText)`
  span {
    margin-left: var(--spacing-2-xs);
    font-family: var(--font-medium);
    font-weight: 500;

    @media (min-width: ${breakpoint.m}) {
      white-space: nowrap;
    }
  }
`;

const Actions = styled.div`
  flex-direction: column;
  align-items: flex-end;
  display: block;
  padding: 0 var(--spacing-xs) var(--spacing-xs) var(--spacing-xs);

  button {
    width: 100%;
    font-family: var(--font-medium);
    font-weight: 500;
    margin-top: var(--spacing-s);
  }

  @media (min-width: ${breakpoint.m}) {
    display: flex;
    padding: var(--spacing-s) var(--spacing-m);

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

const ReservationUnitCard = ({ reservationUnit }: Props): JSX.Element => {
  const { t } = useTranslation();

  const link = `/reservation-unit/single/${reservationUnit.pk}`;
  const address = `${
    getTranslation(reservationUnit.unit?.location, "addressStreet") || ""
  }`;

  const unitPrice = getPrice(reservationUnit);

  return (
    <Container>
      <Image
        alt={t("common:imgAltForSpace", {
          name: getTranslation(reservationUnit, "name"),
        })}
        src={
          getMainImage(reservationUnit)?.mediumUrl ||
          "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="
        }
      />
      <MainContent>
        <Name>
          <Link href={link}>{getTranslation(reservationUnit, "name")}</Link>
        </Name>
        <Description>
          {getTranslation(reservationUnit.unit, "name")}
        </Description>
        <Bottom>
          {reservationUnit.reservationUnitType && (
            <StyledIconWithText
              icon={<IconHome aria-label={t("reservationUnitCard:type")} />}
              text={getTranslation(reservationUnit.reservationUnitType, "name")}
            />
          )}
          {reservationUnit.maxPersons && (
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
          )}
          {unitPrice && (
            <StyledIconWithText
              icon={
                <IconTicket
                  aria-label={t("prices:reservationUnitPriceLabel")}
                />
              }
              text={unitPrice}
            />
          )}
          {address && (
            <StyledIconWithText
              className="grow"
              icon={
                <IconLocation aria-label={t("reservationUnitCard:address")} />
              }
              text={address}
            />
          )}
        </Bottom>
      </MainContent>
      <Actions>
        <div style={{ flexGrow: 1 }} />
        <MediumButton variant="secondary" onClick={() => router.push(link)}>
          {t("reservationUnitCard:seeMore")}
        </MediumButton>
      </Actions>
    </Container>
  );
};

export default ReservationUnitCard;
