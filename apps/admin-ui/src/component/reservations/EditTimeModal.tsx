import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Button, Dialog, Notification } from "hds-react";
import { z } from "zod";
import { TFunction } from "i18next";
import {
  Mutation,
  MutationStaffAdjustReservationTimeArgs,
  ReservationType,
  ReservationTypeConnection,
  ReservationUnitsReservationUnitReservationStartIntervalChoices,
  ReservationsReservationTypeChoices,
} from "common/types/gql-types";
import { FormProvider, useForm } from "react-hook-form";
import { format } from "date-fns";
import { ErrorBoundary } from "react-error-boundary";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@apollo/client";
import { fromUIDate, toUIDate } from "common/src/common/util";
import { useNotification } from "app/context/NotificationContext";
import { useModal } from "app/context/ModalContext";
import { TimeChangeFormSchemaRefined, TimeFormSchema } from "app/schemas";
import { CHANGE_RESERVATION_TIME } from "./queries";
import { setTimeOnDate } from "./utils";
import ControlledTimeInput from "../my-units/components/ControlledTimeInput";
import { reservationDateTime, reservationDuration } from "./requested/util";
import ControlledDateInput from "../my-units/components/ControlledDateInput";
import { BufferToggles } from "../my-units/BufferToggles";
import { useCheckCollisions } from "./requested/hooks";
import { filterNonNullable } from "common/src/helpers";

const StyledForm = styled.form`
  margin-top: var(--spacing-m);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  gap: var(--spacing-s);
`;

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

const DialogContent = ({ reservation, onAccept, onClose }: Props) => {
  const { t, i18n } = useTranslation();
  const { notifyError, notifySuccess } = useNotification();

  const [changeTimeMutation] = useMutation<
    Mutation,
    MutationStaffAdjustReservationTimeArgs
  >(CHANGE_RESERVATION_TIME, {
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
    update(cache, { data }) {
      // NOTE: recurring uses a long list of reservations that is cached, manual update needed
      cache.modify({
        fields: {
          // find the pk => slice the array => replace the state variable in the slice
          // @ts-expect-error: TODO: typechecks broke with ts or apollo-client upgrade
          reservations(existing: ReservationTypeConnection) {
            const queryRes = data?.staffAdjustReservationTime;
            if (queryRes?.errors) {
              // eslint-disable-next-line no-console
              console.error(
                "NOT updating cache: mutation failed with: ",
                queryRes?.errors
              );
            } else if (!queryRes?.errors && !queryRes?.pk) {
              // eslint-disable-next-line no-console
              console.error(
                "NOT updating cache: mutation success but PK missing"
              );
            } else {
              const { begin, end, pk } = queryRes;
              const fid = existing.edges.findIndex((x) => x?.node?.pk === pk);
              if (fid > -1 && begin && end) {
                const cpy = structuredClone(existing.edges[fid]);
                if (cpy?.node && begin && end) {
                  cpy.node.begin = begin;
                  cpy.node.end = end;
                  return {
                    ...existing,
                    edges: [
                      ...existing.edges.slice(0, fid),
                      cpy,
                      ...existing.edges.slice(fid + 1),
                    ],
                  };
                }
                if (!begin || !end) {
                  // eslint-disable-next-line no-console
                  console.error(
                    "Cache update failed reservation found, but no begin or end time in the response"
                  );
                } else {
                  // eslint-disable-next-line no-console
                  console.error(
                    "Cache update failed: No reservation found with pk: ",
                    pk
                  );
                }
              }
            }
            return existing;
          },
        },
      });
    },
  });

  const startDateTime = new Date(reservation.begin);
  const endDateTime = new Date(reservation.end);

  const reservationUnit = reservation.reservationUnits?.find(() => true);

  // TODO this matches the CreateReservationModal logic (should use a common function that is documented)
  // not doing it right now because of open question and because of breaking enum name change.
  const interval =
    reservationUnit?.reservationStartInterval ===
    ReservationUnitsReservationUnitReservationStartIntervalChoices.Interval_15Mins
      ? ReservationUnitsReservationUnitReservationStartIntervalChoices.Interval_15Mins
      : ReservationUnitsReservationUnitReservationStartIntervalChoices.Interval_30Mins;

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

  const newStartTime = setTimeOnDate(
    fromUIDate(formDate) ?? new Date(),
    formStartTime
  );
  const newEndTime = setTimeOnDate(
    fromUIDate(formDate) ?? new Date(),
    formEndTime
  );
  const { hasCollisions, isLoading } = useCheckCollisions({
    reservationPk: reservation.pk ?? 0,
    reservationUnitPk: reservationUnit?.pk ?? 0,
    start: newStartTime,
    end: newEndTime,
    buffers: {
      before:
        reservation.type !== ReservationsReservationTypeChoices.Blocked &&
        reservation.bufferTimeBefore
          ? reservation.bufferTimeBefore
          : 0,
      after:
        reservation.type !== ReservationsReservationTypeChoices.Blocked &&
        reservation.bufferTimeAfter
          ? reservation.bufferTimeAfter
          : 0,
    },
    reservationType:
      reservation.type ?? ReservationsReservationTypeChoices.Staff,
  });

  // NOTE 0 => buffer disabled for this reservation, undefined => no buffers selected
  const bufferBefore =
    (reservation.bufferTimeBefore || reservationUnit?.bufferTimeBefore) ?? 0;
  const bufferAfter =
    (reservation.bufferTimeAfter || reservationUnit?.bufferTimeAfter) ?? 0;

  const onSubmit = (values: FormValueType) => {
    if (values.date && values.startTime && values.endTime) {
      const start = setTimeOnDate(
        fromUIDate(values.date) ?? new Date(),
        values.startTime
      );
      const end = setTimeOnDate(
        fromUIDate(values.date) ?? new Date(),
        values.endTime
      );
      changeTime(start, end, {
        before: values.bufferTimeBefore ? bufferBefore : 0,
        after: values.bufferTimeAfter ? bufferAfter : 0,
      });
    }
  };

  const translateError = (errorMsg?: string) =>
    errorMsg ? t(`reservationForm:errors.${errorMsg}`) : "";

  const newTime = `${reservationDateTime(
    newStartTime,
    newEndTime,
    t
  )}, ${reservationDuration(newStartTime, newEndTime)} t`;

  const originalTime = `${reservationDateTime(
    startDateTime,
    endDateTime,
    t
  )}, ${reservationDuration(startDateTime, endDateTime)} t`;

  const recurringReservationInfo = reservation.recurringReservation ? (
    <TimeInfoBox>
      {t("Reservation.EditTime.recurringInfoLabel")}:{" "}
      <Bold>
        {recurringReservationInfoText({
          weekdays: filterNonNullable(
            reservation.recurringReservation.weekdays
          ),
          // begin: reservation.recurringReservation.beginDate ?? undefined,
          begin: ((x) => (x != null ? new Date(x) : undefined))(
            reservation.recurringReservation.beginDate
          ),
          // end: reservation.recurringReservation.endDate ?? undefined,
          end: ((x) => (x != null ? new Date(x) : undefined))(
            reservation.recurringReservation.endDate
          ),
          t,
        })}
      </Bold>
    </TimeInfoBox>
  ) : null;

  return (
    <Dialog.Content>
      <StyledForm onSubmit={handleSubmit(onSubmit)} noValidate>
        {recurringReservationInfo}
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
          {t("Reservation.EditTime.newTime")}: <Bold>{newTime}</Bold>
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

const EditTimeModal = ({ reservation, onAccept, onClose }: Props) => {
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
};

export default EditTimeModal;
