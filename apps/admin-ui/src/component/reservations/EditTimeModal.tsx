import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Button, Dialog, Notification } from "hds-react";
import { z } from "zod";
import { type TFunction } from "i18next";
import {
  ReservationStartInterval,
  ReservationTypeChoice,
  useStaffAdjustReservationTimeMutation,
  type ReservationQuery,
} from "@gql/gql-types";
import { FormProvider, useForm } from "react-hook-form";
import { differenceInMinutes, format } from "date-fns";
import { ErrorBoundary } from "react-error-boundary";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatDuration, toUIDate } from "common/src/common/util";
import { useNotification } from "app/context/NotificationContext";
import { useModal } from "app/context/ModalContext";
import { TimeChangeFormSchemaRefined, TimeFormSchema } from "app/schemas";
import ControlledTimeInput from "../my-units/components/ControlledTimeInput";
import { reservationDateTime } from "./requested/util";
import ControlledDateInput from "../my-units/components/ControlledDateInput";
import { BufferToggles } from "../my-units/BufferToggles";
import { useCheckCollisions } from "./requested/hooks";
import { filterNonNullable } from "common/src/helpers";
import { parseDateTimeSafe } from "@/helpers";

const StyledForm = styled.form`
  margin-top: var(--spacing-m);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  gap: var(--spacing-s);
`;

// TODO use a fragment
type ReservationType = NonNullable<ReservationQuery["reservation"]>;
type Props = {
  reservation: ReservationType;
  onAccept: () => void;
  onClose: () => void;
};

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

const btnCommon = {
  theme: "black",
  size: "small",
  variant: "secondary",
  disabled: false,
} as const;

const recurringReservationInfoText = ({
  weekdays,
  begin,
  end,
  t,
}: {
  weekdays: number[];
  begin?: Date;
  end?: Date;
  t: TFunction;
}) => {
  return `${t("Reservation.EditTime.recurringInfoTimes", {
    weekdays: weekdays
      .sort((a, b) => a - b)
      .map((weekday) => t(`dayShort.${weekday}`))
      .join(", "),
    begin: begin && toUIDate(begin),
    end: end && toUIDate(end),
  })}`;
};

type FormValueType = z.infer<typeof TimeFormSchema>;

