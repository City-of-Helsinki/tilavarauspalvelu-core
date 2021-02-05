import React from 'react';
import { Button, Container, IconArrowRight, IconClock } from 'hds-react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';
import Card from '../component/Card';
import { ApplicationPeriod } from '../common/types';
import { applicationPeriodState, formatDate } from '../common/util';
import { breakpoint } from '../common/style';

interface Props {
  applicationPeriod: ApplicationPeriod;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const StyledCard = styled(({ act, ...rest }) => <Card {...rest} />)`
  @media (max-width: ${breakpoint.s}) {
    grid-template-columns: 2fr;
  }

  max-width: var(--container-width-m);
  display: grid;
  grid-template-columns: 2fr 1fr;
  grid-gap: var(--spacing-m);
  align-items: start;
  padding: var(--spacing-m);
  margin-bottom: var(--spacing-s);
  border-color: ${(props) =>
    props.act &&
    'var(--tilavaraus-application-period-card-active-border-color)'};
  background-color: ${(props) =>
    props.act &&
    'var(--tilavaraus-application-period-card-active-background-color)'};
`;

const StyledContainer = styled(Container)`
  line-height: var(--lineheight-xl);
  max-width: 100%;
`;

const Name = styled.div`
  font-size: var(--fontsize-body-xl);
  font-weight: 500;
`;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const CardButton = styled(({ noLeftMargin, ...rest }) => <Button {...rest} />)`
  @media (max-width: ${breakpoint.s}) {
    justify-self: center;
  }

  ${(props) =>
    props.noLeftMargin
      ? `
        margin-left: 0;
        padding-left: 0;
        border-left: none;

        & > div {
           margin-left: 0;
        }
    `
      : `
        justify-self: right;
  `}
`;

const ApplicationPeriodCard = ({ applicationPeriod }: Props): JSX.Element => {
  const { t } = useTranslation();
  const history = useHistory();

  const state = applicationPeriodState(
    applicationPeriod.applicationPeriodEnd,
    applicationPeriod.applicationPeriodEnd
  );

  return (
    <StyledCard
      aria-label={applicationPeriod.name}
      border
      act={state === 'active' ? true : undefined}>
      <StyledContainer>
        <Name>{applicationPeriod.name}</Name>
        <div>
          {state === 'pending' &&
            t('ApplicationPeriodCard.pending', {
              openingDateTime: formatDate(
                applicationPeriod.applicationPeriodBegin
              ),
            })}
          {state === 'active' &&
            t('ApplicationPeriodCard.open', {
              until: formatDate(applicationPeriod.applicationPeriodEnd),
            })}
          {state === 'past' &&
            t('ApplicationPeriodCard.past', {
              closingDate: formatDate(applicationPeriod.applicationPeriodEnd),
            })}
        </div>
        <CardButton
          noLeftMargin
          variant="supplementary"
          iconLeft={<IconArrowRight />}
          disabled>
          {t('ApplicationPeriodCard.criteria')}
        </CardButton>
      </StyledContainer>
      {state === 'pending' && (
        <CardButton iconLeft={<IconClock />} variant="secondary" disabled>
          {t('ApplicationPeriodCard.reminderButton')}
        </CardButton>
      )}
      {state === 'active' && (
        <CardButton
          onClick={() =>
            history.push(`/search?application_period=${applicationPeriod.id}`)
          }>
          {t('ApplicationPeriodCard.applyButton')}
        </CardButton>
      )}
      {state === 'past' && (
        <CardButton
          onClick={() =>
            history.push(`/search?application_period=${applicationPeriod.id}`)
          }>
          {t('ApplicationPeriodCard.displayPastButton')}
        </CardButton>
      )}
    </StyledCard>
  );
};

export default ApplicationPeriodCard;
