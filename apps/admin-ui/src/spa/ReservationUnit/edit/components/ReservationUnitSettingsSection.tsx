import { type FieldValues, useController, type UseControllerProps, UseFormReturn } from "react-hook-form";
import { BUFFER_TIME_OPTIONS, ReservationUnitEditFormValues } from "@/spa/ReservationUnit/edit/form";
import { useTranslation } from "next-i18next";
import { Authentication, ReservationStartInterval } from "@gql/gql-types";
import { EditAccordion } from "@/spa/ReservationUnit/edit/components/styled";
import { AutoGrid, Flex } from "common/styled";
import { FieldGroup } from "@/spa/ReservationUnit/edit/components/FieldGroup";
import { ControlledSelect, ControlledCheckbox, DateTimeInput } from "common/src/components/form";
import { getTranslatedError } from "@/common/util";
import { CustomNumberInput } from "@/spa/ReservationUnit/edit/components/CustomNumberInput";
import { SpecializedRadioGroup } from "@/spa/ReservationUnit/edit/components/SpecializedRadioGroup";
import React from "react";
import styled from "styled-components";
import { Checkbox } from "hds-react";

const Indent = styled.div<{ $noIndent: boolean }>`
  ${({ $noIndent }) => ($noIndent ? null : `margin-left: var(--spacing-l);`)}
`;

const Wrapper = styled.div<{ $noMargin: boolean }>`
  ${({ $noMargin }) => ($noMargin ? null : `margin-top: var(--spacing-s);`)}
`;

