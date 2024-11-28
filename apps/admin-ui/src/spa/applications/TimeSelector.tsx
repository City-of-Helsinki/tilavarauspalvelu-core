import React from "react";
import styled, { css } from "styled-components";
import { useTranslation } from "react-i18next";
import { Priority, type ApplicationAdminQuery } from "@gql/gql-types";
import { convertWeekday } from "common/src/conversion";
import { filterNonNullable } from "common/src/helpers";
import { WEEKDAYS } from "common/src/const";
import { Flex, NoWrap } from "common/styles/util";
import { fontMedium } from "common";

type Cell = {
  hour: number;
  label: string;
  priority: Priority | null;
  key: string;
};

type ApplicationType = NonNullable<ApplicationAdminQuery["application"]>;
type ApplicationSectionType = NonNullable<
  ApplicationType["applicationSections"]
>[0];
type SuitableTimeRangeType = NonNullable<
  ApplicationSectionType["suitableTimeRanges"]
>[0];
type TimeSelectorProps = {
  applicationSection: ApplicationSectionType;
};

function cellLabel(row: number): string {
  return `${row} - ${row + 1}`;
}

function timeRangeToCell(timeRanges: SuitableTimeRangeType[]): Cell[][] {
  const firstSlotStart = 7;
  const lastSlotStart = 23;

  const cells: Cell[][] = [];

  for (const j of WEEKDAYS) {
    const day: Cell[] = [];
    for (let i = firstSlotStart; i <= lastSlotStart; i += 1) {
      day.push({
        key: `${j}-${i}`,
        hour: i,
        label: cellLabel(i),
        priority: null,
      });
    }
    cells.push(day);
  }

  for (const timeRange of timeRanges) {
    const { dayOfTheWeek, beginTime, endTime, priority } = timeRange;
    // TODO conversion functions from API time to frontend format
    const hourBegin = Number(beginTime.substring(0, 2)) - firstSlotStart;
    const hourEnd = (Number(endTime.substring(0, 2)) || 24) - firstSlotStart;

    const day = convertWeekday(dayOfTheWeek);
    for (let h = hourBegin; h < hourEnd; h += 1) {
      const cell = cells[day][h];
      cell.priority = priority;
    }
  }

  return cells;
}

const arrowUp = css`
  content: "";
  position: absolute;
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-bottom: 8px solid transparent;
`;

const arrowDown = css`
  content: "";
  position: absolute;
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 8px solid var(--color-white);
`;

const DayLabel = styled.div`
  ${fontMedium}
  text-align: center;
`;

const TimeSelectionCell = styled.div<{
  $priority: Priority | null;
  $firstRow: boolean;
}>`
  /* stylelint-disable csstools/value-no-unknown-custom-properties */
  --border-color: var(--color-black-50);

  text-align: center;
  font-family: var(--font-bold);
  font-weight: bold;
  color: ${({ $priority }) =>
    $priority != null ? "var(--color-white)" : "var(--color-black)"};
  padding: 0.24em 0.5em;
  border: 1px solid var(--border-color);
  border-top: ${({ $firstRow }) =>
    $firstRow ? "1px solid var(--border-color)" : "none"};
  ${({ $priority }) =>
    $priority === Priority.Primary
      ? `
    &:after {
      ${arrowUp}
      left: 4px;
      top: 6px;
      border-bottom-color: var(--color-white);
    }
    background: var(--tilavaraus-calendar-selected);
    color: var(--color-white);
    border-bottom-color: var(--color-black-60);
  `
      : $priority === Priority.Secondary
        ? `
    &:after {
      ${arrowDown}
      left: 4px;
      top: 6px;
      border-top-color: var(--color-black);
    }
    background: var(--tilavaraus-calendar-selected-secondary);
    color: var(--color-black);
  `
        : `
    background: #e5e5e5;
    color: var(--color-black);
  `};
  white-space: nowrap;
  position: relative;
`;

function Day({ head, cells }: { head: string; cells: Cell[] }): JSX.Element {
  return (
    <div>
      <DayLabel>{head}</DayLabel>
      {cells.map((cell, cellIndex) => (
        <TimeSelectionCell
          key={cell.key}
          $priority={cell.priority}
          $firstRow={cellIndex === 0}
          data-testid={`time-selector__button--${cell.key}`}
        >
          {cell.label}
        </TimeSelectionCell>
      ))}
    </div>
  );
}

const CalendarContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  column-gap: 6px;
  overflow-x: scroll;
  width: 100%;
  user-select: none;
`;

const LegendBox = styled.div<{ type: string }>`
  ${(props) =>
    props.type === "unavailable" &&
    `
    background-image: repeating-linear-gradient(135deg, currentColor 0, currentColor 1px, transparent 0, transparent 10%);
  `}
  ${(props) =>
    props.type === "selected-1" &&
    `
    &:after {
      ${arrowUp}
      left: 4px;
      top: 6px;
      border-bottom-color: var(--color-white);
    }

    background-color: var(--tilavaraus-calendar-selected);
  `}
  ${(props) =>
    props.type === "selected-2" &&
    `
    &:after {
      ${arrowDown}
      left: 4px;
      top: 6px;
      border-top-color: var(--color-black);
    }

    background-color: var(--tilavaraus-calendar-selected-secondary);
  `}

  width: 37px;
  height: 37px;
  position: relative;
`;

// scrollable block inside a grid breaks responsivity (grid doesn't)
const Wrapper = styled.div`
  display: grid;
  flex-grow: 1;
  gap: var(--spacing-m);
`;

export function TimeSelector({
  applicationSection,
}: TimeSelectorProps): JSX.Element {
  const schedules = filterNonNullable(applicationSection.suitableTimeRanges);
  const cells = timeRangeToCell(schedules);
  const { t } = useTranslation();

  const cellTypes = [
    {
      type: "selected-1",
      label: t("TimeSelector.primary"),
    },
    {
      type: "selected-2",
      label: t("TimeSelector.secondary"),
    },
  ];
  return (
    <Wrapper>
      <CalendarContainer>
        {WEEKDAYS.map((d) => (
          <Day key={`day-${d}`} head={t(`dayLong.${d}`)} cells={cells[d]} />
        ))}
      </CalendarContainer>
      <Flex $direction="row" $align="center">
        {cellTypes.map((cell) => (
          <Flex $gap="xs" $align="center" $direction="row" key={cell.label}>
            <LegendBox type={cell.type} />
            <NoWrap>{cell.label}</NoWrap>
          </Flex>
        ))}
      </Flex>
    </Wrapper>
  );
}
