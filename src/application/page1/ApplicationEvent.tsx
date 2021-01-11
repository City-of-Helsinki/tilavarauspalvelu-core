import { Accordion, Checkbox, Select, TextInput } from 'hds-react';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import styles from './Page1.module.scss';
import ReservationUnitList from './ReservationUnitList';
import {
  ApplicationEvent as ApplicationEventType,
  ApplicationPeriod,
  ReservationUnit,
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
  form: ReturnType<typeof useForm>;
  selectedReservationUnits: ReservationUnit[];
  optionTypes: OptionTypes;
};

const ApplicationEvent = ({
  applicationEvent,
  index,
  applicationPeriod,
  form,
  selectedReservationUnits,
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

  const name = form.watch(fieldName('name'));

  useEffect(() => {
    form.register({ name: fieldName('ageGroupId'), required: true });
    form.register({ name: fieldName('abilityGroupId'), required: true });
    form.register({ name: fieldName('purposeId'), required: true });
    form.register({ name: fieldName('eventReservationUnits') });
  });

  return (
    <Accordion heading={`${name}` || ''}>
      <div className={styles.subHeadLine}>
        {t('Application.Page1.basicInformationSubHeading')}
      </div>
      <div className={styles.twoColumnContainer}>
        <TextInput
          ref={form.register({ required: true })}
          label={t('Application.Page1.name')}
          id={fieldName('name')}
          name={fieldName('name')}
          required
        />
        <TextInput
          required
          ref={form.register({ required: true })}
          label={t('Application.Page1.groupSize')}
          id={fieldName('numPersons')}
          name={fieldName('numPersons')}
        />
        <Select
          id="ageGroupId"
          placeholder="Valitse"
          options={ageGroupOptions}
          label={t('Application.Page1.ageGroup')}
          required
          onChange={(selection: OptionType): void => {
            form.setValue(fieldName('ageGroupId'), selection.value);
          }}
          defaultValue={getSelectedOption(
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
            form.setValue(fieldName('abilityGroupId'), selection.value);
          }}
          defaultValue={getSelectedOption(
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
            form.setValue(fieldName('purposeId'), selection.value);
          }}
          defaultValue={getSelectedOption(
            applicationEvent.purposeId,
            purposeOptions
          )}
        />
      </div>
      <hr className={styles.ruler} />
      <div className={styles.subHeadLine}>
        {t('Application.Page1.spacesSubHeading')}
      </div>
      <ReservationUnitList
        selectedReservationUnits={selectedReservationUnits}
        applicationEvent={applicationEvent}
        applicationPeriod={applicationPeriod}
        form={form}
        fieldName={fieldName('eventReservationUnits')}
      />
      <hr className={styles.ruler} />
      <div className={styles.subHeadLine}>
        {t('Application.Page1.applicationPeriodSubHeading')}
      </div>
      <div className={styles.periodContainer}>
        <TextInput
          type="date"
          ref={form.register({ required: true })}
          label={t('Application.Page1.periodStartDate')}
          id={fieldName('begin')}
          name={fieldName('begin')}
          required
        />
        <TextInput
          type="date"
          ref={form.register({ required: true })}
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
          ref={form.register({ required: true })}
          label={t('Application.Page1.minDuration')}
          id={fieldName('minDuration')}
          name={fieldName('minDuration')}
          required
        />
        <TextInput
          ref={form.register({ required: true })}
          label={t('Application.Page1.maxDuration')}
          id={fieldName('maxduration')}
          name={fieldName('maxDuration')}
          required
        />
        <Checkbox id="durationCheckbox" checked label="1t" />
        <TextInput
          ref={form.register()}
          className={styles.fullWidth}
          label={t('Application.Page1.eventsPerWeek')}
          id={fieldName('eventsPerWeek')}
          name={fieldName('eventsPerWeek')}
          type="number"
          required
        />
        <Controller
          control={form.control}
          name={fieldName('biweekly')}
          render={(props) => {
            return (
              <Checkbox
                {...props}
                id={fieldName('biweekly')}
                checked={props.value}
                onChange={() => props.onChange(!props.value)}
                label={t('Application.Page1.biweekly')}
              />
            );
          }}
        />
      </div>
    </Accordion>
  );
};

export default ApplicationEvent;
