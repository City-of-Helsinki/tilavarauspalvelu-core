import { IconGlyphEuro, IconGroup } from "hds-react";
import React, { useMemo } from "react";
import { useTranslation } from "next-i18next";
import Link from "next/link";
import { useRouter } from "next/router";
import NextImage from "next/image";
import styled from "styled-components";
import { H5, Strongish } from "common/src/common/typography";
import { breakpoints } from "common/src/common/style";
import { ReservationUnitType } from "common/types/gql-types";
import {
  getAddressAlt,
  getMainImage,
  getTranslation,
} from "../../modules/util";
import IconWithText from "../common/IconWithText";
import { MediumButton, pixel, truncatedText } from "../../styles/util";
import {
  getActivePricing,
  getPrice,
  getReservationUnitName,
  getUnitName,
} from "../../modules/reservationUnit";
import { reservationUnitPrefix } from "../../modules/const";

interface Props {
  reservationUnit: ReservationUnitType;
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

  @media (min-width: ${breakpoints.m}) {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: var(--spacing-l);
  }
`;

const Props = styled.div`
  display: block;

  @media (min-width: ${breakpoints.l}) {
    display: flex;
    gap: var(--spacing-l);
  }
`;

const Actions = styled.div`
  display: block;
  padding: var(--spacing-s) var(--spacing-s) var(--spacing-s) 0;

  > button {
    white-space: nowrap;
  }

  @media (min-width: ${breakpoints.m}) {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    padding: 0;
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

const StyledLink = styled(Link)`
  color: var(--color-black-90);
  display: flex;
`;

const StyledInlineLink = styled(StyledLink)`
  display: inline;
`;

const StyledIconWithText = styled(IconWithText)`
  margin-top: var(--spacing-xs);

  span {
    margin-left: var(--spacing-2-xs);
    font-size: var(--fontsize-body-s);
    ${truncatedText}
  }
`;

const ReservationUnitCard = ({ reservationUnit }: Props): JSX.Element => {
  const { t } = useTranslation();

  const router = useRouter();

  const name = getReservationUnitName(reservationUnit);

  const addressString = getAddressAlt(reservationUnit);

  const link = `${reservationUnitPrefix}/${reservationUnit.pk}`;

  const unitName = getUnitName(reservationUnit.unit);

  const unitPrice = useMemo(() => {
    const pricing = getActivePricing(reservationUnit);
    return getPrice({ pricing });
  }, [reservationUnit]);

  const reservationUnitTypeName = getTranslation(
    reservationUnit.reservationUnitType,
    "name"
  );

  return (
    <Container>
      <StyledLink href={link}>
        <Image
          alt={t("common:imgAltForSpace", {
            name,
          })}
          src={getMainImage(reservationUnit)?.smallUrl || pixel}
        />
      </StyledLink>
      <MainContent>
        <Name>
          <StyledInlineLink href={link}>{name}</StyledInlineLink>
        </Name>
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
                    alt={t("common:headAlt")}
                    width="24"
                    height="24"
                    aria-label={t("reservationUnitCard:type")}
                  />
                }
                text={reservationUnitTypeName}
              />
            )}
            {unitPrice && (
              <StyledIconWithText
                icon={
                  <IconGlyphEuro
                    aria-label={t("prices:reservationUnitPriceLabel")}
                  />
                }
                text={unitPrice}
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
            <div style={{ flexGrow: 1 }} />
            <MediumButton variant="secondary" onClick={() => router.push(link)}>
              {t("reservationUnitCard:seeMore")}
            </MediumButton>
          </Actions>
        </Bottom>
      </MainContent>
    </Container>
  );
};

export default ReservationUnitCard;
