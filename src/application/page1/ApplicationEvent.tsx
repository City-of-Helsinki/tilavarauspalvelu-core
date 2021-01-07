import { Accordion, Checkbox, Select, TextInput } from 'hds-react';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import styles from './Page1.module.scss';
import ReservationUnitList from './ReservationUnitList';
import {
  ApplicationEvent as ApplicationEventType,
  ApplicationPeriod,
} from '../../common/types';
import {
  formatApiDate,
  getSelectedOption,
  OptionType,
} from '../../common/util';

type OptionTypes = {
  ageGroupOptions: OptionType[];
  purposeOptions: OptionType[];
  abilityGroupOptions: OptionType[];
};

type Props = {
  applicationEvent: ApplicationEventType;
  index: number;
  applicationPeriod: ApplicationPeriod;
  register: ReturnType<typeof useForm>['register'];
  setValue: ReturnType<typeof useForm>['setValue'];
  watch: ReturnType<typeof useForm>['watch'];
  optionTypes: OptionTypes;
};

const ApplicationEvent = ({
  applicationEvent,
  index,
  applicationPeriod,
  register,
  setValue,
  watch,
  optionTypes,
}: Props): JSX.Element => {
  const periodStartDate = formatApiDate(
    applicationPeriod.applicationPeriodBegin
  );
  const periodEndDate = formatApiDate(applicationPeriod.applicationPeriodEnd);

  const { ageGroupOptions, abilityGroupOptions, purposeOptions } = optionTypes;

  const { t } = useTranslation();

  const fieldName = (nameField: string) =>
    `applicationEvents[${index}].${nameField}`;

  const name = watch(fieldName('name'));

  useEffect(() => {
    // register form fields (the ones that don't have 'ref')
    register({ name: fieldName('ageGroupId'), required: true });
    register({ name: fieldName('abilityGroupId'), required: true });
    register({ name: fieldName('purposeId'), required: true });
  });

  return (
    <Accordion heading={`${name}` || ''}>
      <div className={styles.subHeadLine}>
        {t('Application.Page1.basicInformationSubHeading')}
      </div>
      <div className={styles.twoColumnContainer}>
        <TextInput
          ref={register({ required: true })}
          label={t('Application.Page1.name')}
          id={fieldName('name')}
          name={fieldName('name')}
          required
        />
        <TextInput
          required
          ref={register({ required: true, min: 1 })}
          label={t('Application.Page1.groupSize')}
          id={fieldName('numPersons')}
          name={fieldName('numPersons')}
          type="number"
        />
        <Select
          id="ageGroupId"
          placeholder="Valitse"
          options={ageGroupOptions}
          label={t('Application.Page1.ageGroup')}
          required
          onChange={(selection: OptionType): void => {
            setValue(fieldName('ageGroupId'), selection.value);
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
            setValue(fieldName('abilityGroupId'), selection.value);
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
            setValue(fieldName('purposeId'), selection.value);
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
          id={fieldName('begin')}
          name={fieldName('begin')}
          required
        />
        <TextInput
          ref={register({ required: true })}
          label={t('Application.Page1.periodEndDate')}
          id={fieldName('end')}
          name={fieldName('end')}
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
          id={fieldName('minDuration')}
          name={fieldName('minDuration')}
          required
        />
        <TextInput
          ref={register({ required: true })}
          label={t('Application.Page1.maxDuration')}
          id={fieldName('maxduration')}
          name={fieldName('maxDuration')}
          required
        />
        <Checkbox id="durationCheckbox" checked label="1t" />
        <TextInput
          ref={register()}
          className={styles.fullWidth}
          label={t('Application.Page1.eventsPerWeek')}
          id={fieldName('eventsPerWeek')}
          name={fieldName('eventsPerWeek')}
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
    </Accordion>
  );
};

export default ApplicationEvent;
