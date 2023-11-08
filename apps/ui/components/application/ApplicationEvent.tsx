// TODO this file should be moved to application/ since the only user is Page1
// also remove default export
import React, { useRef } from "react";
import { Checkbox, DateInput, NumberInput, Select, TextInput } from "hds-react";
import { useTranslation } from "next-i18next";
import { Controller, useFormContext } from "react-hook-form";
import styled from "styled-components";
import { OptionType } from "common/types/common";
import type { ApplicationRoundNode } from "common/types/gql-types";
import { fontRegular, H5 } from "common/src/common/typography";
import { breakpoints } from "common/src/common/style";
import { CheckboxWrapper } from "common/src/reservation-form/components";
import { getLocalizationLang } from "common/src/helpers";
import { ReservationUnitList } from "./ReservationUnitList";
import {
  apiDateToUIDate,
  formatApiDate,
  formatDate,
  uiDateToApiDate,
} from "@/modules/util";
import { ApplicationEventSummary } from "./ApplicationEventSummary";
import Accordion from "../common/Accordion";
import { getDurationNumberOptions } from "@/modules/const";
import ConfirmationModal, { ModalRef } from "../common/ConfirmationModal";
import { MediumButton } from "@/styles/util";
import { ApplicationFormValues } from "./Form";

type OptionTypes = {
  ageGroupOptions: OptionType[];
  purposeOptions: OptionType[];
  abilityGroupOptions: OptionType[];
  reservationUnitTypeOptions: OptionType[];
  participantCountOptions: OptionType[];
  unitOptions: OptionType[];
};

