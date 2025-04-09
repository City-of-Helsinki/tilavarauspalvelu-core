import React, { useEffect } from "react";
import { gql } from "@apollo/client";
import { useForm, FormProvider, UseFormReturn } from "react-hook-form";
import {
  Button,
  ButtonSize,
  ButtonVariant,
  Dialog,
  Notification,
  NotificationSize,
} from "hds-react";
import { useTranslation } from "react-i18next";
import {
  type CreateStaffReservationFragment,
  type ReservationStaffCreateMutationInput,
  useCreateStaffReservationMutation,
  useReservationUnitQuery,
} from "@gql/gql-types";
import styled from "styled-components";
import { format } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import { ErrorBoundary } from "react-error-boundary";
import {
  ReservationFormSchema,
  type ReservationFormType,
  type ReservationFormMeta,
} from "@/schemas";
import { CenterSpinner } from "common/styled";
import { breakpoints } from "common/src/const";
import { useCheckCollisions } from "@/hooks";
import {
  constructDateTimeSafe,
  dateTime,
  getBufferTime,
  getNormalizedInterval,
} from "@/helpers";
import { useModal } from "@/context/ModalContext";
import { ControlledTimeInput } from "@/component/ControlledTimeInput";
import { ControlledDateInput } from "common/src/components/form";
import ReservationTypeForm from "@/component/ReservationTypeForm";
import { base64encode } from "common/src/helpers";
import { successToast } from "common/src/common/toast";
import { useDisplayError } from "common/src/hooks";

// NOTE HDS forces buttons over each other on mobile, we want them side-by-side
const ActionButtons = styled(Dialog.ActionButtons)`
  display: flex;
  flex-wrap: wrap;
  justify-content: end;
  align-items: center;
  gap: var(--spacing-s);
  padding: var(--spacing-s);
  @media (max-width: ${breakpoints.m}) {
    > button {
      margin: 0;
      flex-basis: 47%;
    }
  }
`;

const FixedDialog = styled(Dialog)`
  /* Hack to deal with modal trying to fit content. So an error message -> layout shift */
  width: min(calc(100vw - 2rem), var(--container-width-l)) !important;
  & > div:nth-child(2) {
    /* don't layout shift when the modal content changes */
    height: min(80vh, 1024px);
    > div:nth-child(1) {
      height: 100%;
    }
  }
`;

type FormValueType = ReservationFormType & ReservationFormMeta;

const Form = styled.form`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
  grid-template-rows: repeat(12, 1fr);
  gap: var(--spacing-l);

  height: 100%;
  margin-top: var(--spacing-m);
  margin-bottom: var(--spacing-m);
`;

const StyledNotification = styled(Notification)`
  margin-right: auto;
  width: auto;
`;

function useCheckFormCollisions({
  form,
  reservationUnit,
}: {
  form: UseFormReturn<FormValueType>;
  reservationUnit: CreateStaffReservationFragment;
}) {
  const { watch } = form;

  const formDate = watch("date");
  const formEndTime = watch("endTime");
  const formStartTime = watch("startTime");
  const enableBufferTimeAfter = watch("enableBufferTimeAfter");
  const enableBufferTimeBefore = watch("enableBufferTimeBefore");
  const type = watch("type");

  const bufferBeforeSeconds = getBufferTime(
    reservationUnit.bufferTimeBefore,
    type,
    enableBufferTimeBefore
  );
  const bufferAfterSeconds = getBufferTime(
    reservationUnit.bufferTimeAfter,
    type,
    enableBufferTimeAfter
  );

  const start = constructDateTimeSafe(formDate, formStartTime);
  const end = constructDateTimeSafe(formDate, formEndTime);
  const { hasCollisions } = useCheckCollisions({
    reservationPk: undefined,
    reservationUnitPk: reservationUnit?.pk ?? 0,
    start,
    end,
    buffers: {
      before: bufferBeforeSeconds,
      after: bufferAfterSeconds,
    },
    reservationType: type,
  });

  return { hasCollisions };
}

