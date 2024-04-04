import React, { useEffect } from "react";
import { useForm, FormProvider, UseFormReturn } from "react-hook-form";
import { Button, Dialog, Notification } from "hds-react";
import { useTranslation } from "react-i18next";
import { useMutation } from "@apollo/client";
import {
  type ReservationStaffCreateMutationInput,
  type ReservationStaffCreateMutationPayload,
  type ReservationUnitNode,
  ReservationStartInterval,
  ReservationTypeChoice,
} from "common/types/gql-types";
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
import { dateTime, parseDateTimeSafe } from "@/helpers";
import { useModal } from "@/context/ModalContext";
import { CREATE_STAFF_RESERVATION } from "./queries";
import { useNotification } from "@/context/NotificationContext";
import { flattenMetadata } from "./utils";
import { useReservationUnitQuery } from "../hooks";
import ReservationTypeForm from "../ReservationTypeForm";
import ControlledTimeInput from "../components/ControlledTimeInput";
import ControlledDateInput from "../components/ControlledDateInput";
import { filterNonNullable } from "common/src/helpers";

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

const useCheckFormCollisions = ({
  form,
  reservationUnit,
}: {
  form: UseFormReturn<FormValueType>;
  reservationUnit: ReservationUnitNode;
}) => {
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
    reservationType: (type ??
      ReservationTypeChoice.Blocked) as ReservationTypeChoice,
  });

  return { hasCollisions };
};

const CollisionWarning = ({
  form,
  reservationUnit,
}: {
  form: UseFormReturn<FormValueType>;
  reservationUnit: ReservationUnitNode;
}) => {
  const { t } = useTranslation();
  const { hasCollisions } = useCheckFormCollisions({ form, reservationUnit });

  return hasCollisions ? (
    <StyledNotification
      size="small"
      label={t("errors.descriptive.collision")}
      type="error"
    >
      {t("errors.descriptive.collision")}
    </StyledNotification>
  ) : null;
};

const ActionContainer = ({
  form,
  reservationUnit,
  onCancel,
  onSubmit,
}: {
  form: UseFormReturn<FormValueType>;
  reservationUnit: ReservationUnitNode;
  onCancel: () => void;
  onSubmit: (values: FormValueType) => void;
}) => {
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
      <Button size="small" variant="secondary" onClick={onCancel} theme="black">
        {t("common.cancel")}
      </Button>
      <Button
        type="button"
        size="small"
        disabled={isDisabled}
        onClick={() => {
          handleSubmit(onSubmit)();
        }}
      >
        {t("ReservationDialog.accept")}
      </Button>
    </ActionButtons>
  );
};

const DialogContent = ({
  onClose,
  reservationUnit,
  start,
}: {
  onClose: () => void;
  reservationUnit: ReservationUnitNode;
  start: Date;
}) => {
  const { t, i18n } = useTranslation();
  const interval =
    reservationUnit.reservationStartInterval ===
    ReservationStartInterval.Interval_15Mins
      ? ReservationStartInterval.Interval_15Mins
      : ReservationStartInterval.Interval_30Mins;
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

  const { notifyError, notifySuccess } = useNotification();

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

  const [create] = useMutation<
    { createStaffReservation: ReservationStaffCreateMutationPayload },
    { input: ReservationStaffCreateMutationInput }
  >(CREATE_STAFF_RESERVATION);

  const createStaffReservation = (input: ReservationStaffCreateMutationInput) =>
    create({ variables: { input } });

  const errorHandler = (errorMsg?: string) => {
    const translatedError = i18n.exists(`errors.descriptive.${errorMsg}`)
      ? t(`errors.descriptive.${errorMsg}`)
      : t("errors.descriptive.genericError");
    notifyError(t("ReservationDialog.saveFailed", { error: translatedError }));
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

      const bufferBefore =
        values.type !== "BLOCKED" && values.bufferTimeBefore
          ? reservationUnit.bufferTimeBefore ?? 0
          : 0;
      const bufferAfter =
        values.type !== "BLOCKED" && values.bufferTimeAfter
          ? reservationUnit.bufferTimeAfter ?? 0
          : 0;
      const input: ReservationStaffCreateMutationInput = {
        reservationUnitPks: [reservationUnit.pk],
        type: values.type ?? "",
        begin: dateTime(values.date, values.startTime),
        end: dateTime(values.date, values.endTime),
        bufferTimeBefore: bufferBefore.toString(),
        bufferTimeAfter: bufferAfter.toString(),
        workingMemo: values.comments,
        ...flatMetaValues,
        reserveeType: values.reserveeType,
      };

      await createStaffReservation(input);

      notifySuccess(
        t("ReservationDialog.saveSuccess", {
          reservationUnit: reservationUnit.nameFi,
        })
      );
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
};

function CreateReservationModal({
  reservationUnitId,
  start,
  onClose,
}: {
  reservationUnitId: number;
  start: Date;
  onClose: () => void;
}): JSX.Element {
  const { isOpen } = useModal();
  const { t } = useTranslation();

  const { reservationUnit, loading } =
    useReservationUnitQuery(reservationUnitId);

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

export default CreateReservationModal;
