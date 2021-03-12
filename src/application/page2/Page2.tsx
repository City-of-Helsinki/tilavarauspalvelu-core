import { Accordion, Button, IconArrowLeft, IconArrowRight } from 'hds-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDebounce } from 'use-debounce';
import styled from 'styled-components';
import { Application, Cell } from '../../common/types';
import TimeSelector from './TimeSelector';
import {
  deepCopy,
  cellsToApplicationEventSchedules,
  applicationEventSchedulesToCells,
} from '../../common/util';

type Props = {
  application: Application;
  onNext: (appToSave: Application) => void;
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
  const [selectorData, setSelectorData] = useState<Cell[][][]>(
    application.applicationEvents.map((applicationEvent) =>
      applicationEventSchedulesToCells(
        applicationEvent.applicationEventSchedules
      )
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
