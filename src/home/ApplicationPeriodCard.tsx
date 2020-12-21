import React from 'react';
import { Button, Container, IconArrowRight, IconClock } from 'hds-react';
import { useTranslation } from 'react-i18next';
import Card from '../component/Card';
import { ApplicationPeriod } from '../common/types';
import styles from './ApplicationPeriodCard.module.scss';
import { isActive, formatDate } from '../common/util';

interface Props {
  applicationPeriod: ApplicationPeriod;
}

const ApplicationPeriodCard = ({ applicationPeriod }: Props): JSX.Element => {
  const { t } = useTranslation();

  const active = isActive(
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
        <div className={styles.linkContainer}>
          <span className={styles.linkIcon}>
            <IconArrowRight />
          </span>
          <span className={styles.linkText}>
            {t('ApplicationPeriodCard.criteria')}
          </span>
        </div>
      </Container>
      {active ? (
        <Button className={styles.button} disabled>
          {t('ApplicationPeriodCard.applyButton')}
        </Button>
      ) : (
        <Button
          iconLeft={<IconClock />}
          variant="secondary"
          className={styles.button}
          disabled>
          {t('ApplicationPeriodCard.reminderButton')}
        </Button>
      )}
    </Card>
  );
};

export default ApplicationPeriodCard;
