import React, { useState } from "react";
import styled from "styled-components";
import { TFunction, useTranslation } from "next-i18next";
import {
  Button,
  ButtonSize,
  ButtonVariant,
  IconCross,
  Notification,
  NotificationSize,
} from "hds-react";
import { breakpoints } from "common/src/common/style";
import { filterNonNullable, fromMondayFirstUnsafe } from "common/src/helpers";
import { WEEKDAYS } from "common/src/const";
import { arrowDown, arrowUp } from "@/styled/util";
import { TimePreview } from "./TimePreview";
import { type ApplicationPage2FormValues } from "./form";
import { useFormContext } from "react-hook-form";
import { ControlledSelect } from "common/src/components/form";
import { Flex, NoWrap } from "common/styles/util";
import { isTouchDevice } from "@/modules/util";
import {
  aesToCells,
  ApplicationEventSchedulePriority,
  Cell,
  covertCellsToTimeRange,
} from "./module";
import { successToast } from "common/src/common/toast";
import { type TimeSelectorFragment } from "@/gql/gql-types";
import { fontBold } from "common";
import { ErrorText } from "common/src/components/ErrorText";
import { gql } from "@apollo/client";

const CalendarHead = styled.div`
  ${fontBold}
  font-size: var(--fontsize-body-l);
  text-align: center;
  padding: var(--spacing-2-xs) 0;
`;

const TimeSelectionButton = styled.button<{
  $state: ApplicationEventSchedulePriority | boolean;
  $firstRow: boolean;
}>`
  --border-color: var(--color-black-50);

  display: block;
  width: 100%;
  font-size: var(--fontsize-heading-m);
  white-space: nowrap;
  position: relative;
  cursor: pointer;
  color: ${({ $state }) =>
    $state ? "var(--color-white)" : "var(--color-black)"};
  padding: 0.24em 0.5em;
  border: 1px solid var(--border-color);
  border-top: ${({ $firstRow }) =>
    $firstRow ? "1px solid var(--border-color)" : "none"};
  ${({ $state }) =>
    $state === 300
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
      : $state === 200
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
    background: ${
      $state === 100 ? "var(--color-white)" : "var(--color-black-10)"
    };
    font-weight: ${$state === 100 ? "bold" : "normal"};
    color: var(--color-black);
  `};
`;

function getAriaLabel(t: TFunction, cell: Cell): string {
  switch (cell.state) {
    case 300:
      return t("application:Page2.legend.selected-1");
    case 200:
      return t("application:Page2.legend.selected-2");
    case 100:
      return t("application:Page2.legend.within-opening-hours");
    case 50:
      return t("application:Page2.legend.outside-opening-hours");
    default:
      return "";
  }
}

function constructAriaLabel(
  t: TFunction,
  cell: Cell,
  labelHead: string
): string {
  const base = getAriaLabel(t, cell);
  return `${base ? `${base}: ` : ""}${labelHead} ${cell.label}`;
}

function Day({
  head,
  labelHead,
  cells,
  setCellValue,
  paintState,
  setPaintState,
  painting,
  setPainting,
  priority,
}: {
  head: string;
  labelHead: string;
  cells: Cell[];
  setCellValue: (
    selection: Cell,
    mode: ApplicationEventSchedulePriority | false
  ) => void;
  setPaintState: (state: ApplicationEventSchedulePriority | false) => void;
  paintState: ApplicationEventSchedulePriority | false;
  painting: boolean;
  setPainting: (state: boolean) => void;
  priority: ApplicationEventSchedulePriority;
}): JSX.Element {
  const { t } = useTranslation();

  const handleMouseDown = (cell: Cell, _evt: React.MouseEvent) => {
    const state = priority === cell.state ? false : priority;

    if (isTouchDevice()) {
      setCellValue(cell, state);
      return;
    }

    setPaintState(state);
    setCellValue(cell, state);
    setPainting(true);
  };

  return (
    <div>
      <CalendarHead>{head}</CalendarHead>
      {cells.map((cell, cellIndex) => (
        <TimeSelectionButton
          key={cell.key}
          $state={cell.state}
          $firstRow={cellIndex === 0}
          type="button"
          onMouseDown={(evt) => handleMouseDown(cell, evt)}
          onMouseUp={() => setPainting(false)}
          onKeyDown={() =>
            setCellValue(cell, priority === cell.state ? false : priority)
          }
          onMouseEnter={() => {
            if (painting) {
              setCellValue(cell, paintState);
            }
          }}
          role="option"
          aria-label={constructAriaLabel(t, cell, labelHead)}
          aria-selected={cell.state > 100}
          data-testid={`time-selector__button--${cell.key}`}
        >
          {cell.label}
        </TimeSelectionButton>
      ))}
    </div>
  );
}

const CalendarContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  column-gap: 6px;
  overflow-x: scroll;
  width: 90vw;
  user-select: none;

  @media (min-width: ${breakpoints.l}) {
    overflow-x: auto;
    width: 100%;
  }
`;

