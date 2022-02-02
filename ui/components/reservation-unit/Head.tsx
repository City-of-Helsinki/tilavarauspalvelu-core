import {
  IconCalendar,
  IconCalendarClock,
  IconCheck,
  IconClock,
  IconGroup,
  IconInfoCircle,
  IconPlus,
  IconTicket,
  Koros,
} from "hds-react";
import { parseISO } from "date-fns";
import React from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import useReservationUnitList from "../../hooks/useReservationUnitList";
import { breakpoint } from "../../modules/style";
import { formatSecondDuration, getTranslation } from "../../modules/util";
import Back from "../common/Back";
import Container from "../common/Container";
import IconWithText from "../common/IconWithText";
import Notification from "./Notification";
import Images from "./Images";
import { JustForDesktop, JustForMobile } from "../../modules/style/layout";
import {
  ActiveOpeningTime,
  getDayOpeningTimes,
} from "../../modules/openingHours";
import { MediumButton } from "../../styles/util";
import { ReservationUnitByPkType } from "../../modules/gql-types";
import { getPrice } from "../../modules/reservationUnit";

interface PropsType {
  reservationUnit: ReservationUnitByPkType;
  reservationUnitList: ReturnType<typeof useReservationUnitList>;
  activeOpeningTimes: ActiveOpeningTime[];
  viewType: "recurring" | "single";
  calendarRef?: React.MutableRefObject<HTMLDivElement>;
  isReservable?: boolean;
}

const TopContainer = styled.div`
  background-color: white;
  padding-top: var(--spacing-m);
`;

const RightContainer = styled.div`
  font-size: var(--fontsize-body-m);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-s);

  @media (max-width: ${breakpoint.m}) {
    grid-template-columns: 1fr;
  }
`;

const StyledIconWithText = styled(IconWithText).attrs({
  "data-testid": "icon-with-text",
})`
  margin-top: var(--spacing-m);
  display: flex;
  align-items: flex-start;
  white-space: pre-line;
  line-height: var(--lineheight-l);
`;

const Props = styled.div`
  & > div:empty {
    display: none;
  }

  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-s);
  font-family: var(--font-medium);
  font-weight: 500;
`;

const ReservationUnitName = styled.h1`
  font-size: var(--fontsize-heading-l);
  margin: var(--spacing-2-xs) 0 var(--spacing-xs);
`;

const BuildingName = styled.div`
  font-size: var(--fontsize-heading-m);
  font-family: var(--font-bold);
`;

const ButtonContainer = styled.div`
  margin-top: var(--spacing-layout-m);

  & > button {
    margin: 0;
  }
`;

const ThinButton = styled(MediumButton).attrs({
  variant: "secondary",
  style: { "--min-size": "35px" },
})`
  height: 35px;
`;

const StyledKoros = styled(Koros)`
  margin-top: var(--spacing-l);
  fill: var(--tilavaraus-gray);
`;

const Head = ({
  reservationUnit,
  reservationUnitList,
  activeOpeningTimes,
  viewType,
  calendarRef,
  isReservable,
}: PropsType): JSX.Element => {
  const {
    selectReservationUnit,
    containsReservationUnit,
    removeReservationUnit,
  } = reservationUnitList;

  const { t } = useTranslation();

  const minReservationDuration = formatSecondDuration(
    reservationUnit.minReservationDuration,
    false
  );

  const maxReservationDuration = formatSecondDuration(
    reservationUnit.maxReservationDuration,
    false
  );

  const openingTimesTextArr = activeOpeningTimes?.map((openingTime, index) =>
    getDayOpeningTimes(openingTime, index)
  );

  const unitPrice = getPrice(reservationUnit);

  return (
    <TopContainer>
      <Notification applicationRound={null} />
      <Container>
        <Back
          link={`/${viewType === "single" ? "search/single" : "search"}`}
          label="reservationUnit:backToSearch"
          restore={
            viewType === "single"
              ? "reservationUnit-search-single"
              : "reservationUnit-search"
          }
        />
        <RightContainer>
          <div>
            <ReservationUnitName>
              {getTranslation(reservationUnit, "name")}
            </ReservationUnitName>
            <BuildingName>
              {getTranslation(reservationUnit.unit, "name")}
            </BuildingName>
            <JustForMobile style={{ marginTop: "var(--spacing-l)" }}>
              <Images
                images={reservationUnit.images}
                contextName={getTranslation(reservationUnit, "name")}
              />
            </JustForMobile>
            <Props>
              <div>
                {openingTimesTextArr?.length > 0 && (
                  <StyledIconWithText
                    icon={
                      <IconCalendar
                        aria-label={t("reservationUnit:openingTimes")}
                      />
                    }
                    texts={openingTimesTextArr}
                  />
                )}
                {viewType === "single" &&
                  isReservable &&
                  reservationUnit.nextAvailableSlot && (
                    <StyledIconWithText
                      icon={<IconCalendarClock aria-label="" />}
                      text={`${t("reservationCalendar:nextAvailableTime")}:
                      ${t("common:dateTimeNoYear", {
                        date: parseISO(reservationUnit.nextAvailableSlot),
                      })}
                      `}
                    />
                  )}
              </div>
              <div>
                {viewType === "single" && unitPrice && (
                  <StyledIconWithText
                    icon={
                      <IconTicket
                        aria-label={t("prices:reservationUnitPriceLabel")}
                      />
                    }
                    text={unitPrice}
                  />
                )}
                {viewType === "single" &&
                  (reservationUnit.minReservationDuration ||
                    reservationUnit.maxReservationDuration) && (
                    <StyledIconWithText
                      icon={
                        <IconClock
                          aria-label={t("reservationCalendar:eventDuration")}
                        />
                      }
                      text={`Min ${minReservationDuration}
                      Max ${maxReservationDuration}
                    `}
                    />
                  )}
                {reservationUnit.reservationUnitType ? (
                  <StyledIconWithText
                    icon={
                      <IconInfoCircle aria-label={t("reservationUnit:type")} />
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
                    text={t("reservationUnitCard:maxPersons", {
                      count: reservationUnit.maxPersons,
                    })}
                  />
                )}
              </div>
            </Props>
            <ButtonContainer>
              {viewType === "recurring" &&
                (containsReservationUnit(reservationUnit) ? (
                  <MediumButton
                    onClick={() => removeReservationUnit(reservationUnit)}
                    iconLeft={<IconCheck />}
                    className="margin-left-s margin-top-s"
                  >
                    {t("common:reservationUnitSelected")}
                  </MediumButton>
                ) : (
                  <MediumButton
                    onClick={() => selectReservationUnit(reservationUnit)}
                    iconLeft={<IconPlus />}
                    className="margin-left-s margin-top-s"
                    variant="secondary"
                  >
                    {t("common:selectReservationUnit")}
                  </MediumButton>
                ))}
              {viewType === "single" && isReservable && (
                <ThinButton
                  onClick={() => {
                    window.scroll({
                      top: calendarRef.current.offsetTop - 20,
                      left: 0,
                      behavior: "smooth",
                    });
                  }}
                  data-testid="reservation-unit__button--goto-calendar"
                >
                  {t("reservationCalendar:showCalendar")}
                </ThinButton>
              )}
            </ButtonContainer>
          </div>
          <JustForDesktop>
            <Images
              images={reservationUnit.images}
              contextName={getTranslation(reservationUnit, "name")}
            />
          </JustForDesktop>
        </RightContainer>
      </Container>
      <StyledKoros className="koros" type="wave" />
    </TopContainer>
  );
};

export default Head;
