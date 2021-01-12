import { Accordion, Button, IconArrowLeft } from 'hds-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApplicationEvent } from '../../common/types';
import styles from './TimeSelector.module.scss';

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
const isTouchDevice = 'ontouchstart' in window;

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
  return (
    <div>
      <div className={styles.calendarHead}>{head}</div>
      {cells.map((cell, cellIndex) => (
        <button
          key={cell.key}
          className={`${styles.timeSelectionButton} ${
            cell.state ? styles.selectedTime : ''
          } ${cellIndex === 0 ? styles.firstRow : ''}
              `}
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
        </button>
      ))}
    </div>
  );
};

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
      <div
        className={styles.calendarContainer}
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
      </div>

      <div className={styles.buttonContainer}>
        <Button
          variant="secondary"
          iconLeft={<IconArrowLeft />}
          onClick={() => copyCells(index)}>
          {t('Application.Page2.copyTimes')}
        </Button>
      </div>
    </Accordion>
  );

  return r;
};

export default TimeSelector;
