import React from 'react';
import { useTranslation } from 'react-i18next';
import { IconClock } from 'hds-react';
import styled from 'styled-components';
import { weekdays } from '../common/const';
import LabelValue from '../component/LabelValue';
import { ApplicationEventSchedule } from '../common/types';

interface IProps {
  applicationEventSchedules: ApplicationEventSchedule[];
}

const Wrapper = styled.div`
  display: flex;
`;

const StyledIconClock = styled(IconClock)`
  min-width: 20px;
  margin: 5px 6px 0 0;
`;

const TimePreview = ({ applicationEventSchedules }: IProps): JSX.Element => {
  const { t } = useTranslation();

  return (
    <>
      {weekdays.map((day, index) => (
        <Wrapper key={day}>
          <StyledIconClock />
          <LabelValue
            label={t(`calendar.${day}`)}
            value={
              applicationEventSchedules
                .filter((s) => s.day === index)
                .reduce((acc: string, cur: ApplicationEventSchedule) => {
                  let begin = cur.begin.substring(0, 5);
                  const end = cur.end.substring(0, 5);
                  let prev = acc;
                  let rangeChar = ' - ';
                  let divider = prev.length ? ', ' : '';
                  if (acc.endsWith(begin)) {
                    begin = '';
                    prev = `${prev.slice(0, -5)}`;
                    rangeChar = '';
                    divider = '';
                  }
                  return `${prev}${divider}${begin}${rangeChar}${end}`;
                }, '') || '-'
            }
          />
        </Wrapper>
      ))}
    </>
  );
};

export default TimePreview;
