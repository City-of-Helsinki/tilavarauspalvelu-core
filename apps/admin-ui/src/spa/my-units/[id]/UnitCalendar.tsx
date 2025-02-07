import { CalendarEvent } from "common/src/calendar/Calendar";
import { breakpoints } from "common/src/common/style";
import {
  addMinutes,
  differenceInMinutes,
  isToday,
  setHours,
  startOfDay,
} from "date-fns";
import React, {
  type CSSProperties,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Popup from "reactjs-popup";
import styled, { css } from "styled-components";
import {
  ReservationTypeChoice,
  UserPermissionChoice,
  type ReservationUnitReservationsFragment,
} from "@gql/gql-types";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { POST_PAUSE, PRE_PAUSE } from "@/common/calendarStyling";
import { getReserveeName, sortByName } from "@/common/util";
import { useModal } from "@/context/ModalContext";
import { CELL_BORDER, CELL_BORDER_LEFT, CELL_BORDER_LEFT_ALERT } from "./const";
import { ReservationPopupContent } from "./ReservationPopupContent";
import eventStyleGetter from "./eventStyleGetter";
import { CreateReservationModal } from "./CreateReservationModal";
import { useCheckPermission } from "@/hooks";
import { CenterSpinner } from "common/styles/util";

type CalendarEventType = CalendarEvent<ReservationUnitReservationsFragment>;
type Resource = {
  title: string;
  pk: number;
  url: string;
  isDraft: boolean;
  events: CalendarEventType[];
};

const N_HOURS = 24;
const N_COLS = N_HOURS * 2;

const CELL_HEIGHT = 50;
const TITLE_CELL_WIDTH_CH = 11;
// Magic numbers (in px) for calendar height (margin is the difference between window height and calendar height)
const MOBILE_CUTOFF = 1000;
const MOBILE_MARGIN = 150;
const DESKTOP_MARGIN = 500;

const TemplateProps: CSSProperties = {
  zIndex: "var(--tilavaraus-admin-stack-calendar-buffer)",
  height: `${CELL_HEIGHT}px`,
  position: "absolute",
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
  border-left: ${({ $isDraft }) =>
    $isDraft ? CELL_BORDER_LEFT_ALERT : CELL_BORDER_LEFT};
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
  ${rowCommonCss}
  background: var(--color-white);
  position: sticky;
  top: 0;
  width: 100%;
  z-index: var(--tilavaraus-admin-stack-calendar-header-times);
`;

const Time = styled.div`
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

const Cell = styled.div<{ $isPast?: boolean }>`
  ${({ $isPast }) =>
    $isPast ? "background: var(--tilavaraus-event-booking-past-date);" : ""}
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
    width: calc(100% - var(--spacing-xs) * 2);
    height: calc(100% - var(--spacing-xs) * 2);
    pointer-events: none;
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

const Container = styled.div<{ $height: number }>`
  max-width: 100%;
  overflow: auto;
  scroll-behavior: smooth;
  overscroll-behavior: contain;

  height: ${({ $height }) => $height}px;
`;

function Cells({
  cols,
  reservationUnitPk,
  unitPk,
  date,
  setModalContent,
  onComplete,
}: {
  cols: number;
  reservationUnitPk: number;
  unitPk: number;
  date: Date;
  setModalContent: (content: JSX.Element | null, isHds?: boolean) => void;
  onComplete: () => void;
}) {
  const now = new Date();

  const isPast = (index: number) => {
    return setHours(date, Math.round(index / 2)) < now;
  };

  const { hasPermission } = useCheckPermission({
    units: [unitPk],
    permission: UserPermissionChoice.CanCreateStaffReservations,
  });

  const onClick =
    (offset: number) => (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (!hasPermission) {
        return;
      }
      e.preventDefault();
      setModalContent(
        <CreateReservationModal
          reservationUnitPk={reservationUnitPk}
          start={addMinutes(new Date(date), offset * 30)}
          onClose={() => {
            setModalContent(null);
            onComplete();
          }}
        />,
        true
      );
    };

  const testId = `UnitCalendar__RowCalendar--cells-${reservationUnitPk}`;
  const cellTestId = `UnitCalendar__RowCalendar--cell-${reservationUnitPk}`;
  return (
    <CellContent $numCols={cols} data-testid={testId}>
      {Array.from(Array(cols).keys()).map((i) => (
        <Cell
          key={i}
          onClick={onClick(i)}
          $isPast={isPast(i)}
          data-testid={`${cellTestId}-${i}`}
        />
      ))}
    </CellContent>
  );
}
const PreBuffer = ({
  event,
  hourPercent,
  left,
  style,
}: {
  event: CalendarEventType;
  hourPercent: number;
  left: string;
  style?: CSSProperties;
}): JSX.Element | null => {
  const buffer = event.event?.bufferTimeBefore;
  const { t } = useTranslation();

  if (buffer) {
    const width = `${(hourPercent * buffer) / 3600}%`;
    return (
      <div
        style={{
          ...PRE_PAUSE.style,
          ...style,
          left: `calc(${left} - ${width})`,
          width,
        }}
        title={t("MyUnits.Calendar.legend.pause")}
        key={`${event.event?.pk}-pre`}
      />
    );
  }
  return null;
};

function PostBuffer({
  event,
  hourPercent,
  right,
  style,
}: {
  event: CalendarEventType;
  hourPercent: number;
  right: string;
  style?: CSSProperties;
}): JSX.Element | null {
  const buffer = event.event?.bufferTimeAfter;
  const { t } = useTranslation();

  if (buffer == null) {
    return null;
  }

  const width = `calc(${(hourPercent * buffer) / 3600}% - 1px)`;
  return (
    <div
      style={{
        ...POST_PAUSE.style,
        ...style,
        left: right,
        width,
      }}
      title={t("MyUnits.Calendar.legend.pause")}
      key={`${event.event?.pk}-post`}
    />
  );
}

function getEventTitle({
  reservation: { title, event },
  t,
}: {
  reservation: CalendarEventType;
  t: TFunction;
}) {
  if (event?.type === ReservationTypeChoice.Blocked) {
    return t("MyUnits.Calendar.legend.closed");
  }

  return event && event?.pk !== event?.reservationUnits?.[0]?.pk
    ? getReserveeName(event, t)
    : title;
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

const EventContainer = styled.div`
  position: absolute;
  width: 100%;
  top: 0;
  left: 0;
`;

type EventProps = {
  event: CalendarEventType;
  styleGetter: EventStyleGetter;
};

function Event({ event, styleGetter }: EventProps): JSX.Element {
  const { t } = useTranslation();

  const title = getEventTitle({ reservation: event, t });
  const start = new Date(event.start);
  const endDate = new Date(event.end);

  const eventStartMinutes = start.getHours() * 60 + start.getMinutes();
  const startMinutes = eventStartMinutes;

  const hourPercent = 100 / N_HOURS;
  const hours = startMinutes / 60;
  const left = `${hourPercent * hours}%`;

  const durationMinutes = differenceInMinutes(endDate, start);

  const right = `calc(${left} + ${durationMinutes / 60} * ${
    100 / N_HOURS
  }% + 1px)`;

  const reservation = event.event;
  const testId = `UnitCalendar__RowCalendar--event-${reservation?.pk}`;
  return (
    <>
      <PreBuffer
        event={event}
        hourPercent={hourPercent}
        left={left}
        style={TemplateProps}
      />
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
          data-testid={testId}
        >
          <p>{title}</p>
          {/* NOTE don't set position on Popup it breaks responsiveness */}
          <Popup trigger={EventTriggerButton}>
            {reservation && (
              <ReservationPopupContent reservation={reservation} />
            )}
          </Popup>
        </EventContent>
      </div>
      <PostBuffer
        event={event}
        hourPercent={hourPercent}
        right={right}
        style={TemplateProps}
      />
    </>
  );
}

function Events({
  events,
  styleGetter,
}: {
  events: CalendarEventType[];
  styleGetter: EventStyleGetter;
}) {
  return (
    <EventContainer data-testid="UnitCalendar__RowCalendar--events">
      {events.map((e) => (
        <Event key={e.event?.pk} event={e} styleGetter={styleGetter} />
      ))}
    </EventContainer>
  );
}

function sortByDraftStatusAndTitle(resources: Resource[]) {
  return resources.sort((a, b) => {
    const draftComparison: number = Number(a.isDraft) - Number(b.isDraft);
    const titleComparison = sortByName(a.title, b.title);

    return draftComparison || titleComparison;
  });
}

type Props = {
  date: Date;
  unitPk: number;
  resources: Resource[];
  refetch: () => void;
  isLoading?: boolean;
};

export function UnitCalendar({
  unitPk,
  date,
  resources,
  refetch,
  isLoading,
}: Props): JSX.Element {
  const calendarRef = useRef<HTMLDivElement>(null);
  const orderedResources = sortByDraftStatusAndTitle([...resources]);
  const { setModalContent } = useModal();
  const startDate = startOfDay(date);

  // scroll to around 9 - 17 at load
  // this is scetchy since it uses the hard endpoint (the calendar size changes)
  const scrollCalendar = useCallback(() => {
    const ref = calendarRef.current;

    if (!ref) {
      return;
    }

    // TODO improve the calculations (less magic numbers)
    const FIRST_HOUR = 7;
    const HOUR_CELL_WIDTH = 73;
    // 768px is the mobile breakpoint (there is some funk in it at 768px vs 769px)
    const TITLE_CELL_WIDTH = 105;
    const MOBILE_BREAKPOINT = 768;
    const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
    // 48px on both sides on desktop, 16px on mobile
    const CONTAINER_MARGIN = isMobile ? 16 * 2 : 48 * 2;
    const SIDE_MENU_WIDTH = isMobile ? 0 : 300;
    const MAX_CALENDAR_WIDTH = 1200 - 48 * 2;
    const possibleCalendarWidth =
      window.innerWidth -
      (SIDE_MENU_WIDTH + CONTAINER_MARGIN + TITLE_CELL_WIDTH);
    const calendarSectionSize = Math.min(
      possibleCalendarWidth,
      MAX_CALENDAR_WIDTH
    );
    const nCells = Math.round(calendarSectionSize / HOUR_CELL_WIDTH);
    const now = new Date();
    const cellToScroll = isToday(date)
      ? Math.min(now.getHours() + nCells, 24)
      : Math.min(FIRST_HOUR + nCells, 24);
    const lastElementOfHeader = ref.querySelector(
      `.calendar-header > div:nth-of-type(${cellToScroll})`
    );
    if (lastElementOfHeader) {
      // horizontal scroll the calendar (as long as it's inside the view vertically, this doesn't scroll the page)
      lastElementOfHeader.scrollIntoView(false);
    }
  }, [date]);

  useEffect(() => {
    scrollCalendar();
  }, [scrollCalendar]);

  // Sticky time header requires fixed height, so track the window height and adjust the calendar height accordingly
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);
  useEffect(() => {
    function updateSize() {
      setWindowHeight(window.innerHeight);
    }
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const margins = windowHeight < MOBILE_CUTOFF ? MOBILE_MARGIN : DESKTOP_MARGIN;
  const containerHeight = windowHeight - margins;

  if (isLoading) {
    return <CenterSpinner />;
  }

  return (
    <Container $height={containerHeight}>
      <HideTimesOverTitles />
      <FlexContainer $numCols={N_COLS} ref={calendarRef}>
        <HeadingRow>
          <div />
          <CellContent
            $numCols={N_HOURS}
            key="header"
            className="calendar-header"
          >
            {Array.from(Array(N_HOURS).keys()).map((i, index) => (
              <Time key={i}>{index}</Time>
            ))}
          </CellContent>
        </HeadingRow>
        {orderedResources.map((row) => (
          <Row key={row.url}>
            <ResourceNameContainer title={row.title} $isDraft={row.isDraft}>
              <TitleCell>{row.title}</TitleCell>
            </ResourceNameContainer>
            <RowCalendarArea>
              <Cells
                cols={N_COLS}
                date={startDate}
                reservationUnitPk={row.pk}
                unitPk={unitPk}
                setModalContent={setModalContent}
                onComplete={refetch}
              />
              <Events
                events={row.events}
                styleGetter={eventStyleGetter(row.pk)}
              />
            </RowCalendarArea>
          </Row>
        ))}
      </FlexContainer>
    </Container>
  );
}
