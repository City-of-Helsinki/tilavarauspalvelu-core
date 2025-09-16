import React from "react";
import { useTranslation, type TFunction } from "next-i18next";
import styled from "styled-components";
import { Button, ButtonSize, ButtonVariant, Dialog, Notification, NotificationSize } from "hds-react";
import { z } from "zod";
import {
  type ChangeReservationTimeFragment,
  type ReservationSeriesAddMutationInput,
  ReservationTypeChoice,
  useAddReservationToSeriesMutation,
  useStaffAdjustReservationTimeMutation,
  Weekday,
} from "@gql/gql-types";
import { FormProvider, useForm, UseFormReturn } from "react-hook-form";
import { differenceInMinutes } from "date-fns";
import { ErrorBoundary } from "react-error-boundary";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  formatDuration,
  formatDateTimeRange,
  fromUIDateTime,
  fromUIDateTimeUnsafe,
  formatTime,
  formatDate,
} from "common/src/modules/date-utils";
import { useModal } from "@/context/ModalContext";
import { getTimeChangeFormSchemaRefined, TimeFormSchema } from "common/src/schemas";
import { ControlledTimeInput } from "@/components/ControlledTimeInput";
import { ControlledDateInput } from "common/src/components/form";
import { BufferToggles } from "@/components/BufferToggles";
import { useCheckCollisions } from "@/hooks";
import { getBufferTime, getNormalizedInterval } from "@/modules/helpers";
import { gql } from "@apollo/client";
import { filterNonNullable } from "common/src/modules/helpers";
import { successToast } from "common/src/components/toast";
import { useDisplayError } from "common/src/hooks";
import { convertWeekday } from "common/src/modules/conversion";

const StyledForm = styled.form`
  margin-top: var(--spacing-m);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  gap: var(--spacing-s);
`;

const ActionButtons = styled(Dialog.ActionButtons)`
  justify-content: end;
  grid-column: 1 / -1;
  padding: 0;
  padding-bottom: var(--spacing-m);
`;

const TimeInfoBox = styled.p<{ $isDisabled?: boolean }>`
  grid-column: 1 / -1;
  margin: 0;
  color: ${({ $isDisabled }) => ($isDisabled ? "var(--color-black-40)" : "")};
`;

const Bold = styled.b`
  white-space: nowrap;
`;

const StyledDialog = styled(Dialog)`
  /* larger than normal HDS modal */

  && {
    width: 100%;
  }

  max-width: 944px;
`;

function reservationSeriesInfoText({
  weekdays,
  begin,
  end,
  t,
}: {
  weekdays: Weekday[];
  begin?: Date;
  end?: Date;
  t: TFunction;
}) {
  return t("reservation:EditTimeModal.recurringInfoTimes", {
    weekdays: weekdays
      .sort((a, b) => convertWeekday(a) - convertWeekday(b))
      .map((weekday) => t(`translation:dayShort.${weekday}`))
      .join(", "),
    begin: begin && formatDate(begin, {}),
    end: end && formatDate(end, {}),
  });
}

type EditFormValueType = z.infer<typeof TimeFormSchema>;

function formatDateInterval(t: TFunction, begin: Date, end: Date) {
  const dateString = formatDateTimeRange(begin, end);
  const durationString = formatDuration(t, {
    minutes: differenceInMinutes(end, begin),
  });
  return `${dateString} (${durationString})`;
}

type CommonProps = {
  onClose: () => void;
};
type MutationValues = {
  pk: number | undefined;
  begin: Date;
  end: Date;
  buffers: { before?: number; after?: number };
};

type DialogContentProps = {
  form: UseFormReturn<EditFormValueType>;
  reservationUnitPk: number;
  bufferTimeBefore: number;
  bufferTimeAfter: number;
  mutate: (values: MutationValues) => Promise<void>;
  topContent?: React.ReactNode;
  type: "move" | "new";
} & CommonProps;

function convertToApiFormat(begin: Date, end: Date) {
  return {
    beginsAt: begin.toISOString(),
    endsAt: end.toISOString(),
  };
}