function CollisionWarning({
  form,
  reservationUnit,
}: {
  form: UseFormReturn<FormValueType>;
  reservationUnit: CreateStaffReservationFragment;
}) {
  const { t } = useTranslation();
  const { hasCollisions } = useCheckFormCollisions({ form, reservationUnit });

  if (!hasCollisions) {
    return null;
  }
  return (
    <StyledNotification
      size={NotificationSize.Small}
      label={t("errors.timeCollision")}
      type="error"
      data-testid="CreateReservationModal__collision-warning"
    >
      {t("errors.timeCollision")}
    </StyledNotification>
  );
}

function ActionContainer({
  form,
  reservationUnit,
  onCancel,
  onSubmit,
}: {
  form: UseFormReturn<FormValueType>;
  reservationUnit: CreateStaffReservationFragment;
  onCancel: () => void;
  onSubmit: (values: FormValueType) => void;
}) {
  const { t } = useTranslation();
  const {
    handleSubmit,
    formState: { isDirty, isSubmitting, isValid },
  } = form;

  const { hasCollisions } = useCheckFormCollisions({ form, reservationUnit });

  const isDisabled = !isDirty || isSubmitting || !isValid || hasCollisions;

  return (
    <ActionButtons>
      <CollisionWarning form={form} reservationUnit={reservationUnit} />
      <Button
        type="button"
        size={ButtonSize.Small}
        disabled={isDisabled}
        onClick={() => {
          handleSubmit(onSubmit)();
        }}
        data-testid="CreateReservationModal__accept-reservation"
      >
        {t("ReservationDialog.accept")}
      </Button>
      <Button
        size={ButtonSize.Small}
        variant={ButtonVariant.Secondary}
        onClick={onCancel}
        data-testid="CreateReservationModal__cancel-reservation"
      >
        {t("common.cancel")}
      </Button>
    </ActionButtons>
  );
}

function DialogContent({
  onClose,
  reservationUnit,
  start,
}: {
  onClose: () => void;
  reservationUnit: CreateStaffReservationFragment;
  start: Date;
}) {
  const { t } = useTranslation();
  const interval = getNormalizedInterval(
    reservationUnit.reservationStartInterval
  );
  const form = useForm<FormValueType>({
    // @ts-expect-error -- schema refinement breaks typing
    resolver: zodResolver(ReservationFormSchema(interval)),
    // TODO onBlur or onChange? onChange is anoying because it highlights even untouched fields
    // onBlur on the other hand does no validation on the focused field till it's blurred

    // I want show errors for touched fields onBlur + clear errors onChange
    // I guess I just have to write logic for it using isTouched + onChange

    mode: "onChange",
    defaultValues: {
      date: format(start, "dd.MM.yyyy"),
      startTime: format(start, "HH:mm"),
      enableBufferTimeBefore: false,
      enableBufferTimeAfter: false,
    },
  });

  const {
    handleSubmit,
    control,
    formState: { errors },
    trigger,
    watch,
    getFieldState,
  } = form;

  // show errors if the clicked start date is invalid (both previous day and today but in the past)
  useEffect(() => {
    if (start < new Date()) {
      trigger();
    }
  }, [start, trigger]);

  // force form vaildation on date change but not on first render
  const formDate = watch("date");
  useEffect(() => {
    // Is touched is always false with controller
    if (getFieldState("date").isDirty) {
      trigger();
    }
  }, [formDate, trigger, getFieldState]);

  // force revalidation of end time on start time change
  const formStartTime = watch("startTime");
  useEffect(() => {
    // Is touched is always false with controller
    if (getFieldState("endTime").isDirty) {
      trigger("endTime");
    }
  }, [formStartTime, trigger, getFieldState]);

  const [create] = useCreateStaffReservationMutation();

  const createStaffReservation = (input: ReservationStaffCreateMutationInput) =>
    create({ variables: { input } });
  const displayError = useDisplayError();

  const onSubmit = async (values: FormValueType) => {
    try {
      if (!reservationUnit.pk) {
        throw new Error("Missing reservation unit");
      }

      const {
        comments,
        date,
        startTime,
        endTime,
        type,
        enableBufferTimeBefore,
        enableBufferTimeAfter,
        ...rest
      } = values;

      const bufferBefore = getBufferTime(
        reservationUnit.bufferTimeBefore,
        type,
        enableBufferTimeBefore
      );
      const bufferAfter = getBufferTime(
        reservationUnit.bufferTimeAfter,
        type,
        enableBufferTimeAfter
      );
      const input: ReservationStaffCreateMutationInput = {
        ...rest,
        reservationUnit: reservationUnit.pk,
        type,
        begin: dateTime(date, startTime),
        end: dateTime(date, endTime),
        bufferTimeBefore: bufferBefore,
        bufferTimeAfter: bufferAfter,
        workingMemo: comments,
      };

      await createStaffReservation(input);

      successToast({
        text: t("ReservationDialog.saveSuccess", {
          reservationUnit: reservationUnit.nameFi,
        }),
      });
      onClose();
    } catch (err) {
      displayError(err);
    }
  };

  const translateError = (errorMsg?: string) =>
    errorMsg ? t(`reservationForm:errors.${errorMsg}`) : "";

  return (
    <>
      <Dialog.Content>
        <FormProvider {...form}>
          <Form onSubmit={handleSubmit(onSubmit)}>
            <ControlledDateInput
              name="date"
              control={control}
              error={translateError(errors.date?.message)}
              required
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
            <ReservationTypeForm reservationUnit={reservationUnit} />
          </Form>
        </FormProvider>
      </Dialog.Content>
      <ActionContainer
        form={form}
        reservationUnit={reservationUnit}
        onCancel={onClose}
        onSubmit={onSubmit}
      />
    </>
  );
}

