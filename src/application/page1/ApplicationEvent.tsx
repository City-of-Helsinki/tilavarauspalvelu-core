import { Accordion, Checkbox, Select, TextInput } from 'hds-react';
import React, { ChangeEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import styled from 'styled-components';
import ReservationUnitList from './ReservationUnitList';
import {
  ApplicationEvent as ApplicationEventType,
  ApplicationPeriod,
  OptionType,
  ReservationUnit,
} from '../../common/types';
import {
  formatApiDate,
  formatDate,
  getSelectedOption,
} from '../../common/util';
import { breakpoint } from '../../common/style';

type OptionTypes = {
  ageGroupOptions: OptionType[];
  purposeOptions: OptionType[];
  abilityGroupOptions: OptionType[];
  reservationUnitTypeOptions: OptionType[];
};

type Props = {
  applicationEvent: ApplicationEventType;
  index: number;
  applicationPeriod: ApplicationPeriod;
  form: ReturnType<typeof useForm>;
  selectedReservationUnits: ReservationUnit[];
  optionTypes: OptionTypes;
};

const Ruler = styled.hr`
  margin-top: var(--spacing-layout-m);
`;

const SubHeadLine = styled.div`
  font-family: var(--font-bold);
  margin-top: var(--spacing-layout-m);
  font-weight: 700;
  font-size: var(--fontsize-heading-m);
`;

const TwoColumnContainer = styled.div`
  margin-top: var(--spacing-m);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-m);
  @media (max-width: ${breakpoint.m}) {
    grid-template-columns: 1fr;
  }
`;

const PeriodContainer = styled.div`
  margin-top: var(--spacing-m);
  display: grid;
  grid-template: auto;
  grid-template-columns: 2fr 2fr 3fr;
  gap: var(--spacing-m);
  align-items: center;
  @media (max-width: ${breakpoint.m}) {
    grid-template-columns: 1fr;
  }
`;

const SpanTwoColumns = styled.span`
  grid-column-start: 1;
  grid-column-end: 3;

  @media (max-width: ${breakpoint.m}) {
    grid-column-start: 1;
    grid-column-end: 2;
  }
`;

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
  const defaultDuration = '1';

  const [defaultPeriodSelected, setDefaultPeriodSelected] = useState(false);
  const [defaultDurationSelected, setDefaultDurationSelected] = useState(false);

  const {
    ageGroupOptions,
    abilityGroupOptions,
    purposeOptions,
    reservationUnitTypeOptions,
  } = optionTypes;

  const { t } = useTranslation();

  const fieldName = (nameField: string) =>
    `applicationEvents[${index}].${nameField}`;

  const name = form.watch(fieldName('name'));
  const applicationPeriodBegin = form.watch(fieldName('begin'));
  const applicationPeriodEnd = form.watch(fieldName('end'));
  const durationMin = form.watch(fieldName('minDuration'));
  const durationMax = form.watch(fieldName('maxDuration'));

  useEffect(() => {
    form.register({ name: fieldName('ageGroupId'), required: true });
    form.register({ name: fieldName('abilityGroupId'), required: true });
    form.register({ name: fieldName('purposeId'), required: true });
    form.register({ name: fieldName('eventReservationUnits') });
  });

  useEffect(() => {
    const selectionIsDefaultPeriod =
      applicationPeriodBegin === periodStartDate &&
      applicationPeriodEnd === periodEndDate;

    setDefaultPeriodSelected(selectionIsDefaultPeriod);
  }, [
    applicationPeriodBegin,
    applicationPeriodEnd,
    periodStartDate,
    periodEndDate,
  ]);

  useEffect(() => {
    const selectionIsDefaultDuration =
      durationMin === defaultDuration && durationMax === defaultDuration;

    setDefaultDurationSelected(selectionIsDefaultDuration);
  }, [durationMin, durationMax]);

  const selectDefaultPeriod = (e: ChangeEvent<HTMLInputElement>): void => {
    const { checked } = e.target;
    setDefaultPeriodSelected(checked);
    if (checked) {
      form.setValue(fieldName('begin'), periodStartDate);
      form.setValue(fieldName('end'), periodEndDate);
    }
  };

  const selectDefaultDuration = (e: ChangeEvent<HTMLInputElement>): void => {
    const { checked } = e.target;
    setDefaultDurationSelected(checked);
    if (checked) {
      form.setValue(fieldName('minDuration'), defaultDuration);
      form.setValue(fieldName('maxDuration'), defaultDuration);
    }
  };

  return (
    <Accordion heading={`${name}` || ''}>
      <SubHeadLine>
        {t('Application.Page1.basicInformationSubHeading')}
      </SubHeadLine>
      <TwoColumnContainer>
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
        <SpanTwoColumns>
          <Select
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
        </SpanTwoColumns>
      </TwoColumnContainer>
      <Ruler />
      <SubHeadLine>{t('Application.Page1.spacesSubHeading')}</SubHeadLine>
      <ReservationUnitList
        selectedReservationUnits={selectedReservationUnits}
        applicationEvent={applicationEvent}
        applicationPeriod={applicationPeriod}
        form={form}
        fieldName={fieldName('eventReservationUnits')}
        options={{ purposeOptions, reservationUnitTypeOptions }}
      />
      <Ruler />
      <SubHeadLine>
        {t('Application.Page1.applicationPeriodSubHeading')}
      </SubHeadLine>
      <PeriodContainer>
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
          checked={defaultPeriodSelected}
          label={`${formatDate(
            applicationPeriod.applicationPeriodBegin
          )} - ${formatDate(applicationPeriod.applicationPeriodEnd)}`}
          onChange={selectDefaultPeriod}
          disabled={defaultPeriodSelected}
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
          id={fieldName('maxDuration')}
          name={fieldName('maxDuration')}
          required
        />
        <Checkbox
          id="durationCheckbox"
          checked={defaultDurationSelected}
          label={`${defaultDuration}${t('common.abbreviations.hour')}`}
          onChange={selectDefaultDuration}
          disabled={defaultDurationSelected}
        />
        <SpanTwoColumns>
          <TextInput
            ref={form.register()}
            label={t('Application.Page1.eventsPerWeek')}
            id={fieldName('eventsPerWeek')}
            name={fieldName('eventsPerWeek')}
            type="number"
            required
          />
        </SpanTwoColumns>
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
      </PeriodContainer>
    </Accordion>
  );
};

export default ApplicationEvent;
