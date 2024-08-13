import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Button, Dialog, Notification } from "hds-react";
import { z } from "zod";
import { type TFunction } from "i18next";
import {
  type ChangeReservationTimeFragment,
  ReservationTypeChoice,
  useCreateStaffReservationMutation,
  useStaffAdjustReservationTimeMutation,
  type ReservationQuery,
  ReservationStaffCreateMutationInput,
} from "@gql/gql-types";
import { FormProvider, UseFormReturn, useForm } from "react-hook-form";
import { differenceInMinutes, format } from "date-fns";
import { ErrorBoundary } from "react-error-boundary";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatDuration, toUIDate } from "common/src/common/util";
import { useNotification } from "@/context/NotificationContext";
import { useModal } from "@/context/ModalContext";
import { TimeChangeFormSchemaRefined, TimeFormSchema } from "@/schemas";
import ControlledTimeInput from "@/component/ControlledTimeInput";
import ControlledDateInput from "@/component/ControlledDateInput";
import { BufferToggles } from "@/component/BufferToggles";
import { useCheckCollisions } from "./requested/hooks";
import { getNormalizedInterval, parseDateTimeSafe } from "@/helpers";
import { formatDateTimeRange } from "@/common/util";
import { gql } from "@apollo/client";
import { filterNonNullable, pick } from "common/src/helpers";

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

const btnCommon = {
  theme: "black",
  size: "small",
  variant: "secondary",
  disabled: false,
} as const;

function recurringReservationInfoText({
  weekdays,
  begin,
  end,
  t,
}: {
  weekdays: number[];
  begin?: Date;
  end?: Date;
  t: TFunction;
}) {
  return t("Reservation.EditTimeModal.recurringInfoTimes", {
    weekdays: weekdays
      .sort((a, b) => a - b)
      .map((weekday) => t(`dayShort.${weekday}`))
      .join(", "),
    begin: begin && toUIDate(begin),
    end: end && toUIDate(end),
  });
}

type EditFormValueType = z.infer<typeof TimeFormSchema>;

function formatDateInterval(t: TFunction, begin: Date, end: Date) {
  const dateString = formatDateTimeRange(t, begin, end);
  const durationString = formatDuration(differenceInMinutes(end, begin), t);
  return `${dateString} (${durationString})`;
}

export const CHANGE_RESERVATION_TIME = gql`
  mutation StaffAdjustReservationTime(
    $input: ReservationStaffAdjustTimeMutationInput!
  ) {
    staffAdjustReservationTime(input: $input) {
      pk
      begin
      end
      state
    }
  }
`;

