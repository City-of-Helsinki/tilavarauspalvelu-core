import { Accordion, Button, IconArrowLeft, IconArrowRight } from 'hds-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDebounce } from 'use-debounce';
import styled from 'styled-components';
import { Application, ApplicationEventSchedule } from '../../common/types';
import TimeSelector, { Cell } from './TimeSelector';
import { deepCopy } from '../../common/util';

type Props = {
  application: Application;
  onNext: (appToSave: Application) => void;
};

const cellLabel = (row: number): string => {
  return `${row} - ${row + 1}`;
};

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: row;
  margin-top: var(--spacing-layout-l);
  justify-content: flex-end;

  button {
    margin-left: var(--spacing-layout-xs);
  }
`;

const Page2 = ({ application, onNext }: Props): JSX.Element => {
  const firstSlotStart = 7;
  const lastSlotStart = 23;

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

    // mark selected states
    applicationEventSchedules.forEach((applicationEventSchedule) => {
      const { day } = applicationEventSchedule;
      const hour =
        Number(applicationEventSchedule.begin.substring(0, 2)) - firstSlotStart;
      const cell = cells[day][hour];
      cell.state = true;
    });

    return cells;
  };

  const [selectorData, setSelectorData] = useState<Cell[][][]>(
    application.applicationEvents.map((applicationEvent) =>
      getCells(applicationEvent.applicationEventSchedules)
    )
  );

  const [debouncedSelectorData] = useDebounce(selectorData, 500);

  const updateCells = (index: number, newCells: Cell[][]) => {
    const updated = [...selectorData];
    updated[index] = newCells;
    setSelectorData(updated);
  };

  const copyCells = (index: number) => {
    const updated = [...selectorData];
    const srcCells = updated[index];
    srcCells.forEach((day, i) => {
      day.forEach((cell, j) => {
        const { state } = cell;
        for (let k = 0; k < updated.length; k += 1) {
          if (k !== index) {
            updated[k][i][j].state = state;
          }
        }
      });
    });
    selectorData.forEach(() => updated.push([...selectorData[index]]));
    setSelectorData(updated);
  };

  const formatNumber = (n: number): string => `0${n > 23 ? 0 : n}`.slice(-2);

  // naive impl that just uses 1 hour slots
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

  const { t } = useTranslation();

  const prepareData = (data: Application): Application => {
    const applicationCopy = deepCopy(data);

    applicationCopy.applicationEvents.forEach((applicationEvent, i) => {
      applicationCopy.applicationEvents[i].applicationEventSchedules.length = 0;
      cellsToApplicationEventSchedules(selectorData[i]).forEach((e) =>
        applicationEvent.applicationEventSchedules.push(e)
      );
    });
    return applicationCopy;
  };

  const onSubmit = () => {
    const appToSave = prepareData(application);
    onNext(appToSave);
  };

  return (
    <>
      {application.applicationEvents.map((event, index) => {
        return (
          <Accordion
            key={event.id}
            id={`timeSelector-${index}`}
            heading={event.name || undefined}>
            <TimeSelector
              key={event.id || 'NEW'}
              index={index}
              cells={selectorData[index]}
              updateCells={updateCells}
              copyCells={copyCells}
              summaryData={cellsToApplicationEventSchedules(
                debouncedSelectorData[index]
              )}
            />
          </Accordion>
        );
      })}

      <ButtonContainer>
        <Button variant="secondary" iconLeft={<IconArrowLeft />} disabled>
          {t('common.prev')}
        </Button>
        <Button
          id="next"
          iconRight={<IconArrowRight />}
          onClick={() => onSubmit()}>
          {t('common.next')}
        </Button>
      </ButtonContainer>
    </>
  );
};

export default Page2;
