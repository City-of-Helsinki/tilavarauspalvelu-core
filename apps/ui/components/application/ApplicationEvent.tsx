import React, { useState } from "react";
import { Button, Checkbox, DateInput, NumberInput, TextInput } from "hds-react";
import { useTranslation } from "next-i18next";
import { useFormContext } from "react-hook-form";
import type { ApplicationQuery } from "@gql/gql-types";
import { H5 } from "common/src/common/typography";
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
import { Accordion } from "@/components/Accordion";
import { getDurationOptions } from "@/modules/const";
import { ConfirmationDialog } from "common/src/components/ConfirmationDialog";
import { ApplicationFormValues } from "./Form";
import { AutoGrid, Flex } from "common/styles/util";
import {
  ControlledNumberInput,
  ControlledSelect,
} from "common/src/components/form";

type Node = NonNullable<ApplicationQuery["application"]>;
type AppRoundNode = NonNullable<Node["applicationRound"]>;

type OptionType =
  | { label: string; value: string }
  | { label: string; value: number };
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

  const [isWaitingForDelete, setIsWaitingForDelete] = useState(false);
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
    <Flex $gap="s" $marginTop="s">
      <H5 as="h3">{t("application:Page1.basicInformationSubHeading")}</H5>
      <AutoGrid>
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
          <ControlledNumberInput
            name={`applicationSections.${index}.numPersons`}
            label={t("application:Page1.groupSize")}
            min={0}
            errorText={getTranslatedError("numPersons")}
          />
        </div>
        <ControlledSelect
          control={control}
          required
          name={`applicationSections.${index}.ageGroup`}
          label={t("application:Page1.ageGroup")}
          options={ageGroupOptions}
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
      <H5 as="h3"> {t("application:Page1.spacesSubHeading")}</H5>
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
      <H5 as="h3">{t("application:Page1.applicationRoundSubHeading")}</H5>
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
      <AutoGrid>
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
          placeholder={t("common:select")}
          options={durationOptions}
          label={t("application:Page1.maxDuration")}
          required
          error={getTranslatedError("maxDuration")}
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
      </AutoGrid>
      <ApplicationEventSummary
        applicationSection={getValues(`applicationSections.${index}`)}
        name={watch(`applicationSections.${index}.name`) ?? ""}
      />
      <Button
        variant="secondary"
        size="small"
        id={`applicationSections[${index}].delete`}
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
