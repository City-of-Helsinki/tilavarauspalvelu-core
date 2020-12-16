import { Button, Checkbox, Select, TextInput } from 'hds-react';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import styles from '../Application.module.scss';
import ReservationUnitList from './ReservationUnitList';
import { ApplicationPeriod } from '../../common/types';
import { formatDate } from '../../common/util';

type OptionType = {
  label: string;
  value: string;
};

const options = [
  { label: 'foo', value: 'foo-value' },
  { label: 'bar', value: 'bar-value' },
] as OptionType[];

const Page1 = ({
  applicationPeriod,
}: {
  applicationPeriod: ApplicationPeriod;
}): JSX.Element => {
  const { t } = useTranslation();
  const { register, handleSubmit, setValue } = useForm({
    defaultValues: {
      name: 'niimiii',
      ageGroup: '',
      abilityGroup: '',
      purpose: '',
      periodStartDate: applicationPeriod.applicationPeriodBegin,
    },
  });
  const onSubmit = (data: any) => alert(JSON.stringify(data));

  useEffect(() => {
    // register form fields (the ones that don't have 'ref'
    register({ name: 'ageGroup' });
    register({ name: 'abilityGroup' });
    register({ name: 'purpose' });
  });

  const periodStartDate = formatDate(applicationPeriod.applicationPeriodBegin);
  const periodEndDate = formatDate(applicationPeriod.applicationPeriodEnd);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className={styles.subHeadLine}>{t('Perustiedot')}</div>
      <div className={styles.basicInfoContainer}>
        <TextInput
          ref={register({ required: true })}
          label="Vakiovuoron nimi"
          id="name"
          name="name"
        />
        <TextInput
          ref={register()}
          label="Ryhmän koko"
          id="groupSize"
          name="groupSize"
          type="number"
        />
        <Select
          id="ageGroup"
          placeholder="Valitse"
          options={options}
          label="Ikäryhmä"
          onChange={(selection: OptionType): void => {
            setValue('ageGroup', selection.value);
          }}
        />
        <Select
          placeholder="Valitse"
          options={options}
          label="Tasoryhmä"
          onChange={(selection: OptionType): void => {
            setValue('abilityGroup', selection.value);
          }}
        />
        <Select
          className={styles.fullWidth}
          placeholder="Valitse"
          options={options}
          label="Vuoron käyttötarkoitus / Toiminnan sisältö"
          onChange={(selection: OptionType): void => {
            setValue('purpose', selection.value);
          }}
        />
        <TextInput
          ref={register()}
          className={styles.fullWidth}
          label="Lisätietoja vakiovuoroon liittyen"
          name="additionalInformation"
          id="additionalInformation"
        />
      </div>
      <hr className={styles.ruler} />
      <div className={styles.subHeadLine}>{t('Toivotut tilat')}</div>
      <ReservationUnitList />
      <hr className={styles.ruler} />
      <div className={styles.subHeadLine}>{t('Vakiovuorn kausi')}</div>
      <div className={styles.periodContainer}>
        <TextInput
          ref={register()}
          label="Kauden aloituspäivä"
          name="periodStartDate"
          id="periodStartDate"
        />
        <TextInput
          ref={register()}
          label="Kauden päätöspäivä"
          name="periodEndDate"
          id="periodEndDate"
        />
        <div style={{ display: 'flex' }}>
          <Checkbox id="defaultPeriod" checked />
          <span>
            {periodStartDate} - {periodEndDate}
          </span>
        </div>
        <TextInput
          ref={register()}
          label="Vuoron minimikesto"
          name="minDuration"
          id="minDuration"
        />
        <TextInput
          ref={register()}
          label="Vuoren maksimikesto"
          name="maxDuration"
          id="maxDuration"
        />
        <div style={{ display: 'flex' }}>
          <Checkbox id="durationCheckbox" checked />
          <span>1 t</span>
        </div>
        <TextInput
          ref={register()}
          className={styles.fullWidth}
          label="Vuorojen määrä/viikko"
          name="turnsPerWeek"
          id="turnsPerWeek"
        />
        <div style={{ display: 'flex' }}>
          <Checkbox id="everyTwoWeekCheckboxs" checked />
          <span>Vuoro vain joka toinen viikko</span>
        </div>
      </div>
      <Button onClick={() => handleSubmit(onSubmit)()}>Seuraava</Button>
    </form>
  );
};

export default Page1;
