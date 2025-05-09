import React, { useState } from "react";
import styled, { css, type RuleSet } from "styled-components";
import { type TFunction, useTranslation } from "next-i18next";
import {
  Button,
  ButtonSize,
  ButtonVariant,
  Notification,
  NotificationSize,
} from "hds-react";
import { AutoGrid, Flex, NoWrap, fontBold } from "common/styled";
import { breakpoints, WEEKDAYS } from "common/src/const";
import { filterNonNullable, fromMondayFirstUnsafe } from "common/src/helpers";
import { arrowDown, arrowUp } from "@/styled/util";
import { TimePreview } from "./TimePreview";
import { type ApplicationPage2FormValues } from "./form";
import { useFormContext } from "react-hook-form";
import { ControlledSelect } from "common/src/components/form";
import { isTouchDevice } from "@/modules/util";
import {
  aesToCells,
  ApplicationEventSchedulePriority,
  type Cell,
  covertCellsToTimeRange,
} from "./timeSelectorModule";
import { successToast } from "common/src/common/toast";
import { type TimeSelectorFragment } from "@/gql/gql-types";
import { ErrorText } from "common/src/components/ErrorText";
import { gql } from "@apollo/client";
import { type Day } from "common/src/conversion";

const CalendarHead = styled.div`
  ${fontBold}
  font-size: var(--fontsize-body-l);
  text-align: center;
  padding: var(--spacing-2-xs) 0;
`;

const TimeSelectionButton = styled.button<{
  $state: ApplicationEventSchedulePriority;
}>`
  --border-color: var(--color-black-50);

  display: block;
  width: 100%;
  font-size: var(--fontsize-heading-m);
  white-space: nowrap;
  position: relative;
  cursor: pointer;
  padding: 0.24em 0.5em;
  border: 1px solid var(--border-color);
  border-top: none;
  &:first-of-type {
    border-top: 1px solid var(--border-color);
  }
  ${({ $state }) => cellTypeToCssFragment(cellStateToType($state))};
`;

function cellStateToType(state: ApplicationEventSchedulePriority): CellType {
  switch (state) {
    case 300:
      return "primary";
    case 200:
      return "secondary";
    case 100:
      return "open";
    case 50:
      return "unavailable";
  }
}

