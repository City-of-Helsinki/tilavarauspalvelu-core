import React, { useState } from "react";
import {
  Button,
  ButtonSize,
  ButtonVariant,
  Checkbox,
  DateInput,
  TextInput,
} from "hds-react";
import { useTranslation } from "next-i18next";
import { useFormContext } from "react-hook-form";
import type { ApplicationRoundForApplicationFragment } from "@gql/gql-types";
import { H4 } from "common/src/common/typography";
import { getLocalizationLang } from "common/src/helpers";
import { type OptionTypes, ReservationUnitList } from "./ReservationUnitList";
import { ApplicationEventSummary } from "./ApplicationEventSummary";
import { Accordion } from "@/components/Accordion";
import { getDurationOptions } from "@/modules/const";
import { ConfirmationDialog } from "common/src/components/ConfirmationDialog";
import { type ApplicationPage1FormValues } from "./form";
import { AutoGrid, Flex } from "common/styles/util";
import {
  ControlledNumberInput,
  ControlledSelect,
} from "common/src/components/form";
import { toUIDate } from "common/src/common/util";
import { gql } from "@apollo/client";

type Props = {
  index: number;
  applicationRound: ApplicationRoundForApplicationFragment;
  optionTypes: OptionTypes;
  isVisible: boolean;
  onToggleAccordion: () => void;
  onDeleteEvent: () => void;
};

function ApplicationEventInner({
  index,
  applicationRound,
  optionTypes,
  del,
}: Omit<Props, "onToggleAccordion" | "onDeleteEvent"> & {
  del: () => void;
}): JSX.Element {
  const { t } = useTranslation();
  const form = useFormContext<ApplicationPage1FormValues>();
  const {
    control,
    register,
    formState: { errors },
    getValues,
    setValue,
    clearErrors,
    watch,
  } = form;

  const [isWaitingForDelete, setIsWaitingForDelete] = useState(false);

  const {
    ageGroupOptions,
    purposeOptions,
    reservationUnitTypeOptions,
    unitOptions,
  } = optionTypes;

  const periodStartDate = new Date(applicationRound.reservationPeriodBegin);
  const periodEndDate = new Date(applicationRound.reservationPeriodEnd);

  const selectDefaultPeriod = (): void => {
    const begin = toUIDate(periodStartDate);
    const end = toUIDate(periodEndDate);
    setValue(`applicationSections.${index}.begin`, begin);
    setValue(`applicationSections.${index}.end`, end);
  };

  const applicationPeriodBegin = watch(`applicationSections.${index}.begin`);
  const applicationPeriodEnd = watch(`applicationSections.${index}.end`);
  const numPersons = watch(`applicationSections.${index}.numPersons`);

  const selectionIsDefaultPeriod =
    applicationPeriodEnd != null &&
    applicationPeriodBegin != null &&
    applicationPeriodBegin === toUIDate(periodStartDate) &&
    applicationPeriodEnd === toUIDate(periodEndDate);

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
  const getTranslatedError = (field: FieldName): string | undefined => {
    const error = errors.applicationSections?.[index]?.[field];
    if (error?.message != null) {
      return t(`application:validation.${error.message}`);
    }
    return undefined;
  };

  // convert from minutes to seconds (search page uses minutes, this uses seconds)
  const durationOptions = getDurationOptions(t).map((x) => ({
    label: x.label,
    value: x.value * 60,
  }));

  return (
    <Flex $gap="s" $marginTop="s">
      <H4 as="h3">{t("application:Page1.basicInformationSubHeading")}</H4>
      <AutoGrid>
        <TextInput
          {...register(`applicationSections.${index}.name`)}
          label={t("application:Page1.name")}
          id={`applicationSections.${index}.name`}
          required
          invalid={errors.applicationSections?.[index]?.name != null}
          errorText={getTranslatedError("name")}
        />
        <ControlledNumberInput
          name={`applicationSections.${index}.numPersons`}
          label={t("application:Page1.groupSize")}
          required
          min={0}
          errorText={getTranslatedError("numPersons")}
        />
        <ControlledSelect
          control={control}
          required
          name={`applicationSections.${index}.ageGroup`}
          label={t("application:Page1.ageGroup")}
          options={ageGroupOptions ?? []}
          error={getTranslatedError("ageGroup")}
        />
        <ControlledSelect
          control={control}
          options={purposeOptions}
          name={`applicationSections.${index}.purpose`}
          label={t("application:Page1.purpose")}
          required
          error={getTranslatedError("purpose")}
        />
      </AutoGrid>
      <H4 as="h3"> {t("application:Page1.spacesSubHeading")}</H4>
      <ReservationUnitList
        applicationRound={applicationRound}
        index={index}
        minSize={numPersons}
        options={{
          purposeOptions,
          reservationUnitTypeOptions,
          unitOptions,
        }}
      />
      <H4 as="h3">{t("application:Page1.applicationRoundSubHeading")}</H4>
      <Checkbox
        id={`applicationSections.${index}.defaultPeriod`}
        checked={selectionIsDefaultPeriod}
        label={`${t("application:Page1.defaultPeriodPrefix")} ${toUIDate(
          periodStartDate
        )} - ${toUIDate(periodEndDate)}`}
        onChange={() => {
          clearErrors([
            `applicationSections.${index}.begin`,
            `applicationSections.${index}.end`,
          ]);
          selectDefaultPeriod();
        }}
        disabled={selectionIsDefaultPeriod}
      />
      <AutoGrid>
        <ApplicationDateRangePicker
          index={index}
          minDate={periodStartDate}
          maxDate={periodEndDate}
        />
        <ControlledSelect
          control={control}
          name={`applicationSections.${index}.minDuration`}
          options={durationOptions}
          label={t("application:Page1.minDuration")}
          required
          error={getTranslatedError("minDuration")}
        />
        <ControlledSelect
          control={control}
          name={`applicationSections.${index}.maxDuration`}
          options={durationOptions}
          label={t("application:Page1.maxDuration")}
          required
          error={getTranslatedError("maxDuration")}
        />
        <ControlledNumberInput
          name={`applicationSections.${index}.appliedReservationsPerWeek`}
          label={t("application:Page1.eventsPerWeek")}
          min={1}
          max={7}
          required
          errorText={getTranslatedError("appliedReservationsPerWeek")}
        />
      </AutoGrid>
      <ApplicationEventSummary
        applicationSection={getValues(`applicationSections.${index}`)}
        name={watch(`applicationSections.${index}.name`) ?? ""}
      />
      <Button
        variant={ButtonVariant.Secondary}
        size={ButtonSize.Small}
        id={`applicationSections.${index}.delete`}
        onClick={() => setIsWaitingForDelete(true)}
      >
        {t("application:Page1.deleteEvent")}
      </Button>
      {isWaitingForDelete && (
        <ConfirmationDialog
          id="application-event-confirmation"
          isOpen
          acceptLabel={t("application:Page1.deleteEvent")}
          cancelLabel={t("application:Page1.deleteEventCancel")}
          heading={t("application:Page1.deleteEventHeading")}
          content={t("application:Page1.deleteEventContent")}
          onAccept={del}
          onCancel={() => setIsWaitingForDelete(false)}
          variant="danger"
        />
      )}
    </Flex>
  );
}