const LegendContainer = styled.div`
  @media (min-width: ${breakpoints.m}) {
    & > div {
      display: flex;
    }

    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(2, 1fr);
  }
`;

const Legend = styled.div<{ $idx: number }>`
  display: flex;
  align-items: center;
  margin-right: 3em;
  margin-bottom: var(--spacing-xs);
  /* position the legend items correctly (in relation to the reset button):
  the first two are on the first row, and even ones are in the first column */
  ${(props) => props.$idx < 2 && "grid-row: 1;"}
  ${(props) => props.$idx % 2 === 0 && "grid-column: 1;"}
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
  ${(props) =>
    props.type === "within-opening-hours" &&
    `
    background-color: var(--color-white);
    border: 1px solid var(--color-black-50);
   `}
  ${(props) =>
    props.type === "outside-opening-hours" &&
    `
    background-color: var(--color-black-10);
    border: 1px solid var(--color-black-50);
   `}
  margin-right: 1em;
  width: 37px;
  height: 37px;
  position: relative;

  @media (max-width: ${breakpoints.s}) {
    margin-right: var(spacing-xs);
  }
`;

const StyledNotification = styled(Notification)`
  margin-top: var(--spacing-m);
`;

const ResetButton = styled(Button)`
  && {
    --color: var(--color-black);
    --background-color-hover-focus: var(--color-black-15);
    --background-color-hover: var(--color-black-5);
    --color-hover: var(--color-black-90);
    --color-hover-focus: var(--color-hover);
  }
  grid-row: 1;
  grid-column: 3;
`;

const CELL_TYPES = [
  {
    type: "within-opening-hours",
    label: "application:Page2.legend.within-opening-hours",
  },
  {
    type: "outside-opening-hours",
    label: "application:Page2.legend.outside-opening-hours",
  },
  {
    type: "selected-1",
    label: "application:Page2.legend.selected-1",
  },
  {
    type: "selected-2",
    label: "application:Page2.legend.selected-2",
  },
] as const;

type Props = {
  index: number;
  cells: Cell[][];
  reservationUnitOptions: { label: string; value: number }[];
  reservationUnitOpeningHours: Readonly<TimeSelectorFragment[]>;
};

