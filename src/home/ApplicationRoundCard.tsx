import React from 'react';
import { Button, Container, IconArrowRight } from 'hds-react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';
import { parseISO } from 'date-fns';
import Card from '../component/Card';
import { ApplicationRound } from '../common/types';
import { applicationRoundState, searchUrl } from '../common/util';
import { breakpoint } from '../common/style';

interface Props {
  applicationRound: ApplicationRound;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const StyledCard = styled(({ act, ...rest }) => <Card {...rest} />)`
  && {
    max-width: var(--container-width-m);
    display: grid;
    grid-template-columns: 2fr 1fr;
    grid-gap: var(--spacing-m);
    align-items: start;
    padding: var(--spacing-m);
    margin-bottom: var(--spacing-s);
    border-color: ${(props) => props.act && 'var(--tilavaraus-green)'};
    background-color: ${(props) => props.act && 'var(--tilavaraus-cyan)'};

    @media (max-width: ${breakpoint.s}) {
      grid-template-columns: 1fr;
    }
  }
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

const ApplicationRoundCard = ({ applicationRound }: Props): JSX.Element => {
  const { t } = useTranslation();
  const history = useHistory();

  const state = applicationRoundState(
    applicationRound.applicationPeriodBegin,
    applicationRound.applicationPeriodEnd
  );

  return (
    <StyledCard
      aria-label={applicationRound.name}
      border
      act={state === 'active' ? true : undefined}>
      <StyledContainer>
        <Name>{applicationRound.name}</Name>
        <div>
          {state === 'pending' &&
            t('ApplicationRoundCard.pending', {
              openingDateTime: t('common.dateTime', {
                date: parseISO(applicationRound.applicationPeriodBegin),
              }),
            })}
          {state === 'active' &&
            t('ApplicationRoundCard.open', {
              until: parseISO(applicationRound.applicationPeriodEnd),
            })}
          {state === 'past' &&
            t('ApplicationRoundCard.past', {
              closingDate: parseISO(applicationRound.applicationPeriodEnd),
            })}
        </div>
        <CardButton
          noLeftMargin
          variant="supplementary"
          iconLeft={<IconArrowRight />}
          onClick={() => history.push(`/criteria/${applicationRound.id}`)}>
          {t('ApplicationRoundCard.criteria')}
        </CardButton>
      </StyledContainer>
      {state === 'active' && (
        <CardButton
          onClick={() =>
            history.push(searchUrl({ applicationRound: applicationRound.id }))
          }>
          {t('ApplicationRoundCard.applyButton')}
        </CardButton>
      )}
      {state === 'past' && (
        <CardButton
          onClick={() =>
            history.push(searchUrl({ applicationRound: applicationRound.id }))
          }>
          {t('ApplicationRoundCard.displayPastButton')}
        </CardButton>
      )}
    </StyledCard>
  );
};

export default ApplicationRoundCard;