function DialogContent({
  form,
  reservationUnitPk,
  bufferTimeBefore,
  bufferTimeAfter,
  mutate,
  onClose,
  topContent,
  type,
}: DialogContentProps) {
  const { t } = useTranslation();
  const {
    handleSubmit,
    control,
    formState: { errors, isDirty, isValid },
    watch,
  } = form;

  const formDate = watch("date");
  const formEndTime = watch("endTime");
  const formStartTime = watch("startTime");
  const formPks = watch("pk");
  const formType = watch("type");

  const start = fromUIDateTime(formDate, formStartTime);
  const end = fromUIDateTime(formDate, formEndTime);
  const { hasCollisions, isLoading } = useCheckCollisions({
    reservationPk: formPks,
    reservationUnitPk,
    start,
    end,
    buffers: {
      before: getBufferTime(bufferTimeBefore, formType),
      after: getBufferTime(bufferTimeAfter, formType),
    },
    reservationType: formType,
  });
  const displayError = useDisplayError();

  const onSubmit = async (values: EditFormValueType) => {
    try {
      const newStart = fromUIDateTimeUnsafe(formDate, formStartTime);
      const newEnd = fromUIDateTimeUnsafe(formDate, formEndTime);
      const { pk } = values;
      await mutate({
        pk,
        begin: newStart,
        end: newEnd,
        buffers: {
          before: values.enableBufferTimeBefore ? bufferTimeBefore : 0,
          after: values.enableBufferTimeAfter ? bufferTimeAfter : 0,
        },
      });
    } catch (err) {
      displayError(err);
    }
  };

  const translateError = (errorMsg?: string) => (errorMsg ? t(`reservationForm:errors.${errorMsg}`) : "");

  const newTimeString = start && end ? formatDateInterval(t, start, end) : "";
  const translateKey = type === "move" ? "reservation:EditTimeModal" : "reservation:NewReservationModal";
  const isDisabled = (!isDirty && !isValid) || isLoading || hasCollisions;
  return (
    <Dialog.Content>
      <StyledForm onSubmit={handleSubmit(onSubmit)} noValidate>
        {topContent}
        <ControlledDateInput name="date" control={control} error={translateError(errors.date?.message)} />
        <ControlledTimeInput
          name="startTime"
          control={control}
          error={translateError(errors.startTime?.message)}
          required
        />
        <ControlledTimeInput
          name="endTime"
          control={control}
          error={translateError(errors.endTime?.message)}
          required
        />
        <FormProvider {...form}>
          <BufferToggles before={bufferTimeBefore} after={bufferTimeAfter} />
        </FormProvider>
        <TimeInfoBox $isDisabled={!isDirty || !isValid}>
          {t(`reservation:CommonModal.newTime`)}: <Bold>{newTimeString}</Bold>
        </TimeInfoBox>
        {hasCollisions && (
          <Notification
            size={NotificationSize.Small}
            label={t(`reservation:CommonModal.error.reservationCollides`)}
            type="error"
            style={{ marginTop: "var(--spacing-s)", gridColumn: "1 / -1" }}
          >
            {t(`reservation:CommonModal.error.reservationCollides`)}
          </Notification>
        )}
        <ActionButtons>
          <Button disabled={isDisabled} type="submit">
            {t(`${translateKey}.acceptBtn`)}
          </Button>
          <Button size={ButtonSize.Small} variant={ButtonVariant.Secondary} onClick={onClose}>
            {t("common:cancel")}
          </Button>
        </ActionButtons>
      </StyledForm>
    </Dialog.Content>
  );
}

export type NewReservationModalProps = CommonProps & {
  reservationToCopy: ChangeReservationTimeFragment;
  onAccept: () => void;
};

export function NewReservationModal({ reservationToCopy, onAccept, onClose }: NewReservationModalProps) {
  const { t } = useTranslation("reservation");
  const { isOpen } = useModal();

  const reservationUnit = reservationToCopy.reservationUnit;

  // NOTE 0 => buffer disabled for this reservation, undefined => no buffers selected
  const bufferTimeBefore = reservationUnit.bufferTimeBefore ?? 0;
  const bufferTimeAfter = reservationUnit.bufferTimeAfter ?? 0;

  const interval = getNormalizedInterval(reservationUnit.reservationStartInterval);

  const form = useForm<EditFormValueType>({
    resolver: zodResolver(getTimeChangeFormSchemaRefined(interval)),
    mode: "onChange",
    defaultValues: {
      enableBufferTimeAfter: true,
      enableBufferTimeBefore: true,
      // NOTE type is required because it overrides buffer times
      type: reservationToCopy?.type ?? ReservationTypeChoice.Staff,
    },
  });

  const [create] = useAddReservationToSeriesMutation();

  function createInput({ begin, end, buffers }: MutationValues): ReservationSeriesAddMutationInput {
    if (reservationToCopy?.reservationSeries?.pk == null) {
      throw new Error("recurring reservation pk missing");
    }
    return {
      pk: reservationToCopy?.reservationSeries?.pk,
      ...convertToApiFormat(begin, end),
      bufferTimeAfter: buffers.after?.toString(),
      bufferTimeBefore: buffers.before?.toString(),
    };
  }

  const mutate = async (values: MutationValues) => {
    await create({
      variables: {
        input: createInput(values),
      },
    });
    onAccept();
    successToast({ text: t("NewReservationModal.successToast") });
  };

  return (
    <StyledDialog
      variant="primary"
      id="info-dialog"
      aria-labelledby="modal-header"
      isOpen={isOpen}
      focusAfterCloseRef={undefined}
    >
      <Dialog.Header id="modal-header" title={t("NewReservationModal.title")} />
      <ErrorBoundary fallback={<div>{t("errors.unexpectedError")}</div>}>
        <DialogContent
          form={form}
          reservationUnitPk={reservationUnit.pk ?? 0}
          bufferTimeAfter={bufferTimeAfter}
          bufferTimeBefore={bufferTimeBefore}
          mutate={mutate}
          onClose={onClose}
          type="new"
        />
      </ErrorBoundary>
    </StyledDialog>
  );
}

