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
  CSSProperties,
  Fragment,
  useCallback,
  useEffect,
  useRef,
} from "react";
import Popup from "reactjs-popup";
import styled from "styled-components";
import {
  ReservationType,
  ReservationsReservationTypeChoices,
} from "common/types/gql-types";
import { useTranslation } from "react-i18next";
import { TFunction } from "i18next";
import { CELL_BORDER, CELL_BORDER_LEFT, CELL_BORDER_LEFT_ALERT } from "./const";
import ReservationPopupContent from "./ReservationPopupContent";
import resourceEventStyleGetter from "./eventStyleGetter";
import { POST_PAUSE, PRE_PAUSE } from "../../common/calendarStyling";
import { getReserveeName } from "../reservations/requested/util";
import { sortByName } from "../../common/util";
import CreateReservationModal from "./create-reservation/CreateReservationModal";
import { useModal } from "../../context/ModalContext";

export type Resource = {
  title: string;
  pk: number;
  url: string;
  isDraft: boolean;
  events: CalendarEvent<ReservationType>[];
};

const CELL_HEIGHT = 50;
const TITLE_CELL_WIDTH_CH = 11;

const TemplateProps: CSSProperties = {
  zIndex: "var(--tilavaraus-admin-stack-calendar-buffer)",
  height: `${CELL_HEIGHT}px`,
  position: "absolute",
};

type EventStyleGetter = ({ event }: CalendarEvent<ReservationType>) => {
  style: React.CSSProperties;
  className?: string;
};

