import { IconGlyphEuro, IconGroup, Tag } from "hds-react";
import React from "react";
import { useTranslation } from "next-i18next";
import Link from "next/link";
import { useRouter } from "next/router";
import NextImage from "next/image";
import styled from "styled-components";
import { H5, Strongish } from "common/src/common/typography";
import { breakpoints } from "common/src/common/style";
import { ReservationUnitType } from "common/types/gql-types";
import { addDays, format, isToday, isTomorrow } from "date-fns";
import { toUIDate } from "common/src/common/util";
import { getAddressAlt, getMainImage, getTranslation } from "@/modules/util";
import IconWithText from "../common/IconWithText";
import { MediumButton, pixel, truncatedText } from "@/styles/util";
import {
  getActivePricing,
  getPrice,
  getReservationUnitName,
  getUnitName,
} from "@/modules/reservationUnit";
import { reservationUnitPrefix } from "@/modules/const";

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
  position: relative;

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

const StyledTag = styled(Tag)`
  position: absolute;
  top: 0;
  right: 0;
  z-index: 1;
  /* TODO: Remove the && block when API is ready */
  && {
    display: none;
  }
  &.available {
    background: var(--color-success-light);
  }
  &.no-times {
    background: var(--color-error-light);
  }
  &.closed {
    background: var(--tag-background);
  }
`;

const StatusTag = ({
  data,
}: {
  data: { closed: boolean; availableAt?: Date };
}): JSX.Element => {
  const { t } = useTranslation();

  if (data.closed) {
    return (
      <StyledTag className="closed">
        {t("reservationUnitCard:closed")}
      </StyledTag>
    );
  }

  if (!data.availableAt) {
    return (
      <StyledTag className="no-times">
        {t("reservationUnitCard:noTimes")}
      </StyledTag>
    );
  }

  let dayText = "";
  const timeText = format(data.availableAt, "HH:mm");
  if (isToday(data.availableAt)) {
    dayText = `${t("common:today")}`;
  } else if (isTomorrow(data.availableAt)) {
    dayText = `${t("common:tomorrow")}`;
  } else dayText = `${toUIDate(data.availableAt)} `;

  return (
    <StyledTag className="available">{`${dayText} ${timeText}`}</StyledTag>
  );
};

const ReservationUnitCard = ({ reservationUnit }: Props): JSX.Element => {
  const { t } = useTranslation();

  const router = useRouter();

  const name = getReservationUnitName(reservationUnit);

  const addressString = getAddressAlt(reservationUnit);

  const link = `${reservationUnitPrefix}/${reservationUnit.pk}`;

  const unitName = getUnitName(reservationUnit.unit ?? undefined);

  const pricing = getActivePricing(reservationUnit);
  const unitPrice = pricing != null ? getPrice({ pricing }) : undefined;

  const reservationUnitTypeName =
    reservationUnit.reservationUnitType != null
      ? getTranslation(reservationUnit.reservationUnitType, "name")
      : undefined;

  const getMockData = (): { closed: boolean; availableAt?: Date } => {
    const today = new Date();
    today.setHours(12, 34);
    const mockData = [
      {
        closed: true,
      },
      {
        closed: false,
        availableAt: today,
      },
      {
        closed: false,
        availableAt: addDays(today, 1),
      },
      {
        closed: false,
        availableAt: addDays(today, 2),
      },
      {
        closed: false,
        availableAt: undefined,
      },
    ];
    return mockData[Math.floor(Math.random() * mockData.length)];
  };

  return (
    <Container>
      <StyledLink href={link}>
        <Image
          alt={name}
          src={getMainImage(reservationUnit)?.smallUrl || pixel}
        />
      </StyledLink>
      <MainContent>
        <Name>
          <StyledInlineLink href={link}>{name}</StyledInlineLink>
        </Name>
        <StatusTag data={getMockData()} />
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
