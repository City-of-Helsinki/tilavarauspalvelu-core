import React, { useMemo, useState } from "react";
import styled, { css } from "styled-components";
import { useTranslation } from "react-i18next";
import { breakpoints } from "common/src/common/style";
import { weekdays } from "../../../common/const";
import {
  ApplicationEvent,
  ApplicationEventSchedulePriority,
} from "../../../common/types";
import { applicationEventSchedulesToCells, Cell } from "./util";

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

type Props = {
  applicationEvent: ApplicationEvent;
};

const CalendarHead = styled.div`
  font-family: var(--font-bold);
  font-size: var(--fontsize-body-m);
  text-align: center;
  padding: var(--spacing-2-xs) 0;
`;

const TimeSelectionButton = styled.div<{
  state?: ApplicationEventSchedulePriority;
  firstRow: boolean;
}>`
  /* stylelint-disable csstools/value-no-unknown-custom-properties */
  --border-color: var(--color-black-50);

  text-align: center;
  font-family: var(--font-bold);
  font-weight: bold;
  color: ${(props) =>
    props.state ? "var(--color-white)" : "var(--color-black)"};
  padding: 0.24em 0.5em;
  border: 1px solid var(--border-color);
  border-top: ${(props) =>
    props.firstRow ? "1px solid var(--border-color)" : "none"};
  ${(props) =>
    props.state === 300
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
      : props.state === 200
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

const Day = ({ head, cells }: { head: string; cells: Cell[] }): JSX.Element => {
  return (
    <div>
      <CalendarHead>{head}</CalendarHead>
      {cells.map((cell, cellIndex) => {
        return (
          <TimeSelectionButton
            key={cell.key}
            state={cell.state}
            firstRow={cellIndex === 0}
            data-testid={`time-selector__button--${cell.key}`}
          >
            {cell.label}
          </TimeSelectionButton>
        );
      })}
    </div>
  );
};

const CalendarContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  column-gap: 6px;
  overflow-x: scroll;
  width: 100%;
  user-select: none;

  @media (min-width: ${breakpoints.l}) {
    overflow-x: auto;
    width: 100%;
  }
`;

const LegendContainer = styled.div`
  display: block;
  margin-top: var(--spacing-m);

  @media (min-width: ${breakpoints.m}) {
    & > div {
      display: flex;
      justify-content: space-between;
    }

    display: flex;
    justify-content: space-between;
  }
`;

const Legend = styled.div`
  display: flex;
  align-items: center;
  margin-right: 3em;
  margin-bottom: var(--spacing-xs);

  @media (min-width: ${breakpoints.m}) {
    margin-bottom: 0;
  }
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

  margin-right: 1em;
  width: 37px;
  height: 37px;
  position: relative;

  @media (max-width: ${breakpoints.s}) {
    margin-right: var(spacing-xs);
  }
`;

const LegendLabel = styled.div`
  white-space: nowrap;
`;

const TimeSelector = ({ applicationEvent }: Props): JSX.Element => {
  const [cells] = useState(
    applicationEventSchedulesToCells(applicationEvent.applicationEventSchedules)
  );
  const { t } = useTranslation();

  const cellTypes = useMemo(
    () => [
      // {
      //   type: "unavailable",
      //   label: t("application:Page2.legend.unavailable"),
      // },
      {
        type: "selected-1",
        label: t("TimeSelector.primary"),
      },
      {
        type: "selected-2",
        label: t("TimeSelector.secondary"),
      },
    ],
    [t]
  );

  return (
    <div>
      <CalendarContainer>
        {weekdays.map((c, i) => (
          <Day key={`day-${c}`} head={t(`calendar.${c}`)} cells={cells[i]} />
        ))}
      </CalendarContainer>

      <LegendContainer>
        <div>
          {cellTypes.map((cell) => (
            <Legend key={cell.label}>
              <LegendBox type={cell.type} />
              <LegendLabel>{cell.label}</LegendLabel>
            </Legend>
          ))}
        </div>
      </LegendContainer>
    </div>
  );
};

export default TimeSelector;
