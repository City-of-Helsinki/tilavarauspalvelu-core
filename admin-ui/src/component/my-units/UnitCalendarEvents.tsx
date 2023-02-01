import { CalendarEvent } from "common/src/calendar/Calendar";
import { ReservationType } from "common/types/gql-types";
import { differenceInMinutes } from "date-fns";
import React, { CSSProperties } from "react";
import { TFunction } from "i18next";
import Popup from "reactjs-popup";
import styled from "styled-components";
import { getReserveeName } from "../reservations/requested/util";
import eventStyleGetter, { POST_PAUSE, PRE_PAUSE } from "./eventStyleGetter";
import ReservationPopupContent from "./ReservationPopupContent";

const EventContent = styled.div`
  height: 100%;
  width: 100%;
  position: relative;

  p {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    padding: var(--spacing-xs);

    margin: 0;
    position: absolute;
    width: calc(100% - var(--spacing-xs) * 2);
    height: calc(100% - var(--spacing-xs) * 2);
    pointer-events: none;
  }
`;

const TemplateProps: CSSProperties = {
  zIndex: "101",
  height: "41px",
  position: "absolute",
};

const getEventTitle = ({
  reservation: { title, event },
}: {
  reservation: CalendarEvent<ReservationType>;
}) => {
  return event && event?.pk !== event?.reservationUnits?.[0]?.pk
    ? getReserveeName(event)
    : title;
};
const getPreBuffer = (
  event: CalendarEvent<ReservationType>,
  hourPercent: number,
  left: string,
  t: TFunction
): JSX.Element | null => {
  const buffer = event.event?.reservationUnits?.[0]?.bufferTimeBefore;

  if (buffer) {
    const width = `${(hourPercent * buffer) / 3600}%`;
    return (
      <div
        style={{
          ...PRE_PAUSE.style,
          ...TemplateProps,
          left: `calc(${left} - ${width})`,
          width,
        }}
        title={t("MyUnits.UnitCalendar.legend.pause")}
        key={`${event.event?.pk}-pre`}
      />
    );
  }
  return null;
};

const getPostBuffer = (
  event: CalendarEvent<ReservationType>,
  hourPercent: number,
  right: string,
  t: TFunction
): JSX.Element | null => {
  const buffer = event.event?.reservationUnits?.[0]?.bufferTimeAfter;

  if (buffer) {
    const width = `calc(${(hourPercent * buffer) / 3600}% - 1px)`;
    return (
      <div
        style={{
          ...POST_PAUSE.style,
          ...TemplateProps,
          left: right,
          width,
        }}
        title={t("MyUnits.UnitCalendar.legend.pause")}
        key={`${event.event?.pk}-post`}
      />
    );
  }
  return null;
};

const Events = ({
  currentReservationUnit,
  firstHour,
  events,
  numHours,
  t,
}: {
  currentReservationUnit: number;
  firstHour: number;
  events: CalendarEvent<ReservationType>[];
  numHours: number;
  t: TFunction;
}): JSX.Element => {
  const styleGetter = eventStyleGetter(currentReservationUnit);

  return (
    <div
      style={{
        position: "absolute",
        width: "100%",
        top: 0,
        left: 0,
      }}
    >
      {events.map((e) => {
        const title = getEventTitle({ reservation: e });
        const startDate = new Date(e.start);
        const endDate = new Date(e.end);
        const dayStartDate = new Date(e.start);
        dayStartDate.setHours(firstHour);
        dayStartDate.setMinutes(0);
        dayStartDate.setSeconds(0);

        const startMinutes = differenceInMinutes(startDate, dayStartDate);

        const hourPercent = 100 / numHours;
        const hours = startMinutes / 60;
        const left = `${hourPercent * hours}%`;

        const durationMinutes = differenceInMinutes(endDate, startDate);

        let preBuffer = null;
        let postBuffer = null;
        if (currentReservationUnit === e.event?.reservationUnits?.[0]?.pk) {
          preBuffer = getPreBuffer(e, hourPercent, left, t);

          const right = `calc(${left} + ${durationMinutes / 60} * ${
            100 / numHours
          }% + 1px)`;
          postBuffer = getPostBuffer(e, hourPercent, right, t);
        }

        return [
          preBuffer,
          <div
            key={String(e.event?.pk)}
            style={{
              left,
              ...TemplateProps,
              width: `calc(${durationMinutes / 60} * ${100 / numHours}% + 1px)`,
              zIndex: 5,
            }}
          >
            <EventContent style={{ ...styleGetter(e).style }}>
              <p>{title}</p>
              <Popup
                position={["right center", "left center"]}
                trigger={() => (
                  <button
                    type="button"
                    style={{
                      background: "transparent",
                      cursor: "pointer",
                      border: 0,
                      width: "100%",
                      height: "100%",
                    }}
                  />
                )}
              >
                <ReservationPopupContent
                  reservation={e.event as ReservationType}
                />
              </Popup>
            </EventContent>
          </div>,
          postBuffer,
        ];
      })}
    </div>
  );
};

export { Events };
