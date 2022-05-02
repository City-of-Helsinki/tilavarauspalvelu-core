import { IconGroup, IconTicket } from "hds-react";
import React, { useMemo } from "react";
import { useTranslation } from "next-i18next";
import Link from "next/link";
import { useRouter } from "next/router";
import NextImage from "next/image";
import styled from "styled-components";
import { breakpoint } from "../../modules/style";
import {
  getAddressAlt,
  getMainImage,
  getTranslation,
} from "../../modules/util";
import IconWithText from "../common/IconWithText";
import { MediumButton, pixel, truncatedText } from "../../styles/util";
import { ReservationUnitType } from "../../modules/gql-types";
import { H5, Strongish } from "../../modules/style/typography";
import { getPrice } from "../../modules/reservationUnit";
import { reservationUnitSinglePrefix } from "../../modules/const";

interface Props {
  reservationUnit: ReservationUnitType;
}

const Container = styled.div`
  display: block;
  background-color: var(--color-white);
  margin-top: var(--spacing-s);

  @media (min-width: ${breakpoint.s}) {
    display: grid;
    grid-template-columns: 226px auto;
  }
`;

const MainContent = styled.div`
  display: grid;
  margin: var(--spacing-s);

  @media (min-width: ${breakpoint.s}) and (max-width: ${breakpoint.m}) {
    margin-bottom: 0;
  }
`;

const Name = styled(H5).attrs({ as: "h2" })`
  font-family: var(--font-bold);
  font-weight: 700;
  margin: 0 0 var(--spacing-2-xs);
  line-height: var(--lineheight-m);

  @media (min-width: ${breakpoint.s}) {
    ${truncatedText};
  }
`;

const Description = styled.span`
  font-family: var(--font-regular);
  font-size: var(--fontsize-body-m);
  flex-grow: 1;
  height: 40px;

  @media (min-width: ${breakpoint.m}) {
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

  @media (min-width: ${breakpoint.m}) {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: var(--spacing-l);
  }
`;

const Props = styled.div`
  display: block;

  @media (min-width: ${breakpoint.l}) {
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

  @media (min-width: ${breakpoint.m}) {
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

  @media (min-width: ${breakpoint.s}) {
    max-height: 250px;
    height: 100%;
  }

  @media (min-width: ${breakpoint.m}) {
    max-height: 182px;
  }

  @media (min-width: ${breakpoint.l}) {
    max-height: 150px;
  }
`;

const Anchor = styled.a`
  color: var(--color-black-90);
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

  const addressString = useMemo(
    () => getAddressAlt(reservationUnit),
    [reservationUnit]
  );

  const link = useMemo(
    () => `${reservationUnitSinglePrefix}/${reservationUnit.pk}`,
    [reservationUnit]
  );

  const unitPrice = useMemo(() => getPrice(reservationUnit), [reservationUnit]);

  return (
    <Container>
      <Link href={link} passHref>
        <Anchor style={{ display: "flex" }}>
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
          <Link href={link} passHref>
            <Anchor title={getTranslation(reservationUnit, "name")}>
              {getTranslation(reservationUnit, "name")}
            </Anchor>
          </Link>
        </Name>
        <Description>
          {getTranslation(reservationUnit.unit, "name")}
          {addressString && (
            <>
              {", "}
              <Strongish>{addressString}</Strongish>
            </>
          )}
        </Description>
        <Bottom>
          <Props>
            {reservationUnit.reservationUnitType ? (
              <StyledIconWithText
                icon={
                  <NextImage
                    src="/icons/icon_premises.svg"
                    width="24"
                    height="24"
                    aria-label={t("reservationUnitCard:type")}
                  />
                }
                text={getTranslation(
                  reservationUnit.reservationUnitType,
                  "name"
                )}
              />
            ) : null}
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
