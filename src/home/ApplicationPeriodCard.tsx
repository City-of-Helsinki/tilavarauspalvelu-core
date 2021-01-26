import React from 'react';
import { Button, Container, IconArrowRight, IconClock } from 'hds-react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import Card from '../component/Card';
import { ApplicationPeriod } from '../common/types';
import { isActive, formatDate } from '../common/util';
import { breakpoint } from '../common/style';

interface Props {
  applicationPeriod: ApplicationPeriod;
}

const StyledCard = styled(Card)<{ act?: boolean }>`
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

const CardButton = styled(Button)<{ noLeftMargin?: boolean }>`
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

  const active = isActive(
    applicationPeriod.applicationPeriodBegin,
    applicationPeriod.applicationPeriodEnd
  );

  return (
    <StyledCard border act={active ? true : undefined}>
      <StyledContainer>
        <Name>{applicationPeriod.name}</Name>
        <div>
          {active
            ? t('ApplicationPeriodCard.open', {
                until: formatDate(applicationPeriod.applicationPeriodEnd),
              })
            : t('ApplicationPeriodCard.closed', {
                openingDateTime: formatDate(
                  applicationPeriod.applicationPeriodBegin
                ),
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
      {active ? (
        <CardButton disabled>
          {t('ApplicationPeriodCard.applyButton')}
        </CardButton>
      ) : (
        <CardButton iconLeft={<IconClock />} variant="secondary" disabled>
          {t('ApplicationPeriodCard.reminderButton')}
        </CardButton>
      )}
    </StyledCard>
  );
};

export default ApplicationPeriodCard;
