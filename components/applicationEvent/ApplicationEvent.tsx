import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import {
  Button as HDSButton,
  Checkbox,
  DateInput,
  Notification,
  TextInput,
} from "hds-react";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import styled from "styled-components";
import ReservationUnitList from "../reservation-unit/ReservationUnitList";
import {
  AccordionState,
  Action,
  Application,
  ApplicationEvent as ApplicationEventType,
  ApplicationRound,
  EditorState,
  LocalizationLanguages,
  OptionType,
  ReservationUnit,
} from "../../modules/types";
import {
  apiDateToUIDate,
  apiDurationToMinutes,
  errorText,
  formatApiDate,
  formatDate,
  uiDateToApiDate,
} from "../../modules/util";
import { breakpoint } from "../../modules/style";
import { CheckboxWrapper, HorisontalRule } from "../common/common";
import ApplicationEventSummary from "./ApplicationEventSummary";
import ControlledSelect from "../common/ControlledSelect";
import Accordion from "../common/Accordion";
import { defaultDuration, durationOptions } from "../../modules/const";
import { after, before } from "../../modules/validation";
import ConfirmationModal, { ModalRef } from "../common/ConfirmationModal";

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
  onDeleteEvent: () => void;
};

const SubHeadLine = styled.h2`
  font-family: var(--font-bold);
  margin-top: var(--spacing-layout-m);
  font-weight: 700;
  font-size: var(--fontsize-heading-m);
`;

const TwoColumnContainer = styled.div`
  margin-top: var(--spacing-l);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-l);
  @media (max-width: ${breakpoint.m}) {
    grid-template-columns: 1fr;
    gap: 0;
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

const Button = styled(HDSButton)`
  margin-top: var(--spacing-layout-l);
  @media (max-width: ${breakpoint.s}) {
    margin-top: var(--spacing-layout-s);
    margin-left: auto;
    margin-right: auto;
  }
