import { Button, Checkbox, IconArrowRight, Select, TextInput } from 'hds-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import styles from './Page1.module.scss';
import ReservationUnitList from './ReservationUnitList';
import {
  Application as ApplicationType,
  ApplicationPeriod,
} from '../../common/types';
import {
  formatDate,
  getSelectedOption,
  mapOptions,
  OptionType,
} from '../../common/util';
import { getParameters } from '../../common/api';
import {
  SelectionsListContext,
  SelectionsListContextType,
} from '../../context/SelectionsListContext';

type Props = {
  applicationPeriod: ApplicationPeriod;
  application: ApplicationType;
  onNext: () => void;
};

const Page1 = ({
  onNext,
  applicationPeriod,
  application,
}: Props): JSX.Element | null => {
  const [ready, setReady] = useState<boolean>(false);
  const [ageGroupOptions, setAgeGroupOptions] = useState<OptionType[]>([]);
  const [purposeOptions, setPurposeOptions] = useState<OptionType[]>([]);
  const [abilityGroupOptions, setAbilityGroupOptions] = useState<OptionType[]>(
    []
  );

  const periodStartDate = formatDate(applicationPeriod.applicationPeriodBegin);
  const periodEndDate = formatDate(applicationPeriod.applicationPeriodEnd);

  const { t } = useTranslation();

  // todo only single is handled
  const applicationEvent = application.applicationEvents[0];

  const { register, handleSubmit, setValue } = useForm({
    defaultValues: {
      ...applicationEvent,
    },
  });

  const { reservationUnits } = React.useContext(
    SelectionsListContext
  ) as SelectionsListContextType;

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

  if (reservationUnits.length > 0) {
    console.log('!');
  }

  const onSubmit = (data: any) => {
    Object.assign(applicationEvent, data);
    onNext();
  };

  return ready ? (
    <form onSubmit={handleSubmit(onSubmit)}>
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
          ref={register({ required: true, min: 0 })}
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
          ref={register()}
          label={t('Application.Page1.periodStartDate')}
          name="begin"
          id="begin"
          required
        />
        <TextInput
          ref={register()}
          label={t('Application.Page1.periodEndDate')}
          name="end"
          id="end"
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
  ) : null;
};

export default Page1;
