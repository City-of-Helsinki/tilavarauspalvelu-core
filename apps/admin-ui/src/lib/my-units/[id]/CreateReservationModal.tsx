import React, { type RefObject, useEffect } from "react";
import { gql } from "@apollo/client";
import { useForm, FormProvider, UseFormReturn } from "react-hook-form";
import {
  Button,
  ButtonSize,
  ButtonVariant,
  Dialog,
  IconSearch,
  LoadingSpinner,
  Notification,
  NotificationSize,
} from "hds-react";
import { useTranslation } from "next-i18next";
import {
  type CreateStaffReservationFragment,
  type ReservationStaffCreateMutationInput,
  useCreateStaffReservationMutation,
  useReservationUnitQuery,
} from "@gql/gql-types";
import styled from "styled-components";
import { zodResolver } from "@hookform/resolvers/zod";
import { ErrorBoundary } from "react-error-boundary";
import { ReservationFormSchema, type ReservationFormType, type ReservationFormMeta } from "@/schemas";
import { CenterSpinner, Flex } from "common/src/styled";
import { breakpoints } from "common/src/modules/const";
import { useCheckCollisions } from "@/hooks";
import { getBufferTime, getNormalizedInterval } from "@/modules/helpers";
import { fromUIDateTimeUnsafe, formatDate, formatTime, fromUIDateTime } from "common/src/modules/date-utils";
import { useModal } from "@/context/ModalContext";
import { ControlledTimeInput } from "@/components/ControlledTimeInput";
import { ControlledDateInput } from "common/src/components/form";
import ReservationTypeForm from "@/components/ReservationTypeForm";
import { createNodeId, toNumber } from "common/src/modules/helpers";
import { successToast } from "common/src/components/toast";
import { useDisplayError } from "common/src/hooks";
import { SelectFilter } from "@/components/QueryParamFilters";
import { FixedDialog } from "@/styled/FixedDialog";
import { useSearchParams } from "next/navigation";

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

const MandatoryFieldsText = styled.div`
  margin-top: calc(var(--spacing-xs) * -1);
  grid-column: 1 / -1;
  font-size: var(--fontsize-body-s);
`;

type FormValueType = ReservationFormType & ReservationFormMeta;

const Form = styled.form`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
  gap: var(--spacing-l);

  height: 100%;
  margin-top: var(--spacing-m);
  margin-bottom: var(--spacing-m);
`;

const StyledNotification = styled(Notification)`
  margin-right: auto;
  width: auto;
`;

type CreateReservationModalProps = {
  reservationUnitOptions: { label: string; value: number }[];
  onClose: () => void;
  start?: Date;
  focusAfterCloseRef: RefObject<HTMLElement>;
};

export function CreateReservationModal({
  reservationUnitOptions,
  start,
  onClose,
  focusAfterCloseRef,
}: CreateReservationModalProps): JSX.Element {
  const { t } = useTranslation();
  const { isOpen } = useModal();
  const params = useSearchParams();
  const reservationUnitPk = toNumber(params.get("reservationUnit")) ?? reservationUnitOptions[0]?.value;

  const { data, loading } = useReservationUnitQuery({
    variables: { id: createNodeId("ReservationUnitNode", reservationUnitPk ?? 0) },
    skip: !reservationUnitPk,
  });

  const { reservationUnit } = data ?? {};

  const interval = getNormalizedInterval(reservationUnit?.reservationStartInterval);
  const startDate = start ?? new Date();
  const form = useForm<FormValueType>({
    // @ts-expect-error -- schema refinement breaks typing
    resolver: zodResolver(ReservationFormSchema(interval)),
    // TODO onBlur or onChange? onChange is anoying because it highlights even untouched fields
    // onBlur on the other hand does no validation on the focused field till it's blurred

    // I want show errors for touched fields onBlur + clear errors onChange
    // I guess I just have to write logic for it using isTouched + onChange

    mode: "onChange",
    defaultValues: {
      date: formatDate(startDate, {}),
      startTime: formatTime(startDate),
      enableBufferTimeBefore: false,
      enableBufferTimeAfter: false,
    },
  });
  const [create] = useCreateStaffReservationMutation();
  const createStaffReservation = (input: ReservationStaffCreateMutationInput) => create({ variables: { input } });
  const displayError = useDisplayError();
  const onSubmit = async (values: FormValueType) => {
    try {
      if (!reservationUnit?.pk) {
        throw new Error("Missing reservation unit");
      }

      await createStaffReservation(transformCreateReservationMutation(values, reservationUnit));

      successToast({
        text: t("myUnits:ReservationDialog.saveSuccess", {
          reservationUnit: reservationUnit.nameFi,
        }),
      });
      onClose();
    } catch (err) {
      displayError(err);
    }
  };

  if (loading) {
    return <CenterSpinner />;
  }

  return (
    <FixedDialog
      id="info-dialog"
      variant="primary"
      aria-labelledby="modal-header"
      close={onClose}
      closeButtonLabelText={t("common:close")}
      focusAfterCloseRef={focusAfterCloseRef}
      isOpen={isOpen}
      $maxWidth="l"
      scrollable
    >
      <Dialog.Header id="modal-header" title={t("myUnits:ReservationDialog.title")} />
      <Dialog.Content style={{ paddingTop: "var(--spacing-m)" }}>
        <SelectFilter name="reservationUnit" sort options={reservationUnitOptions} />
        {reservationUnit != null && (
          <ErrorBoundary fallback={<div>{t("errors:unexpectedError")}</div>}>
            <Flex>
              <DialogContent reservationUnit={reservationUnit} startDate={startDate} form={form} onSubmit={onSubmit} />
              <ActionContainer form={form} reservationUnit={reservationUnit} onCancel={onClose} onSubmit={onSubmit} />
            </Flex>
          </ErrorBoundary>
        )}
      </Dialog.Content>
    </FixedDialog>
  );
}