export function TimeSelector({
  cells,
  index,
  reservationUnitOptions,
  reservationUnitOpeningHours,
}: Props): JSX.Element | null {
  const { t } = useTranslation();
  const [paintState, setPaintState] = useState<
    ApplicationEventSchedulePriority | false
  >(false); // toggle value true = set, false = clear: ;
  const [painting, setPainting] = useState(false); // is painting 'on'

  const cellTypes = CELL_TYPES.map(({ type, label }) => ({
    type,
    label: t(label),
  }));

  const { setValue, watch } = useFormContext<ApplicationPage2FormValues>();
  const priority = watch(`applicationSections.${index}.priority`);

  const setSelectorData = (selected: Cell[][][]) => {
    const formVals = covertCellsToTimeRange(selected);
    for (const i of formVals.keys()) {
      const vals = formVals[i];
      if (vals == null) {
        continue;
      }
      setValue(`applicationSections.${i}.suitableTimeRanges`, vals, {
        shouldDirty: true,
        shouldValidate: true,
        shouldTouch: true,
      });
    }
  };

  const getSelectorData = (): Cell[][][] => {
    const applicationSections = filterNonNullable(watch("applicationSections"));
    const selectorData = applicationSections.map((ae) =>
      aesToCells(ae.suitableTimeRanges, reservationUnitOpeningHours)
    );
    return selectorData;
  };

  const updateCells = (newCells: Cell[][]) => {
    const updated = [...getSelectorData()];
    updated[index] = newCells;
    setSelectorData(updated);
  };

  // TODO should remove the cell not set a priority
  const resetCells = () => {
    const selectorData = [...getSelectorData()];
    const updated = [...selectorData];
    const toChange = selectorData[index];
    if (toChange == null) {
      return;
    }
    updated[index] = toChange.map((n) =>
      n.map((nn) => ({ ...nn, state: 100 }))
    );
    setSelectorData(updated);
  };

  const copyCells = () => {
    const updated = [...getSelectorData()];
    const srcCells = updated[index];
    srcCells?.forEach((day, i) => {
      day.forEach((cell, j) => {
        const { state } = cell;
        for (let k = 0; k < updated.length; k += 1) {
          if (k !== index && updated[k]?.[i]?.[j] != null) {
            const elem = updated[k]?.[i]?.[j];
            if (elem != null) {
              elem.state = state;
            }
          }
        }
      });
    });
    setSelectorData(updated);
    successToast({
      text: t("application:Page2.notification.copyCells"),
      dataTestId: "application__page2--notification-success",
    });
  };
  const setCellValue = (
    selection: Cell,
    value: ApplicationEventSchedulePriority | false
  ): void => {
    const newVal = cells.map((day) => [
      ...day.map((h) =>
        h.key === selection.key
          ? { ...h, state: value === false ? 100 : value }
          : h
      ),
    ]);
    updateCells(newVal);
  };

  const enableCopyCells =
    filterNonNullable(watch("applicationSections")).length > 1;

  return (
    // NOTE flex inside a grid container breaks overflow-x
    <Flex style={{ display: "grid" }}>
      <StyledNotification
        label={t("application:Page2.info")}
        size={NotificationSize.Small}
        type="info"
      >
        {t("application:Page2.info")}
      </StyledNotification>
      <OptionSelector
        reservationUnitOptions={reservationUnitOptions}
        index={index}
      />
      <CalendarContainer
        onMouseLeave={() => setPainting(false)}
        aria-multiselectable
        aria-labelledby={`timeSelector-${index}`}
        role="listbox"
      >
        {WEEKDAYS.map((day) => (
          <Day
            paintState={paintState}
            setPaintState={setPaintState}
            painting={painting}
            setPainting={setPainting}
            key={`day-${day}`}
            head={t(`common:weekDayLong.${fromMondayFirstUnsafe(day)}`)}
            labelHead={t(`common:weekDay.${fromMondayFirstUnsafe(day)}`)}
            cells={cells[day] ?? []}
            setCellValue={setCellValue}
            priority={priority ?? 200}
          />
        ))}
      </CalendarContainer>
      <LegendContainer>
        {cellTypes.map((cell, idx) => (
          <Legend key={cell.label} $idx={idx}>
            <LegendBox type={cell.type} />
            <NoWrap>{cell.label}</NoWrap>
          </Legend>
        ))}
        <ResetButton
          id={`time-selector__button--reset-${index}`}
          variant={ButtonVariant.Supplementary}
          onClick={() => resetCells()}
          iconStart={<IconCross />}
          disabled={!cells.some((day) => day.some((cell) => cell.state > 100))}
        >
          {t("application:Page2.resetTimes")}
        </ResetButton>
      </LegendContainer>
      <div data-testid={`time-selector__preview-${index}`}>
        <TimePreview index={index} />
      </div>
      {enableCopyCells && (
        <div>
          <Button
            id={`time-selector__button--copy-cells-${index}`}
            variant={ButtonVariant.Secondary}
            onClick={copyCells}
            size={ButtonSize.Small}
          >
            {t("application:Page2.copyTimes")}
          </Button>
        </div>
      )}
      <ErrorMessage index={index} />
    </Flex>
  );
}

const OptionWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-s);
  @media (min-width: ${breakpoints.s}) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

function OptionSelector({
  reservationUnitOptions,
  index,
}: Pick<Props, "reservationUnitOptions" | "index">) {
  const { t } = useTranslation();
  const { control } = useFormContext<ApplicationPage2FormValues>();

  const priorityOptions = [300, 200].map((n) => ({
    label: t(`application:Page2.priorityLabels.${n}`),
    value: n,
  }));

  return (
    <OptionWrapper>
      <ControlledSelect
        name={`applicationSections.${index}.priority`}
        label={t("application:Page2.prioritySelectLabel")}
        control={control}
        options={priorityOptions}
      />
      <ControlledSelect
        name={`applicationSections.${index}.reservationUnitPk`}
        label={t("application:Page2.reservationUnitSelectLabel")}
        control={control}
        options={reservationUnitOptions}
      />
    </OptionWrapper>
  );
}

function ErrorMessage({ index }: { index: number }): JSX.Element | null {
  const { t } = useTranslation();
  const fieldName = `applicationSections.${index}.suitableTimeRanges` as const;
  const { getFieldState } = useFormContext<ApplicationPage2FormValues>();
  const state = getFieldState(fieldName);
  if (!state.invalid) {
    return null;
  }
  const errorMsg = state.error?.message;
  const msg = errorMsg
    ? t(`application:validation.calendar.${errorMsg}`)
    : t("errors:general_error");

  return (
    <ErrorText
      size={NotificationSize.Medium}
      title={t("application:validation.calendar.title")}
      data-testid="application__page2--notification-min-duration"
    >
      {msg}
    </ErrorText>
  );
}

export const TIME_SELECTOR_FRAGMENT = gql`
  fragment TimeSelector on ApplicationRoundTimeSlotNode {
    id
    weekday
    closed
    reservableTimes {
      begin
      end
    }
  }
`;
