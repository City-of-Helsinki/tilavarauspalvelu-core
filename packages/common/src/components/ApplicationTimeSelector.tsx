import React, { type HTMLAttributes, useState } from "react";
import styled, { css, type RuleSet } from "styled-components";
import { type TFunction, useTranslation } from "next-i18next";
import { AutoGrid, Flex, fontMedium, NoWrap } from "../../styled";
import { WEEKDAYS_SORTED } from "../const";
import { isTouchDevice } from "../browserHelpers";
import { Weekday } from "../../gql/gql-types";
import { convertWeekday } from "../conversion";

export const CELL_STATES = ["none", "secondary", "primary"] as const;
export const OPEN_HOURS_STATES = ["open", "unavailable"] as const;

export type CellState = (typeof CELL_STATES)[number];
export type OpenHoursState = (typeof OPEN_HOURS_STATES)[number];
export type Cell = {
  hour: number;
  state: CellState;
  openState: OpenHoursState;
  weekday: Weekday;
};

// for formatting strings and css styles
const COMBINED_CELL_STATES = ["primary", "secondary", "open", "unavailable"] as const;
type CombinedCellState = (typeof COMBINED_CELL_STATES)[number];

export function isCellEqual(a: Cell, b: Cell): boolean {
  return a.hour === b.hour && a.weekday === b.weekday;
}

function DayColumn({
  day,
  cells,
  updateCell,
  selectedPriority,
}: Readonly<{
  day: Weekday;
  cells: ReadonlyArray<Cell>;
  // use undefined to disable painting
  updateCell?: (cell: Cell, value: CellState) => void;
  selectedPriority?: CellState;
}>): JSX.Element {
  const { t } = useTranslation();
  const [paintState, setPaintState] = useState<CellState | false>(false); // toggle value true = set, false = clear: ;
  const [painting, setPainting] = useState(false); // is painting 'on'

  const setCellValue = (selection: Cell, value: CellState | false): void => {
    if (updateCell == null) {
      return;
    }
    updateCell(selection, value === false ? "none" : value);
  };

  const handleMouseDown = (cell: Cell, _evt: React.MouseEvent) => {
    if (selectedPriority == null) {
      return;
    }
    const state = selectedPriority === cell.state ? false : selectedPriority;

    if (isTouchDevice()) {
      setCellValue(cell, state);
      return;
    }

    setPaintState(state);
    setCellValue(cell, state);
    setPainting(true);
  };

  const handleKeyDown = (cell: Cell, evt: React.KeyboardEvent) => {
    if (selectedPriority == null) {
      return;
    }
    if (evt.key !== "Enter" && evt.key !== " ") {
      return;
    }
    setCellValue(cell, selectedPriority === cell.state ? false : selectedPriority);
  };

  const head = t(`common:weekdayLongEnum.${day}`);
  const weekdayStr = t(`common:weekdayShortEnum.${day}`);

  const getHandlers = (cell: Cell) => {
    if (updateCell == null) {
      return {};
    }
    return {
      onMouseDown: (evt: React.MouseEvent) => handleMouseDown(cell, evt),
      onMouseUp: () => setPainting(false),
      onKeyDown: (evt: React.KeyboardEvent) => handleKeyDown(cell, evt),
      onMouseEnter: () => {
        if (painting) {
          setCellValue(cell, paintState);
        }
      },
    };
  };

  return (
    <div onMouseLeave={() => setPainting(false)}>
      <CalendarHead>{head}</CalendarHead>
      {cells.map((cell) => (
        <TimeSelectionButton
          as={updateCell != null ? "button" : "div"}
          key={`${cell.weekday}-${cell.hour}`}
          $type={cell.state !== "none" ? cell.state : cell.openState}
          disabled={updateCell == null}
          type="button"
          {...getHandlers(cell)}
          role="option"
          aria-label={formatButtonAriaLabel(t, cell, weekdayStr)}
          aria-selected={isSelected(cell.state)}
          data-testid={`time-selector__button--${cell.weekday}-${cell.hour}`}
        >
          {formatCell(cell)}
        </TimeSelectionButton>
      ))}
    </div>
  );
}

function isSelected(cellType: CellState): boolean {
  return cellType === "primary" || cellType === "secondary";
}

