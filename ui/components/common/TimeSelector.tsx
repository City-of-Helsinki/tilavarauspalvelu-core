import React, { useEffect, useMemo, useState } from "react";
import styled, { CSSProperties } from "styled-components";
import { useTranslation } from "react-i18next";
import { IconCross, Select } from "hds-react";
import {
  ApplicationEventSchedule,
  Cell,
  ApplicationEventSchedulePriority,
  OptionType,
} from "common/types/common";
import { fontRegular } from "common/src/common/typography";
import { breakpoints } from "common/src/common/style";
import TimePreview from "./TimePreview";
import { weekdays } from "../../modules/const";
import {
  arrowDown,
  arrowUp,
  MediumButton,
  SupplementaryButton,
} from "../../styles/util";

type Props = {
  index: number;
  cells: Cell[][];
  updateCells: (i: number, cells: Cell[][]) => void;
  copyCells: ((i: number) => void) | null;
  resetCells: () => void;
  summaryData: [ApplicationEventSchedule[], ApplicationEventSchedule[]];
};

const CalendarHead = styled.div`
  font-family: var(--font-bold);
  font-size: var(--fontsize-body-l);
  text-align: center;
  padding: var(--spacing-2-xs) 0;
`;

const TimeSelectionButton = styled.button<{
  state: ApplicationEventSchedulePriority | false;
  firstRow: boolean;
}>`
  --border-color: var(--color-black-50);

  display: block;
  width: 100%;
  font-family: var(--font-bold);
  font-size: var(--fontsize-heading-m);
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
  cursor: pointer;
`;

const Day = ({
  head,
  cells,
  setCellValue,
  paintState,
  setPaintState,
  painting,
  setPainting,
  priority,
}: {
  head: string;
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
}): JSX.Element => {
  const { t } = useTranslation();

  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    if ("ontouchstart" in window) setIsTouchDevice(true);
  }, []);

  return (
    <div>
      <CalendarHead>{head}</CalendarHead>
      {cells.map((cell, cellIndex) => {
        let ariaLabel = "";
        switch (cell.state) {
          case 300:
            ariaLabel = t("application:Page2.legend.selected-1");
            break;
          case 200:
            ariaLabel = t("application:Page2.legend.selected-2");
            break;
          default:
        }

        return (
          <TimeSelectionButton
            key={cell.key}
            state={cell.state}
            firstRow={cellIndex === 0}
            type="button"
            onMouseDown={() => {
              const state = priority === cell.state ? false : priority;

              if (isTouchDevice) {
                setCellValue(cell, state);
                return;
              }

              setPaintState(state);
              setCellValue(cell, state);
              setPainting(true);
            }}
            onMouseUp={() => {
              setPainting(false);
            }}
            onKeyPress={() => {
              const state = priority === cell.state ? false : priority;
              setCellValue(cell, state);
            }}
            onMouseEnter={() => {
              if (painting) {
                setCellValue(cell, paintState);
              }
            }}
            role="option"
            aria-label={ariaLabel}
            aria-selected={!!cell.state}
            data-testid={`time-selector__button--${cell.key}`}
          >
            {cell.label}
          </TimeSelectionButton>
        );
      })}
    </div>
  );
};

const OptionWrapper = styled.div`
  margin-top: var(--spacing-m);
`;

const PrioritySelect = styled(Select)`
  max-width: 380px;
`;

const CalendarContainer = styled.div`
  margin-top: var(--spacing-layout-s);
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

const TimePreviewContainer = styled.div`
  margin: var(--spacing-xl) 0;
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: row;
  margin-top: var(--spacing-layout-l);
  margin-bottom: var(--spacing-layout-s);
`;

const ResetButton = styled(SupplementaryButton).attrs({
  style: {
    "--color-bus": "var(--color-black)",
  } as CSSProperties,
})`
  & > span {
    display: flex;
    gap: var(--spacing-2-xs);
    padding-left: 0;
    white-space: nowrap;
    align-items: center;
  }

  ${fontRegular};
`;

const TimeSelector = ({
  cells,
  updateCells,
  copyCells,
  resetCells,
  index,
  summaryData,
}: Props): JSX.Element => {
  const { t } = useTranslation();

  const cellTypes = useMemo(
    () => [
      // {
      //   type: "unavailable",
      //   label: t("application:Page2.legend.unavailable"),
      // },
      {
        type: "selected-1",
        label: t("application:Page2.legend.selected-1"),
      },
      {
        type: "selected-2",
        label: t("application:Page2.legend.selected-2"),
      },
    ],
    [t]
  );

  const [priority, setPriority] =
    useState<ApplicationEventSchedulePriority>(300);
  const [paintState, setPaintState] = useState<
    ApplicationEventSchedulePriority | false
  >(false); // toggle value true = set, false = clear: ;
  const [painting, setPainting] = useState(false); // is painting 'on'

  const priorityOptions: OptionType[] = useMemo(() => {
    return [300, 200].map((n) => ({
      label: t(`application:Page2.priorityLabels.${n}`),
      value: n,
    }));
  }, [t]);

  const setCellValue = (
    selection: Cell,
    value: ApplicationEventSchedulePriority | false
  ): void => {
    updateCells(
      index,
      cells.map((day) => [
        ...day.map((h) =>
          h.key === selection.key ? { ...h, state: value } : h
        ),
      ])
    );
  };

  return (
    <>
      <OptionWrapper>
        <PrioritySelect
          id={`time-selector__select--priority-${index}`}
          label=""
          options={priorityOptions}
          value={priorityOptions.find((n) => n.value === priority)}
          defaultValue={priorityOptions[0]}
          onChange={(val: OptionType) =>
            setPriority(val.value as ApplicationEventSchedulePriority)
          }
        />
      </OptionWrapper>
      <CalendarContainer
        onMouseLeave={() => {
          setPainting(false);
        }}
        aria-multiselectable
        aria-labelledby={`timeSelector-${index}`}
        role="listbox"
      >
        {weekdays.map((c, i) => (
          <Day
            paintState={paintState}
            setPaintState={setPaintState}
            painting={painting}
            setPainting={setPainting}
            key={`day-${c}`}
            head={t(`calendar:${c}`)}
            cells={cells[i]}
            setCellValue={setCellValue}
            priority={priority}
          />
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
        <ResetButton
          id={`time-selector__button--reset-${index}`}
          variant="supplementary"
          onClick={() => resetCells()}
          iconLeft={<IconCross />}
        >
          {t("application:Page2.resetTimes")}
        </ResetButton>
      </LegendContainer>
      <TimePreviewContainer data-testid={`time-selector__preview-${index}`}>
        <TimePreview applicationEventSchedules={summaryData} />
      </TimePreviewContainer>
      {copyCells && (
        <ButtonContainer>
          <MediumButton
            id={`time-selector__button--copy-cells-${index}`}
            variant="secondary"
            onClick={() => copyCells(index)}
          >
            {t("application:Page2.copyTimes")}
          </MediumButton>
        </ButtonContainer>
      )}
    </>
  );
};

export default TimeSelector;
