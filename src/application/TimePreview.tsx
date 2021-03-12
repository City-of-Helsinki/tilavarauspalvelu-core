import React from 'react';
import { useTranslation } from 'react-i18next';
import { IconClock } from 'hds-react';
import styled from 'styled-components';
import { weekdays } from '../common/const';
import LabelValue from '../component/LabelValue';
import { ApplicationEventSchedule } from '../common/types';

type Props = {
  applicationEventSchedules: ApplicationEventSchedule[];
};

const Wrapper = styled.div`
  display: flex;
`;

const StyledIconClock = styled(IconClock)`
  min-width: 24px;
  margin: 5px 6px 0 0;
`;

const TimePreview = ({ applicationEventSchedules }: Props): JSX.Element => {
  const { t } = useTranslation();

  return (
    <>
      {weekdays.map((day, index) => (
        <Wrapper key={day}>
          <StyledIconClock aria-hidden="true" />
          <LabelValue
            label={t(`calendar.${day}`)}
            value={applicationEventSchedules
              .filter((s) => s.day === index)
              .map(
                (cur) =>
                  `${cur.begin.substring(0, 5)} - ${cur.end.substring(0, 5)}`
              )
              .join(', ')}
          />
        </Wrapper>
      ))}
    </>
  );
};

export default TimePreview;
