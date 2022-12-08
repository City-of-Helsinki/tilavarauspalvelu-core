import { CalendarEvent } from "common/src/calendar/Calendar";
import { breakpoints } from "common/src/common/style";
import { differenceInMinutes } from "date-fns";
import React, {
  CSSProperties,
  Fragment,
  useCallback,
  useEffect,
  useRef,
} from "react";
import Popup from "reactjs-popup";
import styled from "styled-components";
import { ReservationType } from "common/types/gql-types";
import { TFunction, useTranslation } from "react-i18next";
import { CELL_BORDER, CELL_BORDER_LEFT, CELL_BORDER_LEFT_ALERT } from "./const";
import ReservationPopupContent from "./ReservationPopupContent";
import resourceEventStyleGetter, {
  POST_PAUSE,
  PRE_PAUSE,
} from "./resourceEventStyleGetter";

export type Resource = {
  title: string;
  pk: number;
  url: string;
  isDraft: boolean;
  events: CalendarEvent<ReservationType>[];
};

const zIndex = "101";

const TemplateProps: CSSProperties = {
  zIndex,
  height: "41px",
  position: "absolute",
};

type EventStyleGetter = ({ event }: CalendarEvent<ReservationType>) => {
  style: React.CSSProperties;
  className?: string;
};

type Props = {
  resources: Resource[];
};

const FlexContainer = styled.div<{ $numCols: number }>`
  display: flex;
  flex-direction: column;
  @media (min-width: ${breakpoints.m}) {
    min-width: calc(150px + ${({ $numCols }) => $numCols} * 35px);
  }
  min-width: calc(150px + ${({ $numCols }) => $numCols} * 40px);
  grid-gap: 0;
  border-bottom: ${CELL_BORDER};
`;

const ResourceNameContainer = styled.div<{ $isDraft: boolean }>`
  display: flex;
  align-items: center;
  border-top: ${CELL_BORDER};
  border-right: ${CELL_BORDER};
  border-left: ${({ $isDraft }) =>
    $isDraft ? CELL_BORDER_LEFT_ALERT : CELL_BORDER_LEFT};
  font-size: var(--fontsize-body-s);
  padding-inline: var(--spacing-4-xs);
  position: sticky;
  left: 0;
  z-index: 2;
  background: var(--color-white);
`;

const HeadingRow = styled.div`
  height: 44px;
  display: grid;
  grid-template-columns: 150px 1fr;
  border-right: 1px solid transparent;
  border-left: 2px solid transparent;
`;

const Time = styled.div`
  display: flex;
  align-items: center;
  border-left: ${CELL_BORDER};
  padding-left: 4px;
  font-size: var(--fontsize-body-s);
`;

const Row = styled(HeadingRow)`
  border-right: ${CELL_BORDER};
  border-left: 2px solid transparent;
`;

const CellContent = styled.div<{ $numCols: number }>`
  display: grid;
  width: 100%;
  height: 100%;
  grid-template-columns: repeat(${({ $numCols }) => $numCols}, 1fr);
  border-right: ${CELL_BORDER};
  position: relative;
`;

const Cell = styled.div`
  height: 100%;
  width: 100%;
  border-left: ${CELL_BORDER};
  border-top: ${CELL_BORDER};
`;

const RowCalendarArea = styled.div`
  width: 100%;
  position: relative;
`;

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
    z-index: 5;
    width: calc(100% - var(--spacing-xs) * 2);
    height: calc(100% - var(--spacing-xs) * 2);
    pointer-events: none;
  }
`;

const Cells = ({ cols }: { cols: number }) => (
  <CellContent $numCols={cols}>
    {Array.from(Array(cols).keys()).map((i) => (
      <Cell key={i} />
    ))}
  </CellContent>
);

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
      />
    );
  }
  return null;
};

const Events = ({
  currentReservationUnit,
  firstHour,
  events,
  eventStyleGetter,
  numHours,
  t,
}: {
  currentReservationUnit: number;
  firstHour: number;
  events: CalendarEvent<ReservationType>[];
  eventStyleGetter: EventStyleGetter;
  numHours: number;
  t: TFunction;
}) => (
  <div
    style={{
      position: "absolute",
      width: "100%",
      top: 0,
      left: 0,
    }}
  >
    {events.map((e) => {
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
          }}
        >
          <EventContent style={{ ...eventStyleGetter(e).style }}>
            <p>{e.title}</p>
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

const sortByDraftStatusAndTitle = (resources: Resource[]) => {
  return resources.sort(
    (a, b) =>
      Number(a.isDraft) - Number(b.isDraft) || a.title.localeCompare(b.title)
  );
};

const ResourceCalendar = ({ resources }: Props): JSX.Element => {
  const { t } = useTranslation();
  const calendarRef = useRef<HTMLDivElement>(null);
  // todo find out min and max opening hour of every reservationunit
  const [beginHour, endHour] = [0, 24];
  const numHours = endHour - beginHour;
  const orderedResources = sortByDraftStatusAndTitle([...resources]);

  const scrollCalendar = useCallback(() => {
    const ref = calendarRef.current;

    if (!ref) return;

    const lastElementOfHeader = ref.querySelector(
      ".calendar-header > div:last-of-type"
    );

    if (lastElementOfHeader) {
      lastElementOfHeader.scrollIntoView();
    }
  }, [calendarRef]);

  useEffect(() => {
    scrollCalendar();
  }, [scrollCalendar]);

  return (
    <>
      <FlexContainer $numCols={numHours * 2} ref={calendarRef}>
        <HeadingRow>
          <div />
          <CellContent
            $numCols={numHours}
            key="header"
            className="calendar-header"
          >
            {Array.from(Array(numHours).keys()).map((i, index) => (
              <Time key={i}>{beginHour + index}</Time>
            ))}
          </CellContent>
        </HeadingRow>
        {orderedResources.map((row) => (
          <Fragment key={row.url}>
            <Row>
              <ResourceNameContainer title={row.title} $isDraft={row.isDraft}>
                <div
                  style={{
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                    padding: "var(--spacing-xs)",
                  }}
                >
                  {row.title}
                </div>
              </ResourceNameContainer>
              <RowCalendarArea>
                <Cells cols={numHours * 2} />
                <Events
                  currentReservationUnit={row.pk}
                  firstHour={beginHour}
                  numHours={numHours}
                  events={row.events}
                  eventStyleGetter={resourceEventStyleGetter(row.pk)}
                  t={t}
                />
              </RowCalendarArea>
            </Row>
          </Fragment>
        ))}
      </FlexContainer>
    </>
  );
};

export default ResourceCalendar;
