import React from "react";
import { useForm, FormProvider } from "react-hook-form";
import { Button, Dialog } from "hds-react";
import { useTranslation } from "react-i18next";
import { useMutation } from "@apollo/client";
import type {
  ReservationStaffCreateMutationInput,
  ReservationStaffCreateMutationPayload,
  ReservationUnitType,
} from "common/types/gql-types";
import styled from "styled-components";
import { camelCase, get } from "lodash";
import { format } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import { ErrorBoundary } from "react-error-boundary";
import {
  ReservationFormSchema,
  type ReservationFormType,
  type ReservationFormMeta,
} from "app/schemas";
import { dateTime } from "../../ReservationUnits/ReservationUnitEditor/DateTimeInput";
import { useModal } from "../../../context/ModalContext";
import { CREATE_STAFF_RESERVATION } from "./queries";
import Loader from "../../Loader";
import { useNotification } from "../../../context/NotificationContext";
import { flattenMetadata } from "./utils";
import { useReservationUnitQuery } from "../hooks";
import ReservationTypeForm from "../ReservationTypeForm";
import { Grid, Element } from "../MyUnitRecurringReservation/commonStyling";
import ControlledTimeInput from "../components/ControlledTimeInput";
import ControlledDateInput from "../components/ControlledDateInput";

// NOTE HDS forces buttons over each other on mobile, we want them side-by-side
const ActionButtons = styled(Dialog.ActionButtons)`
  display: flex;
  justify-content: end;
  align-items: center;
  gap: 1rem;
  > button {
    margin: 0;
  }
`;

const GridInsideTheModal = styled(Grid)`
  margin-top: var(--spacing-m);
  margin-bottom: var(--spacing-m);
`;

const FixedDialog = styled(Dialog)`
  /* Hack to deal with modal trying to fit content. So an error message -> layout shift */
  width: min(calc(100vw - 2rem), var(--container-width-l)) !important;
  & > div:nth-child(2) {
    /* don't layout shift when the modal content changes */
    height: min(95vh, 1024px);
  }
`;

type FormValueType = ReservationFormType & ReservationFormMeta;

const DialogContent = ({
  onClose,
  reservationUnit,
  start,
}: {
  onClose: () => void;
  reservationUnit: ReservationUnitType;
  start: Date;
}) => {
  const { t, i18n } = useTranslation();
  const form = useForm<FormValueType>({
    resolver: zodResolver(
      ReservationFormSchema(reservationUnit.reservationStartInterval)
    ),
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
    formState: { errors },
  } = form;

  const { notifyError, notifySuccess } = useNotification();

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

      const metadataSetFields =
        reservationUnit.metadataSet?.supportedFields
          ?.filter((x): x is string => x != null)
          .map(camelCase) ?? [];

      const flattenedMetadataSetValues = flattenMetadata(
        values,
        metadataSetFields
      );

      const input: ReservationStaffCreateMutationInput = {
        reservationUnitPks: [reservationUnit.pk],
        type: values.type ?? "",
        begin: dateTime(values.date, values.startTime),
        end: dateTime(values.date, values.endTime),
        bufferTimeBefore:
          values.bufferTimeBefore && reservationUnit.bufferTimeBefore
            ? String(reservationUnit.bufferTimeBefore)
            : undefined,
        bufferTimeAfter:
          values.bufferTimeAfter && reservationUnit.bufferTimeAfter
            ? String(reservationUnit.bufferTimeAfter)
            : undefined,
        workingMemo: values.comments,
        ...flattenedMetadataSetValues,
        reserveeType: values.reserveeType,
      };

      const { data: createResponse } = await createStaffReservation(input);

      const firstError = (
        createResponse?.createStaffReservation?.errors || []
      ).find(() => true);

      if (firstError) {
        const error = get(firstError, "messages[0]");
        errorHandler(error);
      } else {
        notifySuccess(
          t("ReservationDialog.saveSuccess", {
            reservationUnit: reservationUnit.nameFi,
          })
        );
        onClose();
      }
    } catch (e) {
      errorHandler(get(e, "message"));
    }
  };

  const translateError = (errorMsg?: string) =>
    errorMsg ? t(`reservationForm:errors.${errorMsg}`) : "";

  // TODO refactor the form part of this outside the dialog
  return (
    <>
      <Dialog.Content>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <GridInsideTheModal>
              <Element>
                <ControlledDateInput
                  name="date"
                  control={form.control}
                  error={translateError(errors.date?.message)}
                  required
                />
              </Element>
              <Element>
                <ControlledTimeInput
                  name="startTime"
                  control={form.control}
                  error={translateError(errors.startTime?.message)}
                  required
                />
              </Element>
              <Element>
                <ControlledTimeInput
                  name="endTime"
                  control={form.control}
                  error={translateError(errors.endTime?.message)}
                  required
                />
              </Element>
              <ReservationTypeForm reservationUnit={reservationUnit} />
            </GridInsideTheModal>
          </form>
        </FormProvider>
      </Dialog.Content>
      <ActionButtons>
        <Button variant="secondary" onClick={onClose} theme="black">
          {t("common.cancel")}
        </Button>
        <Button
          type="submit"
          onClick={() => {
            form.handleSubmit(onSubmit)();
          }}
        >
          {t("ReservationDialog.accept")}
        </Button>
      </ActionButtons>
    </>
  );
};

const CreateReservationModal = ({
  reservationUnitId,
  start,
  onClose,
}: {
  reservationUnitId: number;
  start: Date;
  onClose: () => void;
}): JSX.Element => {
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
        <ErrorBoundary fallback={<div>{t("errors.uncaught")}</div>}>
          <DialogContent
            onClose={onClose}
            reservationUnit={reservationUnit}
            start={start}
          />
        </ErrorBoundary>
      )}
    </FixedDialog>
  );
};
export default CreateReservationModal;
