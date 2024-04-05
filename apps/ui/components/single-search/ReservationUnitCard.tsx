import { IconArrowRight, IconGlyphEuro, IconGroup, Tag } from "hds-react";
import React from "react";
import { useTranslation } from "next-i18next";
import Link from "next/link";
import NextImage from "next/image";
import styled from "styled-components";
import { H5 } from "common/src/common/typography";
import { breakpoints } from "common/src/common/style";
import type { ReservationUnitNode } from "common/types/gql-types";
import { format, isToday, isTomorrow } from "date-fns";
import { toUIDate } from "common/src/common/util";
import { getMainImage, getTranslation } from "@/modules/util";
import IconWithText from "../common/IconWithText";
import { truncatedText } from "@/styles/util";
import {
  getActivePricing,
  getPrice,
  getReservationUnitName,
  getUnitName,
} from "@/modules/reservationUnit";
import { reservationUnitPrefix } from "@/modules/const";
import { ButtonLikeLink } from "../common/ButtonLikeLink";
import { useSearchParams } from "next/navigation";
import { getImageSource } from "common/src/helpers";

interface PropsT {
  reservationUnit: ReservationUnitNode;
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
  margin-bottom: var(--spacing-s);

  @media (min-width: ${breakpoints.l}) {
    margin-bottom: 0;
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
  display: flex;
  gap: var(--spacing-s);
  flex-direction: column;
  align-items: start;

  @media (min-width: ${breakpoints.s}) {
    gap: var(--spacing-3-xs);
  }

  @media (min-width: ${breakpoints.l}) {
    flex-direction: row;
    gap: var(--spacing-l);
    align-items: end;
  }
`;

const Actions = styled.div`
  display: flex;
  padding: var(--spacing-m) var(--spacing-s) var(--spacing-s) 0;
  width: 100%;

  /* ButtonLikeLink doesn't scale to max-width on mobile */
  & > a {
    display: flex;
    flex-grow: 1;
  }

  @media (min-width: ${breakpoints.s}) {
    padding-top: var(--spacing-s);
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
  margin: 0;

  span {
    margin-left: var(--spacing-2-xs);
    font-size: var(--fontsize-body-s);
    ${truncatedText}
  }
`;

const StyledTag = styled(Tag)<{ $status: "available" | "no-times" | "closed" }>`
  margin-bottom: var(--spacing-s);

  @media (min-width: ${breakpoints.s}) {
    position: absolute;
    top: 0;
    right: 0;
    z-index: 1;
    margin: 0;
  }

  && {
    --tag-background: ${({ $status }) => {
      switch ($status) {
        case "available":
          return "var(--color-success-light)";
        case "no-times":
          return "var(--color-error-light)";
        case "closed":
          return "var(--color-black-10)";
      }
    }};
  }
`;

const StatusTag = (ru: {
  data: { closed: boolean; availableAt: string };
}): JSX.Element => {
  const { t } = useTranslation();
  const { closed, availableAt } = ru.data;

  if (closed) {
    return (
      <StyledTag $status="closed">{t("reservationUnitCard:closed")}</StyledTag>
    );
  }

  if (!availableAt) {
    return (
      <StyledTag $status="no-times">
        {t("reservationUnitCard:noTimes")}
      </StyledTag>
    );
  }

  let dayText = "";
  const timeText = format(new Date(availableAt), "HH:mm");
  if (isToday(new Date(availableAt))) {
    dayText = `${t("common:today")}`;
  } else if (isTomorrow(new Date(availableAt))) {
    dayText = `${t("common:tomorrow")}`;
  } else dayText = `${toUIDate(new Date(availableAt))} `;

  return <StyledTag $status="available">{`${dayText} ${timeText}`}</StyledTag>;
};

const ReservationUnitCard = ({ reservationUnit }: PropsT): JSX.Element => {
  const { t } = useTranslation();
  const params = useSearchParams();
  const date = params.get("startDate");
  const time = params.get("timeBegin");
  const duration = params.get("duration");

  const name = getReservationUnitName(reservationUnit);

  const linkURL = new URL(
    `${reservationUnitPrefix}/${reservationUnit.pk}`,
    document.baseURI
  );
  if (duration != null) linkURL.searchParams.set("duration", duration);
  if (date != null) linkURL.searchParams.set("date", date);
  if (time != null) linkURL.searchParams.set("time", time);
  const link = linkURL.toString();
  const unitName = getUnitName(reservationUnit.unit ?? undefined);

  const pricing = getActivePricing(reservationUnit);
  const unitPrice = pricing != null ? getPrice({ pricing }) : undefined;

  const reservationUnitTypeName =
    reservationUnit.reservationUnitType != null
      ? getTranslation(reservationUnit.reservationUnitType, "name")
      : undefined;

  const img = getMainImage(reservationUnit);
  const imgSrc = getImageSource(img, "small");

  return (
    <Container>
      <StyledLink href={link}>
        <Image alt={name} src={imgSrc} />
      </StyledLink>
      <MainContent>
        <Name>
          <StyledInlineLink href={link}>{name}</StyledInlineLink>
        </Name>
        <Description>{unitName}</Description>
        <div>
          <StatusTag
            data={{
              closed: reservationUnit.isClosed ?? false,
              availableAt: reservationUnit.firstReservableDatetime ?? "",
            }}
          />
        </div>
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
            <ButtonLikeLink href={link}>
              {t("reservationUnitCard:seeMore")}
              <IconArrowRight aria-hidden="true" />
            </ButtonLikeLink>
          </Actions>
        </Bottom>
      </MainContent>
    </Container>
  );
};

export default ReservationUnitCard;