function formatDateInterval(begin: Date, end: Date, t: TFunction) {
  return `${reservationDateTime(
    begin,
    end,
    t
  )}, ${formatDuration(differenceInMinutes(end, begin), t)}`;
}
const DialogContent = ({ reservation, onAccept, onClose }: Props) => {
  const { t, i18n } = useTranslation();
  const { notifyError, notifySuccess } = useNotification();

  const [changeTimeMutation] = useStaffAdjustReservationTimeMutation({
    onCompleted: () => {
      notifySuccess(t("Reservation.EditTime.successToast"));
      onAccept();
    },
    onError: (error) => {
      const { message } = error;
      const translatedError = i18n.exists(`errors.descriptive.${message}`)
        ? t(`errors.descriptive.${message}`)
        : t("errors.descriptive.genericError");
      notifyError(
        t("ReservationDialog.saveFailed", { error: translatedError })
      );
    },
  });

  const startDateTime = new Date(reservation.begin);
  const endDateTime = new Date(reservation.end);

  const reservationUnit = reservation.reservationUnit?.find(() => true);

  // TODO this matches the CreateReservationModal logic (should use a common function that is documented)
  // not doing it right now because of open question and because of breaking enum name change.
  const interval =
    reservationUnit?.reservationStartInterval ===
    ReservationStartInterval.Interval_15Mins
      ? ReservationStartInterval.Interval_15Mins
      : ReservationStartInterval.Interval_30Mins;

  const form = useForm<FormValueType>({
    resolver: zodResolver(TimeChangeFormSchemaRefined(interval)),
    mode: "onChange",
    defaultValues: {
      date: format(startDateTime, "dd.MM.yyyy"),
      startTime: format(startDateTime, "HH:mm"),
      endTime: format(endDateTime, "HH:mm"),
      bufferTimeAfter: !!reservation.bufferTimeAfter,
      bufferTimeBefore: !!reservation.bufferTimeBefore,
    },
  });
  const {
    handleSubmit,
    control,
    formState: { errors, isDirty, isValid },
    watch,
  } = form;

  const convertToApiFormat = (begin: Date, end: Date) => ({
    begin: begin.toISOString(),
    end: end.toISOString(),
  });

  const changeTime = async (
    begin: Date,
    end: Date,
    buffers: { before?: number; after?: number }
  ) => {
    return changeTimeMutation({
      variables: {
        input: {
          ...convertToApiFormat(begin, end),
          pk: reservation.pk ?? 0,
          bufferTimeAfter:
            buffers.after != null ? String(buffers.after) : undefined,
          bufferTimeBefore:
            buffers.before != null ? String(buffers.before) : undefined,
        },
      },
    });
  };

  const formDate = watch("date");
  const formEndTime = watch("endTime");
  const formStartTime = watch("startTime");

  const start = parseDateTimeSafe(formDate, formStartTime);
  const end = parseDateTimeSafe(formDate, formEndTime);
  const { hasCollisions, isLoading } = useCheckCollisions({
    reservationPk: reservation.pk ?? 0,
    reservationUnitPk: reservationUnit?.pk ?? 0,
    start,
    end,
    buffers: {
      before:
        reservation.type !== ReservationTypeChoice.Blocked &&
        reservation.bufferTimeBefore
          ? reservation.bufferTimeBefore
          : 0,
      after:
        reservation.type !== ReservationTypeChoice.Blocked &&
        reservation.bufferTimeAfter
          ? reservation.bufferTimeAfter
          : 0,
    },
    reservationType: reservation.type ?? ReservationTypeChoice.Staff,
  });

  // NOTE 0 => buffer disabled for this reservation, undefined => no buffers selected
  const bufferBefore =
    (reservation.bufferTimeBefore || reservationUnit?.bufferTimeBefore) ?? 0;
  const bufferAfter =
    (reservation.bufferTimeAfter || reservationUnit?.bufferTimeAfter) ?? 0;

  const onSubmit = (values: FormValueType) => {
    const newStart = parseDateTimeSafe(formDate, formStartTime);
    const newEnd = parseDateTimeSafe(formDate, formEndTime);
    if (newStart && newEnd) {
      changeTime(newStart, newEnd, {
        before: values.bufferTimeBefore ? bufferBefore : 0,
        after: values.bufferTimeAfter ? bufferAfter : 0,
      });
    }
  };

  const translateError = (errorMsg?: string) =>
    errorMsg ? t(`reservationForm:errors.${errorMsg}`) : "";

  const newTimeString = start && end ? formatDateInterval(start, end, t) : "";
  const originalTime = formatDateInterval(startDateTime, endDateTime, t);

  return (
    <Dialog.Content>
      <StyledForm onSubmit={handleSubmit(onSubmit)} noValidate>
        {reservation.recurringReservation && (
          <TimeInfoBox>
            {t("Reservation.EditTime.recurringInfoLabel")}:{" "}
            <Bold>
              {recurringReservationInfoText({
                weekdays: filterNonNullable(
                  reservation.recurringReservation.weekdays
                ),
                begin: ((x) => (x != null ? new Date(x) : undefined))(
                  reservation.recurringReservation.beginDate
                ),
                end: ((x) => (x != null ? new Date(x) : undefined))(
                  reservation.recurringReservation.endDate
                ),
                t,
              })}
            </Bold>
          </TimeInfoBox>
        )}
        <TimeInfoBox>
          {t("Reservation.EditTime.originalTime")}: <Bold>{originalTime}</Bold>
        </TimeInfoBox>
        <ControlledDateInput
          name="date"
          control={control}
          error={translateError(errors.date?.message)}
        />
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
          <BufferToggles before={bufferBefore} after={bufferAfter} />
        </FormProvider>
        <TimeInfoBox $isDisabled={!isDirty || !isValid}>
          {t("Reservation.EditTime.newTime")}: <Bold>{newTimeString}</Bold>
        </TimeInfoBox>
        {hasCollisions && (
          <Notification
            size="small"
            label={t("Reservation.EditTime.error.reservationCollides")}
            type="error"
            style={{ marginTop: "var(--spacing-s)", gridColumn: "1 / -1" }}
          >
            {t("Reservation.EditTime.error.reservationCollides")}
          </Notification>
        )}
        <ActionButtons>
          <Button {...btnCommon} onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            disabled={((!isDirty || !isValid) && !isLoading) || hasCollisions}
            type="submit"
          >
            {t("Reservation.EditTime.accept")}
          </Button>
        </ActionButtons>
      </StyledForm>
    </Dialog.Content>
  );
};

const StyledDialog = styled(Dialog)`
  /* larger than normal HDS modal */
  && {
    width: 100%;
  }
  max-width: 944px;
`;

function EditTimeModal({ reservation, onAccept, onClose }: Props) {
  const { isOpen } = useModal();
  const { t } = useTranslation();

  return (
    <StyledDialog
      variant="primary"
      id="info-dialog"
      aria-labelledby="modal-header"
      isOpen={isOpen}
      focusAfterCloseRef={undefined}
    >
      <Dialog.Header
        id="modal-header"
        title={t("Reservation.EditTime.title")}
      />
      <ErrorBoundary fallback={<div>{t("errors.unknown")}</div>}>
        <DialogContent
          reservation={reservation}
          onAccept={onAccept}
          onClose={onClose}
        />
      </ErrorBoundary>
    </StyledDialog>
  );
}

export default EditTimeModal;
