import { Button, IconArrowLeft, IconArrowRight } from 'hds-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Application, ApplicationEventSchedule } from '../../common/types';
import styles from './Page2.module.scss';

type Props = {
  //  applicationPeriod: ApplicationPeriod;
  application: Application;
  onNext: () => void;
};

type Cell = {
  day: number;
  hour: number;
  label: string;
  state: boolean;
  key: string;
};
const firstSlotStart = 7;
const lastSlotStart = 23;

const cellLabel = (row: number): string => {
  return `${row} - ${row + 1}`;
};

const getCells = (
  applicationEventSchedules: ApplicationEventSchedule[]
): Cell[][] => {
  const cells = [] as Cell[][];

  for (let j = 0; j < 7; j += 1) {
    const day = [];
    for (let i = firstSlotStart; i <= lastSlotStart; i += 1) {
      day.push({
        key: `${i}-${j}`,
        day: j,
        hour: i,
        label: cellLabel(i),
        state: false,
      });
    }
    cells.push(day);
  }

  // mark selected
  applicationEventSchedules.forEach((applicationEventSchedule) => {
    const { day } = applicationEventSchedule;
    const hour =
      Number(applicationEventSchedule.begin.substring(0, 2)) - firstSlotStart;
    const cell = cells[day][hour];
    cell.state = true;
  });

  return cells;
};

const formatNumber = (n: number): string => `0${n > 23 ? 0 : n}`.slice(-2);

/** vaive impl just uses 1 hour slots */
const cellsToApplicationEventSchedules = (
  cells: Cell[][]
): ApplicationEventSchedule[] => {
  const daySchedules = [] as ApplicationEventSchedule[];
  for (let day = 0; day < 7; day += 1) {
    const dayCells = cells[day];
    dayCells
      .filter((cell) => cell.state)
      .map(
        (cell) =>
          ({
            day,
            begin: `${formatNumber(cell.hour)}:00`,
            end: `${formatNumber(cell.hour + 1)}:00`,
          } as ApplicationEventSchedule)
      )
      .forEach((e) => daySchedules.push(e));
  }
  return daySchedules;
};

const Day = ({
  head,
  cells,
  toggle,
}: {
  head: string;
  cells: Cell[];
  toggle: (selection: Cell) => void;
}): JSX.Element => {
  return (
    <div>
      <div className={styles.calendarHead}>{head}</div>
      {cells.map((cell, cellIndex) => (
        <button
          key={cell.key}
          className={`button-reset ${styles.timeSelectionButton} ${
            cell.state ? styles.selectedTime : ''
          } ${cellIndex < 7 ? styles.firstRow : ''}
              `}
          type="button"
          onClick={() => toggle(cell)}>
          {cell.label}
        </button>
      ))}
    </div>
  );
};

const Page2 = ({ application, onNext }: Props): JSX.Element => {
  const { t } = useTranslation();

  // todo only single event is handled
  const applicationEvent = application.applicationEvents[0];

  const schedules = applicationEvent.applicationEventSchedules;

  const [cells, setCells] = useState(getCells(schedules));

  const toggle = (selection: { state: boolean }): void => {
    // eslint-disable-next-line no-param-reassign
    selection.state = !selection.state;
    setCells([...cells]);
  };

  const next = () => {
    schedules.length = 0;
    cellsToApplicationEventSchedules(cells).forEach((e) => schedules.push(e));
    onNext();
  };

  return (
    <>
      <span className={styles.eventName}>{applicationEvent.name}</span>
      <div className={styles.calendarContainer}>
        {[
          'monday',
          'tuesday',
          'wednesday',
          'thursday',
          'friday',
          'saturday',
          'sunday',
        ].map((c, index) => (
          <Day
            key={`day-${c}`}
            head={t(`calendar.${c}`)}
            cells={cells[index]}
            toggle={toggle}
          />
        ))}
      </div>

      <div className={styles.buttonContainer}>
        <Button variant="secondary" iconLeft={<IconArrowLeft />} disabled>
          {t('common.prev')}
        </Button>
        <Button iconRight={<IconArrowRight />} onClick={() => next()}>
          {t('common.next')}
        </Button>
      </div>
    </>
  );
};

export default Page2;
