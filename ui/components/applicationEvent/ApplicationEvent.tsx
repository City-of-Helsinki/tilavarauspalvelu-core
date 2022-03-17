import React, { useRef } from "react";
import {
  Checkbox,
  DateInput,
  Notification,
  NumberInput,
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
  applicationErrorText,
  formatApiDate,
  formatDate,
  uiDateToApiDate,
} from "../../modules/util";
import { breakpoint } from "../../modules/style";
import { CheckboxWrapper } from "../common/common";
import ApplicationEventSummary from "./ApplicationEventSummary";
import ControlledSelect from "../common/ControlledSelect";
import Accordion from "../common/Accordion";
import { durationOptions } from "../../modules/const";
import { after, before } from "../../modules/validation";
import ConfirmationModal, { ModalRef } from "../common/ConfirmationModal";
import { MediumButton } from "../../styles/util";
import { fontRegular, H4 } from "../../modules/style/typography";

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

const SubHeadLine = styled(H4).attrs({
  as: "h2",
})`
  margin-top: var(--spacing-layout-m);
`;

const TwoColumnContainer = styled.div`
  margin-top: var(--spacing-l);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-l);

  label {
    ${fontRegular};
  }

  @media (max-width: ${breakpoint.m}) {
    grid-template-columns: 1fr;
    gap: 0;
  }
`;

const PeriodContainer = styled.div`
  margin-top: var(--spacing-m);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-m);
  align-items: baseline;
  margin-bottom: var(--spacing-layout-s);

  label {
    ${fontRegular};
  }

  @media (max-width: ${breakpoint.m}) {
    grid-template-columns: 1fr;
  }
`;

const ActionContainer = styled.div`
  display: flex;
  flex-direction: column-reverse;
  margin-top: var(--spacing-layout-l);
  gap: var(--spacing-l);

  @media (min-width: ${breakpoint.m}) {
    flex-direction: row;
    justify-content: flex-end;
    gap: var(--spacing-l);
  }
`;

