import { Button, Checkbox, IconArrowRight, Select, TextInput } from 'hds-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import styles from '../Application.module.scss';
import ReservationUnitList from './ReservationUnitList';
import { ApplicationPeriod, Parameter } from '../../common/types';
import { formatDate } from '../../common/util';
import { getParameters } from '../../common/api';

type Props = {
  applicationPeriod: ApplicationPeriod;
};

type OptionType = {
  label: string;
  value: string;
};

const mapOptions = (src: Parameter[]): OptionType[] =>
  src.map((v) => ({
    label: v.name,
    value: String(v.id),
  }));

const Page1 = ({ applicationPeriod }: Props): JSX.Element => {
  const [ageGroupOptions, setAgeGroupOptions] = useState<OptionType[]>([]);
  const [purposeOptions, setPurposeOptions] = useState<OptionType[]>([]);
  const [abilityGroupOptions, setAbilityGroupOptions] = useState<OptionType[]>(
    []
  );

  const periodStartDate = formatDate(applicationPeriod.applicationPeriodBegin);
  const periodEndDate = formatDate(applicationPeriod.applicationPeriodEnd);

  const { t } = useTranslation();
  const { register, handleSubmit, setValue } = useForm({
    defaultValues: {
      name: 'Vakiovuoro 1.',
      ageGroup: '',
      abilityGroup: '',
      purpose: '',
      periodStartDate,
      periodEndDate,
      minDuration: 1,
      maxDuration: 1,
      turnsPerWeek: 1,
    },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, no-alert
  const onSubmit = (data: any) => alert(JSON.stringify(data));

  useEffect(() => {
    // register form fields (the ones that don't have 'ref')
    register({ name: 'ageGroup', required: true });
    register({ name: 'abilityGroup', required: true });
    register({ name: 'purpose', required: true });
  });

  useEffect(() => {
    async function fetchData() {
      const fetchedAbilityGroupOptions = await getParameters('ability_group');
      const fetchedAgeGroupOptions = await getParameters('age_group');
      const fetchedPurposeOptions = await getParameters('purpose');

      setAbilityGroupOptions(mapOptions(fetchedAbilityGroupOptions));
      setAgeGroupOptions(mapOptions(fetchedAgeGroupOptions));
      setPurposeOptions(mapOptions(fetchedPurposeOptions));
    }
    fetchData();
  }, []);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className={styles.subHeadLine}>
        {t('Application.Page1.basicInformationSubHeading')}
      </div>
      <div className={styles.basicInfoContainer}>
        <TextInput
          ref={register({ required: true })}
          label={t('Application.Page1.name')}
          id="name"
          name="name"
          required
        />
        <TextInput
          required
          ref={register({ required: true })}
          label={t('Application.Page1.groupSize')}
          id="groupSize"
          name="groupSize"
          type="number"
        />
        <Select
          id="ageGroup"
          placeholder="Valitse"
          options={ageGroupOptions}
          label={t('Application.Page1.ageGroup')}
          required
          onChange={(selection: OptionType): void => {
            setValue('ageGroup', selection.value);
          }}
        />
        <Select
          placeholder="Valitse"
          options={abilityGroupOptions}
          label={t('Application.Page1.abilityGroup')}
          required
          onChange={(selection: OptionType): void => {
            setValue('abilityGroup', selection.value);
          }}
        />
        <Select
          className={styles.fullWidth}
          placeholder="Valitse"
          required
          options={purposeOptions}
          label={t('Application.Page1.purpose')}
          onChange={(selection: OptionType): void => {
            setValue('purpose', selection.value);
          }}
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
          ref={register()}
          label={t('Application.Page1.periodStartDate')}
          name="periodStartDate"
          id="periodStartDate"
          required
        />
        <TextInput
          ref={register()}
          label={t('Application.Page1.periodEndDate')}
          name="periodEndDate"
          id="periodEndDate"
          required
        />
        <div style={{ display: 'flex' }}>
          <Checkbox id="defaultPeriod" checked />
          <span>
            {periodStartDate} - {periodEndDate}
          </span>
        </div>
        <TextInput
          ref={register()}
          label={t('Application.Page1.minDuration')}
          name="minDuration"
          id="minDuration"
          required
        />
        <TextInput
          ref={register()}
          label={t('Application.Page1.maxDuration')}
          name="maxDuration"
          id="maxDuration"
          required
        />
        <div style={{ display: 'flex' }}>
          <Checkbox id="durationCheckbox" checked />
          <span>1 t</span>
        </div>
        <TextInput
          ref={register()}
          className={styles.fullWidth}
          label={t('Application.Page1.eventsPerWeek')}
          name="eventsPerWeek"
          id="eventsPerWeek"
          type="number"
          required
        />
        <div style={{ display: 'flex' }}>
          <Checkbox id="everyTwoWeekCheckboxs" checked />
          <span>Vuoro vain joka toinen viikko</span>
        </div>
      </div>
      <div className={styles.buttonContainer}>
        <Button
          iconRight={<IconArrowRight />}
          onClick={() => handleSubmit(onSubmit)()}>
          {t('common.next')}
        </Button>
      </div>
    </form>
  );
};

export default Page1;
