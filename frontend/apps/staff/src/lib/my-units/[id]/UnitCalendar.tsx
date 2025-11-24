import React, { type CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import Popup from "reactjs-popup";
import { addMinutes, differenceInMinutes, isToday, setHours, setMinutes, startOfDay } from "date-fns";
import { IconClock } from "hds-react";
import { type TFunction, useTranslation } from "next-i18next";
import { useSearchParams } from "next/navigation";
import styled, { css } from "styled-components";
import { CalendarEvent } from "ui/src/components/calendar/Calendar";
import { breakpoints } from "ui/src/modules/const";
import { formatTimeRange, timeForInput, timeToMinutes } from "ui/src/modules/date-utils";
import { focusStyles } from "ui/src/styled";
import { isCellOverlappingSpan, TimeSpanType } from "@ui/components/calendar/utils";
import { useSetSearchParams } from "@/hooks/useSetSearchParams";
import { EVENT_BUFFER, NOT_RESERVABLE } from "@/modules/calendarStyling";
import { getReserveeName } from "@/modules/helpers";
import { ReservationTypeChoice, type ReservationUnitReservationsFragment } from "@gql/gql-types";
import { ReservationPopupContent } from "./ReservationPopupContent";
import eventStyleGetter from "./eventStyleGetter";
import { CELL_BORDER, CELL_BORDER_LEFT, CELL_BORDER_LEFT_ALERT } from "./utils";

type CalendarEventType = CalendarEvent<ReservationUnitReservationsFragment>;
type Resource = {
  title: string;
  pk: number;
  isDraft: boolean;
  events: CalendarEventType[];
  reservableTimeSpans: TimeSpanType[];
};

const N_HOURS = 24;
const N_COLS = N_HOURS * 2;

const CELL_HEIGHT = 50;
const TITLE_CELL_WIDTH_CH = 11;
// Magic numbers (in px) for calendar height (margin is the difference between window height and calendar height)
const MOBILE_CUTOFF = 1000;
const MOBILE_MARGIN = 150;
const DESKTOP_MARGIN = 500;
const MAX_RESOURCES_WITHOUT_SCROLL = 10;

const TemplateProps: CSSProperties = {
  position: "absolute",
  top: "1px", // Show border on top of the cell
  height: `${CELL_HEIGHT - 1}px`,
  zIndex: "var(--tilavaraus-admin-stack-calendar-buffer)",
};

type EventStyleGetter = ({ event }: CalendarEventType) => {
  style: React.CSSProperties;
  className?: string;
};

const FlexContainer = styled.div<{ $numCols: number }>`
  display: flex;
  flex-direction: column;
  @media (min-width: ${breakpoints.m}) {
    min-width: calc(150px + ${({ $numCols }) => $numCols} * 35px);
  }
  min-width: calc(150px + ${({ $numCols }) => $numCols} * 40px);
  gap: 0;
  border-bottom: ${CELL_BORDER};
`;

const ResourceNameContainer = styled.div<{ $isDraft: boolean }>`
  padding: var(--spacing-2-xs) var(--spacing-4-xs);
  border-top: ${CELL_BORDER};
  border-right: ${CELL_BORDER};
  border-left: ${({ $isDraft }) => ($isDraft ? CELL_BORDER_LEFT_ALERT : CELL_BORDER_LEFT)};
  font-size: var(--fontsize-body-s);
  line-height: var(--lineheight-m);
  position: sticky;
  left: 0;
  z-index: var(--tilavaraus-admin-stack-calendar-header-names);
  background: var(--color-white);
`;

const rowCommonCss = css`
  height: ${CELL_HEIGHT}px;
  display: grid;
  grid-template-columns: ${TITLE_CELL_WIDTH_CH}ch 1fr;
  border-right: 1px solid transparent;
  border-left: 2px solid transparent;
`;

// NOTE sticky times
// Decided: the container has a fixed height and both overflows, the times are sticky and the content is scrollable.
//
// What doesn't work:
// 1. Sticky doesn't work with overflow-x (so naive approach of adding CSS sticky to the times doesn't work).
// 2. Tracking the position with JS becomes too complicated and has other issues
//  - would have to calculate the absolute position from the whole tree
//  - if there is layout (or size) change that doesn't affect this component directly, there is no way to know.
// 3. Setting CSS top from scrollY with absolute position, animation lags when user scrolls.
//
// Other options:
// 1. Dynamically set an absolute size for the table and use CSS sticky (no vertical scroll because the container matches the content size).
// 2. Use absolute position for the header and set it in JS (crude) (set element position, not CSS top).
const HeadingRow = styled.div`
  background: var(--color-white);
  position: sticky;
  top: 0;
  width: 100%;
  z-index: var(--tilavaraus-admin-stack-calendar-header-times);
  ${rowCommonCss}
`;

const HeaderTime = styled.div`
  display: flex;
  align-items: center;
  border-left: ${CELL_BORDER};
  padding-left: 4px;
  font-size: var(--fontsize-body-s);
`;

const Row = styled.div`
  ${rowCommonCss}
`;

const CellContent = styled.div<{ $numCols: number }>`
  display: grid;
  width: 100%;
  height: 100%;
  grid-template-columns: repeat(${({ $numCols }) => $numCols}, 1fr);
  border-right: ${CELL_BORDER};
  position: relative;
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
    padding-left: var(--spacing-xs);
    padding-right: var(--spacing-xs);
    padding-top: var(--spacing-3-xs);
    position: absolute;
    margin: 0;
    width: calc(100% - var(--spacing-xs) * 2);
    height: calc(100% - var(--spacing-xs) * 2);
    pointer-events: none;
    font-size: var(--fontsize-body-s);
  }

  p:nth-child(2) {
    top: calc(var(--spacing-xs) * 1.5);
  }
`;

const TitleCell = styled.div`
  /* stylelint-disable value-no-vendor-prefix */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const HideTimesOverTitles = styled.div`
  position: absolute;
  width: ${TITLE_CELL_WIDTH_CH}ch;
  height: ${CELL_HEIGHT}px;
  background-color: white;
  z-index: var(--tilavaraus-admin-stack-calendar-header-names);
`;

const Container = styled.div<{ $height: number | "auto"; $isLoading: boolean }>`
  max-width: 100%;
  overflow: auto;
  scroll-behavior: smooth;
  overscroll-behavior: contain;

  height: ${({ $height }) => (typeof $height === "number" ? `${$height}px` : "auto")};
  background: ${({ $isLoading }) => ($isLoading ? "var(--color-black-10)" : "transparent")};
`;

const EventContainer = styled.div`
  position: absolute;
  width: 100%;
  top: 0;
  left: 0;
`;

const CellStyled = styled.div`
  height: 100%;
  width: 100%;
  border-left: ${CELL_BORDER};
  border-top: ${CELL_BORDER};
  cursor: pointer;

  &:focus {
    ${focusStyles};
    z-index: var(--tilavaraus-admin-stack-calendar-pick-time-focus);
  }
`;

function RowCells({ hasPermission, cols, ...rest }: CellProps): JSX.Element {
  const testId = `UnitCalendar__RowCalendar--cells-${rest.reservationUnitPk}`;

  return (
    <CellContent $numCols={cols} data-testid={testId}>
      {Array.from(Array(cols).keys()).map((i) => (
        <Cell key={i} {...rest} offset={i} hasPermission={hasPermission} />
      ))}
    </CellContent>
  );
}

type CellProps = {
  cols: number;
  reservationUnitPk: number;
  date: Date;
  onComplete: () => void;
  hasPermission: boolean;
  reservableTimeSpans: TimeSpanType[];
};

function getIsCellClosed(offset: number, reservableTimeSpans: TimeSpanType[], selectedDate: Date): boolean {
  // Use date from the first reservable time span instead of `date` to prevent flickering when day is changed, which
  // causes an API request and `reservableTimeSpans` contains `previousData`, but `selectedDate` has already changed
  const reservableStartTimeDate = reservableTimeSpans[0]?.start ?? selectedDate;

  if (reservableTimeSpans.length === 0 || !reservableTimeSpans[0]?.start) {
    return false; // Don't show as closed if reservable time spans are not yet loaded
  }

  const isOpen = reservableTimeSpans.some((span) => {
    // Cell start is at e.g. 8:00 for offset 16, 8:30 for offset 17
    // Cell end is at e.g. 8:30 for offset 16, 9:00 for offset 17
    const cellHours = Math.floor(offset / 2);
    const cellMinutes = (offset * 30) % 60;

    const cellStart = setMinutes(setHours(reservableStartTimeDate, cellHours), cellMinutes);
    const cellEnd = addMinutes(cellStart, 30);

    // Cell is open, if it overlaps with any reservable time span
    // i.e. if the cell start is after the span end or the cell end is before the span start
    return isCellOverlappingSpan(cellStart, cellEnd, span.start, span.end);
  });

  return !isOpen;
}

/// Focusable cell that opens the reservation modal
function Cell({
  offset,
  date,
  hasPermission,
  reservationUnitPk,
  reservableTimeSpans,
}: { offset: number } & Omit<CellProps, "cols">): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const setParams = useSetSearchParams();

  const cellId = `${reservationUnitPk}-${offset}`;

  const now = new Date();
  const isPast = setHours(date, Math.round(offset / 2)) < now;

  const isClosed = getIsCellClosed(offset, reservableTimeSpans, date);

  const handleOpenModal = () => {
    if (!hasPermission) {
      return;
    }
    const params = new URLSearchParams(searchParams);
    params.set("reservationUnit", reservationUnitPk.toString());
    params.set("isModalOpen", "true");
    params.set("timeOffset", offset.toString());
    params.set("cellId", cellId);
    setParams(params);
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.preventDefault();
    handleOpenModal();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleOpenModal();
    }
  };

  return (
    <CellStyled
      ref={ref}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={isPast || isClosed ? -1 : 0}
      data-testid={`UnitCalendar__RowCalendar--cell-${cellId}`}
      style={isPast || isClosed ? NOT_RESERVABLE.style : undefined}
    />
  );
}

function PreBuffer({
  event,
  hourPercent,
  left,
}: {
  event: CalendarEventType;
  hourPercent: number;
  left: string;
}): JSX.Element | null {
  const { t } = useTranslation();

  const buffer = event.event?.bufferTimeBefore;
  if (buffer == null) return null;

  const width = `${(hourPercent * buffer) / 3600}%`;
  return (
    <div
      style={{
        ...EVENT_BUFFER.style,
        ...TemplateProps,
        left: `calc(${left} - ${width})`,
        width,
      }}
      title={t("myUnits:Calendar.legend.pause")}
      key={`${event.event?.pk}-pre`}
    >
      <IconClock />
    </div>
  );
}

function PostBuffer({
  event,
  hourPercent,
  right,
}: {
  event: CalendarEventType;
  hourPercent: number;
  right: string;
}): JSX.Element | null {
  const { t } = useTranslation();

  const buffer = event.event?.bufferTimeAfter;
  if (buffer == null) return null;

  const width = `calc(${(hourPercent * buffer) / 3600}% - 1px)`;
  return (
    <div
      style={{
        ...EVENT_BUFFER.style,
        ...TemplateProps,
        left: right,
        width,
      }}
      title={t("myUnits:Calendar.legend.pause")}
      key={`${event.event?.pk}-post`}
    >
      <IconClock />
    </div>
  );
}

function getEventTitle({ reservation: { title, event }, t }: { reservation: CalendarEventType; t: TFunction }) {
  if (event?.type === ReservationTypeChoice.Blocked) return t("myUnits:Calendar.legend.closed");
  if (event && event?.pk !== event?.reservationUnit?.pk) return getReserveeName(event, t);
  return title;
}

const EventTriggerButton = () => (
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
);

function Event({ event, styleGetter }: { event: CalendarEventType; styleGetter: EventStyleGetter }): JSX.Element {
  const { t } = useTranslation();

  const title = getEventTitle({ reservation: event, t });
  const start = new Date(event.start);
  const endDate = new Date(event.end);

  const durationMinutes = differenceInMinutes(endDate, start);
  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const hours = startMinutes / 60;
  const hourPercent = 100 / N_HOURS;

  const left = `${hourPercent * hours}%`;
  const right = `calc(${left} + ${durationMinutes / 60} * ${100 / N_HOURS}% + 1px)`;

  const timeRange = formatTimeRange(timeToMinutes(timeForInput(event.start)), timeToMinutes(timeForInput(event.end)));
  const reservation = event.event;
  return (
    <>
      <PreBuffer event={event} hourPercent={hourPercent} left={left} />
      <div
        style={{
          left,
          ...TemplateProps,
          width: `calc(${durationMinutes / 60} * ${100 / N_HOURS}% - 2px)`,
          zIndex: 5,
        }}
      >
        <EventContent
          style={{ ...styleGetter(event).style }}
          data-testid={`UnitCalendar__RowCalendar--event-${reservation?.pk}`}
        >
          <p>{timeRange}</p>
          <p>{title}</p>
          {/* NOTE don't set position on Popup it breaks responsiveness */}
          <Popup trigger={EventTriggerButton}>
            {reservation && <ReservationPopupContent reservation={reservation} />}
          </Popup>
        </EventContent>
      </div>
      <PostBuffer event={event} hourPercent={hourPercent} right={right} />
    </>
  );
}

function Events({ events, styleGetter }: { events: CalendarEventType[]; styleGetter: EventStyleGetter }) {
  return (
    <EventContainer data-testid="UnitCalendar__RowCalendar--events">
      {events.map((e) => (
        <Event key={e.event?.pk} event={e} styleGetter={styleGetter} />
      ))}
    </EventContainer>
  );
}

function sortByName(a?: string, b?: string): number {
  return a && b ? a.toLowerCase().localeCompare(b.toLowerCase()) : !a ? 1 : -1;
}

function sortByDraftStatusAndTitle(resources: Resource[]) {
  return resources.sort((a, b) => {
    const draftComparison: number = Number(a.isDraft) - Number(b.isDraft);
    const titleComparison = sortByName(a.title, b.title);

    return draftComparison || titleComparison;
  });
}

function scrollCalendarToCurrentTime(calendarRef: React.RefObject<HTMLDivElement>, date: Date) {
  // scroll to around 9 - 17 on load
  const ref = calendarRef.current;

  if (!ref) {
    return;
  }

  const FIRST_HOUR = 7;
  const now = new Date();
  const cellToScroll = isToday(date) ? Math.min(now.getHours(), 24) : Math.min(FIRST_HOUR, 24);
  const firstElementOfHeader = ref.querySelector(`.calendar-header > div:nth-of-type(${cellToScroll})`);
  // horizontal scroll the calendar element
  // NOTE Don't use scrollIntoView because it changes focus on Chrome
  if (firstElementOfHeader && ref.parentElement) {
    const elementPos = firstElementOfHeader.getBoundingClientRect().left;
    // move a bit backwards to handle row title on mobile
    const x = elementPos - 35;
    const originalScrollLeft = ref.parentElement.scrollLeft;
    ref.parentElement.scrollTo(x + originalScrollLeft, 0);
  }
}

interface UnitCalendarProps {
  date: Date;
  resources: Resource[];
  refetch: () => void;
  canCreateReservations?: boolean;
  isLoading: boolean;
}

export function UnitCalendar({
  date,
  resources,
  refetch,
  canCreateReservations = false,
  isLoading,
}: UnitCalendarProps): JSX.Element {
  const calendarRef = useRef<HTMLDivElement>(null);
  const orderedResources = sortByDraftStatusAndTitle([...resources]);
  const startDate = startOfDay(date);

  const scrollCalendar = useCallback(() => {
    scrollCalendarToCurrentTime(calendarRef, date);
  }, [date]);

  useEffect(() => {
    scrollCalendar();
  }, [scrollCalendar]);

  // Sticky time header requires fixed height, so track the window height and adjust the calendar height accordingly
  const [windowHeight, setWindowHeight] = useState(0);
  useEffect(() => {
    // SSR doesn't have window, so set it inside a hook
    setWindowHeight(window.innerHeight);

    function updateSize() {
      setWindowHeight(window.innerHeight);
    }

    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const margins = windowHeight < MOBILE_CUTOFF ? MOBILE_MARGIN : DESKTOP_MARGIN;
  const containerHeight = windowHeight - margins;

  const height = resources.length > MAX_RESOURCES_WITHOUT_SCROLL ? containerHeight : "auto";

  return (
    <Container $height={height} $isLoading={isLoading}>
      <HideTimesOverTitles />
      <FlexContainer $numCols={N_COLS} ref={calendarRef}>
        <HeadingRow>
          <div />
          <CellContent $numCols={N_HOURS} key="header" className="calendar-header">
            {Array.from(Array(N_HOURS).keys()).map((i, hour) => (
              <HeaderTime key={i}>{hour}</HeaderTime>
            ))}
          </CellContent>
        </HeadingRow>

        {orderedResources.map((row) => (
          <Row key={row.pk}>
            <ResourceNameContainer title={row.title} $isDraft={row.isDraft}>
              <TitleCell>{row.title}</TitleCell>
            </ResourceNameContainer>
            <RowCalendarArea>
              <RowCells
                cols={N_COLS}
                date={startDate}
                reservationUnitPk={row.pk}
                hasPermission={canCreateReservations}
                onComplete={refetch}
                reservableTimeSpans={row.reservableTimeSpans}
              />
              {/* TODO events should be over the cells (tabindex is not correct now) */}
              <Events events={row.events} styleGetter={eventStyleGetter(row.pk)} />
            </RowCalendarArea>
          </Row>
        ))}
      </FlexContainer>
    </Container>
  );
}