function ApplicationDateRangePicker({
  index,
  minDate,
  maxDate,
}: {
  index: number;
  minDate: Date;
  maxDate: Date;
}): JSX.Element {
  const { t, i18n } = useTranslation();
  const form = useFormContext<ApplicationPage1FormValues>();
  const { register, getValues, setValue, clearErrors, trigger, getFieldState } =
    form;

  const lang = getLocalizationLang(i18n.language);

  const getTranslatedError = (msg?: string): string | undefined => {
    if (msg != null) {
      return t(`application:validation.${msg}`);
    }
    return undefined;
  };

  const field = "applicationSections" as const;
  const beginField = `${field}.${index}.begin` as const;
  const endField = `${field}.${index}.end` as const;
  const beginState = getFieldState(beginField);
  const endState = getFieldState(endField);

  return (
    <>
      <DateInput
        {...register(beginField)}
        language={lang}
        id={beginField}
        label={t("application:Page1.periodStartDate")}
        onChange={(v) => {
          clearErrors([beginField, endField]);
          setValue(beginField, v);
          trigger([beginField, endField]);
        }}
        value={getValues(beginField)}
        required
        minDate={minDate}
        maxDate={maxDate}
        invalid={beginState.error?.message != null}
        errorText={getTranslatedError(beginState.error?.message)}
      />
      <DateInput
        {...register(endField)}
        language={lang}
        id={endField}
        label={t("application:Page1.periodEndDate")}
        onChange={(v) => {
          clearErrors([beginField, endField]);
          setValue(endField, v);
          trigger([beginField, endField]);
        }}
        value={getValues(endField)}
        required
        minDate={minDate}
        maxDate={maxDate}
        invalid={endState.error?.message != null}
        errorText={getTranslatedError(endState.error?.message)}
      />
    </>
  );
}

export function ApplicationEvent(props: Props): JSX.Element {
  const { index, isVisible, onDeleteEvent, onToggleAccordion } = props;

  const { t } = useTranslation();

  const form = useFormContext<ApplicationPage1FormValues>();
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
  );
}

export const APPLICATION_ROUND_FRAGMENT = gql`
  fragment ApplicationRoundForApplication on ApplicationRoundNode {
    ...ApplicationReservationUnitList
    reservationPeriodBegin
    reservationPeriodEnd
  }
`;
