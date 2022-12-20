import { CalendarEvent } from "common/src/calendar/Calendar";
import { breakpoints } from "common/src/common/style";

import React, { Fragment, useCallback, useEffect, useRef } from "react";
import styled from "styled-components";
import { ReservationType } from "common/types/gql-types";
import { useTranslation } from "react-i18next";
import { CELL_BORDER, CELL_BORDER_LEFT, CELL_BORDER_LEFT_ALERT } from "./const";
import { sortByName } from "../../common/util";
import { Events } from "./UnitCalendarEvents";

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
  z-index: 10;
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

const Cells = ({ cols }: { cols: number }) => (
  <CellContent $numCols={cols}>
    {Array.from(Array(cols).keys()).map((i) => (
      <Cell key={i} />
    ))}
  </CellContent>
);

const sortByDraftStatusAndTitle = (resources: Resource[]) => {
  return resources.sort((a, b) => {
    const draftComparison: number = Number(a.isDraft) - Number(b.isDraft);
    const titleComparison = sortByName(a.title, b.title);

    return draftComparison || titleComparison;
  });
};

export type Resource = {
  title: string;
  pk: number;
  url: string;
  isDraft: boolean;
  events: CalendarEvent<ReservationType>[];
};

type Props = {
  resources: Resource[];
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