export const CHANGE_RESERVATION_TIME_QUERY_FRAGMENT = gql`
  fragment ChangeReservationTime on ReservationNode {
    id
    pk
    begin
    end
    type
    bufferTimeAfter
    bufferTimeBefore
    recurringReservation {
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
  mutate: (values: MutationValues) => void;
  topContent?: React.ReactNode;
  type: "move" | "new";
} & CommonProps;

function convertToApiFormat(begin: Date, end: Date) {
  return {
    begin: begin.toISOString(),
    end: end.toISOString(),
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
  const { t, i18n } = useTranslation();
  const { notifyError } = useNotification();

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

  const start = parseDateTimeSafe(formDate, formStartTime);
  const end = parseDateTimeSafe(formDate, formEndTime);
  const { hasCollisions, isLoading } = useCheckCollisions({
    reservationPk: formPks,
    reservationUnitPk,
    start,
    end,
    buffers: {
      before:
        formType !== ReservationTypeChoice.Blocked && bufferTimeBefore
          ? bufferTimeBefore
          : 0,
      after:
        formType !== ReservationTypeChoice.Blocked && bufferTimeAfter
          ? bufferTimeAfter
          : 0,
    },
    reservationType: formType,
  });

  const onSubmit = (values: EditFormValueType) => {
    const newStart = parseDateTimeSafe(formDate, formStartTime);
    const newEnd = parseDateTimeSafe(formDate, formEndTime);
    const { pk } = values;
    if (newStart && newEnd) {
      try {
        mutate({
          pk,
          begin: newStart,
          end: newEnd,
          buffers: {
            before: values.enableBufferTimeBefore ? bufferTimeBefore : 0,
            after: values.enableBufferTimeAfter ? bufferTimeAfter : 0,
          },
        });
      } catch (err) {
        if (err instanceof Error) {
          const { message } = err;
          const translatedError = i18n.exists(`errors.descriptive.${message}`)
            ? t(`errors.descriptive.${message}`)
            : t("errors.descriptive.genericError");
          notifyError(
            t("ReservationDialog.saveFailed", { error: translatedError })
          );
        } else {
          notifyError(t("ReservationDialog.saveFailed"));
        }
      }
    }
  };

  const translateError = (errorMsg?: string) =>
    errorMsg ? t(`reservationForm:errors.${errorMsg}`) : "";

  const newTimeString = start && end ? formatDateInterval(t, start, end) : "";
  const translateKey =
    type === "move"
      ? "Reservation.EditTimeModal"
      : "Reservation.NewReservationModal";
  const commonTrKey = "Reservation.CommonModal";
  const isDisabled = (!isDirty && !isValid) || isLoading || hasCollisions;
  return (
    <Dialog.Content>
      <StyledForm onSubmit={handleSubmit(onSubmit)} noValidate>
        {topContent}
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
          <BufferToggles before={bufferTimeBefore} after={bufferTimeAfter} />
        </FormProvider>
        <TimeInfoBox $isDisabled={!isDirty || !isValid}>
          {t(`${commonTrKey}.newTime`)}: <Bold>{newTimeString}</Bold>
        </TimeInfoBox>
        {hasCollisions && (
          <Notification
            size="small"
            label={t(`${commonTrKey}.error.reservationCollides`)}
            type="error"
            style={{ marginTop: "var(--spacing-s)", gridColumn: "1 / -1" }}
          >
            {t(`${commonTrKey}.error.reservationCollides`)}
          </Notification>
        )}
        <ActionButtons>
          <Button {...btnCommon} onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button disabled={isDisabled} type="submit">
            {t(`${translateKey}.acceptBtn`)}
          </Button>
        </ActionButtons>
      </StyledForm>
    </Dialog.Content>
  );
}

export type NewReservationModalProps = CommonProps & {
  reservationToCopy: ReservationQuery["reservation"];
  onAccept: () => void;
};

export function NewReservationModal({
  reservationToCopy,
  onAccept,
  onClose,
}: NewReservationModalProps) {
  const { t } = useTranslation();
  const { isOpen } = useModal();

  const { recurringReservation, type } = reservationToCopy ?? {};
  const { pk: recurringReservationPk } = recurringReservation ?? {};
  const reservationUnit = reservationToCopy?.reservationUnit?.[0];

  // NOTE 0 => buffer disabled for this reservation, undefined => no buffers selected
  const bufferTimeBefore = reservationUnit?.bufferTimeBefore ?? 0;
  const bufferTimeAfter = reservationUnit?.bufferTimeAfter ?? 0;

  const interval = getNormalizedInterval(
    reservationUnit?.reservationStartInterval
  );

  const form = useForm<EditFormValueType>({
    resolver: zodResolver(TimeChangeFormSchemaRefined(interval)),
    mode: "onChange",
    defaultValues: {
      enableBufferTimeAfter: true,
      enableBufferTimeBefore: true,
      // FIXME this is incorrect (they are created as part of a series)
      // so we need to use the type from other reservations in that series
      // TODO we can remove the type completely? correct?
      type: reservationToCopy?.type ?? ReservationTypeChoice.Staff,
    },
  });

  // TODO for the create mutation we need to pass in at least the recurringReservationPk (from another reservation in the same series)
  // but do we need to pass in also the metadata? i.e. copy all the fields from another reservation?
  const [create] = useCreateStaffReservationMutation();

  const { notifySuccess } = useNotification();

  function createInput({
    begin,
    end,
    buffers,
  }: MutationValues): ReservationStaffCreateMutationInput {
    if (reservationToCopy == null) {
      throw new Error("reservationToCopy missing");
    }
    const keys = [
      "name",
      "description",
      "applyingForFreeOfCharge",
      "billingAddressCity",
      "billingAddressStreet",
      "billingAddressZip",
      "billingEmail",
      "billingFirstName",
      "billingLastName",
      "billingPhone",
      "freeOfChargeReason",
      "numPersons",
      "reserveeAddressCity",
      "reserveeAddressStreet",
      "reserveeAddressZip",
      "reserveeEmail",
      "reserveeFirstName",
      "reserveeId",
      "reserveeIsUnregisteredAssociation",
      "reserveeLastName",
      "reserveeOrganisationName",
      "reserveePhone",
    ] as const;
    const homeCityPk = reservationToCopy.homeCity?.pk;
    const purposePk = reservationToCopy.purpose?.pk;
    const ageGroupPk = reservationToCopy.ageGroup?.pk;
    const metadata = pick(reservationToCopy, keys);
    if (!reservationUnit?.pk) {
      throw new Error("reservation unit pk missing");
    }
    if (type == null) {
      throw new Error("type missing");
    }
    return {
      ...metadata,
      homeCityPk,
      purposePk,
      ageGroupPk,
      ...convertToApiFormat(begin, end),
      bufferTimeAfter: String(buffers.after),
      bufferTimeBefore: String(buffers.before),
      reservationUnitPks: [reservationUnit?.pk],
      type,
      recurringReservationPk,
    };
  }

  // TODO pass the type as a prop? it's available in the form
  // but it doesn't need to be?
  const mutate = async (values: MutationValues) => {
    await create({
      variables: {
        input: createInput(values),
      },
    });
    onAccept();
    notifySuccess(t("Reservation.NewReservationModal.successToast"));
  };

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
        title={t("Reservation.NewReservationModal.title")}
      />
      <ErrorBoundary fallback={<div>{t("errors.descriptive.unknown")}</div>}>
        <DialogContent
          form={form}
          reservationUnitPk={reservationUnit?.pk ?? 0}
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
  const { t } = useTranslation();

  const startDateTime = new Date(reservation.begin);
  const endDateTime = new Date(reservation.end);

  const reservationUnit = reservation.reservationUnit?.find(() => true);

  // NOTE 0 => buffer disabled for this reservation, undefined => no buffers selected
  const bufferTimeBefore =
    (reservation.bufferTimeBefore || reservationUnit?.bufferTimeBefore) ?? 0;
  const bufferTimeAfter =
    (reservation.bufferTimeAfter || reservationUnit?.bufferTimeAfter) ?? 0;

  const interval = getNormalizedInterval(
    reservationUnit?.reservationStartInterval
  );

  if (reservation.pk == null) {
    // eslint-disable-next-line no-console
    console.warn("EditTimeModal: pk missing");
  }

  const form = useForm<EditFormValueType>({
    resolver: zodResolver(TimeChangeFormSchemaRefined(interval)),
    mode: "onChange",
    defaultValues: {
      pk: reservation.pk ?? undefined,
      date: format(startDateTime, "dd.MM.yyyy"),
      startTime: format(startDateTime, "HH:mm"),
      endTime: format(endDateTime, "HH:mm"),
      enableBufferTimeAfter: !!reservation.bufferTimeAfter,
      enableBufferTimeBefore: !!reservation.bufferTimeBefore,
      type: reservation.type ?? ReservationTypeChoice.Staff,
    },
  });

  const { notifySuccess } = useNotification();

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
          bufferTimeAfter:
            buffers.after != null ? String(buffers.after) : undefined,
          bufferTimeBefore:
            buffers.before != null ? String(buffers.before) : undefined,
        },
      },
    });
    notifySuccess(t("Reservation.EditTimeModal.successToast"));
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
      <Dialog.Header
        id="modal-header"
        title={t("Reservation.EditTimeModal.title")}
      />
      <ErrorBoundary fallback={<div>{t("errors.descriptive.unknown")}</div>}>
        <DialogContent
          form={form}
          reservationUnitPk={reservation.reservationUnit?.[0]?.pk ?? 0}
          bufferTimeAfter={bufferTimeAfter}
          bufferTimeBefore={bufferTimeBefore}
          mutate={changeTime}
          onClose={onClose}
          type="move"
          topContent={
            <>
              <TimeInfoBox>
                {t("Reservation.EditTimeModal.recurringInfoLabel")}:{" "}
                <Bold>
                  {recurringReservationInfoText({
                    weekdays: filterNonNullable(
                      reservation.recurringReservation?.weekdays
                    ),
                    begin: ((x) => (x != null ? new Date(x) : undefined))(
                      reservation.recurringReservation?.beginDate
                    ),
                    end: ((x) => (x != null ? new Date(x) : undefined))(
                      reservation.recurringReservation?.endDate
                    ),
                    t,
                  })}
                </Bold>
              </TimeInfoBox>
              <TimeInfoBox>
                {t("Reservation.EditTimeModal.originalTime")}:{" "}
                <Bold>{originalTime}</Bold>
              </TimeInfoBox>
            </>
          }
        />
      </ErrorBoundary>
    </StyledDialog>
  );
}
