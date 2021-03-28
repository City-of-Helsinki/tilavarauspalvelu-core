import React, { ChangeEvent, useEffect, useState } from 'react';
import {
  Button,
  Checkbox,
  IconPaperclip,
  Notification,
  TextInput,
} from 'hds-react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import styled from 'styled-components';
import ReservationUnitList from './ReservationUnitList';
import {
  AccordionState,
  Action,
  Application,
  ApplicationEvent as ApplicationEventType,
  ApplicationRound,
  EditorState,
  OptionType,
  ReservationUnit,
} from '../../common/types';
import { formatApiDate, formatDate } from '../../common/util';
import { breakpoint } from '../../common/style';
import { HorisontalRule } from '../../component/common';
import ApplicationEventSummary from './ApplicationEventSummary';
import ControlledSelect from '../../component/ControlledSelect';
import Accordion from '../../component/Accordion';
import { durationOptions } from '../../common/const';

type OptionTypes = {
  ageGroupOptions: OptionType[];
  purposeOptions: OptionType[];
  abilityGroupOptions: OptionType[];
  reservationUnitTypeOptions: OptionType[];
  participantCountOptions: OptionType[];
};

type Props = {
  applicationEvent: ApplicationEventType;
  index: number;
  applicationRound: ApplicationRound;
  form: ReturnType<typeof useForm>;
  selectedReservationUnits: ReservationUnit[];
  optionTypes: OptionTypes;
  editorState: EditorState;
  dispatch: React.Dispatch<Action>;
  onSave: () => void;
};

const SubHeadLine = styled.h2`
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
  grid-template-columns: 2fr 2fr 3fr;
  gap: var(--spacing-m);
  align-items: center;
  margin-bottom: var(--spacing-layout-s);
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

const SaveButton = styled(Button)`
  margin-top: var(--spacing-layout-l);
`;
const defaultDuration = '01:00:00';

const isOpen = (
  current: number | undefined,
  states: AccordionState[]
): boolean => {
  return Boolean(
    states.find((state) => state.applicationEventId === current)?.open
  );
};

const getApplicationEventData = (
  original: ApplicationEventType,
  form: ApplicationEventType
): ApplicationEventType => {
  return { ...original, ...form };
};

const ApplicationEvent = ({
  applicationEvent,
  index,
  applicationRound,
  form,
  selectedReservationUnits,
  optionTypes,
  editorState,
  dispatch,
  onSave,
}: Props): JSX.Element => {
  const periodStartDate = formatApiDate(
    applicationRound.applicationPeriodBegin
  );
  const periodEndDate = formatApiDate(applicationRound.applicationPeriodEnd);

  const [defaultPeriodSelected, setDefaultPeriodSelected] = useState(false);
  const [defaultDurationSelected, setDefaultDurationSelected] = useState(false);

  const {
    ageGroupOptions,
    abilityGroupOptions,
    purposeOptions,
    reservationUnitTypeOptions,
    participantCountOptions,
  } = optionTypes;

  const { t } = useTranslation();

  const fieldName = (nameField: string) =>
    `applicationEvents[${index}].${nameField}`;

  const applicationName = form.watch(fieldName('name'));
  const applicationPeriodBegin = form.watch(fieldName('begin'));
  const applicationPeriodEnd = form.watch(fieldName('end'));
  const durationMin = form.watch(fieldName('minDuration'));
  const durationMax = form.watch(fieldName('maxDuration'));
  form.watch(fieldName('numPersons'));
  form.watch(fieldName('eventsPerWeek'));

  useEffect(() => {
    form.register({ name: fieldName('eventReservationUnits') });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    <>
      <Accordion
        onToggle={() =>
          dispatch({
            type: 'toggleAccordionState',
            eventId: applicationEvent.id,
          })
        }
        open={isOpen(applicationEvent.id, editorState.accordionStates)}
        heading={`${applicationName}` || ''}>
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
          <ControlledSelect
            name={fieldName('ageGroupId')}
            required
            label={t('Application.Page1.ageGroup')}
            control={form.control}
            options={ageGroupOptions}
          />
          <ControlledSelect
            name={fieldName('abilityGroupId')}
            required
            label={t('Application.Page1.abilityGroup')}
            control={form.control}
            options={abilityGroupOptions}
          />
          <SpanTwoColumns>
            <ControlledSelect
              name={fieldName('purposeId')}
              required
              label={t('Application.Page1.purpose')}
              control={form.control}
              options={purposeOptions}
            />
          </SpanTwoColumns>
        </TwoColumnContainer>
        <HorisontalRule />
        <SubHeadLine>{t('Application.Page1.spacesSubHeading')}</SubHeadLine>
        <ReservationUnitList
          selectedReservationUnits={selectedReservationUnits}
          applicationEvent={applicationEvent}
          applicationRound={applicationRound}
          form={form}
          fieldName={fieldName('eventReservationUnits')}
          options={{
            purposeOptions,
            reservationUnitTypeOptions,
            participantCountOptions,
          }}
        />
        <HorisontalRule />
        <SubHeadLine>
          {t('Application.Page1.applicationRoundSubHeading')}
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
              applicationRound.applicationPeriodBegin
            )} - ${formatDate(applicationRound.applicationPeriodEnd)}`}
            onChange={selectDefaultPeriod}
            disabled={defaultPeriodSelected}
          />
          <ControlledSelect
            name={fieldName('minDuration')}
            required
            label={t('Application.Page1.minDuration')}
            control={form.control}
            options={durationOptions}
          />
          <ControlledSelect
            name={fieldName('maxDuration')}
            required
            label={t('Application.Page1.maxDuration')}
            control={form.control}
            options={durationOptions}
          />
          <Checkbox
            id="durationCheckbox"
            checked={defaultDurationSelected}
            label={t('Application.Page1.defaultDurationLabel')}
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
        <HorisontalRule />
        <ApplicationEventSummary
          applicationEvent={getApplicationEventData(
            applicationEvent,
            (form.getValues() as Application).applicationEvents?.[index]
          )}
          name={applicationName}
        />
        <SaveButton
          id={`applicationEvents[${index}].save`}
          iconLeft={<IconPaperclip />}
          onClick={onSave}>
          {t('Application.Page1.saveEvent')}
        </SaveButton>
      </Accordion>
      {editorState.savedEventId &&
      editorState.savedEventId === applicationEvent.id ? (
        <Notification
          size="small"
          type="success"
          label={t('Application.applicationEventSaved')}>
          {t('Application.applicationEventSaved')}
        </Notification>
      ) : null}
    </>
  );
};

export default ApplicationEvent;
