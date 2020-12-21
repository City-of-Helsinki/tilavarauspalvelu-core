import { Button, Checkbox, IconArrowRight, Select, TextInput } from 'hds-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import styles from './Page1.module.scss';
import ReservationUnitList from './ReservationUnitList';
import {
  Application as ApplicationType,
  ApplicationPeriod,
  EventReservationUnit,
  ReservationUnit,
} from '../../common/types';
import {
  formatApiDate,
  getSelectedOption,
  mapOptions,
  OptionType,
} from '../../common/util';
import { getParameters } from '../../common/api';

type Props = {
  applicationPeriod: ApplicationPeriod;
  application: ApplicationType;
  reservationUnits: ReservationUnit[];
  onNext: () => void;
};

const Page1 = ({
  onNext,
  applicationPeriod,
  application,
  reservationUnits,
}: Props): JSX.Element | null => {
  const [ready, setReady] = useState<boolean>(false);
  const [ageGroupOptions, setAgeGroupOptions] = useState<OptionType[]>([]);
  const [purposeOptions, setPurposeOptions] = useState<OptionType[]>([]);
  const [abilityGroupOptions, setAbilityGroupOptions] = useState<OptionType[]>(
    []
  );

  const periodStartDate = formatApiDate(
    applicationPeriod.applicationPeriodBegin
  );
  const periodEndDate = formatApiDate(applicationPeriod.applicationPeriodEnd);

  const { t } = useTranslation();

  // todo only single event is handled
  const applicationEvent = application.applicationEvents[0];

  const { register, handleSubmit, setValue } = useForm({
    defaultValues: {
      ...applicationEvent,
      end: applicationEvent?.end ? applicationEvent.end : periodEndDate,
      begin: applicationEvent?.begin ? applicationEvent.begin : periodStartDate,
    },
  });

  useEffect(() => {
    // register form fields (the ones that don't have 'ref')
    register({ name: 'ageGroupId', required: true });
    register({ name: 'abilityGroupId', required: true });
    register({ name: 'purposeId', required: true });
  }, [register]);

  useEffect(() => {
    async function fetchData() {
      const fetchedAbilityGroupOptions = await getParameters('ability_group');
      const fetchedAgeGroupOptions = await getParameters('age_group');
      const fetchedPurposeOptions = await getParameters('purpose');

      setAbilityGroupOptions(mapOptions(fetchedAbilityGroupOptions));
      setAgeGroupOptions(mapOptions(fetchedAgeGroupOptions));
      setPurposeOptions(mapOptions(fetchedPurposeOptions));

      setReady(true);
    }
    fetchData();
  }, []);

  const onSubmit = (data: any) => {
    Object.assign(applicationEvent, data);
    setReady(false);

    // reservation units
    if (applicationEvent.eventReservationUnits.length === 0) {
      reservationUnits.forEach((ru, index) =>
        applicationEvent.eventReservationUnits.push({
          reservationUnit: ru.id,
          priority: index,
        } as EventReservationUnit)
      );
    }

    onNext();
  };

  return ready ? (
    <form>
      <div className={styles.subHeadLine}>
        {t('Application.Page1.basicInformationSubHeading')}
      </div>
      <div className={styles.twoColumnContainer}>
        <TextInput
          ref={register({ required: true })}
          label={t('Application.Page1.name')}
          id="name"
          name="name"
          required
        />
        <TextInput
          required
          ref={register({ required: true, min: 1 })}
          label={t('Application.Page1.groupSize')}
          id="numPersons"
          name="numPersons"
          type="number"
        />
        <Select
          id="ageGroupId"
          placeholder="Valitse"
          options={ageGroupOptions}
          label={t('Application.Page1.ageGroup')}
          required
          onChange={(selection: OptionType): void => {
            setValue('ageGroupId', selection.value);
          }}
          value={getSelectedOption(
            applicationEvent.ageGroupId,
            ageGroupOptions
          )}
        />
        <Select
          placeholder="Valitse"
          options={abilityGroupOptions}
          label={t('Application.Page1.abilityGroup')}
          required
          onChange={(selection: OptionType): void => {
            setValue('abilityGroupId', selection.value);
          }}
          value={getSelectedOption(
            applicationEvent.abilityGroupId,
            abilityGroupOptions
          )}
        />
        <Select
          className={styles.fullWidth}
          placeholder="Valitse"
          required
          options={purposeOptions}
          label={t('Application.Page1.purpose')}
          onChange={(selection: OptionType): void => {
            setValue('purposeId', selection.value);
          }}
          value={getSelectedOption(applicationEvent.purposeId, purposeOptions)}
        />
      </div>
      <hr className={styles.ruler} />
      <div className={styles.subHeadLine}>
        {t('Application.Page1.spacesSubHeading')}
      </div>
      <ReservationUnitList />
      <hr className={styles.ruler} />
      <div className={styles.subHeadLine}>
        {t('Application.Page1.applicationPeriodSubHeading')}
      </div>
      <div className={styles.periodContainer}>
        <TextInput
          ref={register({ required: true })}
          label={t('Application.Page1.periodStartDate')}
          name="begin"
          id="begin"
          required
        />
        <TextInput
          ref={register({ required: true })}
          label={t('Application.Page1.periodEndDate')}
          name="end"
          id="end"
          required
        />
        <Checkbox
          id="defaultPeriod"
          checked
          label={`${periodStartDate} - ${periodEndDate}`}
        />
        <TextInput
          ref={register({ required: true })}
          label={t('Application.Page1.minDuration')}
          name="minDuration"
          id="minDuration"
          required
        />
        <TextInput
          ref={register({ required: true })}
          label={t('Application.Page1.maxDuration')}
          name="maxDuration"
          id="maxDuration"
          required
        />
        <Checkbox id="durationCheckbox" checked label="1t" />
        <TextInput
          ref={register()}
          className={styles.fullWidth}
          label={t('Application.Page1.eventsPerWeek')}
          name="eventsPerWeek"
          id="eventsPerWeek"
          type="number"
          required
        />
        <Checkbox
          ref={register()}
          name="biweekly"
          id="biweekly"
          checked={applicationEvent.biweekly}
          label={t('Application.Page1.biweekly')}
        />
      </div>
      <div className={styles.buttonContainer}>
        <Button
          iconRight={<IconArrowRight />}
          onClick={() => handleSubmit(onSubmit)()}>
          {t('common.next')}
        </Button>
      </div>
    </form>
  ) : null;
};

export default Page1;
