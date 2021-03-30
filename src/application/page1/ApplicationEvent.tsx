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
import {
  apiDurationToMinutes,
  errorText,
  formatApiDate,
  formatDate,
} from '../../common/util';
import { breakpoint } from '../../common/style';
import { CheckboxWrapper, HorisontalRule } from '../../component/common';
import ApplicationEventSummary from './ApplicationEventSummary';
import ControlledSelect from '../../component/ControlledSelect';
import Accordion from '../../component/Accordion';
import { durationOptions } from '../../common/const';
import { after, before } from './validation';

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
  align-items: baseline;
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

const clearDurationErrors = (
  form: ReturnType<typeof useForm>,
  fieldName: (nameField: string) => string
) => {
  form.clearErrors([fieldName('minDuration'), fieldName('maxDuration')]);
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
    applicationRound.reservationPeriodBegin
  );
  const periodEndDate = formatApiDate(applicationRound.reservationPeriodEnd);

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
  const numPersons = form.watch(fieldName('numPersons'));
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
          <div>
            <TextInput
              ref={form.register({ required: true })}
              label={t('Application.Page1.name')}
              id={fieldName('name')}
              name={fieldName('name')}
              required
              invalid={!!form.errors.applicationEvents?.[index]?.name?.type}
              errorText={errorText(
                t,
                form.errors.applicationEvents?.[index]?.name?.type
              )}
            />
          </div>
          <div>
            <TextInput
              type="number"
              required
              ref={form.register({
                validate: {
                  required: (val) => Boolean(val),
                  numPersonsMin: (val) => Number(val) > 0,
                },
              })}
              label={t('Application.Page1.groupSize')}
              id={fieldName('numPersons')}
              name={fieldName('numPersons')}
              invalid={
                !!form.errors.applicationEvents?.[index]?.numPersons?.type
              }
              errorText={errorText(
                t,
                form.errors.applicationEvents?.[index]?.numPersons?.type
              )}
            />
          </div>
          <ControlledSelect
            name={fieldName('ageGroupId')}
            required
            label={t('Application.Page1.ageGroup')}
            control={form.control}
            options={ageGroupOptions}
            error={errorText(
              t,
              form.errors.applicationEvents?.[index]?.ageGroupId?.type
            )}
          />
          <ControlledSelect
            name={fieldName('abilityGroupId')}
            required
            label={t('Application.Page1.abilityGroup')}
            control={form.control}
            options={abilityGroupOptions}
            error={errorText(
              t,
              form.errors.applicationEvents?.[index]?.abilityGroupId?.type
            )}
          />
          <SpanTwoColumns>
            <ControlledSelect
              name={fieldName('purposeId')}
              required
              label={t('Application.Page1.purpose')}
              control={form.control}
              options={purposeOptions}
              error={errorText(
                t,
                form.errors.applicationEvents?.[index]?.purposeId?.type
              )}
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
          minSize={numPersons}
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
            onChange={() => {
              form.clearErrors([fieldName('begin'), fieldName('end')]);
            }}
            ref={form.register({
              validate: {
                required: (val) => Boolean(val),
                beginAfterEnd: (val) =>
                  !after(form.getValues().applicationEvents?.[index]?.end, val),
                beginBeforePeriodBegin: (val) =>
                  !before(applicationRound.reservationPeriodBegin, val),
                beginAfterPeriodEnd: (val) =>
                  !after(applicationRound.reservationPeriodEnd, val),
              },
            })}
            label={t('Application.Page1.periodStartDate')}
            id={fieldName('begin')}
            name={fieldName('begin')}
            required
            invalid={!!form.errors.applicationEvents?.[index]?.begin?.type}
            errorText={errorText(
              t,
              form.errors.applicationEvents?.[index]?.begin?.type
            )}
          />
          <TextInput
            type="date"
            onChange={() =>
              form.clearErrors([fieldName('begin'), fieldName('end')])
            }
            ref={form.register({
              validate: {
                required: (val) => Boolean(val),
                endBeforeBegin: (val) =>
                  !before(
                    form.getValues().applicationEvents?.[index]?.begin,
                    val
                  ),
                endBeforePeriodBegin: (val) =>
                  !before(applicationRound.reservationPeriodBegin, val),
                endAfterPeriodEnd: (val) =>
                  !after(applicationRound.reservationPeriodEnd, val),
              },
            })}
            label={t('Application.Page1.periodEndDate')}
            id={fieldName('end')}
            name={fieldName('end')}
            required
            invalid={form.errors.applicationEvents?.[index]?.end?.type}
            errorText={errorText(
              t,
              form.errors.applicationEvents?.[index]?.end?.type
            )}
          />
          <CheckboxWrapper>
            <Checkbox
              id="defaultPeriod"
              checked={defaultPeriodSelected}
              label={`${formatDate(
                applicationRound.reservationPeriodBegin
              )} - ${formatDate(applicationRound.reservationPeriodEnd)}`}
              onChange={(e) => {
                form.clearErrors([fieldName('begin'), fieldName('end')]);
                selectDefaultPeriod(e);
              }}
              disabled={defaultPeriodSelected}
            />
          </CheckboxWrapper>
          <ControlledSelect
            name={fieldName('minDuration')}
            required
            label={t('Application.Page1.minDuration')}
            control={form.control}
            options={durationOptions}
            error={errorText(
              t,
              form.errors.applicationEvents?.[index]?.minDuration?.type
            )}
            validate={{
              required: (val: string) => {
                clearDurationErrors(form, fieldName);
                return val !== '00:00:00';
              },
              minDurationBiggerThanMaxDuration: (val: string) =>
                apiDurationToMinutes(val) <=
                apiDurationToMinutes(
                  form.getValues().applicationEvents?.[index]
                    ?.maxDuration as string
                ),
            }}
          />
          <ControlledSelect
            name={fieldName('maxDuration')}
            required
            label={t('Application.Page1.maxDuration')}
            control={form.control}
            options={durationOptions}
            error={errorText(
              t,
              form.errors.applicationEvents?.[index]?.maxDuration?.type
            )}
            validate={{
              required: (val: string) => {
                clearDurationErrors(form, fieldName);
                return val !== '00:00:00';
              },
              maxDurationSmallerThanMinDuration: (val: string) =>
                apiDurationToMinutes(val) >=
                apiDurationToMinutes(
                  form.getValues().applicationEvents?.[index]
                    ?.minDuration as string
                ),
            }}
          />
          <CheckboxWrapper>
            <Checkbox
              id="durationCheckbox"
              checked={defaultDurationSelected}
              label={t('Application.Page1.defaultDurationLabel')}
              onChange={(e) => {
                clearDurationErrors(form, fieldName);
                selectDefaultDuration(e);
              }}
              disabled={defaultDurationSelected}
            />
          </CheckboxWrapper>
          <SpanTwoColumns>
            <TextInput
              ref={form.register({
                validate: {
                  eventsPerWeekMin: (val) => Number(val) > 0,
                },
              })}
              label={t('Application.Page1.eventsPerWeek')}
              id={fieldName('eventsPerWeek')}
              name={fieldName('eventsPerWeek')}
              type="number"
              required
              min={1}
              invalid={
                !!form.errors.applicationEvents?.[index]?.eventsPerWeek?.type
              }
              errorText={errorText(
                t,
                form.errors.applicationEvents?.[index]?.eventsPerWeek?.type
              )}
            />
          </SpanTwoColumns>
          <Controller
            control={form.control}
            name={fieldName('biweekly')}
            render={(props) => {
              return (
                <CheckboxWrapper>
                  <Checkbox
                    {...props}
                    id={fieldName('biweekly')}
                    checked={props.value}
                    onChange={() => props.onChange(!props.value)}
                    label={t('Application.Page1.biweekly')}
                  />
                </CheckboxWrapper>
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