const Button = styled(MediumButton)`
  width: 100%;

  @media (min-width: ${breakpoint.m}) {
    width: 250px;
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

  const {
    ageGroupOptions,
    purposeOptions,
    reservationUnitTypeOptions,
    participantCountOptions,
  } = optionTypes;

  const { t, i18n } = useTranslation();

  const fieldName = (nameField: string) =>
    `applicationEvents[${index}].${nameField}`;

  form.register({ name: fieldName("eventReservationUnits") });
  form.register(fieldName("begin"));
  form.register(fieldName("end"));
  form.register(fieldName("minDuration"));
  form.register(fieldName("maxDuration"));
  form.register(fieldName("numPersons"));
  form.register(fieldName("eventsPerWeek"));
  form.register(fieldName("biweekly"));

  const eventName = form.watch(fieldName("name"));
  const applicationPeriodBegin = form.watch(fieldName("begin"));
  const applicationPeriodEnd = form.watch(fieldName("end"));
  const numPersons = form.watch(fieldName("numPersons"));
  form.watch(fieldName("eventsPerWeek"));
  form.watch(fieldName("biweekly"));

  const modalRef = useRef<ModalRef>();

  const selectDefaultPeriod = (): void => {
    form.setValue(fieldName("begin"), apiDateToUIDate(periodStartDate));
    form.setValue(fieldName("end"), apiDateToUIDate(periodEndDate));
  };

  const del = () => {
    if (!applicationEvent.id) {
      // freshly created event can just be deleted
      dispatch({ type: "removeApplicationEvent", eventId: undefined });
    } else {
      onDeleteEvent();
    }
  };

  const selectionIsDefaultPeriod =
    applicationPeriodEnd &&
    applicationPeriodBegin &&
    uiDateToApiDate(applicationPeriodBegin) === periodStartDate &&
    uiDateToApiDate(applicationPeriodEnd) === periodEndDate;

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
        heading={`${eventName}` || t("application:Page1.applicationEventName")}
        theme="thin"
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
              errorText={applicationErrorText(
                t,
                form.errors.applicationEvents?.[index]?.name?.type
              )}
            />
          </div>
          <div>
            <NumberInput
              id={fieldName("numPersons")}
              name={fieldName("numPersons")}
              required
              ref={form.register({
                validate: {
                  required: (val) => Boolean(val),
                  numPersonsMin: (val) => Number(val) > 0,
                },
              })}
              label={t("application:Page1.groupSize")}
              min={0}
              minusStepButtonAriaLabel={t("common:subtract")}
              plusStepButtonAriaLabel={t("common:add")}
              step={1}
              errorText={applicationErrorText(
                t,
                form.errors.applicationEvents?.[index]?.numPersons?.type
              )}
              invalid={
                !!form.errors.applicationEvents?.[index]?.numPersons?.type
              }
            />
          </div>
          <ControlledSelect
            name={fieldName("ageGroupId")}
            required
            label={t("application:Page1.ageGroup")}
            control={form.control}
            options={ageGroupOptions}
            error={applicationErrorText(
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
            error={applicationErrorText(
              t,
              form.errors.applicationEvents?.[index]?.purposeId?.type
            )}
          />
        </TwoColumnContainer>
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
        <SubHeadLine>
          {t("application:Page1.applicationRoundSubHeading")}
        </SubHeadLine>
        <CheckboxWrapper>
          <Checkbox
            id="defaultPeriod"
            checked={selectionIsDefaultPeriod}
            label={`${formatDate(
              applicationRound.reservationPeriodBegin
            )} - ${formatDate(applicationRound.reservationPeriodEnd)}`}
            onChange={() => {
              form.clearErrors([fieldName("begin"), fieldName("end")]);
              selectDefaultPeriod();
            }}
            disabled={selectionIsDefaultPeriod}
          />
        </CheckboxWrapper>
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
            errorText={applicationErrorText(
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
            errorText={applicationErrorText(
              t,
              form.errors.applicationEvents?.[index]?.end?.type
            )}
          />
          <ControlledSelect
            name={fieldName("minDuration")}
            required
            label={t("application:Page1.minDuration")}
            control={form.control}
            options={durationOptions}
            error={applicationErrorText(
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
            error={applicationErrorText(
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
          <NumberInput
            id={fieldName("eventsPerWeek")}
            name={fieldName("eventsPerWeek")}
            required
            ref={form.register({
              validate: {
                eventsPerWeekMin: (val) => Number(val) > 0,
              },
            })}
            label={t("application:Page1.eventsPerWeek")}
            min={1}
            minusStepButtonAriaLabel={t("common:subtract")}
            plusStepButtonAriaLabel={t("common:add")}
            step={1}
            invalid={
              !!form.errors.applicationEvents?.[index]?.eventsPerWeek?.type
            }
            errorText={applicationErrorText(
              t,
              form.errors.applicationEvents?.[index]?.eventsPerWeek?.type
            )}
          />
          <Controller
            control={form.control}
            name={fieldName("biweekly")}
            // render={(props) => {
            //   return (
            //     <CheckboxWrapper>
            //       <Checkbox
            //         {...props}
            //         id={fieldName("biweekly")}
            //         checked={props.value}
            //         onChange={() => props.onChange(!props.value)}
            //         label={t("application:Page1.biweekly")}
            //       />
            //     </CheckboxWrapper>
            //   );
            // }}
            render={() => {
              return (
                <input
                  type="hidden"
                  id={fieldName("biweekly")}
                  name={fieldName("biweekly")}
                  value=""
                />
              );
            }}
          />
        </PeriodContainer>
        <ApplicationEventSummary
          applicationEvent={getApplicationEventData(
            applicationEvent,
            (form.getValues() as Application).applicationEvents?.[index]
          )}
          name={eventName}
        />
        <ActionContainer>
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
          <Button
            type="submit"
            id={`applicationEvents[${index}].save`}
            onClick={onSave}
          >
            {t("application:Page1.saveEvent")}
          </Button>
          <ConfirmationModal
            id="application-event-confirmation"
            cancelLabel="common:close"
            heading={t("application:Page1.deleteEvent")}
            content=""
            onOk={del}
            ref={modalRef}
          />
        </ActionContainer>
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