const CalendarContainer = styled.div`
  --border-color: var(--color-black-50);

  display: grid;
  grid-template-columns: repeat(7, min-content);
  column-gap: 6px;
  overflow-x: auto;
  user-select: none;
`;

const LegendBox = styled.div<{ type: CombinedCellState }>`
  border: 1px solid var(--color-black-50);
  ${({ type }) => cellTypeToCssFragment(type)}

  box-sizing: border-box;
  width: 30px;
  height: 40px;
  position: relative;
`;

function translateCellType(t: TFunction, state: CombinedCellState): string {
  return t(`application:TimeSelector.legend.${state}`);
}

function formatCell(cell: Cell): string {
  return `${cell.hour} - ${cell.hour + 1}`;
}

function formatButtonAriaLabel(t: TFunction, cell: Cell, weekday: string): string {
  const s = cell.state !== "none" ? cell.state : cell.openState;
  const base = translateCellType(t, s);
  return `${base}: ${weekday} ${formatCell(cell)}`;
}

interface ApplicationTimeSelectorProps extends HTMLAttributes<HTMLDivElement> {
  cells: ReadonlyArray<ReadonlyArray<Cell>>;
  onCellUpdate?: (selection: Cell, value: CellState) => void;
  selectedPriority?: CellState;
}

/// Component to select time slots for the application
/// allows for non interactive version by not passing onCellUpdate
export function ApplicationTimeSelector({
  cells,
  onCellUpdate,
  selectedPriority,
  ...rest
}: Readonly<ApplicationTimeSelectorProps>): JSX.Element {
  return (
    <>
      <CalendarContainer {...rest} role="table">
        {WEEKDAYS_SORTED.map((day) => (
          <DayColumn
            key={`day-${day}`}
            day={day}
            cells={cells[convertWeekday(day)] ?? []}
            updateCell={onCellUpdate}
            selectedPriority={selectedPriority}
          />
        ))}
      </CalendarContainer>
      <Legend />
    </>
  );
}

function Legend() {
  const { t } = useTranslation();
  const cellTypes = COMBINED_CELL_STATES.map((x) => ({
    type: x,
    label: translateCellType(t, x),
  }));

  return (
    <AutoGrid $minWidth="9rem" $gap="xs" data-testid="time-selector__legend">
      {cellTypes.map((cell) => (
        <Flex key={cell.label} $gap="2-xs" $alignItems="center" $direction="row">
          <LegendBox type={cell.type} />
          <NoWrap>{cell.label}</NoWrap>
        </Flex>
      ))}
    </AutoGrid>
  );
}

const CalendarHead = styled.div`
  ${fontMedium};
  font-size: var(--fontsize-body-m);
  text-align: center;
  padding: var(--spacing-2-xs) 0;

  border-bottom: 1px solid var(--border-color);
`;

const TimeSelectionButton = styled.button<{
  $type: CombinedCellState;
}>`
  ${fontMedium};
  width: 100%;
  font-size: var(--fontsize-body-m);
  white-space: nowrap;
  position: relative;
  box-sizing: border-box;
  padding-block: 0;
  padding-inline: 0;
  padding: var(--spacing-2-xs) var(--spacing-m);

  &:enabled {
    cursor: pointer;
  }

  border: 1px solid var(--border-color);
  border-top: none;
  ${({ $type }) => cellTypeToCssFragment($type)};
`;

function cellTypeToCssFragment(type: CombinedCellState): RuleSet<object> {
  switch (type) {
    case "primary":
      return primaryCssFragment;
    case "secondary":
      return secondaryCssFragment;
    case "open":
      return notSelectedCssFragment;
    case "unavailable":
      return notAvailableCssFragment;
  }
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

const primaryCssFragment = css`
  &:before {
    ${arrowUp};
    left: 4px;
    top: 6px;
    border-bottom-color: var(--color-white);
  }

  background: var(--color-bus);
  color: var(--color-white);
  border-bottom-color: var(--color-black-60);
`;

const secondaryCssFragment = css`
  &:before {
    ${arrowDown};
    left: 4px;
    top: 6px;
    border-top-color: var(--color-black);
  }

  background: var(--color-engel);
  color: var(--color-black);
`;

const notSelectedCssFragment = css`
  background: var(--color-white);
  color: var(--color-black);
`;
const notAvailableCssFragment = css`
  background: var(--color-black-10);
  color: var(--color-black);
`;
