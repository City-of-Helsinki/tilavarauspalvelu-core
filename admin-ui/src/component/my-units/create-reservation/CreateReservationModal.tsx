import React from "react";
import { joiResolver } from "@hookform/resolvers/joi";
import { useForm, Controller, FormProvider } from "react-hook-form";
import { Button, DateInput, Dialog, TimeInput } from "hds-react";
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
import {
  valueForDateInput,
  dateTime,
} from "../../ReservationUnits/ReservationUnitEditor/DateTimeInput";
import { formatDate } from "../../../common/util";
import { VerticalFlex } from "../../../styles/layout";
import { useModal } from "../../../context/ModalContext";
import { CREATE_STAFF_RESERVATION } from "./queries";
import Loader from "../../Loader";
import { useNotification } from "../../../context/NotificationContext";
import { reservationSchema } from "./validator";
import { ReservationFormType } from "./types";
import { flattenMetadata } from "./utils";
import { useReservationUnitQuery } from "../hooks";
import ReservationTypeForm from "../ReservationTypeForm";

const ActionButtons = styled(Dialog.ActionButtons)`
  justify-content: end;
`;

const CommonFields = styled.div`
  display: grid;
  gap: 1em;
  grid-template-columns: 1fr 1fr 1fr;
`;

const DialogContent = ({
  onClose,
  reservationUnit,
  start,
}: {
  onClose: () => void;
  reservationUnit: ReservationUnitType;
  start: Date;
}) => {
  const { t } = useTranslation();
  const form = useForm<ReservationFormType>({
    resolver: joiResolver(
      reservationSchema(reservationUnit.reservationStartInterval)
    ),
    shouldFocusError: true,
    defaultValues: {
      date: valueForDateInput(start.toISOString()),
      startTime: formatDate(start.toISOString(), "HH:mm") as string,
      bufferTimeBefore: false,
      bufferTimeAfter: false,
    },
  });

  const {
    formState: { errors },
  } = form;

  const myDateTime = (date: Date, time: string) =>
    dateTime(format(date, "dd.MM.yyyy"), time);

  const { notifyError, notifySuccess } = useNotification();

  const [create] = useMutation<
    { createStaffReservation: ReservationStaffCreateMutationPayload },
    { input: ReservationStaffCreateMutationInput }
  >(CREATE_STAFF_RESERVATION);

  const createStaffReservation = (input: ReservationStaffCreateMutationInput) =>
    create({ variables: { input } });

  const onSubmit = async (values: ReservationFormType) => {
    try {
      const metadataSetFields =
        reservationUnit.metadataSet?.supportedFields
          ?.filter((x): x is string => x != null)
          .map(camelCase) ?? [];

      const flattenedMetadataSetValues = flattenMetadata(
        values,
        metadataSetFields
      );

      const input: ReservationStaffCreateMutationInput = {
        reservationUnitPks: [reservationUnit.pk as number],
        type: values.type ?? "",
        begin: myDateTime(new Date(values.date), values.startTime),
        end: myDateTime(new Date(values.date), values.endTime as string),
        bufferTimeBefore: values.bufferTimeBefore
          ? String(reservationUnit.bufferTimeBefore)
          : undefined,
        bufferTimeAfter: values.bufferTimeAfter
          ? String(reservationUnit.bufferTimeAfter)
          : undefined,
        workingMemo: values.comments,
        ...flattenedMetadataSetValues,
      };

      const { data: createResponse } = await createStaffReservation(input);

      const firstError = (
        createResponse?.createStaffReservation?.errors || []
      ).find(() => true);

      if (firstError) {
        notifyError(
          t("ReservationDialog.saveFailed", {
            error: get(firstError, "messages[0]"),
          })
        );
      } else {
        notifySuccess(
          t("ReservationDialog.saveSuccess", {
            reservationUnit: reservationUnit.nameFi,
          })
        );
        onClose();
      }
    } catch (e) {
      notifyError(
        t("ReservationDialog.saveFailed", { error: get(e, "message") })
      );
    }
  };

  return (
    <>
      <Dialog.Content>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <VerticalFlex style={{ marginTop: "var(--spacing-m)" }}>
              <CommonFields>
                <Controller
                  name="date"
                  control={form.control}
                  render={({ field }) => (
                    <DateInput
                      id="reservationDialog.date"
                      label={t("ReservationDialog.date")}
                      minDate={new Date()}
                      disableConfirmation
                      language="fi"
                      errorText={errors.date?.message}
                      {...field}
                    />
                  )}
                />
                <Controller
                  name="startTime"
                  control={form.control}
                  render={({ field }) => (
                    <TimeInput
                      id="ReservationDialog.startTime"
                      label={t("ReservationDialog.startTime")}
                      hoursLabel={t("common.hoursLabel")}
                      minutesLabel={t("common.minutesLabel")}
                      required
                      errorText={errors.startTime?.message}
                      {...field}
                    />
                  )}
                />
                <Controller
                  name="endTime"
                  control={form.control}
                  render={({ field }) => (
                    <TimeInput
                      id="ReservationDialog.endtime"
                      label={t("ReservationDialog.endTime")}
                      hoursLabel={t("common.hoursLabel")}
                      minutesLabel={t("common.minutesLabel")}
                      required
                      errorText={errors.endTime?.message}
                      {...field}
                    />
                  )}
                />
              </CommonFields>
              <ReservationTypeForm reservationUnit={reservationUnit} />
            </VerticalFlex>
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
    <Dialog
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
        <DialogContent
          onClose={onClose}
          reservationUnit={reservationUnit}
          start={start}
        />
      )}
    </Dialog>
  );
};
export default CreateReservationModal;
