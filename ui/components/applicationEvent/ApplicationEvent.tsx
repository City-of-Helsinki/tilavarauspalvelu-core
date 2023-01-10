import React, { useRef } from "react";
import {
  Checkbox,
  DateInput,
  Notification,
  NumberInput,
  TextInput,
} from "hds-react";
import { useTranslation } from "react-i18next";
import { Controller, useForm } from "react-hook-form";
import styled from "styled-components";
import {
  AccordionState,
  Action,
  Application,
  ApplicationEvent as ApplicationEventType,
  EditorState,
  LocalizationLanguages,
  OptionType,
} from "common/types/common";
import {
  ApplicationRoundType,
  ReservationUnitType,
} from "common/types/gql-types";
import { fontRegular, H5 } from "common/src/common/typography";
import { breakpoints } from "common/src/common/style";
import { omit } from "lodash";
import { CheckboxWrapper } from "common/src/reservation-form/components";
import ReservationUnitList from "../reservation-unit/ReservationUnitList";
import {
  apiDateToUIDate,
  apiDurationToMinutes,
  applicationErrorText,
  formatApiDate,
  formatDate,
  uiDateToApiDate,
} from "../../modules/util";
import ApplicationEventSummary from "./ApplicationEventSummary";
import ControlledSelect from "../common/ControlledSelect";
import Accordion from "../common/Accordion";
import { getDurationOptions } from "../../modules/const";
import { after, before } from "../../modules/validation";
import ConfirmationModal, { ModalRef } from "../common/ConfirmationModal";
import { MediumButton } from "../../styles/util";

type OptionTypes = {
  ageGroupOptions: OptionType[];
  purposeOptions: OptionType[];
  abilityGroupOptions: OptionType[];
  reservationUnitTypeOptions: OptionType[];
  participantCountOptions: OptionType[];
  unitOptions: OptionType[];
};

type Props = {
  applicationEvent: ApplicationEventType;
  index: number;
  applicationRound: ApplicationRoundType;
  form: ReturnType<typeof useForm>;
  selectedReservationUnits: ReservationUnitType[];
  optionTypes: OptionTypes;
  editorState: EditorState;
  dispatch: React.Dispatch<Action>;
  onSave: () => void;
  onDeleteEvent: () => void;
};

const Wrapper = styled.div`
  margin-bottom: var(--spacing-s);
`;

