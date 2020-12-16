import { Select, TextInput } from 'hds-react';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import styles from '../Application.module.scss';
import ReservationUnitList from './ReservationUnitList';

type OptionType = {
  label: string;
  value: string;
};

const options = [
  { label: 'foo', value: 'foo-value' },
  { label: 'bar', value: 'bar-value' },
] as OptionType[];

const Page1 = (): JSX.Element => {
  const { t } = useTranslation();
  const { register, handleSubmit, setValue } = useForm();
  const onSubmit = (data: any) => alert(JSON.stringify(data));

  useEffect(() => {
    // register form fields
    register({ name: 'ageGroup' });
    register({ name: 'abilityGroup' });
    register({ name: 'purpose' });
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className={styles.subHeadLine}>{t('Perustiedot')}</div>
      <div className={styles.basicInfoContainer}>
        <TextInput ref={register()} label="Vakiovuoron nimi" id="name" name="name" />
        <TextInput ref={register()} label="Ryhmän koko" id="groupSize" name="groupSize" type="number" />
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
      <input type="submit" />
    </form>
  );
};

export default Page1;
