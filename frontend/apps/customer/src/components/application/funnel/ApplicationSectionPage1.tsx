import React, { useState } from "react";
import { Button, ButtonSize, ButtonVariant, Checkbox, DateInput, TextInput } from "hds-react";
import { useTranslation } from "next-i18next";
import { useFormContext } from "react-hook-form";
import { gql } from "@apollo/client";
import type { ApplicationRoundForApplicationFragment } from "@gql/gql-types";
import { AutoGrid, Flex, H4 } from "ui/src/styled";
import { getLocalizationLang } from "ui/src/modules/helpers";
import { ConfirmationDialog } from "ui/src/components/ConfirmationDialog";
import { ControlledNumberInput, ControlledSelect } from "ui/src/components/form";
import { formatDate, formatDateRange } from "ui/src/modules/date-utils";
import { Accordion } from "@/components/Accordion";
import { getDurationOptions } from "@/modules/const";
import { type ApplicationPage1FormValues } from "./form";
import { ApplicationSectionSummary, ReservationUnitList } from ".";
import { type OptionsListT } from "ui/src/modules/search";
import { startOfDay } from "date-fns/startOfDay";

type Props = Readonly<{
  index: number;
  applicationRound: ApplicationRoundForApplicationFragment;
  options: Readonly<OptionsListT>;
  onDeleteEvent: () => void;
}>;

function ApplicationSectionInner({ index, applicationRound, options, onDeleteEvent }: Props): JSX.Element {
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

  const periodStartDate = new Date(applicationRound.reservationPeriodBeginDate);
  const periodEndDate = new Date(applicationRound.reservationPeriodEndDate);

  const selectDefaultPeriod = (): void => {
    clearErrors([`applicationSections.${index}.begin`, `applicationSections.${index}.end`]);
    const begin = formatDate(periodStartDate, {});
    const end = formatDate(periodEndDate, {});
    setValue(`applicationSections.${index}.begin`, begin);
    setValue(`applicationSections.${index}.end`, end);
  };

  const applicationPeriodBeginsAt = watch(`applicationSections.${index}.begin`);
  const applicationPeriodEndsAt = watch(`applicationSections.${index}.end`);
  const numPersons = watch(`applicationSections.${index}.numPersons`);

  const selectionIsDefaultPeriod =
    applicationPeriodEndsAt != null &&
    applicationPeriodBeginsAt != null &&
    applicationPeriodBeginsAt === formatDate(periodStartDate, {}) &&
    applicationPeriodEndsAt === formatDate(periodEndDate, {});

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
      // TODO this could be changed in the validation schema
      // so it follows the same pattern as the other fields
      if (field === "reservationUnits" && error.type === "too_small") {
        return t("application:validation.noReservationUnits");
      }
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
    <Flex $gap="s" $marginTop="s" data-testid={`application__applicationSection_${index}`}>
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
          min={1}
          errorText={getTranslatedError("numPersons")}
        />
        <ControlledSelect
          control={control}
          required
          name={`applicationSections.${index}.ageGroup`}
          label={t("application:Page1.ageGroup")}
          options={options.ageGroups}
          error={getTranslatedError("ageGroup")}
        />
        <ControlledSelect
          control={control}
          options={options.reservationPurposes}
          name={`applicationSections.${index}.purpose`}
          label={t("application:Page1.purpose")}
          required
          error={getTranslatedError("purpose")}
        />
      </AutoGrid>
      <H4 as="h3"> {t("application:Page1.spacesSubHeading")}</H4>
      <ReservationUnitList
        name={`applicationSections.${index}.reservationUnits`}
        control={control}
        applicationRound={applicationRound}
        minSize={numPersons}
        options={options}
        error={getTranslatedError("reservationUnits")}
      />
      <H4 as="h3">{t("application:Page1.applicationRoundSubHeading")}</H4>
      <Checkbox
        id={`applicationSections.${index}.defaultPeriod`}
        checked={selectionIsDefaultPeriod}
        label={`${t("application:Page1.defaultPeriodPrefix")} ${formatDateRange(periodStartDate, periodEndDate, {})}`}
        onChange={selectDefaultPeriod}
        disabled={selectionIsDefaultPeriod}
      />
      <AutoGrid>
        <ApplicationDateRangePicker index={index} minDate={periodStartDate} maxDate={periodEndDate} />
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
      <ApplicationSectionSummary
        applicationSection={getValues(`applicationSections.${index}`)}
        name={watch(`applicationSections.${index}.name`) ?? "-"}
      />
      <Button
        variant={ButtonVariant.Secondary}
        size={ButtonSize.Small}
        id={`applicationSections.${index}.delete`}
        onClick={() => setIsWaitingForDelete(true)}
      >
        {t("common:remove")}
      </Button>
      {isWaitingForDelete && (
        <ConfirmationDialog
          id="application-event-confirmation"
          isOpen
          acceptLabel={t("common:remove")}
          cancelLabel={t("common:cancel")}
          heading={t("application:Page1.deleteDialog.heading")}
          content={t("application:Page1.deleteDialog.content")}
          onAccept={onDeleteEvent}
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
  const { register, getValues, setValue, clearErrors, trigger, getFieldState } = form;

  const lang = getLocalizationLang(i18n.language);

  const getTranslatedError = (msg?: string): string | undefined => {
    if (msg != null) {
      return t(`application:validation.${msg}`);
    }
    return undefined;
  };

  const beginField = `applicationSections.${index}.begin` as const;
  const endField = `applicationSections.${index}.end` as const;
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
        minDate={startOfDay(minDate)}
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
        minDate={startOfDay(minDate)}
        maxDate={maxDate}
        invalid={endState.error?.message != null}
        errorText={getTranslatedError(endState.error?.message)}
      />
    </>
  );
}

export function ApplicationSectionPage1(props: Props): JSX.Element {
  const { index } = props;

  const { t } = useTranslation();

  const form = useFormContext<ApplicationPage1FormValues>();
  const {
    watch,
    setValue,
    formState: { errors },
  } = form;

  const eventName = watch(`applicationSections.${index}.name`);
  watch(`applicationSections.${index}.appliedReservationsPerWeek`);
  const openByDefault = watch(`applicationSections`)?.length === 1;
  const isVisible = openByDefault || watch(`applicationSections.${index}.isAccordionOpen`);

  // TODO requires us to use the accordion from admin-ui instead (or add force open)
  const hasErrors = errors.applicationSections?.[index] != null;

  const shouldRenderInner = isVisible || hasErrors;
  const onToggleAccordion = () => {
    const val = watch(`applicationSections.${index}.isAccordionOpen`);
    setValue(`applicationSections.${index}.isAccordionOpen`, !val, {
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  return (
    <Accordion
      onToggle={onToggleAccordion}
      open={shouldRenderInner}
      heading={eventName || t("application:Page1.defaultSectionName")}
      theme="thin"
    >
      {/* Accordion doesn't remove from DOM on hide, but this is too slow if it's visible */}
      {shouldRenderInner && <ApplicationSectionInner {...props} />}
    </Accordion>
  );
}

export const APPLICATION_ROUND_FRAGMENT = gql`
  fragment ApplicationRoundForApplication on ApplicationRoundNode {
    ...ApplicationReservationUnitList
    reservationPeriodBeginDate
    reservationPeriodEndDate
  }
`;