const SubHeadLine = styled(H5).attrs({
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

  @media (max-width: ${breakpoints.m}) {
    grid-template-columns: 1fr;
  }
`;

const PeriodContainer = styled.div`
  margin-top: var(--spacing-m);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-l);
  align-items: baseline;
  margin-bottom: var(--spacing-layout-s);

  label {
    ${fontRegular};
  }

  @media (max-width: ${breakpoints.m}) {
    grid-template-columns: 1fr;
  }
`;

const ActionContainer = styled.div`
  display: flex;
  flex-direction: column-reverse;
  margin-top: var(--spacing-layout-l);
  gap: var(--spacing-l);

  @media (min-width: ${breakpoints.m}) {
    flex-direction: row;
    justify-content: space-between;
    gap: var(--spacing-l);
  }
`;

const Button = styled(MediumButton)`
  width: 100%;

  @media (min-width: ${breakpoints.m}) {
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
    unitOptions,
  } = optionTypes;

  const { t, i18n } = useTranslation();

  const fieldName = (nameField: string) =>
    `applicationEvents[${index}].${nameField}`;

  const {
    register,
    formState: { errors },
  } = form;

  register(fieldName("eventReservationUnits"));
  register(fieldName("begin"));
  register(fieldName("end"));
  register(fieldName("minDuration"));
  register(fieldName("maxDuration"));
  register(fieldName("numPersons"));
  register(fieldName("eventsPerWeek"));
  register(fieldName("biweekly"));

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
    <Wrapper>
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
              {...form.register(fieldName("name"), {
                required: true,
                maxLength: 255,
              })}
              label={t("application:Page1.name")}
              id={fieldName("name")}
              required
              invalid={!!errors.applicationEvents?.[index]?.name?.type}
              errorText={applicationErrorText(
                t,
                errors.applicationEvents?.[index]?.name?.type,
                { count: 255 }
              )}
            />
          </div>
          <div>
            <NumberInput
              id={fieldName("numPersons")}
              required
              {...omit(
                form.register(fieldName("numPersons"), {
                  validate: {
                    required: (val) => Boolean(val),
                    numPersonsMin: (val) => Number(val) > 0,
                  },
                }),
                ["max"]
              )}
              label={t("application:Page1.groupSize")}
              min={0}
              minusStepButtonAriaLabel={t("common:subtract")}
              plusStepButtonAriaLabel={t("common:add")}
              step={1}
              errorText={applicationErrorText(
                t,
                errors.applicationEvents?.[index]?.numPersons?.type
              )}
              invalid={!!errors.applicationEvents?.[index]?.numPersons?.type}
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
              errors.applicationEvents?.[index]?.ageGroupId?.type
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
              errors.applicationEvents?.[index]?.purposeId?.type
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
          minSize={parseInt(numPersons, 10)}
          options={{
            purposeOptions,
            reservationUnitTypeOptions,
            participantCountOptions,
            unitOptions,
          }}
        />
        <SubHeadLine>
          {t("application:Page1.applicationRoundSubHeading")}
        </SubHeadLine>
        <CheckboxWrapper>
          <Checkbox
            id={fieldName("defaultPeriod")}
            checked={selectionIsDefaultPeriod}
            label={`${t("application:Page1.defaultPeriodPrefix")} ${formatDate(
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
            {...form.register(fieldName("begin"), {
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
            onChange={(v) => {
              form.clearErrors([fieldName("begin"), fieldName("end")]);
              form.setValue(fieldName("begin"), v);
              form.trigger([fieldName("end"), fieldName("begin")]);
            }}
            label={t("application:Page1.periodStartDate")}
            id={fieldName("begin")}
            value={form.getValues(fieldName("begin"))}
            required
            minDate={new Date(applicationRound.reservationPeriodBegin)}
            maxDate={new Date(applicationRound.reservationPeriodEnd)}
            invalid={!!errors?.applicationEvents?.[index]?.begin?.type}
            errorText={applicationErrorText(
              t,
              errors?.applicationEvents?.[index]?.begin?.type
            )}
          />
          <DateInput
            {...form.register(fieldName("end"), {
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
            required
            minDate={new Date(applicationRound.reservationPeriodBegin)}
            maxDate={new Date(applicationRound.reservationPeriodEnd)}
            invalid={errors.applicationEvents?.[index]?.end?.type}
            errorText={applicationErrorText(
              t,
              errors.applicationEvents?.[index]?.end?.type
            )}
          />
          <ControlledSelect
            name={fieldName("minDuration")}
            required
            label={t("application:Page1.minDuration")}
            control={form.control}
            options={getDurationOptions()}
            error={applicationErrorText(
              t,
              errors.applicationEvents?.[index]?.minDuration?.type
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
            options={getDurationOptions()}
            error={applicationErrorText(
              t,
              errors.applicationEvents?.[index]?.maxDuration?.type
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
            required
            {...omit(
              form.register(fieldName("eventsPerWeek"), {
                validate: {
                  eventsPerWeekMin: (val) => Number(val) > 0,
                },
              }),
              ["max"]
            )}
            label={t("application:Page1.eventsPerWeek")}
            min={1}
            minusStepButtonAriaLabel={t("common:subtract")}
            plusStepButtonAriaLabel={t("common:add")}
            step={1}
            invalid={!!errors.applicationEvents?.[index]?.eventsPerWeek?.type}
            errorText={applicationErrorText(
              t,
              errors.applicationEvents?.[index]?.eventsPerWeek?.type
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
            okLabel="application:Page1.deleteEvent"
            cancelLabel="application:Page1.deleteEventCancel"
            heading={t("application:Page1.deleteEventHeading")}
            content={t("application:Page1.deleteEventContent")}
            onOk={del}
            ref={modalRef}
            type="confirm"
          />
        </ActionContainer>
      </Accordion>
      {editorState.savedEventId &&
      editorState.savedEventId === applicationEvent.id ? (
        <Notification
          size="small"
          type="success"
          label={t("application:applicationEventSaved")}
          autoClose
        >
          {t("application:applicationEventSaved")}
        </Notification>
      ) : null}
    </Wrapper>
  );
};

export default ApplicationEvent;