// TODO refactor so it doesnt require a reservation
// use the same UI for new reservation creation (only requires unit or reservation unit?)
// allow either a move or new (if / else if we have to)
export function EditTimeModal({
  reservation,
  onAccept,
  onClose,
}: CommonProps & {
  onAccept: () => void;
  reservation: ChangeReservationTimeFragment;
}) {
  const { isOpen } = useModal();
  const { t } = useTranslation("reservation");

  const startDateTime = new Date(reservation.beginsAt);
  const endDateTime = new Date(reservation.endsAt);

  const reservationUnit = reservation.reservationUnit;

  // NOTE 0 => buffer disabled for this reservation, undefined => no buffers selected
  const bufferTimeBefore = (reservation.bufferTimeBefore || reservationUnit.bufferTimeBefore) ?? 0;
  const bufferTimeAfter = (reservation.bufferTimeAfter || reservationUnit.bufferTimeAfter) ?? 0;

  const interval = getNormalizedInterval(reservationUnit.reservationStartInterval);

  if (reservation.pk == null) {
    // eslint-disable-next-line no-console
    console.warn("EditTimeModal: pk missing");
  }

  const form = useForm<EditFormValueType>({
    resolver: zodResolver(getTimeChangeFormSchemaRefined(interval)),
    mode: "onChange",
    defaultValues: {
      pk: reservation.pk ?? undefined,
      date: formatDate(startDateTime, {}),
      startTime: formatTime(startDateTime),
      endTime: formatTime(endDateTime),
      enableBufferTimeAfter: !!reservation.bufferTimeAfter,
      enableBufferTimeBefore: !!reservation.bufferTimeBefore,
      type: reservation.type ?? ReservationTypeChoice.Staff,
    },
  });

  const [changeTimeMutation] = useStaffAdjustReservationTimeMutation();

  const changeTime = async ({ begin, end, buffers }: MutationValues) => {
    const pk = reservation.pk;
    if (!pk) {
      throw new Error("pk missing");
    }
    await changeTimeMutation({
      variables: {
        input: {
          ...convertToApiFormat(begin, end),
          pk,
          bufferTimeAfter: buffers.after ?? undefined,
          bufferTimeBefore: buffers.before ?? undefined,
        },
      },
    });
    successToast({ text: t("EditTimeModal.successToast") });
    onAccept();
  };

  const originalTime = formatDateInterval(t, startDateTime, endDateTime);
  return (
    <StyledDialog
      variant="primary"
      id="info-dialog"
      aria-labelledby="modal-header"
      isOpen={isOpen}
      focusAfterCloseRef={undefined}
    >
      <Dialog.Header id="modal-header" title={t("EditTimeModal.title")} />
      <ErrorBoundary fallback={<div>{t("errors:unexpectedError")}</div>}>
        <DialogContent
          form={form}
          reservationUnitPk={reservation.reservationUnit.pk ?? 0}
          bufferTimeAfter={bufferTimeAfter}
          bufferTimeBefore={bufferTimeBefore}
          mutate={changeTime}
          onClose={onClose}
          type="move"
          topContent={
            <>
              <TimeInfoBox>
                {t("EditTimeModal.recurringInfoLabel")}:{" "}
                <Bold>
                  {reservationSeriesInfoText({
                    weekdays: filterNonNullable(reservation.reservationSeries?.weekdays),
                    begin: ((x) => (x != null ? new Date(x) : undefined))(reservation.reservationSeries?.beginDate),
                    end: ((x) => (x != null ? new Date(x) : undefined))(reservation.reservationSeries?.endDate),
                    t,
                  })}
                </Bold>
              </TimeInfoBox>
              <TimeInfoBox>
                {t("EditTimeModal.originalTime")}: <Bold>{originalTime}</Bold>
              </TimeInfoBox>
            </>
          }
        />
      </ErrorBoundary>
    </StyledDialog>
  );
}

export const CHANGE_RESERVATION_TIME = gql`
  mutation StaffAdjustReservationTime($input: ReservationStaffAdjustTimeMutationInput!) {
    staffAdjustReservationTime(input: $input) {
      pk
      beginsAt
      endsAt
      state
    }
  }
`;

export const ADD_RESERVATION_TO_SERIES = gql`
  mutation AddReservationToSeries($input: ReservationSeriesAddMutationInput!) {
    addReservationToSeries(input: $input) {
      pk
    }
  }
`;

export const CHANGE_RESERVATION_TIME_QUERY_FRAGMENT = gql`
  fragment ChangeReservationTime on ReservationNode {
    id
    pk
    beginsAt
    endsAt
    type
    bufferTimeAfter
    bufferTimeBefore
    reservationSeries {
      pk
      id
      weekdays
      beginDate
      endDate
    }
    reservationUnit {
      id
      pk
      bufferTimeBefore
      bufferTimeAfter
      reservationStartInterval
    }
  }
`;