function cellTypeToCssFragment(type: CellType): RuleSet<object> {
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

const primaryCssFragment = css`
  &:after {
    ${arrowUp}
    left: 4px;
    top: 6px;
    border-bottom-color: var(--color-white);
  }
  background: var(--tilavaraus-calendar-selected);
  color: var(--color-white);
  border-bottom-color: var(--color-black-60);
`;

const secondaryCssFragment = css`
  &:after {
    ${arrowDown}
    left: 4px;
    top: 6px;
    border-top-color: var(--color-black);
  }
  background: var(--tilavaraus-calendar-selected-secondary);
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

function constructAriaLabel(
  t: TFunction,
  cell: Cell,
  labelHead: string
): string {
  const type = cellStateToType(cell.state);
  const base = t(`application:Page2.legend.${type}`);
  return `${base ? `${base}: ` : ""}${labelHead} ${cell.label}`;
}

function DayColumn({
  day,
  cells,
  updateCells,
  paintState,
  setPaintState,
  painting,
  setPainting,
  priority,
}: {
  day: Day;
  cells: Cell[];
  updateCells: (cells: Cell[]) => void;
  setPaintState: (state: ApplicationEventSchedulePriority | false) => void;
  paintState: ApplicationEventSchedulePriority | false;
  painting: boolean;
  setPainting: (state: boolean) => void;
  priority: ApplicationEventSchedulePriority;
}): JSX.Element {
  const { t } = useTranslation();

  const setCellValue = (
    selection: Cell,
    value: ApplicationEventSchedulePriority | false
  ): void => {
    const newVal = cells.map((cell) =>
      cell.key === selection.key
        ? { ...cell, state: value === false ? 100 : value }
        : cell
    );
    updateCells(newVal);
  };
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

  // TODO why doesn't this check the key that is pressed?
  const handleKeyDown = (cell: Cell, _evt: React.KeyboardEvent) => {
    setCellValue(cell, priority === cell.state ? false : priority);
  };

  const head = t(`common:weekDayLong.${fromMondayFirstUnsafe(day)}`);
  const labelHead = t(`common:weekDay.${fromMondayFirstUnsafe(day)}`);

  return (
    <div>
      <CalendarHead>{head}</CalendarHead>
      {cells.map((cell) => (
        <TimeSelectionButton
          key={cell.key}
          $state={cell.state}
          type="button"
          onMouseDown={(evt) => handleMouseDown(cell, evt)}
          onMouseUp={() => setPainting(false)}
          onKeyDown={(evt) => handleKeyDown(cell, evt)}
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
  overflow-x: auto;
  width: 90vw;
  user-select: none;

  @media (min-width: ${breakpoints.l}) {
    overflow-x: auto;
    width: 100%;
  }
`;

const LegendBox = styled.div<{ type: CellType }>`
  border: 1px solid var(--color-black-50);
  ${({ type }) => cellTypeToCssFragment(type)}

  box-sizing: border-box;
  width: 30px;
  height: 40px;
  position: relative;

  @media (max-width: ${breakpoints.s}) {
    margin-right: var(spacing-xs);
  }
`;

const CELL_TYPES = ["open", "unavailable", "secondary", "primary"] as const;
type CellType = (typeof CELL_TYPES)[number];

type TimeSelectorProps = {
  index: number;
  reservationUnitOptions: { label: string; value: number }[];
  reservationUnitOpeningHours: Readonly<TimeSelectorFragment[]>;
};

export function TimeSelector({
  index,
  reservationUnitOptions,
  reservationUnitOpeningHours,
}: TimeSelectorProps): JSX.Element | null {
  const { t } = useTranslation();
  const [paintState, setPaintState] = useState<
    ApplicationEventSchedulePriority | false
  >(false); // toggle value true = set, false = clear: ;
  const [painting, setPainting] = useState(false); // is painting 'on'

  const cellTypes = CELL_TYPES.map((val) => ({
    type: val,
    label: t(`application:Page2.legend.${val}`),
  }));

  const { setValue, watch } = useFormContext<ApplicationPage2FormValues>();

  const setSelectorData = (index: number, selected: Cell[][]) => {
    const formVals = covertCellsToTimeRange(selected);
    setValue(`applicationSections.${index}.suitableTimeRanges`, formVals, {
      shouldDirty: true,
      shouldValidate: true,
      shouldTouch: true,
    });
  };

  const handleCellUpdate = (day: Day, newCells: Cell[]) => {
    const thisSection = watch(
      `applicationSections.${index}.suitableTimeRanges`
    );
    const tmp = aesToCells(thisSection, reservationUnitOpeningHours);
    if (tmp[day] == null) {
      throw new Error("day not found");
    }
    tmp[day] = newCells;
    setSelectorData(index, tmp);
  };

  const copyCells = () => {
    const thisSection = watch(
      `applicationSections.${index}.suitableTimeRanges`
    );
    const srcCells = aesToCells(thisSection, reservationUnitOpeningHours);
    const others = watch(`applicationSections`);
    for (const i of others.keys()) {
      setSelectorData(i, srcCells);
    }
    successToast({
      text: t("application:Page2.notification.copyCells"),
      dataTestId: "application__page2--notification-success",
    });
  };

  const applicationSections = filterNonNullable(watch("applicationSections"));
  const selectorData = applicationSections.map((ae) =>
    aesToCells(ae.suitableTimeRanges, reservationUnitOpeningHours)
  );
  const cells = selectorData[index] ?? [];

  const enableCopyCells =
    filterNonNullable(watch("applicationSections")).length > 1;
  const priority = watch(`applicationSections.${index}.priority`);

  return (
    // NOTE flex inside a grid container breaks overflow-x
    <Flex style={{ display: "grid" }} $marginTop="m">
      <Notification
        label={t("application:Page2.info")}
        size={NotificationSize.Small}
        type="info"
      >
        {t("application:Page2.info")}
      </Notification>
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
          <DayColumn
            paintState={paintState}
            setPaintState={setPaintState}
            painting={painting}
            setPainting={setPainting}
            key={`day-${day}`}
            day={day}
            cells={cells[day] ?? []}
            updateCells={(toUpdate) => handleCellUpdate(day, toUpdate)}
            priority={priority ?? 200}
          />
        ))}
      </CalendarContainer>
      <AutoGrid $minWidth="14rem" $gap="xs">
        {cellTypes.map((cell) => (
          <Flex
            key={cell.label}
            $gap="2-xs"
            $alignItems="center"
            $direction="row"
          >
            <LegendBox type={cell.type} />
            <NoWrap>{cell.label}</NoWrap>
          </Flex>
        ))}
      </AutoGrid>
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

function OptionSelector({
  reservationUnitOptions,
  index,
}: Pick<TimeSelectorProps, "reservationUnitOptions" | "index">) {
  const { t } = useTranslation();
  const { control } = useFormContext<ApplicationPage2FormValues>();

  const priorityOptions = [300, 200].map((n) => ({
    label: t(`application:Page2.priorityLabels.${n}`),
    value: n,
  }));

  return (
    <AutoGrid $minWidth="20rem">
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
    </AutoGrid>
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
