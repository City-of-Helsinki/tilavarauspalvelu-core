import { IconClock, IconGroup, IconGlyphEuro } from "hds-react";
import React from "react";
import NextImage from "next/image";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { isReservationStartInFuture } from "common/src/calendar/util";
import { formatDuration } from "common/src/common/util";
import { fontRegular, H2, H3 } from "common/src/common/typography";
import { breakpoints } from "common/src/common/style";
import { ReservationKind, type ReservationUnitPageQuery } from "@gql/gql-types";
import { Container } from "common";
import {
  formatDate,
  getTranslation,
  orderImages,
  singleSearchUrl,
} from "@/modules/util";
import IconWithText from "../common/IconWithText";
import { Images } from "./Images";
import {
  getActivePricing,
  getPrice,
  getReservationUnitName,
  getUnitName,
} from "@/modules/reservationUnit";
import BreadcrumbWrapper from "../common/BreadcrumbWrapper";

type QueryT = NonNullable<ReservationUnitPageQuery["reservationUnit"]>;
interface PropsType {
  reservationUnit: QueryT;
  reservationUnitIsReservable?: boolean;
  subventionSuffix?: JSX.Element;
}

type NotificationType = "alert";

const TopContainer = styled.div`
  background-color: white;
  padding-top: var(--spacing-m);

  @media (min-width: ${breakpoints.m}) {
    padding-top: var(--spacing-l);
  }
`;

const RightContainer = styled.div`
  font-size: var(--fontsize-body-m);
  display: grid;
  grid-template-columns: 1fr;

  @media (min-width: ${breakpoints.l}) {
    grid-template-columns: auto 465px;
    gap: var(--spacing-layout-2-xl);
  }
`;

const StyledIconWithText = styled(IconWithText)`
  display: grid;
  align-items: flex-start;
  white-space: pre-line;
  line-height: var(--lineheight-l);
  margin-top: unset;
`;

const Props = styled.div`
  & > div:empty {
    display: none;
  }

  ${fontRegular};
  font-size: var(--fontsize-body-s);
  display: grid;
  grid-template-columns: repeat(2, auto);
  gap: var(--spacing-m) var(--spacing-s);
  margin-bottom: var(--spacing-m);

  @media (min-width: ${breakpoints.m}) {
    margin-bottom: var(--spacing-l);
  }

  @media (min-width: ${breakpoints.l}) {
    grid-template-columns: repeat(2, auto);
  }

  @media (min-width: ${breakpoints.xl}) {
    grid-template-columns: repeat(4, auto);
  }
`;

const Wrapper = styled.div<{ $type: NotificationType }>`
  background-color: ${({ $type }) =>
    $type === "alert" ? "var(--color-engel-light)" : "transparent"};
  font-size: var(--fontsize-body-l);
  padding: var(--spacing-s);
  margin-bottom: var(--spacing-m);
  display: inline-block;
`;

const ReservationUnitName = styled(H2).attrs({ as: "h1" })`
  margin-top: 0;
`;

const UnitName = styled(H3).attrs({ as: "h2" })`
  margin-top: 0;
  margin-bottom: var(--spacing-m);

  @media (min-width: ${breakpoints.m}) {
    margin-bottom: var(--spacing-l);
  }
`;

function NonReservableNotification({
  reservationUnit,
}: {
  reservationUnit: QueryT;
}) {
  const { t } = useTranslation();
  let returnText = t("reservationUnit:notifications.notReservable");
  const futureOpeningText = t("reservationUnit:notifications.futureOpening", {
    date: reservationUnit.reservationBegins
      ? formatDate(reservationUnit.reservationBegins, "d.M.yyyy")
      : "",
    time: reservationUnit.reservationBegins
      ? formatDate(reservationUnit.reservationBegins, "H.mm")
      : "",
  });
  if (reservationUnit.reservationKind === ReservationKind.Season) {
    returnText = t("reservationUnit:notifications.onlyRecurring");
  } else if (isReservationStartInFuture(reservationUnit))
    returnText = futureOpeningText;
  return (
    <Wrapper
      $type="alert"
      data-testid="reservation-unit--notification__reservation-start"
    >
      {returnText}
    </Wrapper>
  );
}

function Head({
  reservationUnit,
  // activeOpeningTimes,
  reservationUnitIsReservable,
  subventionSuffix,
}: PropsType): JSX.Element {
  const { t } = useTranslation();

  const searchUrl = singleSearchUrl();

  const minDur = reservationUnit.minReservationDuration ?? 0;
  const maxDur = reservationUnit.maxReservationDuration ?? 0;
  const minReservationDuration = formatDuration(minDur / 60, t, true);
  const maxReservationDuration = formatDuration(maxDur / 60, t, true);

  const pricing = getActivePricing(reservationUnit);
  const unitPrice = pricing ? getPrice({ pricing }) : undefined;

  const unitPriceSuffix =
    pricing &&
    getPrice({ pricing, asNumeral: true }) !== "0" &&
    subventionSuffix != null
      ? subventionSuffix
      : undefined;

  const reservationUnitName = getReservationUnitName(reservationUnit);

  const unitName = getUnitName(reservationUnit.unit ?? undefined);

  return (
    <>
      <BreadcrumbWrapper
        route={[searchUrl, "reservationUnitName"]}
        aliases={[
          { slug: searchUrl, title: t("breadcrumb:search") },
          { slug: "reservationUnitName", title: reservationUnitName ?? "-" },
        ]}
      />
      <TopContainer>
        <Container>
          <RightContainer>
            <div>
              <ReservationUnitName>{reservationUnitName}</ReservationUnitName>
              <UnitName>{unitName}</UnitName>
              <Props>
                {reservationUnit.reservationUnitType ? (
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
                    text={getTranslation(
                      reservationUnit.reservationUnitType,
                      "name"
                    )}
                  />
                ) : null}
                {reservationUnit.maxPersons && (
                  <StyledIconWithText
                    icon={
                      <IconGroup aria-label={t("reservationUnit:maxPersons")} />
                    }
                    text={t("reservationUnitCard:personRange", {
                      count: reservationUnit.maxPersons,
                      value:
                        reservationUnit.minPersons !==
                          reservationUnit.maxPersons &&
                        reservationUnit.minPersons != null &&
                        reservationUnit.minPersons > 1
                          ? `${reservationUnit.minPersons} - ${reservationUnit.maxPersons}`
                          : reservationUnit.maxPersons,
                    })}
                  />
                )}
                {(reservationUnit.minReservationDuration ||
                  reservationUnit.maxReservationDuration) && (
                  <StyledIconWithText
                    icon={
                      <IconClock
                        aria-label={t("reservationCalendar:eventDuration")}
                      />
                    }
                    text={t(`reservationCalendar:eventDurationLiteral`, {
                      min: minReservationDuration,
                      max: maxReservationDuration,
                    })}
                  />
                )}
                {unitPrice && (
                  <StyledIconWithText
                    icon={
                      <IconGlyphEuro
                        aria-label={t("prices:reservationUnitPriceLabel")}
                      />
                    }
                    text={
                      <>
                        {unitPrice}
                        {unitPriceSuffix}
                      </>
                    }
                  />
                )}
              </Props>
              {!reservationUnitIsReservable && (
                <NonReservableNotification reservationUnit={reservationUnit} />
              )}
            </div>
            <Images
              images={orderImages(reservationUnit.images ?? [])}
              contextName={reservationUnitName}
            />
          </RightContainer>
        </Container>
      </TopContainer>
    </>
  );
}

export default Head;
