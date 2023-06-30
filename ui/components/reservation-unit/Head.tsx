import { IconClock, IconGroup, IconTicket } from "hds-react";
import React, { useMemo } from "react";
import NextImage from "next/image";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { isReservationStartInFuture } from "common/src/calendar/util";
import { formatSecondDuration } from "common/src/common/util";
import { fontRegular, H2, H3 } from "common/src/common/typography";
import { breakpoints } from "common/src/common/style";
import {
  ReservationUnitByPkType,
  ReservationUnitsReservationUnitReservationKindChoices,
} from "common/types/gql-types";
import { omit } from "lodash";
import { useLocalStorage } from "react-use";
import { Container } from "common";

import {
  formatDate,
  getTranslation,
  orderImages,
  singleSearchUrl,
} from "../../modules/util";
import IconWithText from "../common/IconWithText";
import Images from "./Images";
import {
  getActivePricing,
  getPrice,
  getReservationUnitName,
  getUnitName,
} from "../../modules/reservationUnit";
import BreadcrumbWrapper from "../common/BreadcrumbWrapper";
import AltNotification from "../common/AltNotification";

interface PropsType {
  reservationUnit: ReservationUnitByPkType;
  // activeOpeningTimes: ActiveOpeningTime[];
  isReservable?: boolean;
  subventionSuffix?: (arg: string) => JSX.Element;
}

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

const StyledIconWithText = styled(IconWithText).attrs({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  "data-testid": "icon-with-text",
})`
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

const StyledAltNotification = styled(AltNotification)`
  margin-bottom: var(--spacing-m);
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

const Head = ({
  reservationUnit,
  // activeOpeningTimes,
  isReservable,
  subventionSuffix,
}: PropsType): JSX.Element => {
  const { t } = useTranslation();

  const storageKey = "reservationUnit-search";

  const [storedValues] = useLocalStorage(storageKey, null);

  const searchUrlWithParams = useMemo(() => {
    return singleSearchUrl(omit(storedValues, "applicationRound"));
  }, [storedValues]);

  const minReservationDuration = formatSecondDuration(
    reservationUnit.minReservationDuration,
    true
  );

  const maxReservationDuration = formatSecondDuration(
    reservationUnit.maxReservationDuration,
    true
  );

  const pricing = getActivePricing(reservationUnit);
  const unitPrice = getPrice({ pricing });

  const unitPriceSuffix =
    getPrice({ pricing, asInt: true }) !== "0" &&
    subventionSuffix("reservation-unit-head");

  const reservationUnitName = getReservationUnitName(reservationUnit);

  const unitName = getUnitName(reservationUnit.unit);

  return (
    <>
      <BreadcrumbWrapper
        route={["", searchUrlWithParams, "reservationUnitName"]}
        aliases={[
          { slug: searchUrlWithParams, title: t("breadcrumb:search") },
          { slug: "reservationUnitName", title: reservationUnitName },
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
                        reservationUnit.minPersons > 1
                          ? `${reservationUnit.minPersons} - ${reservationUnit.maxPersons}`
                          : reservationUnit.maxPersons,
                    })}
                  />
                )}
                {/* {openingTimesTextArr?.length > 0 && (
                    <StyledIconWithText
                      icon={
                        <IconCalendar
                          aria-label={t("reservationUnit:openingTimes")}
                        />
                      }
                      texts={openingTimesTextArr}
                    />
                  )} */}
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
                      <IconTicket
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
              {!isReservable &&
                !isReservationStartInFuture(reservationUnit) && (
                  <StyledAltNotification
                    text={t(
                      `reservationUnit:notifications.${
                        reservationUnit.reservationKind ===
                        ReservationUnitsReservationUnitReservationKindChoices.Direct
                          ? "notReservable"
                          : "onlyRecurring"
                      }`
                    )}
                    type="alert"
                  />
                )}
              {isReservationStartInFuture(reservationUnit) && (
                <StyledAltNotification
                  data-testid="reservation-unit--notification__reservation-start"
                  text={t("reservationUnit:notifications.futureOpening", {
                    date: formatDate(
                      reservationUnit.reservationBegins,
                      "d.M.yyyy"
                    ),
                    time: formatDate(reservationUnit.reservationBegins, "H.mm"),
                  })}
                  type="alert"
                />
              )}
            </div>
            <Images
              images={orderImages(reservationUnit.images)}
              contextName={reservationUnitName}
            />
          </RightContainer>
        </Container>
      </TopContainer>
    </>
  );
};

export default Head;
