import React from "react";
import styled from "styled-components";
import { Checkbox } from "hds-react";
import { useTranslation } from "next-i18next";
import { type FieldValues, useController, type UseControllerProps, UseFormReturn } from "react-hook-form";
import { AuthenticationType, ReservationStartInterval } from "@gql/gql-types";
import { AutoGrid, Flex } from "common/styled";
import { ControlledSelect, ControlledCheckbox, DateTimeInput } from "common/src/components/form";
import { getTranslatedError } from "@/common/util";
import { BUFFER_TIME_OPTIONS, ReservationUnitEditFormValues } from "./form";
import { EditAccordion } from "./styled";
import { FieldGroup } from "./FieldGroup";
import { CustomNumberInput } from "./CustomNumberInput";
import { SpecializedRadioGroup } from "./SpecializedRadioGroup";

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
    label: t(`translation:reservationStartInterval.${choice}`),
  }));

  const authenticationOptions = Object.values(AuthenticationType).map((choice) => ({
    value: choice,
    label: t(`translation:authentication.${choice}`),
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
        label: t("reservationUnitEditor:durationHours", {
          hours: (v / 3600).toLocaleString("fi"),
        }),
      }))
  );

  return (
    <EditAccordion open={hasErrors} heading={t("reservationUnitEditor:settings")}>
      <AutoGrid $minWidth="18rem">
        {isDirect && (
          <FieldGroup
            heading={t("reservationUnitEditor:publishingSettings")}
            tooltip={t("reservationUnitEditor:tooltip.publishingSettings")}
            style={{ gridColumn: "1 / span 1" }}
          >
            <ActivationGroup
              label={t("reservationUnitEditor:scheduledPublishing")}
              control={control}
              name="hasScheduledPublish"
            >
              <Flex $gap="xs">
                {/* TODO the Two DateInputs need to touch each other to rerun common validation code */}
                <ActivationGroup
                  label={t("reservationUnitEditor:publishBeginsAt")}
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
                  label={t("reservationUnitEditor:publishEndsAt")}
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
            heading={t("reservationUnitEditor:reservationSettings")}
            tooltip={t("reservationUnitEditor:tooltip.reservationSettings")}
            style={{ gridColumn: "1 / span 1" }}
          >
            <ActivationGroup
              label={t("reservationUnitEditor:scheduledReservation")}
              control={control}
              name="hasScheduledReservation"
            >
              {/* TODO the Two DateInputs need to touch each other to rerun common validation code */}
              <ActivationGroup
                label={t("reservationUnitEditor:reservationBeginsAt")}
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
                label={t("reservationUnitEditor:reservationEndsAt")}
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
              label={t("reservationUnitEditor:label.minReservationDuration")}
              error={getTranslatedError(t, errors.minReservationDuration?.message)}
              tooltip={t("reservationUnitEditor:tooltip.minReservationDuration")}
            />
            <ControlledSelect
              control={control}
              name="maxReservationDuration"
              required
              options={durationOptions}
              label={t("reservationUnitEditor:label.maxReservationDuration")}
              error={getTranslatedError(t, errors.maxReservationDuration?.message)}
              tooltip={t("reservationUnitEditor:tooltip.maxReservationDuration")}
            />
            <ControlledSelect
              control={control}
              name="reservationsMaxDaysBefore"
              options={reservationsMaxDaysBeforeOptions}
              required
              label={t("reservationUnitEditor:label.reservationsMaxDaysBefore")}
              error={getTranslatedError(t, errors.reservationsMaxDaysBefore?.message)}
              tooltip={t("reservationUnitEditor:tooltip.reservationsMaxDaysBefore")}
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
          label={t("reservationUnitEditor:label.reservationStartInterval")}
          tooltip={t("reservationUnitEditor:tooltip.reservationStartInterval")}
        />
        <FieldGroup
          heading={t("reservationUnitEditor:bufferSettings")}
          tooltip={t("reservationUnitEditor:tooltip.bufferSettings")}
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
                  label={t("reservationUnitEditor:bufferTimeBefore")}
                  control={control}
                  name="hasBufferTimeBefore"
                >
                  <ControlledSelect
                    control={control}
                    name="bufferTimeBefore"
                    options={bufferTimeOptions}
                    label={t("reservationUnitEditor:bufferTimeBeforeDuration")}
                  />
                </ActivationGroup>
                <ActivationGroup
                  label={t("reservationUnitEditor:bufferTimeAfter")}
                  control={control}
                  name="hasBufferTimeAfter"
                >
                  <ControlledSelect
                    control={control}
                    name="bufferTimeAfter"
                    label={t("reservationUnitEditor:bufferTimeAfterDuration")}
                    options={bufferTimeOptions}
                  />
                </ActivationGroup>
              </>
            )}
          </AutoGrid>
        </FieldGroup>
        <FieldGroup
          heading={t("reservationUnitEditor:cancellationSettings")}
          tooltip={t("reservationUnitEditor:tooltip.cancellationSettings")}
          style={{ gridColumn: "1 / -1", alignItems: "start" }}
        >
          <ActivationGroup
            label={t("reservationUnitEditor:cancellationIsPossible")}
            control={control}
            name="hasCancellationRule"
          >
            <SpecializedRadioGroup
              name="cancellationRule"
              options={cancellationRuleOptions}
              control={control}
              noLabel
              noTooltip
              noTranslation
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
              label={t("reservationUnitEditor:label.metadataSet")}
              error={getTranslatedError(t, errors.metadataSet?.message)}
              tooltip={t("reservationUnitEditor:tooltip.metadataSet")}
            />
            <ControlledSelect
              control={control}
              name="authentication"
              required
              options={authenticationOptions}
              label={t("reservationUnitEditor:authenticationLabel")}
              tooltip={t("reservationUnitEditor:tooltip.authentication")}
            />
            <CustomNumberInput name="maxReservationsPerUser" min={1} form={form} />
            <FieldGroup
              // FIXME replace the text fields
              heading={t("reservationUnitEditor:requireAdultReserveeSettings")}
              tooltip={t("reservationUnitEditor:tooltip.requireAdultReservee")}
              style={{ gridColumn: "1 / -1" }}
            >
              <ControlledCheckbox
                control={control}
                name="requireAdultReservee"
                label={t("reservationUnitEditor:requireAdultReserveeLabel")}
              />
            </FieldGroup>
            <FieldGroup
              heading={t("reservationUnitEditor:handlingSettings")}
              tooltip={t("reservationUnitEditor:tooltip.handlingSettings")}
              style={{ gridColumn: "1 / -1" }}
            >
              <ControlledCheckbox
                control={control}
                name="requireReservationHandling"
                label={t("reservationUnitEditor:requireReservationHandling")}
              />
            </FieldGroup>
          </>
        )}
      </AutoGrid>
    </EditAccordion>
  );
}