type Props = {
  date: Date;
  resources: Resource[];
  refetch: () => void;
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
  padding: var(--spacing-2-xs) var(--spacing-4-xs);
  border-top: ${CELL_BORDER};
  border-right: ${CELL_BORDER};
  border-left: ${({ $isDraft }) =>
    $isDraft ? CELL_BORDER_LEFT_ALERT : CELL_BORDER_LEFT};
  font-size: var(--fontsize-body-s);
  line-height: var(--lineheight-m);
  position: sticky;
  left: 0;
  z-index: var(--tilavaraus-admin-stack-calendar-title-cells);
  background: var(--color-white);
`;

const HeadingRow = styled.div`
  height: ${CELL_HEIGHT}px;
  display: grid;
  grid-template-columns: ${TITLE_CELL_WIDTH_CH}ch 1fr;
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
  z-index: var(--tilavaraus-admin-stack-calendar-title-cells);
`;

const Cells = ({
  cols,
  reservationUnitPk,
  date,
  setModalContent,
  onComplete,
}: {
  cols: number;
  reservationUnitPk: number;
  date: Date;
  setModalContent: (content: JSX.Element | null, isHds?: boolean) => void;
  onComplete: () => void;
}) => {
  const now = new Date();

  const isPast = (index: number) => {
    return setHours(date, Math.round(index / 2)) < now;
  };

  const onClick =
    (offset: number) => (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      e.preventDefault();
      setModalContent(
        <CreateReservationModal
          reservationUnitId={reservationUnitPk}
          start={addMinutes(new Date(date), offset * 30)}
          onClose={() => {
            setModalContent(null);
            onComplete();
          }}
        />,
        true
      );
    };

  return (
    <CellContent $numCols={cols}>
      {Array.from(Array(cols).keys()).map((i) => (
        <Cell key={i} onClick={onClick(i)} $isPast={isPast(i)} />
      ))}
    </CellContent>
  );
};
const PreBuffer = ({
  event,
  hourPercent,
  left,
  style,
}: {
  event: CalendarEvent<ReservationType>;
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

const PostBuffer = ({
  event,
  hourPercent,
  right,
  style,
}: {
  event: CalendarEvent<ReservationType>;
  hourPercent: number;
  right: string;
  style?: CSSProperties;
}): JSX.Element | null => {
  const buffer = event.event?.bufferTimeAfter;
  const { t } = useTranslation();

  if (buffer) {
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
  return null;
};

const getEventTitle = ({
  reservation: { title, event },
  t,
}: {
  reservation: CalendarEvent<ReservationType>;
  t: TFunction;
}) => {
  if (event?.type === ReservationsReservationTypeChoices.Blocked) {
    return t("MyUnits.Calendar.legend.closed");
  }

  return event && event?.pk !== event?.reservationUnits?.[0]?.pk
    ? getReserveeName(event)
    : title;
};

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

const Events = ({
  firstHour,
  events,
  eventStyleGetter,
  numHours,
}: {
  firstHour: number;
  events: CalendarEvent<ReservationType>[];
  eventStyleGetter: EventStyleGetter;
  numHours: number;
}) => {
  const { t } = useTranslation();
  return (
    <EventContainer>
      {events.map((e) => {
        const title = getEventTitle({ reservation: e, t });
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

        const right = `calc(${left} + ${durationMinutes / 60} * ${
          100 / numHours
        }% + 1px)`;

        return (
          <Fragment key={`${title}-${startDate.toISOString()}`}>
            <PreBuffer
              event={e}
              hourPercent={hourPercent}
              left={left}
              style={TemplateProps}
            />
            <div
              style={{
                left,
                ...TemplateProps,
                width: `calc(${durationMinutes / 60} * ${
                  100 / numHours
                }% - 2px)`,
                zIndex: 5,
              }}
            >
              <EventContent style={{ ...eventStyleGetter(e).style }}>
                <p>{title}</p>
                <Popup
                  position={["right center", "left center"]}
                  trigger={EventTriggerButton}
                >
                  {e.event && <ReservationPopupContent reservation={e.event} />}
                </Popup>
              </EventContent>
            </div>
            <PostBuffer
              event={e}
              hourPercent={hourPercent}
              right={right}
              style={TemplateProps}
            />
          </Fragment>
        );
      })}
    </EventContainer>
  );
};

const sortByDraftStatusAndTitle = (resources: Resource[]) => {
  return resources.sort((a, b) => {
    const draftComparison: number = Number(a.isDraft) - Number(b.isDraft);
    const titleComparison = sortByName(a.title, b.title);

    return draftComparison || titleComparison;
  });
};

const UnitCalendar = ({ date, resources, refetch }: Props): JSX.Element => {
  const calendarRef = useRef<HTMLDivElement>(null);
  // todo find out min and max opening hour of every reservationunit
  const [beginHour, endHour] = [0, 24];
  const numHours = endHour - beginHour;
  const orderedResources = sortByDraftStatusAndTitle([...resources]);
  const { setModalContent } = useModal();
  const startDate = startOfDay(date);

  // scroll to around 9 - 17 at load
  // this is scetchy since it uses the hard endpoint (the calendar size changes)
  const scrollCalendar = useCallback(() => {
    const ref = calendarRef.current;

    if (!ref) return;

    // NOTE on mobile only for today move the scroll position to this hour
    // TODO improve the calculations (less magic numbers), add desktop version (sidebars, margins)
    const LAST_HOUR = 17;
    const FIRST_HOUR = 9;
    const HOUR_CELL_WIDTH = 82;
    const PAGE_MARGIN = 30;
    const TITLE_CELL_WIDTH = 105;
    const calendarSectionSize =
      window.innerWidth - PAGE_MARGIN - TITLE_CELL_WIDTH;
    const nCells = Math.round(calendarSectionSize / HOUR_CELL_WIDTH);
    const now = new Date();
    const mobileCell = isToday(date)
      ? now.getHours() + nCells
      : FIRST_HOUR + nCells;
    const isMobile = window.innerWidth < 768;
    const cellToScroll = isMobile ? mobileCell : LAST_HOUR;
    const lastElementOfHeader = ref.querySelector(
      `.calendar-header > div:nth-of-type(${cellToScroll})`
    );
    if (lastElementOfHeader) {
      lastElementOfHeader.scrollIntoView();
    }
  }, [date]);

  useEffect(() => {
    scrollCalendar();
  }, [scrollCalendar]);

  return (
    <>
      <HideTimesOverTitles />
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
          <Row key={row.url}>
            <ResourceNameContainer title={row.title} $isDraft={row.isDraft}>
              <TitleCell>{row.title}</TitleCell>
            </ResourceNameContainer>
            <RowCalendarArea>
              <Cells
                cols={numHours * 2}
                date={startDate}
                reservationUnitPk={row.pk}
                setModalContent={setModalContent}
                onComplete={refetch}
              />
              <Events
                firstHour={beginHour}
                numHours={numHours}
                events={row.events}
                eventStyleGetter={resourceEventStyleGetter(row.pk)}
              />
            </RowCalendarArea>
          </Row>
        ))}
      </FlexContainer>
    </>
  );
};

export default UnitCalendar;
