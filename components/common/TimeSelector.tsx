import { Button } from "hds-react";
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { ApplicationEventSchedule, Cell } from "../../modules/types";
import TimePreview from "./TimePreview";
import { weekdays } from "../../modules/const";
import { breakpoint } from "../../modules/style";

type Props = {
  index: number;
  cells: Cell[][];
  updateCells: (i: number, cells: Cell[][]) => void;
  copyCells: ((i: number) => void) | null;
  summaryData: ApplicationEventSchedule[];
};

const CalendarHead = styled.div`
  font-family: var(--font-bold);
  font-size: var(--fontsize-body-l);
  text-align: center;
  padding: var(--spacing-2-xs) 0;
`;

const TimeSelectionButton = styled.button<{
  selected: boolean;
  firstRow: boolean;
}>`
  --border-color: var(--color-black-50);

  display: block;
  width: 100%;
  font-family: var(--font-bold);
  font-size: var(--fontsize-heading-m);
  font-weight: bold;
  padding: 0.3em 0.5em;
  background: ${(props) =>
    props.selected ? "var(--tilavaraus-calendar-selected)" : "#e5e5e5"};
  border: 1px solid
    ${(props) =>
      props.selected
        ? "var(--tilavaraus-calendar-selected)"
        : "var(--border-color)"};
  border-top: ${(props) =>
    props.firstrow ? "1px solid var(--border-color)" : "none"};
  white-space: nowrap;
`;

const SubHeadline = styled.div`
  font-family: var(--font-bold);
  margin-top: var(--spacing-layout-m);
  font-weight: 700;
  font-size: var(--fontsize-heading-m);
`;

const Day = ({
  head,
  cells,
  setCellValue,
  paintState,
  setPaintState,
  painting,
  setPainting,
}: {
  head: string;
  cells: Cell[];
  setCellValue: (selection: Cell, mode: boolean) => void;
  setPaintState: (state: boolean) => void;
  paintState: boolean;
  painting: boolean;
  setPainting: (state: boolean) => void;
}): JSX.Element => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    if ("ontouchstart" in window) setIsTouchDevice(true);
  }, []);

  return (
    <div>
      <CalendarHead>{head}</CalendarHead>
      {cells.map((cell, cellIndex) => (
        <TimeSelectionButton
          key={cell.key}
          selected={cell.state}
          firstRow={cellIndex === 0}
          type="button"
          onMouseDown={() => {
            if (isTouchDevice) {
              setCellValue(cell, !cell.state);
              return;
            }
            setPaintState(!cell.state);
            setCellValue(cell, !cell.state);
            setPainting(true);
          }}
          onMouseUp={() => {
            setPainting(false);
          }}
          onKeyPress={() => {
            setCellValue(cell, !cell.state);
          }}
          onMouseEnter={() => {
            if (painting) {
              setCellValue(cell, paintState);
            }
          }}
        >
          {cell.label}
        </TimeSelectionButton>
      ))}
    </div>
  );
};

const CalendarContainer = styled.div`
  @media (max-width: ${breakpoint.m}) {
    width: 90vw;
    overflow-x: scroll;
  }

  @media (max-width: ${breakpoint.s}) {
    width: 94vw;
    overflow-x: scroll;
  }

  margin-top: var(--spacing-layout-s);
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  column-gap: 6px;
`;

const LegendContainer = styled.div`
  display: flex;
  margin-top: var(--spacing-m);

  @media (max-width: ${breakpoint.s}) {
    display: block;
  }
`;

const Legend = styled.div`
  display: flex;
  margin-right: 3em;

  @media (max-width: ${breakpoint.s}) {
    margin-top: var(--spacing-xs);
  }
`;

const LegendBox = styled.div<{ type: string }>`
  ${(props) =>
    props.type === "unavailable" &&
    `
    background-image: repeating-linear-gradient(135deg, currentColor 0, currentColor 1px, transparent 0, transparent 10%);
  `}
  ${(props) =>
    props.type === "selected" &&
    `
    background-color: var(--tilavaraus-calendar-selected);
  `}

  margin-right: 1em;
  width: 20px;
  height: 20px;

  @media (max-width: ${breakpoint.s}) {
    margin-right: var(spacing-xs);
  }
`;

const LegendLabel = styled.div`
  font-family: var(--font-bold);
`;

const TimePreviewContainer = styled.div`
  @media (max-width: ${breakpoint.s}) {
    grid-template-columns: 1fr;
  }

  margin-top: var(--spacing-m);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-m);
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: row;
  margin-top: var(--spacing-layout-l);
  margin-bottom: var(--spacing-layout-s);
`;

const cellTypes = [
  {
    type: "unavailable",
    label: "Ei varattavissa",
  },
  {
    type: "selected",
    label: "Toivomuksesi",
  },
];

const TimeSelector = ({
  cells,
  updateCells,
  copyCells,
  index,
  summaryData,
}: Props): JSX.Element => {
  const { t } = useTranslation();

  const [paintState, setPaintState] = useState(false); // toggle value true = set, false = clear
  const [painting, setPainting] = useState(false); // is painting 'on'

  const setCellValue = (selection: Cell, value: boolean): void => {
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
      <CalendarContainer
        onMouseLeave={() => {
          setPainting(false);
        }}
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
          />
        ))}
      </CalendarContainer>

      <LegendContainer>
        {cellTypes.map((cell) => (
          <Legend key={cell.label}>
            <LegendBox type={cell.type} />
            <LegendLabel>{cell.label}</LegendLabel>
          </Legend>
        ))}
      </LegendContainer>

      <SubHeadline>{t("application:Page2.summary")}</SubHeadline>
      <TimePreviewContainer>
        <TimePreview applicationEventSchedules={summaryData} />
      </TimePreviewContainer>

      {copyCells ? (
        <ButtonContainer>
          <Button variant="secondary" onClick={() => copyCells(index)}>
            {t("application:Page2.copyTimes")}
          </Button>
        </ButtonContainer>
      ) : null}
    </>
  );
};

export default TimeSelector;
