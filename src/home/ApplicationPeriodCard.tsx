import React from 'react';
import { format, parseISO, isBefore, isAfter } from 'date-fns';
import { Button, Container, IconArrowRight, IconClock } from 'hds-react';
import { useTranslation } from 'react-i18next';
import Card from '../component/Card';
import { ApplicationPeriod } from '../common/types';
import styles from './ApplicationPeriodCard.module.scss';

interface Props {
  applicationPeriod: ApplicationPeriod;
}

const isActive = (startDate: string, endDate: string) => {
  const now = new Date();
  return isAfter(parseISO(startDate), now) && isBefore(parseISO(endDate), now);
};

const formatDate = (startDate: string) => {
  return format(parseISO(startDate), 'd. M. yyyy');
};

const ApplicationPeriodCard = ({ applicationPeriod }: Props): JSX.Element => {
  const { t } = useTranslation();

  const active = !isActive(
    applicationPeriod.applicationPeriodBegin,
    applicationPeriod.applicationPeriodEnd
  );

  return (
    <Card
      border
      className={`${styles.card} ${active ? styles.active : styles.passive}`}>
      <Container className={styles.container}>
        <div className={styles.name}>{applicationPeriod.name}</div>
        <div>
          {t('ApplicationPeriodCard.open', {
            until: formatDate(applicationPeriod.applicationPeriodEnd),
          })}
        </div>
        <div>
          <IconArrowRight />
          {t('ApplicationPeriodCard.criteria')}
        </div>
      </Container>
      {active ? (
        <Button className={styles.button}>
          {t('ApplicatiopPeriodCard.button.apply')}
        </Button>
      ) : (
        <Button
          iconLeft={<IconClock />}
          variant="secondary"
          className={styles.button}>
          {t('ApplicatiopPeriodCard.button.reminder')}
        </Button>
      )}
    </Card>
  );
};

export default ApplicationPeriodCard;