function transformCreateReservationMutation(
  values: FormValueType,
  reservationUnit: Pick<CreateStaffReservationFragment, "bufferTimeBefore" | "bufferTimeAfter" | "pk">
): ReservationStaffCreateMutationInput {
  if (!reservationUnit?.pk) {
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
    reserveeIsUnregisteredAssociation,
    ...rest
  } = values;

  const bufferBefore = getBufferTime(reservationUnit.bufferTimeBefore, type, enableBufferTimeBefore);
  const bufferAfter = getBufferTime(reservationUnit.bufferTimeAfter, type, enableBufferTimeAfter);
  return {
    // TODO don't use spread it allows passing unknown attributes to the object (even with Exact)
    ...rest,
    reservationUnit: reservationUnit.pk,
    type,
    beginsAt: fromUIDateTimeUnsafe(date, startTime).toISOString(),
    endsAt: fromUIDateTimeUnsafe(date, endTime).toISOString(),
    bufferTimeBefore: bufferBefore,
    bufferTimeAfter: bufferAfter,
    workingMemo: comments,
  } satisfies ReservationStaffCreateMutationInput;
}

function DialogContent({
  reservationUnit,
  startDate,
  form,
  onSubmit,
}: {
  reservationUnit: CreateStaffReservationFragment;
  startDate: Date;
  form: UseFormReturn<FormValueType>;
  onSubmit: (values: FormValueType) => void;
}) {
  const { t } = useTranslation();

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
    if (startDate < new Date()) {
      trigger();
    }
  }, [startDate, trigger]);

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

  const translateError = (errorMsg?: string) => (errorMsg ? t(`reservationForm:errors.${errorMsg}`) : "");

  return (
    <FormProvider {...form}>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <MandatoryFieldsText>{t("forms:mandatoryFieldsText")}</MandatoryFieldsText>
        <ControlledDateInput name="date" control={control} error={translateError(errors.date?.message)} required />
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
  );
}

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

  const bufferBeforeSeconds = getBufferTime(reservationUnit.bufferTimeBefore, type, enableBufferTimeBefore);
  const bufferAfterSeconds = getBufferTime(reservationUnit.bufferTimeAfter, type, enableBufferTimeAfter);

  const start = formDate && formStartTime ? fromUIDateTime(formDate, formStartTime) : new Date();
  const end = formDate && formEndTime ? fromUIDateTime(formDate, formEndTime) : null;
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
      label={t("errors:timeCollision")}
      type="error"
      data-testid="CreateReservationModal__collision-warning"
    >
      {t("errors:timeCollision")}
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
    formState: { isDirty, isSubmitting },
  } = form;

  const { hasCollisions } = useCheckFormCollisions({ form, reservationUnit });

  const isDisabled = !isDirty || isSubmitting || hasCollisions;

  return (
    <ActionButtons>
      <CollisionWarning form={form} reservationUnit={reservationUnit} />
      <Button
        type="button"
        size={ButtonSize.Small}
        iconStart={isSubmitting ? <LoadingSpinner small /> : <IconSearch />}
        disabled={isDisabled}
        onClick={() => {
          handleSubmit(onSubmit)();
        }}
        data-testid="CreateReservationModal__accept-reservation"
      >
        {t("myUnits:ReservationDialog.accept")}
      </Button>
      <Button
        size={ButtonSize.Small}
        variant={ButtonVariant.Secondary}
        onClick={onCancel}
        data-testid="CreateReservationModal__cancel-reservation"
      >
        {t("common:cancel")}
      </Button>
    </ActionButtons>
  );
}

// TODO this is reused for create ReservationSeries also (though we have a common fragment)
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
  mutation CreateStaffReservation($input: ReservationStaffCreateMutationInput!) {
    createStaffReservation(input: $input) {
      pk
    }
  }
`;