type Props = {
  index: number;
  applicationRound: ApplicationRoundNode;
  optionTypes: OptionTypes;
  isVisible: boolean;
  onToggleAccordian: () => void;
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

const ApplicationEventInner = ({
  index,
  applicationRound,
  optionTypes,
  del,
}: Omit<Props, "onToggleAccordian" | "onDeleteEvent"> & {
  del: () => void;
}): JSX.Element => {
  const { t, i18n } = useTranslation();
  const form = useFormContext<ApplicationFormValues>();
  const {
    control,
    register,
    formState: { errors },
    getValues,
    setValue,
    clearErrors,
    trigger,
    watch,
  } = form;

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

  const applicationPeriodBegin = watch(`applicationEvents.${index}.begin`);
  const applicationPeriodEnd = watch(`applicationEvents.${index}.end`);
  const numPersons = watch(`applicationEvents.${index}.numPersons`);
  const modalRef = useRef<ModalRef>();

  const selectDefaultPeriod = (): void => {
    const begin = periodStartDate ? apiDateToUIDate(periodStartDate) : "";
    const end = periodEndDate ? apiDateToUIDate(periodEndDate) : "";
    setValue(`applicationEvents.${index}.begin`, begin);
    setValue(`applicationEvents.${index}.end`, end);
  };

  const selectionIsDefaultPeriod =
    applicationPeriodEnd != null &&
    applicationPeriodBegin != null &&
    uiDateToApiDate(applicationPeriodBegin) === periodStartDate &&
    uiDateToApiDate(applicationPeriodEnd) === periodEndDate;

  type FieldName =
    | "begin"
    | "end"
    | "purpose"
    | "ageGroup"
    | "numPersons"
    | "abilityGroup"
    | "minDuration"
    | "maxDuration"
    | "name"
    | "eventsPerWeek"
    | "applicationEventSchedules"
    | "reservationUnits";
  const getTranslatedError = (field: FieldName): string => {
    const error = errors.applicationEvents?.[index]?.[field];
    if (error?.message != null) {
      return t(`application:validation.${error.message}`);
    }
    return "";
  };

  return (
    <>
      <SubHeadLine>
        {t("application:Page1.basicInformationSubHeading")}
      </SubHeadLine>
      <TwoColumnContainer>
        <div>
          <TextInput
            {...register(`applicationEvents.${index}.name`, {
              required: true,
              maxLength: 255,
            })}
            label={t("application:Page1.name")}
            id={`applicationEvents.${index}.name`}
            required
            invalid={errors.applicationEvents?.[index]?.name != null}
            errorText={getTranslatedError("name")}
          />
        </div>
        <div>
          <NumberInput
            id={`applicationEvents.${index}.numPersons`}
            required
            {...register(`applicationEvents.${index}.numPersons`, {
              validate: {
                required: (val) => Boolean(val),
                numPersonsMin: (val) => Number(val) > 0,
              },
              valueAsNumber: true,
            })}
            label={t("application:Page1.groupSize")}
            min={0}
            max={undefined}
            minusStepButtonAriaLabel={t("common:subtract")}
            plusStepButtonAriaLabel={t("common:add")}
            step={1}
            invalid={errors.applicationEvents?.[index]?.numPersons != null}
            errorText={getTranslatedError("numPersons")}
          />
        </div>
        <Controller
          control={control}
          rules={{ required: true }}
          name={`applicationEvents.${index}.ageGroup`}
          render={({ field }) => (
            <Select<OptionType>
              value={ageGroupOptions.find((v) => v.value === field.value)}
              onChange={(v: OptionType) => field.onChange(v.value)}
              required
              label={t("application:Page1.ageGroup")}
              options={ageGroupOptions}
              invalid={errors.applicationEvents?.[index]?.ageGroup != null}
              error={getTranslatedError("ageGroup")}
            />
          )}
        />
        <Controller
          control={control}
          rules={{ required: true }}
          name={`applicationEvents.${index}.purpose`}
          render={({ field }) => (
            <Select<OptionType>
              label={t("application:Page1.purpose")}
              value={purposeOptions.find((v) => v.value === field.value)}
              onChange={(v: OptionType) => field.onChange(v.value)}
              required
              options={purposeOptions}
              invalid={errors.applicationEvents?.[index]?.purpose != null}
              error={getTranslatedError("purpose")}
            />
          )}
        />
      </TwoColumnContainer>
      <SubHeadLine>{t("application:Page1.spacesSubHeading")}</SubHeadLine>
      <ReservationUnitList
        applicationRound={applicationRound}
        index={index}
        minSize={numPersons ?? undefined}
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
          id={`applicationEvents.${index}.defaultPeriod`}
          checked={selectionIsDefaultPeriod}
          label={`${t("application:Page1.defaultPeriodPrefix")} ${formatDate(
            applicationRound.reservationPeriodBegin
          )} - ${formatDate(applicationRound.reservationPeriodEnd)}`}
          onChange={() => {
            clearErrors([
              `applicationEvents.${index}.begin`,
              `applicationEvents.${index}.end`,
            ]);
            selectDefaultPeriod();
          }}
          disabled={selectionIsDefaultPeriod}
        />
      </CheckboxWrapper>
      <PeriodContainer>
        <DateInput
          disableConfirmation
          language={getLocalizationLang(i18n.language)}
          {...register(`applicationEvents.${index}.begin`)}
          onChange={(v) => {
            clearErrors([
              `applicationEvents.${index}.begin`,
              `applicationEvents.${index}.end`,
            ]);
            setValue(`applicationEvents.${index}.begin`, v);
            trigger([
              `applicationEvents.${index}.begin`,
              `applicationEvents.${index}.end`,
            ]);
          }}
          label={t("application:Page1.periodStartDate")}
          id={`applicationEvents.${index}.begin`}
          value={getValues(`applicationEvents.${index}.begin`)}
          required
          minDate={new Date(applicationRound.reservationPeriodBegin)}
          maxDate={new Date(applicationRound.reservationPeriodEnd)}
          invalid={errors?.applicationEvents?.[index]?.begin != null}
          errorText={getTranslatedError("begin")}
        />
        <DateInput
          {...register(`applicationEvents.${index}.end`)}
          disableConfirmation
          language={getLocalizationLang(i18n.language)}
          onChange={(v) => {
            clearErrors([
              `applicationEvents.${index}.begin`,
              `applicationEvents.${index}.end`,
            ]);
            setValue(`applicationEvents.${index}.end`, v);
            trigger([
              `applicationEvents.${index}.begin`,
              `applicationEvents.${index}.end`,
            ]);
          }}
          value={getValues(`applicationEvents.${index}.end`)}
          label={t("application:Page1.periodEndDate")}
          id={`applicationEvents.${index}.end`}
          required
          minDate={new Date(applicationRound.reservationPeriodBegin)}
          maxDate={new Date(applicationRound.reservationPeriodEnd)}
          invalid={errors.applicationEvents?.[index]?.end != null}
          errorText={getTranslatedError("end")}
        />
        <Controller
          control={control}
          name={`applicationEvents.${index}.minDuration`}
          rules={{ required: true }}
          render={({ field }) => (
            <Select
              id={field.name}
              value={
                getDurationNumberOptions().find(
                  (x) => x.value === field.value
                ) ?? { label: "", value: "" }
              }
              placeholder={t("common:select")}
              options={getDurationNumberOptions()}
              label={t("application:Page1.minDuration")}
              required
              onChange={(selection: OptionType): void => {
                field.onChange(selection.value);
              }}
              invalid={errors.applicationEvents?.[index]?.minDuration != null}
              error={getTranslatedError("minDuration")}
            />
          )}
        />
        <Controller
          control={control}
          name={`applicationEvents.${index}.maxDuration`}
          rules={{ required: true }}
          render={({ field }) => (
            <Select
              id={field.name}
              value={
                getDurationNumberOptions().find(
                  (x) => x.value === field.value
                ) ?? { label: "", value: "" }
              }
              placeholder={t("common:select")}
              options={getDurationNumberOptions()}
              label={t("application:Page1.maxDuration")}
              required
              onChange={(selection: OptionType): void => {
                field.onChange(selection.value);
              }}
              invalid={errors.applicationEvents?.[index]?.maxDuration != null}
              error={getTranslatedError("maxDuration")}
            />
          )}
        />
        <NumberInput
          id={`applicationEvents.${index}.eventsPerWeek`}
          required
          {...register(`applicationEvents.${index}.eventsPerWeek`, {
            valueAsNumber: true,
          })}
          label={t("application:Page1.eventsPerWeek")}
          min={1}
          max={undefined}
          minusStepButtonAriaLabel={t("common:subtract")}
          plusStepButtonAriaLabel={t("common:add")}
          step={1}
          invalid={errors.applicationEvents?.[index]?.eventsPerWeek != null}
          errorText={getTranslatedError("eventsPerWeek")}
        />
        <Controller
          control={control}
          name={`applicationEvents.${index}.biweekly`}
          render={({ field }) => {
            return (
              <input type="hidden" id={field.name} name={field.name} value="" />
            );
          }}
        />
      </PeriodContainer>
      <ApplicationEventSummary
        applicationEvent={getValues(`applicationEvents.${index}`)}
        name={watch(`applicationEvents.${index}.name`) ?? ""}
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
    </>
  );
};

const ApplicationEvent = (props: Props): JSX.Element => {
  const { index, isVisible, onDeleteEvent, onToggleAccordian } = props;

  const { t } = useTranslation();

  const form = useFormContext<ApplicationFormValues>();
  const { watch } = form;

  const eventName = watch(`applicationEvents.${index}.name`);
  watch(`applicationEvents.${index}.eventsPerWeek`);
  watch(`applicationEvents.${index}.biweekly`);

  const shouldRenderInner = isVisible;

  return (
    <Wrapper>
      <Accordion
        onToggle={onToggleAccordian}
        open={isVisible}
        heading={`${eventName}` || t("application:Page1.applicationEventName")}
        theme="thin"
      >
        {/* Accordion doesn't remove from DOM on hide, but this is too slow if it's visible */}
        {shouldRenderInner && (
          <ApplicationEventInner {...props} del={onDeleteEvent} />
        )}
      </Accordion>
    </Wrapper>
  );
};

export { ApplicationEvent };
