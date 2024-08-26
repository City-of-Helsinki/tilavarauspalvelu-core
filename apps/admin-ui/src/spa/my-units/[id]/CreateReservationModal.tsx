import React, { useEffect } from "react";
import { gql } from "@apollo/client";
import { useForm, FormProvider, UseFormReturn } from "react-hook-form";
import { Button, Dialog, Notification } from "hds-react";
import { useTranslation } from "react-i18next";
import {
  type ReservationStaffCreateMutationInput,
  type ReservationUnitQuery,
  ReservationTypeChoice,
  useCreateStaffReservationMutation,
  useReservationUnitQuery,
} from "@gql/gql-types";
import styled from "styled-components";
import { get } from "lodash";
import { format } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import { ErrorBoundary } from "react-error-boundary";
import {
  ReservationFormSchema,
  type ReservationFormType,
  type ReservationFormMeta,
} from "@/schemas";
import { breakpoints } from "common/src/common/style";
import { useCheckCollisions } from "@/component/reservations/requested/hooks";
import Loader from "@/component/Loader";
import { dateTime, getNormalizedInterval, parseDateTimeSafe } from "@/helpers";
import { useModal } from "@/context/ModalContext";
import ControlledTimeInput from "@/component/ControlledTimeInput";
import ControlledDateInput from "@/component/ControlledDateInput";
import ReservationTypeForm from "@/component/ReservationTypeForm";
import { flattenMetadata } from "@/common/util";
import { base64encode, filterNonNullable } from "common/src/helpers";
import { errorToast, successToast } from "common/src/common/toast";

type ReservationUnitType = NonNullable<ReservationUnitQuery["reservationUnit"]>;

export const CREATE_STAFF_RESERVATION = gql`
  mutation CreateStaffReservation(
    $input: ReservationStaffCreateMutationInput!
  ) {
    createStaffReservation(input: $input) {
      pk
    }
  }
`;

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
  reservationUnit: ReservationUnitType;
}) {
  const { watch } = form;

  const formDate = watch("date");
  const formEndTime = watch("endTime");
  const formStartTime = watch("startTime");
  const bufferTimeAfter = watch("bufferTimeAfter");
  const bufferTimeBefore = watch("bufferTimeBefore");
  const type = watch("type");

  const bufferBeforeSeconds =
    type !== "BLOCKED" && bufferTimeBefore && reservationUnit.bufferTimeBefore
      ? reservationUnit.bufferTimeBefore
      : 0;
  const bufferAfterSeconds =
    type !== "BLOCKED" && bufferTimeAfter && reservationUnit.bufferTimeAfter
      ? reservationUnit.bufferTimeAfter
      : 0;

  const start = parseDateTimeSafe(formDate, formStartTime);
  const end = parseDateTimeSafe(formDate, formEndTime);
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
  reservationUnit: ReservationUnitType;
}) {
  const { t } = useTranslation();
  const { hasCollisions } = useCheckFormCollisions({ form, reservationUnit });

  if (!hasCollisions) {
    return null;
  }
  return (
    <StyledNotification
      size="small"
      label={t("errors.descriptive.collision")}
      type="error"
    >
      {t("errors.descriptive.collision")}
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
  reservationUnit: ReservationUnitType;
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
        size="small"
        variant="secondary"
        onClick={onCancel}
        theme="black"
        data-testid="CreateReservationModal__cancel-reservation"
      >
        {t("common.cancel")}
      </Button>
      <Button
        type="button"
        size="small"
        disabled={isDisabled}
        onClick={() => {
          handleSubmit(onSubmit)();
        }}
        data-testid="CreateReservationModal__accept-reservation"
      >
        {t("ReservationDialog.accept")}
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
  reservationUnit: ReservationUnitType;
  start: Date;
}) {
  const { t, i18n } = useTranslation();
  const interval = getNormalizedInterval(
    reservationUnit.reservationStartInterval
  );
  const form = useForm<FormValueType>({
    resolver: zodResolver(ReservationFormSchema(interval)),
    // TODO onBlur or onChange? onChange is anoying because it highlights even untouched fields
    // onBlur on the other hand does no validation on the focused field till it's blurred

    // I want show errors for touched fields onBlur + clear errors onChange
    // I guess I just have to write logic for it using isTouched + onChange

    mode: "onChange",
    defaultValues: {
      date: format(start, "dd.MM.yyyy"),
      startTime: format(start, "HH:mm"),
      bufferTimeBefore: false,
      bufferTimeAfter: false,
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
  const date = watch("date");
  useEffect(() => {
    // Is touched is always false with controller
    if (getFieldState("date").isDirty) {
      trigger();
    }
  }, [date, trigger, getFieldState]);

  // force revalidation of end time on start time change
  const startTime = watch("startTime");
  useEffect(() => {
    // Is touched is always false with controller
    if (getFieldState("endTime").isDirty) {
      trigger("endTime");
    }
  }, [startTime, trigger, getFieldState]);

  const [create] = useCreateStaffReservationMutation();

  const createStaffReservation = (input: ReservationStaffCreateMutationInput) =>
    create({ variables: { input } });

  const errorHandler = (errorMsg?: string) => {
    const translatedError = i18n.exists(`errors.descriptive.${errorMsg}`)
      ? t(`errors.descriptive.${errorMsg}`)
      : t("errors.descriptive.genericError");
    errorToast({
      text: t("ReservationDialog.saveFailed", {
        error: translatedError,
      }),
    });
  };

  const onSubmit = async (values: FormValueType) => {
    try {
      if (!reservationUnit.pk) {
        throw new Error("Missing reservation unit");
      }

      const fields = filterNonNullable(
        reservationUnit.metadataSet?.supportedFields
      );

      const flatMetaValues = flattenMetadata(values, fields);

      if (values.type == null) {
        throw new Error("Invalid reservation type");
      }
      const bufferBefore =
        values.type !== ReservationTypeChoice.Blocked && values.bufferTimeBefore
          ? (reservationUnit.bufferTimeBefore ?? 0)
          : 0;
      const bufferAfter =
        values.type !== ReservationTypeChoice.Blocked && values.bufferTimeAfter
          ? (reservationUnit.bufferTimeAfter ?? 0)
          : 0;
      const input: ReservationStaffCreateMutationInput = {
        reservationUnitPks: [reservationUnit.pk],
        type: values.type,
        begin: dateTime(values.date, values.startTime),
        end: dateTime(values.date, values.endTime),
        bufferTimeBefore: bufferBefore.toString(),
        bufferTimeAfter: bufferAfter.toString(),
        workingMemo: values.comments,
        ...flatMetaValues,
        reserveeType: values.reserveeType,
      };

      await createStaffReservation(input);

      successToast({
        text: t("ReservationDialog.saveSuccess", {
          reservationUnit: reservationUnit.nameFi,
        }),
      });
      onClose();
    } catch (e) {
      errorHandler(get(e, "message"));
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
    return <Loader />;
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