export function CreateReservationModal({
  reservationUnitPk: pk,
  start,
  onClose,
}: {
  reservationUnitPk: number;
  start: Date;
  onClose: () => void;
}): JSX.Element {
  const { isOpen } = useModal();
  const { t } = useTranslation();

  const isPkValid = pk > 0;
  const id = base64encode(`ReservationUnitNode:${pk}`);
  const { data, loading } = useReservationUnitQuery({
    variables: { id },
    skip: !isPkValid,
  });

  const { reservationUnit } = data ?? {};

  if (loading) {
    return <CenterSpinner />;
  }

  return (
    <FixedDialog
      variant="primary"
      id="info-dialog"
      aria-labelledby="modal-header"
      aria-describedby="modal-description"
      isOpen={isOpen}
      focusAfterCloseRef={undefined}
      scrollable
    >
      <Dialog.Header
        id="modal-header"
        title={t("ReservationDialog.title", {
          reservationUnit: reservationUnit?.nameFi,
        })}
      />
      {reservationUnit != null && (
        <ErrorBoundary fallback={<div>{t("errors.unexpectedError")}</div>}>
          <DialogContent
            onClose={onClose}
            reservationUnit={reservationUnit}
            start={start}
          />
        </ErrorBoundary>
      )}
    </FixedDialog>
  );
}

// TODO this is reused for create RecurringReservation also (though we have a common fragment)
export const RESERVATION_UNIT_QUERY = gql`
  query ReservationUnit($id: ID!) {
    reservationUnit(id: $id) {
      ...CreateStaffReservation
    }
  }
`;

export const CREATE_STAFF_RESERVATION_FRAGMENT = gql`
  fragment CreateStaffReservation on ReservationUnitNode {
    pk
    nameFi
    reservationStartInterval
    ...ReservationTypeFormFields
  }
`;

export const CREATE_STAFF_RESERVATION = gql`
  mutation CreateStaffReservation(
    $input: ReservationStaffCreateMutationInput!
  ) {
    createStaffReservation(input: $input) {
      pk
    }
  }
`;