interface ControllerProps<T extends FieldValues> extends UseControllerProps<T> {
  label: string;
  children: React.ReactNode;
  noIndent?: boolean;
  noMargin?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

function ActivationGroup<T extends FieldValues>({
  control,
  name,
  label,
  children,
  noIndent = false,
  noMargin = false,
  style,
  className,
}: ControllerProps<T>): JSX.Element {
  const {
    field: { value, onChange },
  } = useController({ control, name });

  return (
    <Wrapper $noMargin={noMargin} style={style} className={className}>
      <Checkbox id={name} label={label} checked={value} onChange={onChange} />
      {value ? (
        <Wrapper $noMargin={noMargin}>
          <Indent $noIndent={noIndent}>{children}</Indent>
        </Wrapper>
      ) : null}
    </Wrapper>
  );
}

const bufferTimeOptions = [
  { value: 900, label: "15 minuuttia" },
  { value: 1800, label: "30 minuuttia" },
  { value: 3600, label: "60 minuuttia" },
  { value: 5400, label: "90 minuuttia" },
];

const reservationsMaxDaysBeforeOptions = [
  { value: 14, label: "2 vko" },
  { value: 30, label: "1 kk" },
  { value: 60, label: "2 kk" },
  { value: 90, label: "3 kk" },
  { value: 182, label: "6 kk" },
  { value: 365, label: "12 kk" },
  { value: 730, label: "24 kk" },
];

export function ReservationUnitSettingsSection({
  form,
  metadataOptions,
  cancellationRuleOptions,
}: {
  form: UseFormReturn<ReservationUnitEditFormValues>;
  metadataOptions: Array<{ value: number; label: string }>;
  cancellationRuleOptions: Array<{ value: number; label: string }>;
}) {
  const { t } = useTranslation();
  const { control, watch, formState } = form;
  const { errors } = formState;

  const reservationStartIntervalOptions = Object.values(ReservationStartInterval).map((choice) => ({
    value: choice,
    label: t(`reservationStartInterval.${choice}`),
  }));

  const authenticationOptions = Object.values(Authentication).map((choice) => ({
    value: choice,
    label: t(`authentication.${choice}`),
  }));

  const isDirect = watch("reservationKind") === "DIRECT" || watch("reservationKind") === "DIRECT_AND_SEASON";

  const hasErrors =
    errors.reservationBeginsDate != null ||
    errors.reservationEndsDate != null ||
    errors.reservationBeginsTime != null ||
    errors.reservationEndsTime != null ||
    errors.metadataSet != null ||
    errors.cancellationRule != null ||
    errors.reservationStartInterval != null ||
    errors.reservationsMinDaysBefore != null ||
    errors.reservationsMaxDaysBefore != null ||
    errors.maxReservationDuration != null ||
    errors.minReservationDuration != null;

  const durationOptions = bufferTimeOptions.concat(
    Array.from({ length: (23 - 2) * 2 + 1 })
      .map((_v, i) => 3600 * 2 + i * 1800)
      .map((v) => ({
        value: v,
        label: t("ReservationUnitEditor.durationHours", {
          hours: (v / 3600).toLocaleString("fi"),
        }),
      }))
  );

  return (
    <EditAccordion open={hasErrors} heading={t("ReservationUnitEditor.settings")}>
      <AutoGrid $minWidth="24rem">
        {isDirect && (
          <FieldGroup
            heading={t("ReservationUnitEditor.publishingSettings")}
            tooltip={t("ReservationUnitEditor.tooltip.publishingSettings")}
            style={{ gridColumn: "1 / span 1" }}
          >
            <ActivationGroup
              label={t("ReservationUnitEditor.scheduledPublishing")}
              control={control}
              name="hasScheduledPublish"
            >
              <Flex $gap="xs">
                {/* TODO the Two DateInputs need to touch each other to rerun common validation code */}
                <ActivationGroup
                  label={t("ReservationUnitEditor.publishBegins")}
                  control={control}
                  name="hasPublishBegins"
                  noIndent
                  noMargin
                >
                  <DateTimeInput
                    control={control}
                    name={{
                      date: "publishBeginsDate",
                      time: "publishBeginsTime",
                    }}
                    translateError={(err) => getTranslatedError(t, err)}
                  />
                </ActivationGroup>
                <ActivationGroup
                  label={t("ReservationUnitEditor.publishEnds")}
                  control={control}
                  name="hasPublishEnds"
                  noIndent
                  noMargin
                >
                  <DateTimeInput
                    control={control}
                    name={{ date: "publishEndsDate", time: "publishEndsTime" }}
                    translateError={(err) => getTranslatedError(t, err)}
                  />
                </ActivationGroup>
              </Flex>
            </ActivationGroup>
          </FieldGroup>
        )}
        {isDirect && (
          <FieldGroup
            heading={t("ReservationUnitEditor.reservationSettings")}
            tooltip={t("ReservationUnitEditor.tooltip.reservationSettings")}
            style={{ gridColumn: "1 / span 1" }}
          >
            <ActivationGroup
              label={t("ReservationUnitEditor.scheduledReservation")}
              control={control}
              name="hasScheduledReservation"
            >
              {/* TODO the Two DateInputs need to touch each other to rerun common validation code */}
              <ActivationGroup
                label={t("ReservationUnitEditor.reservationBegins")}
                control={control}
                name="hasReservationBegins"
                noIndent
              >
                <DateTimeInput
                  control={control}
                  name={{
                    date: "reservationBeginsDate",
                    time: "reservationBeginsTime",
                  }}
                  minDate={new Date()}
                  translateError={(err) => getTranslatedError(t, err)}
                />
              </ActivationGroup>
              <ActivationGroup
                label={t("ReservationUnitEditor.reservationEnds")}
                control={control}
                name="hasReservationEnds"
                noIndent
              >
                <DateTimeInput
                  control={control}
                  name={{
                    date: "reservationEndsDate",
                    time: "reservationEndsTime",
                  }}
                  minDate={new Date()}
                  translateError={(err) => getTranslatedError(t, err)}
                />
              </ActivationGroup>
            </ActivationGroup>
          </FieldGroup>
        )}
        {isDirect && (
          <>
            <ControlledSelect
              control={control}
              name="minReservationDuration"
              options={durationOptions}
              style={{ gridColumnStart: "1" }}
              required
              label={t("ReservationUnitEditor.label.minReservationDuration")}
              error={getTranslatedError(t, errors.minReservationDuration?.message)}
              tooltip={t("ReservationUnitEditor.tooltip.minReservationDuration")}
            />
            <ControlledSelect
              control={control}
              name="maxReservationDuration"
              required
              options={durationOptions}
              label={t("ReservationUnitEditor.label.maxReservationDuration")}
              error={getTranslatedError(t, errors.maxReservationDuration?.message)}
              tooltip={t("ReservationUnitEditor.tooltip.maxReservationDuration")}
            />
            <ControlledSelect
              control={control}
              name="reservationsMaxDaysBefore"
              options={reservationsMaxDaysBeforeOptions}
              required
              label={t("ReservationUnitEditor.label.reservationsMaxDaysBefore")}
              error={getTranslatedError(t, errors.reservationsMaxDaysBefore?.message)}
              tooltip={t("ReservationUnitEditor.tooltip.reservationsMaxDaysBefore")}
            />
            <CustomNumberInput
              name="reservationsMinDaysBefore"
              max={watch("reservationsMaxDaysBefore")}
              min={0}
              form={form}
              required
            />
          </>
        )}
        <ControlledSelect
          control={control}
          name="reservationStartInterval"
          options={reservationStartIntervalOptions}
          required
          error={getTranslatedError(t, errors.reservationStartInterval?.message)}
          label={t("ReservationUnitEditor.label.reservationStartInterval")}
          tooltip={t("ReservationUnitEditor.tooltip.reservationStartInterval")}
        />
        <FieldGroup
          heading={t("ReservationUnitEditor.bufferSettings")}
          tooltip={t("ReservationUnitEditor.tooltip.bufferSettings")}
          style={{ gridColumn: "1 / -1" }}
        >
          <AutoGrid>
            <SpecializedRadioGroup
              name="bufferType"
              options={BUFFER_TIME_OPTIONS}
              control={control}
              noLabel
              noTooltip
              // TODO do we need this? or do we just initialize the value in the form?
              // defaultValue="no-buffer"
            />
            {watch("bufferType") === "bufferTimesSet" && (
              <>
                <ActivationGroup
                  label={t("ReservationUnitEditor.bufferTimeBefore")}
                  control={control}
                  name="hasBufferTimeBefore"
                >
                  <ControlledSelect
                    control={control}
                    name="bufferTimeBefore"
                    options={bufferTimeOptions}
                    label={t("ReservationUnitEditor.bufferTimeBeforeDuration")}
                  />
                </ActivationGroup>
                <ActivationGroup
                  label={t("ReservationUnitEditor.bufferTimeAfter")}
                  control={control}
                  name="hasBufferTimeAfter"
                >
                  <ControlledSelect
                    control={control}
                    name="bufferTimeAfter"
                    label={t("ReservationUnitEditor.bufferTimeAfterDuration")}
                    options={bufferTimeOptions}
                  />
                </ActivationGroup>
              </>
            )}
          </AutoGrid>
        </FieldGroup>
        <FieldGroup
          heading={t("ReservationUnitEditor.cancellationSettings")}
          tooltip={t("ReservationUnitEditor.tooltip.cancellationSettings")}
          style={{ gridColumn: "1 / -1", alignItems: "start" }}
        >
          <ActivationGroup
            label={t("ReservationUnitEditor.cancellationIsPossible")}
            control={control}
            name="hasCancellationRule"
          >
            <SpecializedRadioGroup
              name="cancellationRule"
              options={cancellationRuleOptions}
              control={control}
              noLabel
              noTooltip
            />
          </ActivationGroup>
        </FieldGroup>
        {isDirect && (
          <>
            <ControlledSelect
              control={control}
              name="metadataSet"
              required
              options={metadataOptions}
              label={t("ReservationUnitEditor.label.metadataSet")}
              error={getTranslatedError(t, errors.metadataSet?.message)}
              tooltip={t("ReservationUnitEditor.tooltip.metadataSet")}
            />
            <ControlledSelect
              control={control}
              name="authentication"
              required
              options={authenticationOptions}
              label={t("ReservationUnitEditor.authenticationLabel")}
              tooltip={t("ReservationUnitEditor.tooltip.authentication")}
            />
            <CustomNumberInput name="maxReservationsPerUser" min={1} form={form} />
            <FieldGroup
              // FIXME replace the text fields
              heading={t("ReservationUnitEditor.requireAdultReserveeSettings")}
              tooltip={t("ReservationUnitEditor.tooltip.requireAdultReservee")}
              style={{ gridColumn: "1 / -1" }}
            >
              <ControlledCheckbox
                control={control}
                name="requireAdultReservee"
                label={t("ReservationUnitEditor.requireAdultReserveeLabel")}
              />
            </FieldGroup>
            <FieldGroup
              heading={t("ReservationUnitEditor.handlingSettings")}
              tooltip={t("ReservationUnitEditor.tooltip.handlingSettings")}
              style={{ gridColumn: "1 / -1" }}
            >
              <ControlledCheckbox
                control={control}
                name="requireReservationHandling"
                label={t("ReservationUnitEditor.requireReservationHandling")}
              />
            </FieldGroup>
          </>
        )}
      </AutoGrid>
    </EditAccordion>
  );
}
