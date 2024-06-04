// TODO this file should be moved to application/ since the only user is Page1
// also remove default export
import React, { useRef } from "react";
import { Checkbox, DateInput, NumberInput, Select, TextInput } from "hds-react";
import { useTranslation } from "next-i18next";
import { Controller, useFormContext } from "react-hook-form";
import styled from "styled-components";
import { OptionType } from "common/types/common";
import type { ApplicationQuery } from "@gql/gql-types";
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
import { getDurationOptions } from "@/modules/const";
import ConfirmationModal, { ModalRef } from "../common/ConfirmationModal";
import { MediumButton } from "@/styles/util";
import { ApplicationFormValues } from "./Form";

type Node = NonNullable<ApplicationQuery["application"]>;
type AppRoundNode = NonNullable<Node["applicationRound"]>;
type OptionTypes = {
  ageGroupOptions: OptionType[];
  purposeOptions: OptionType[];
  reservationUnitTypeOptions: OptionType[];
  participantCountOptions: OptionType[];
  unitOptions: OptionType[];
};

type Props = {
  index: number;
  applicationRound: AppRoundNode;
  optionTypes: OptionTypes;
  isVisible: boolean;
  onToggleAccordion: () => void;
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

function ApplicationEventInner({
  index,
  applicationRound,
  optionTypes,
  del,
}: Omit<Props, "onToggleAccordion" | "onDeleteEvent"> & {
  del: () => void;
}): JSX.Element {
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

  const applicationPeriodBegin = watch(`applicationSections.${index}.begin`);
  const applicationPeriodEnd = watch(`applicationSections.${index}.end`);
  const numPersons = watch(`applicationSections.${index}.numPersons`);
  const modalRef = useRef<ModalRef>();

  const selectDefaultPeriod = (): void => {
    const begin = periodStartDate ? apiDateToUIDate(periodStartDate) : "";
    const end = periodEndDate ? apiDateToUIDate(periodEndDate) : "";
    setValue(`applicationSections.${index}.begin`, begin);
    setValue(`applicationSections.${index}.end`, end);
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
    | "minDuration"
    | "maxDuration"
    | "name"
    | "appliedReservationsPerWeek"
    | "reservationUnits";
  const getTranslatedError = (field: FieldName): string => {
    const error = errors.applicationSections?.[index]?.[field];
    if (error?.message != null) {
      return t(`application:validation.${error.message}`);
    }
    return "";
  };

  // convert from minutes to seconds (search page uses minutes, this uses seconds)
  const durationOptions = getDurationOptions(t).map((x) => ({
    label: x.label,
    value: x.value * 60,
  }));

  return (
    <>
      <SubHeadLine>
        {t("application:Page1.basicInformationSubHeading")}
      </SubHeadLine>
      <TwoColumnContainer>
        <div>
          <TextInput
            {...register(`applicationSections.${index}.name`)}
            label={t("application:Page1.name")}
            id={`applicationSections.${index}.name`}
            required
            invalid={errors.applicationSections?.[index]?.name != null}
            errorText={getTranslatedError("name")}
          />
        </div>
        <div>
          <NumberInput
            id={`applicationSections.${index}.numPersons`}
            required
            {...register(`applicationSections.${index}.numPersons`, {
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
            invalid={errors.applicationSections?.[index]?.numPersons != null}
            errorText={getTranslatedError("numPersons")}
          />
        </div>
        <Controller
          control={control}
          rules={{ required: true }}
          name={`applicationSections.${index}.ageGroup`}
          render={({ field }) => (
            <Select
              value={
                ageGroupOptions.find((v) => v.value === field.value) ?? null
              }
              onChange={(v: (typeof ageGroupOptions)[0]) =>
                field.onChange(v.value)
              }
              required
              label={t("application:Page1.ageGroup")}
              options={ageGroupOptions}
              invalid={errors.applicationSections?.[index]?.ageGroup != null}
              error={getTranslatedError("ageGroup")}
            />
          )}
        />
        <Controller
          control={control}
          rules={{ required: true }}
          name={`applicationSections.${index}.purpose`}
          render={({ field }) => (
            <Select
              label={t("application:Page1.purpose")}
              value={
                purposeOptions.find((v) => v.value === field.value) ?? null
              }
              onChange={(v: (typeof purposeOptions)[0]) =>
                field.onChange(v.value)
              }
              required
              options={purposeOptions}
              invalid={errors.applicationSections?.[index]?.purpose != null}
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
          id={`applicationSections.${index}.defaultPeriod`}
          checked={selectionIsDefaultPeriod}
          label={`${t("application:Page1.defaultPeriodPrefix")} ${formatDate(
            applicationRound.reservationPeriodBegin
          )} - ${formatDate(applicationRound.reservationPeriodEnd)}`}
          onChange={() => {
            clearErrors([
              `applicationSections.${index}.begin`,
              `applicationSections.${index}.end`,
            ]);
            selectDefaultPeriod();
          }}
          disabled={selectionIsDefaultPeriod}
        />
      </CheckboxWrapper>
      <PeriodContainer>
        <DateInput
          // disableConfirmation: is not accessible
          language={getLocalizationLang(i18n.language)}
          {...register(`applicationSections.${index}.begin`)}
          onChange={(v) => {
            clearErrors([
              `applicationSections.${index}.begin`,
              `applicationSections.${index}.end`,
            ]);
            setValue(`applicationSections.${index}.begin`, v);
            trigger([
              `applicationSections.${index}.begin`,
              `applicationSections.${index}.end`,
            ]);
          }}
          label={t("application:Page1.periodStartDate")}
          id={`applicationSections.${index}.begin`}
          value={getValues(`applicationSections.${index}.begin`)}
          required
          minDate={new Date(applicationRound.reservationPeriodBegin)}
          maxDate={new Date(applicationRound.reservationPeriodEnd)}
          invalid={errors?.applicationSections?.[index]?.begin != null}
          errorText={getTranslatedError("begin")}
        />
        <DateInput
          {...register(`applicationSections.${index}.end`)}
          // disableConfirmation: is not accessible
          language={getLocalizationLang(i18n.language)}
          onChange={(v) => {
            clearErrors([
              `applicationSections.${index}.begin`,
              `applicationSections.${index}.end`,
            ]);
            setValue(`applicationSections.${index}.end`, v);
            trigger([
              `applicationSections.${index}.begin`,
              `applicationSections.${index}.end`,
            ]);
          }}
          value={getValues(`applicationSections.${index}.end`)}
          label={t("application:Page1.periodEndDate")}
          id={`applicationSections.${index}.end`}
          required
          minDate={new Date(applicationRound.reservationPeriodBegin)}
          maxDate={new Date(applicationRound.reservationPeriodEnd)}
          invalid={errors.applicationSections?.[index]?.end != null}
          errorText={getTranslatedError("end")}
        />
        {/* TODO should use ControlledSelect */}
        <Controller
          control={control}
          name={`applicationSections.${index}.minDuration`}
          rules={{ required: true }}
          render={({ field }) => (
            <Select
              id={field.name}
              value={
                durationOptions.find((x) => x.value === field.value) ?? null
              }
              placeholder={t("common:select")}
              options={durationOptions}
              label={t("application:Page1.minDuration")}
              required
              onChange={(selection: (typeof durationOptions)[0]): void => {
                field.onChange(selection.value);
              }}
              invalid={errors.applicationSections?.[index]?.minDuration != null}
              error={getTranslatedError("minDuration")}
            />
          )}
        />
        {/* TODO should use ControlledSelect */}
        <Controller
          control={control}
          name={`applicationSections.${index}.maxDuration`}
          rules={{ required: true }}
          render={({ field }) => (
            <Select
              id={field.name}
              value={
                durationOptions.find((x) => x.value === field.value) ?? null
              }
              placeholder={t("common:select")}
              options={durationOptions}
              label={t("application:Page1.maxDuration")}
              required
              onChange={(selection: (typeof durationOptions)[0]): void => {
                field.onChange(selection.value);
              }}
              invalid={errors.applicationSections?.[index]?.maxDuration != null}
              error={getTranslatedError("maxDuration")}
            />
          )}
        />
        <NumberInput
          id={`applicationSections.${index}.appliedReservationsPerWeek`}
          required
          {...register(
            `applicationSections.${index}.appliedReservationsPerWeek`,
            {
              valueAsNumber: true,
            }
          )}
          label={t("application:Page1.eventsPerWeek")}
          min={1}
          max={undefined}
          minusStepButtonAriaLabel={t("common:subtract")}
          plusStepButtonAriaLabel={t("common:add")}
          step={1}
          invalid={
            errors.applicationSections?.[index]?.appliedReservationsPerWeek !=
            null
          }
          errorText={getTranslatedError("appliedReservationsPerWeek")}
        />
      </PeriodContainer>
      <ApplicationEventSummary
        applicationSection={getValues(`applicationSections.${index}`)}
        name={watch(`applicationSections.${index}.name`) ?? ""}
      />
      <ActionContainer>
        <Button
          type="button"
          variant="secondary"
          id={`applicationSections[${index}].delete`}
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
}

export function ApplicationEvent(props: Props): JSX.Element {
  const { index, isVisible, onDeleteEvent, onToggleAccordion } = props;

  const { t } = useTranslation();

  const form = useFormContext<ApplicationFormValues>();
  const {
    watch,
    formState: { errors },
  } = form;

  const eventName = watch(`applicationSections.${index}.name`);
  watch(`applicationSections.${index}.appliedReservationsPerWeek`);

  const shouldRenderInner = isVisible;

  // TODO requires us to use the accordion from admin-ui instead (or add force open)
  const hasErrors = errors.applicationSections?.[index] != null;

  return (
    <Wrapper>
      <Accordion
        onToggle={onToggleAccordion}
        open={isVisible || hasErrors}
        heading={eventName || t("application:Page1.applicationEventName")}
        theme="thin"
      >
        {/* Accordion doesn't remove from DOM on hide, but this is too slow if it's visible */}
        {shouldRenderInner && (
          <ApplicationEventInner {...props} del={onDeleteEvent} />
        )}
      </Accordion>
    </Wrapper>
  );
}
