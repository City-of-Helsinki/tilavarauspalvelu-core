import React from 'react';
import { format, parseISO } from 'date-fns';
import { Button, Container, IconArrowRight, IconClock } from 'hds-react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import Card from '../component/Card';
import { ApplicationPeriod } from '../common/types';
import { isActive } from '../common/util';

interface Props {
  applicationPeriod: ApplicationPeriod;
}

const formatDate = (startDate: string) => {
  return format(parseISO(startDate), 'd. M. yyyy');
};

const StyledCard = styled(Card)<{ act?: boolean }>`
  @media (max-width: var(--breakpoint-s)) {
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

const LinkContainer = styled.div`
  line-height: var(--lineheight-s);
  color: var(--color-bus);
  font-weight: 500;
`;

const LinkToken = styled.span`
  vertical-align: middle;
  display: inline-block;
  margin: var(--spacing-s) var(--spacing-xs) 0 0;
`;

const CardButton = styled(Button)`
  @media (max-width: var(--breakpoint-s)) {
    justify-self: center;
  }

  justify-self: right;
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
        <LinkContainer>
          <LinkToken>
            <IconArrowRight />
          </LinkToken>
          <LinkToken>{t('ApplicationPeriodCard.criteria')}</LinkToken>
        </LinkContainer>
      </StyledContainer>
      {active ? (
        <CardButton>{t('ApplicationPeriodCard.applyButton')}</CardButton>
      ) : (
        <CardButton iconLeft={<IconClock />} variant="secondary">
          {t('ApplicationPeriodCard.reminderButton')}
        </CardButton>
      )}
    </StyledCard>
  );
};

export default ApplicationPeriodCard;
