import { Accordion, Button, IconArrowLeft } from 'hds-react';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { ApplicationEvent } from '../../common/types';

type Props = {
  applicationEvent: ApplicationEvent;
  index: number;
  cells: Cell[][];
  updateCells: (i: number, cells: Cell[][]) => void;
  copyCells: (i: number) => void;
};

// todo rename 'timeslot'?
export type Cell = {
  day: number;
  hour: number;
  label: string;
  state: boolean;
  key: string;
};

const CalendarHead = styled.div`
  font-family: HelsinkiGrotesk-Bold, var(--font-default);
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
  font-family: HelsinkiGrotesk-Bold, var(--font-default);
  font-size: var(--fontsize-heading-m);
  font-weight: bold;
  padding: 0.3em 0;
  background: ${(props) => (props.selected ? '#0022a6' : '#e5e5e5')};
  border: 1px solid
    ${(props) => (props.selected ? '#0022a6' : 'var(--border-color)')};
  border-top: ${(props) =>
    props.firstRow ? '1px solid var(--border-color)' : 'none'};
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
    if ('ontouchstart' in window) setIsTouchDevice(true);
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
          }}>
          {cell.label}
        </TimeSelectionButton>
      ))}
    </div>
  );
};

const CalendarContainer = styled.div`
  @media (max-width: var(--breakpoint-m)) {
    grid-template-columns: 1fr 1fr 1fr 1fr;
  }
  @media (max-width: var(--breakpoint-xs)) {
    grid-template-columns: 1fr;
  }

  margin-top: var(--spacing-layout-s);
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  column-gap: 6px;
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: row;
  margin-top: var(--spacing-layout-l);
  margin-bottom: var(--spacing-layout-s);
`;

const TimeSelector = ({
  applicationEvent,
  cells,
  updateCells,
  copyCells,
  index,
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

  const r = (
    <Accordion heading={applicationEvent.name || undefined}>
      <CalendarContainer
        onMouseLeave={() => {
          setPainting(false);
        }}>
        {[
          'monday',
          'tuesday',
          'wednesday',
          'thursday',
          'friday',
          'saturday',
          'sunday',
        ].map((c, i) => (
          <Day
            paintState={paintState}
            setPaintState={setPaintState}
            painting={painting}
            setPainting={setPainting}
            key={`day-${c}`}
            head={t(`calendar.${c}`)}
            cells={cells[i]}
            setCellValue={setCellValue}
          />
        ))}
      </CalendarContainer>

      <ButtonContainer>
        <Button
          variant="secondary"
          iconLeft={<IconArrowLeft />}
          onClick={() => copyCells(index)}>
          {t('Application.Page2.copyTimes')}
        </Button>
      </ButtonContainer>
    </Accordion>
  );

  return r;
};

export default TimeSelector;
