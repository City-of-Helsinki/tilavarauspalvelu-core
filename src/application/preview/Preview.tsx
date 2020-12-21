import { Button, IconArrowLeft, IconArrowRight } from 'hds-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Preview.module.scss';
import { Application as ApplicationType } from '../../common/types';

type Props = {
  application: ApplicationType;
  onNext: () => void;
};

const LabelValue = ({
  label,
  value,
}: {
  label: string;
  value: string | number | null;
}): JSX.Element | null => (
  <div>
    <div className={styles.label}>{label}</div>
    <div className={styles.value}>{value}</div>
  </div>
);

const Preview = ({ onNext, application }: Props): JSX.Element | null => {
  const { t } = useTranslation();

  const onSubmit = () => {
    // eslint-disable-next-line no-param-reassign
    application.status = 'review';
    onNext();
  };

  return application.contactPerson != null ? (
    <>
      <div className={styles.subHeadLine}>
        {t('Application.preview.basicInfoSubHeading')}
      </div>
      <div className={styles.twoColumnContainer}>
        <LabelValue
          label={t('Application.preview.firstName')}
          value={application.contactPerson.firstName}
        />
        <LabelValue
          label={t('Application.preview.lastName')}
          value={application.contactPerson.lastName}
        />
        <LabelValue
          label={t('Application.preview.email')}
          value={application.contactPerson.email}
        />
      </div>
      {application.applicationEvents.map((applicationEvent) => (
        <div key={applicationEvent.id}>
          <div className={styles.subHeadLine}>{applicationEvent.name}</div>
          <div className={styles.twoColumnContainer}>
            <LabelValue
              label={t('Application.preview.applicationEvent.name')}
              value={applicationEvent.name}
            />
            <LabelValue
              label={t('Application.preview.applicationEvent.numPersons')}
              value={applicationEvent.numPersons}
            />
            <LabelValue
              label={t('Application.preview.applicationEvent.ageGroup')}
              value={applicationEvent.ageGroupId}
            />
            <LabelValue
              label={t('Application.preview.applicationEvent.abilityGroup')}
              value={applicationEvent.abilityGroupId}
            />
            <LabelValue
              label={t('Application.preview.applicationEvent.purpose')}
              value={applicationEvent.purposeId}
            />
            <LabelValue
              label={t('Application.preview.applicationEvent.additionalInfo')}
              value=""
            />
            <LabelValue
              label={t('Application.preview.applicationEvent.begin')}
              value={applicationEvent.begin}
            />
            <LabelValue
              label={t('Application.preview.applicationEvent.end')}
              value={applicationEvent.end}
            />
            <LabelValue
              label={t('Application.preview.applicationEvent.eventsPerWeek')}
              value={applicationEvent.eventsPerWeek}
            />
            <LabelValue
              label={t('Application.preview.applicationEvent.biweekly')}
              value={String(applicationEvent.biweekly)}
            />
            {applicationEvent.eventReservationUnits.map((reservationUnit) => (
              <LabelValue
                key={reservationUnit.reservationUnit}
                label={t(
                  'Application.preview.applicationEvent.reeservationUnit'
                )}
                value={reservationUnit.reservationUnit}
              />
            ))}
          </div>
        </div>
      ))}

      <div className={styles.buttonContainer}>
        <Button variant="secondary" iconLeft={<IconArrowLeft />} disabled>
          {t('common.prev')}
        </Button>
        <Button iconRight={<IconArrowRight />} onClick={() => onSubmit()}>
          {t('common.next')}
        </Button>
      </div>
    </>
  ) : null;
};

export default Preview;
