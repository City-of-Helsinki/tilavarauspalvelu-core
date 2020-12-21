import { Button, IconArrowLeft, IconArrowRight } from 'hds-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Preview.module.scss';
import { Application, ReservationUnit, Parameter } from '../../common/types';
import { formatDate } from '../../common/util';
import { getParameters, getReservationUnits } from '../../common/api';

type Props = {
  application: Application;
  onNext: () => void;
};

const LabelValue = ({
  label,
  value,
}: {
  label: string;
  value: any;
}): JSX.Element | null => (
  <div>
    <div className={styles.label}>{label}</div>
    <div className={styles.value}>{value}</div>
  </div>
);

const mapArrayById = (array: { id: number }[]): { [key: number]: any } => {
  return array.reduce((prev, current) => {
    // eslint-disable-next-line no-param-reassign
    prev[current.id] = current;
    return prev;
  }, {} as { [key: number]: any });
};

const Preview = ({ onNext, application }: Props): JSX.Element | null => {
  const [ready, setReady] = useState(false);

  const [ageGroupOptions, setAgeGroupOptions] = useState<{
    [key: number]: Parameter;
  }>({});
  const [purposeOptions, setPurposeOptions] = useState<{
    [key: number]: Parameter;
  }>({});
  const [abilityGroupOptions, setAbilityGroupOptions] = useState<{
    [key: number]: Parameter;
  }>({});

  const [reservationUnits, setReservationUnits] = useState<{
    [key: number]: ReservationUnit;
  }>({});

  useEffect(() => {
    async function fetchData() {
      // there's no api to get reservation units with multiple ids so we're getting them all :)  a.k.a. FIXME
      const units = await getReservationUnits({ search: undefined });
      setReservationUnits(mapArrayById(units));

      const fetchedAbilityGroupOptions = await getParameters('ability_group');
      setAbilityGroupOptions(mapArrayById(fetchedAbilityGroupOptions));
      const fetchedAgeGroupOptions = await getParameters('age_group');
      setAgeGroupOptions(mapArrayById(fetchedAgeGroupOptions));
      const fetchedPurposeOptions = await getParameters('purpose');
      setPurposeOptions(mapArrayById(fetchedPurposeOptions));
      setReady(true);
    }
    fetchData();
  }, []);

  const { t } = useTranslation();

  const onSubmit = () => {
    // eslint-disable-next-line no-param-reassign
    application.status = 'review';
    onNext();
  };

  return ready ? (
    <>
      <div className={styles.subHeadLine}>
        {t('Application.preview.basicInfoSubHeading')}
      </div>
      <div className={styles.twoColumnContainer}>
        <LabelValue
          label={t('Application.preview.firstName')}
          value={application.contactPerson?.firstName}
        />
        <LabelValue
          label={t('Application.preview.lastName')}
          value={application.contactPerson?.lastName}
        />
        <LabelValue
          label={t('Application.preview.email')}
          value={application.contactPerson?.email}
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
              value={`${
                ageGroupOptions[applicationEvent.ageGroupId || 0].minimum
              } - ${ageGroupOptions[applicationEvent.ageGroupId || 0].maximum}`}
            />
            <LabelValue
              label={t('Application.preview.applicationEvent.abilityGroup')}
              value={
                abilityGroupOptions[applicationEvent.abilityGroupId || 0].name
              }
            />
            <LabelValue
              label={t('Application.preview.applicationEvent.purpose')}
              value={purposeOptions[applicationEvent.purposeId || 0].name}
            />
            <LabelValue
              label={t('Application.preview.applicationEvent.additionalInfo')}
              value=""
            />
            <LabelValue
              label={t('Application.preview.applicationEvent.begin')}
              value={formatDate(applicationEvent.begin || '')}
            />
            <LabelValue
              label={t('Application.preview.applicationEvent.end')}
              value={formatDate(applicationEvent.end || '')}
            />
            <LabelValue
              label={t('Application.preview.applicationEvent.eventsPerWeek')}
              value={applicationEvent.eventsPerWeek}
            />
            <LabelValue
              label={t('Application.preview.applicationEvent.biweekly')}
              value={t(`common.${applicationEvent.biweekly}`)}
            />
            {applicationEvent.eventReservationUnits.map(
              (reservationUnit, index) => (
                <LabelValue
                  key={reservationUnit.reservationUnit}
                  label={t(
                    'Application.preview.applicationEvent.reservationUnit',
                    { order: index + 1 }
                  )}
                  value={reservationUnits[reservationUnit.reservationUnit].name}
                />
              )
            )}
          </div>
          <hr className={styles.ruler} />
          <div className={styles.smallSubHeadLine}>
            {t('Application.preview.applicationEventSchedules')}
          </div>
          <div className={styles.twoColumnContainer}>
            {[
              'monday',
              'tuesday',
              'wednesday',
              'thursday',
              'friday',
              'saturday',
              'sunday',
            ].map((day, index) => (
              <div key={day}>
                <LabelValue
                  label={t(`calendar.${day}`)}
                  value={applicationEvent.applicationEventSchedules
                    .filter((s) => s.day === index)
                    .map((s, i) => (
                      <span>
                        {i !== 0 ? ', ' : ''}
                        {s.begin.substring(0, 5)} - {s.end.substring(0, 5)}
                      </span>
                    ))}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className={styles.buttonContainer}>
        <Button variant="secondary" iconLeft={<IconArrowLeft />} disabled>
          {t('common.prev')}
        </Button>
        <Button iconRight={<IconArrowRight />} onClick={() => onSubmit()}>
          {t('common.submit')}
        </Button>
      </div>
    </>
  ) : null;
};

export default Preview;
