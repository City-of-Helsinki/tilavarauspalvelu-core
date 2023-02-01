import { IconArrowRight, IconGroup, IconTicket } from "hds-react";
import React from "react";
import { useTranslation } from "next-i18next";
import NextImage from "next/image";
import router from "next/router";
import Link from "next/link";
import styled from "styled-components";
import { useMedia } from "react-use";
import { breakpoints } from "common/src/common/style";
import { ReservationUnitType } from "common/types/gql-types";
import { reservationUnitPath } from "../../modules/const";
import { getMainImage, getTranslation } from "../../modules/util";
import IconWithText from "../common/IconWithText";
import Carousel from "../Carousel";
import {
  getActivePricing,
  getPrice,
  getReservationUnitName,
  getUnitName,
} from "../../modules/reservationUnit";
import { SupplementaryButton, truncatedText } from "../../styles/util";

type PropsType = {
  units: ReservationUnitType[];
};

const Wrapper = styled.div`
  margin: 0 var(--spacing-s);

  @media (min-width: ${breakpoints.m}) {
    margin: 0;
  }
`;

const StyledCarousel = styled(Carousel)`
  .slider-list {
    cursor: default !important;
  }
`;

const Content = styled.div`
  padding: var(--spacing-s);
  height: 180px;
  position: relative;
`;

const Unit = styled.div`
  background-color: var(--color-black-5);
`;

const Name = styled.div`
  &:hover {
    opacity: 0.5;
  }

  cursor: pointer;
  font-family: var(--font-bold);
  font-weight: 700;
  font-size: var(--fontsize-heading-s);
  margin-bottom: var(--spacing-xs);
  ${truncatedText};
`;

const Image = styled.img`
  width: 100%;
  height: 205px;
  object-fit: cover;
`;

const Building = styled.div`
  font-family: var(--font-regular);
  margin: var(--spacing-3-xs) 0 var(--spacing-xs);
  ${truncatedText};
`;

const Props = styled.div`
  font-size: var(--fontsize-body-s);
  display: grid;
  grid-template-columns: 1fr;
  gap: 0;
`;

const StyledIconWithText = styled(IconWithText)`
  margin-top: var(--spacing-xs);
`;

const Buttons = styled.div`
  position: absolute;
  right: 0;
  bottom: 0;
`;

const LinkButton = styled(SupplementaryButton)`
  --color-coat-of-arms: transparent;
  --color-bus-dark: transparent;

  svg {
    color: black;
  }
`;

const RelatedUnits = ({ units }: PropsType): JSX.Element | null => {
  const { t } = useTranslation();
  const isMobile = useMedia(`(max-width: ${breakpoints.m})`, false);
  const isWideMobile = useMedia(`(max-width: ${breakpoints.l})`, false);

  if (units.length === 0) {
    return null;
  }
  return (
    <Wrapper>
      <StyledCarousel
        slidesToShow={isMobile ? 1 : isWideMobile ? 2 : 3}
        slidesToScroll={isMobile ? 1 : isWideMobile ? 2 : 3}
        wrapAround={false}
        hideCenterControls
        cellSpacing={24}
      >
        {units.map((unit) => {
          const pricing = getActivePricing(unit);
          const unitPrice = getPrice({ pricing });
          const reservationUnitTypeName = getTranslation(
            unit.reservationUnitType,
            "name"
          );
          return (
            <Unit key={unit.pk}>
              <Image
                src={getMainImage(unit)?.mediumUrl}
                alt=""
                style={{ marginTop: 0 }}
              />
              <Content>
                <Link href={reservationUnitPath(unit.pk)} passHref>
                  <Name>{getReservationUnitName(unit)}</Name>
                </Link>
                <Building>{getUnitName(unit.unit)}</Building>
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
                  {unit.maxPersons && (
                    <StyledIconWithText
                      icon={
                        <IconGroup
                          aria-label={t("reservationUnitCard:maxPersons", {
                            maxPersons: unit.maxPersons,
                          })}
                        />
                      }
                      text={t("reservationUnitCard:maxPersons", {
                        count: unit.maxPersons,
                      })}
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
                </Props>
                <Buttons>
                  <LinkButton
                    onClick={() => router.push(reservationUnitPath(unit.pk))}
                  >
                    <IconArrowRight
                      size="l"
                      aria-label={getReservationUnitName(unit)}
                    />
                  </LinkButton>
                </Buttons>
              </Content>
            </Unit>
          );
        })}
      </StyledCarousel>
    </Wrapper>
  );
};

export default RelatedUnits;