`;

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
  form.clearErrors([fieldName("minDuration"), fieldName("maxDuration")]);
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
  onDeleteEvent,
}: Props): JSX.Element => {
  const periodStartDate = formatApiDate(
    applicationRound.reservationPeriodBegin
  );
  const periodEndDate = formatApiDate(applicationRound.reservationPeriodEnd);

  const [defaultPeriodSelected, setDefaultPeriodSelected] = useState(false);
  const [defaultDurationSelected, setDefaultDurationSelected] = useState(false);

  const {
    ageGroupOptions,
    purposeOptions,
    reservationUnitTypeOptions,
    participantCountOptions,
  } = optionTypes;

  const { t, i18n } = useTranslation();

  const fieldName = (nameField: string) =>
    `applicationEvents[${index}].${nameField}`;

  const eventName = form.watch(fieldName("name"));
  const applicationPeriodBegin = form.watch(fieldName("begin"));
  const applicationPeriodEnd = form.watch(fieldName("end"));
  const durationMin = form.watch(fieldName("minDuration"));
  const durationMax = form.watch(fieldName("maxDuration"));
  const numPersons = form.watch(fieldName("numPersons"));
  form.watch(fieldName("eventsPerWeek"));
  form.watch(fieldName("biweekly"));

  useEffect(() => {
    form.register({ name: fieldName("eventReservationUnits") });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const selectionIsDefaultPeriod =
      applicationPeriodEnd &&
      applicationPeriodBegin &&
      uiDateToApiDate(applicationPeriodBegin) === periodStartDate &&
      uiDateToApiDate(applicationPeriodEnd) === periodEndDate;

    setDefaultPeriodSelected(selectionIsDefaultPeriod);
  }, [
    applicationPeriodBegin,
    applicationPeriodEnd,
    periodStartDate,
    periodEndDate,
  ]);

  const modalRef = useRef<ModalRef>();

  useEffect(() => {
    const selectionIsDefaultDuration =
      durationMin === defaultDuration && durationMax === defaultDuration;

    setDefaultDurationSelected(selectionIsDefaultDuration);
  }, [durationMin, durationMax]);

  const selectDefaultPeriod = (e: ChangeEvent<HTMLInputElement>): void => {
    const { checked } = e.target;
    setDefaultPeriodSelected(checked);
    if (checked) {
      form.setValue(fieldName("begin"), apiDateToUIDate(periodStartDate));
      form.setValue(fieldName("end"), apiDateToUIDate(periodEndDate));
    }
  };

  const selectDefaultDuration = (e: ChangeEvent<HTMLInputElement>): void => {
    const { checked } = e.target;
    setDefaultDurationSelected(checked);
    if (checked) {
      form.setValue(fieldName("minDuration"), defaultDuration);
      form.setValue(fieldName("maxDuration"), defaultDuration);
    }
  };

  const del = () => {
    if (!applicationEvent.id) {
      // freshly created event can just be deleted
      dispatch({ type: "removeApplicationEvent", eventId: undefined });
    } else {
      onDeleteEvent();
    }
  };

  return (
    <>
      <Accordion
        onToggle={() =>
          dispatch({
            type: "toggleAccordionState",
            eventId: applicationEvent.id,
          })
        }
        open={isOpen(applicationEvent.id, editorState.accordionStates)}
        heading={`${eventName}` || t('application:Page1.applicationEventName')}
      >
        <SubHeadLine>
          {t("application:Page1.basicInformationSubHeading")}
        </SubHeadLine>
        <TwoColumnContainer>
          <div>
            <TextInput
              ref={form.register({ required: true })}
              label={t("application:Page1.name")}
              id={fieldName("name")}
              name={fieldName("name")}
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
              label={t("application:Page1.groupSize")}
              id={fieldName("numPersons")}
              name={fieldName("numPersons")}
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
            name={fieldName("ageGroupId")}
            required
            label={t("application:Page1.ageGroup")}
            control={form.control}
            options={ageGroupOptions}
            error={errorText(
              t,
              form.errors.applicationEvents?.[index]?.ageGroupId?.type
            )}
          />
          <ControlledSelect
            name={fieldName("purposeId")}
            required
            label={t("application:Page1.purpose")}
            control={form.control}
            options={purposeOptions}
            error={errorText(
              t,
              form.errors.applicationEvents?.[index]?.purposeId?.type
            )}
          />
        </TwoColumnContainer>
        <HorisontalRule />
        <SubHeadLine>{t("application:Page1.spacesSubHeading")}</SubHeadLine>
        <ReservationUnitList
          selectedReservationUnits={selectedReservationUnits}
          applicationEvent={applicationEvent}
          applicationRound={applicationRound}
          form={form}
          fieldName={fieldName("eventReservationUnits")}
          minSize={numPersons}
          options={{
            purposeOptions,
            reservationUnitTypeOptions,
            participantCountOptions,
          }}
        />
        <HorisontalRule />
        <SubHeadLine>
          {t("application:Page1.applicationRoundSubHeading")}
        </SubHeadLine>
        <PeriodContainer>
          <DateInput
            disableConfirmation
            language={i18n.language as LocalizationLanguages}
            onChange={(v) => {
              form.clearErrors([fieldName("begin"), fieldName("end")]);
              form.setValue(fieldName("begin"), v);
              form.trigger([fieldName("end"), fieldName("begin")]);
            }}
            ref={form.register({
              validate: {
                required: (val) => Boolean(val),
                beginAfterEnd: (val) =>
                  !after(
                    uiDateToApiDate(
                      form.getValues().applicationEvents?.[index]?.end
                    ),
                    uiDateToApiDate(val)
                  ),
                beginBeforePeriodBegin: (val) =>
                  !before(
                    applicationRound.reservationPeriodBegin,
                    uiDateToApiDate(val)
                  ),
                beginAfterPeriodEnd: (val) =>
                  !after(
                    applicationRound.reservationPeriodEnd,
                    uiDateToApiDate(val)
                  ),
              },
            })}
            label={t("application:Page1.periodStartDate")}
            id={fieldName("begin")}
            name={fieldName("begin")}
            value={form.getValues(fieldName("begin"))}
            required
            invalid={!!form.errors.applicationEvents?.[index]?.begin?.type}
            errorText={errorText(
              t,
              form.errors.applicationEvents?.[index]?.begin?.type
            )}
          />
          <DateInput
            ref={form.register({
              validate: {
                required: (val) => {
                  return Boolean(val);
                },
                endBeforeBegin: (val) => {
                  return !before(
                    uiDateToApiDate(
                      form.getValues().applicationEvents?.[index]?.begin
                    ),
                    uiDateToApiDate(val)
                  );
                },
                endBeforePeriodBegin: (val) =>
                  !before(
                    applicationRound.reservationPeriodBegin,
                    uiDateToApiDate(val)
                  ),
                endAfterPeriodEnd: (val) =>
                  !after(
                    applicationRound.reservationPeriodEnd,
                    uiDateToApiDate(val)
                  ),
              },
            })}
            disableConfirmation
            language={i18n.language as LocalizationLanguages}
            onChange={(v) => {
              form.clearErrors([fieldName("begin"), fieldName("end")]);
              form.setValue(fieldName("end"), v);
              form.trigger([fieldName("end"), fieldName("begin")]);
            }}
            value={form.getValues(fieldName("end"))}
            label={t("application:Page1.periodEndDate")}
            id={fieldName("end")}
            name={fieldName("end")}
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
                form.clearErrors([fieldName("begin"), fieldName("end")]);
                selectDefaultPeriod(e);
              }}
              disabled={defaultPeriodSelected}
            />
          </CheckboxWrapper>
          <ControlledSelect
            name={fieldName("minDuration")}
            required
            label={t("application:Page1.minDuration")}
            control={form.control}
            options={durationOptions}
            error={errorText(
              t,
              form.errors.applicationEvents?.[index]?.minDuration?.type
            )}
            validate={{
              required: (val: string) => {
                clearDurationErrors(form, fieldName);
                return val !== "00:00:00";
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
            name={fieldName("maxDuration")}
            required
            label={t("application:Page1.maxDuration")}
            control={form.control}
            options={durationOptions}
            error={errorText(
              t,
              form.errors.applicationEvents?.[index]?.maxDuration?.type
            )}
            validate={{
              required: (val: string) => {
                clearDurationErrors(form, fieldName);
                return val !== "00:00:00";
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
              label={t("application:Page1.defaultDurationLabel")}
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
              label={t("application:Page1.eventsPerWeek")}
              id={fieldName("eventsPerWeek")}
              name={fieldName("eventsPerWeek")}
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
            name={fieldName("biweekly")}
            render={(props) => {
              return (
                <CheckboxWrapper>
                  <Checkbox
                    {...props}
                    id={fieldName("biweekly")}
                    checked={props.value}
                    onChange={() => props.onChange(!props.value)}
                    label={t("application:Page1.biweekly")}
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
          name={eventName}
        />
        <TwoColumnContainer>
          <Button
            type="submit"
            id={`applicationEvents[${index}].save`}
            onClick={onSave}
          >
            {t("application:Page1.saveEvent")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            id={`applicationEvents[${index}].delete`}
            onClick={() => {
              modalRef?.current?.open();
            }}
          >
            {t("application:Page1.deleteEvent")}
          </Button>
          <ConfirmationModal
            id="application-event-confirmation"
            cancelLabel="common:close"
            heading={t("DeleteEvent.heading")}
            content={t("DeleteEvent.text")}
            onOk={del}
            ref={modalRef}
          />
        </TwoColumnContainer>
      </Accordion>
      {editorState.savedEventId &&
      editorState.savedEventId === applicationEvent.id ? (
        <Notification
          size="small"
          type="success"
          label={t("application:applicationEventSaved")}
        >
          {t("application:applicationEventSaved")}
        </Notification>
      ) : null}
    </>
  );
};

export default ApplicationEvent;
