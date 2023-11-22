import React, { useState } from "react";
import { Button, TextArea } from "hds-react";
import { FetchResult, useMutation } from "@apollo/client";
import {
  type ApplicationUpdateMutationInput,
  type Mutation,
  type ReservationWorkingMemoMutationInput,
} from "common/types/gql-types";
import { useTranslation } from "next-i18next";
import { useNotification } from "@/context/NotificationContext";
import { HorisontalFlex } from "@/styles/layout";
import {
  UPDATE_RESERVATION_WORKING_MEMO,
  UPDATE_APPLICATION_WORKING_MEMO,
} from "./queries";

// TODO split into two variations with different mutations
// one for application and other for reservation
function WorkingMemo({
  initialValue,
  onMutate,
}: {
  initialValue: string;
  onMutate: (memo: string) => Promise<FetchResult<Mutation>>;
}) {
  const [workingMemo, setWorkingMemo] = useState<string>(initialValue);
  const { notifyError } = useNotification();
  const { t } = useTranslation();

  const handleSave = async () => {
    try {
      await onMutate(workingMemo);
    } catch (ex) {
      notifyError(t("RequestedReservation.errorSavingWorkingMemo"));
    }
  };

  return (
    <>
      <TextArea
        label={t("RequestedReservation.workingMemoLabel")}
        id="workingMemo"
        helperText={t("RequestedReservation.workingMemoHelperText")}
        value={workingMemo}
        onChange={(e) => setWorkingMemo(e.target.value)}
      />
      <HorisontalFlex style={{ justifyContent: "flex-end" }}>
        <Button
          size="small"
          variant="secondary"
          theme="black"
          onClick={() => setWorkingMemo(initialValue || "")}
        >
          {t("common.cancel")}
        </Button>
        <Button size="small" onClick={handleSave}>
          {t("RequestedReservation.save")}
        </Button>
      </HorisontalFlex>
    </>
  );
}

export function ReservationWorkingMemo({
  reservationPk,
  refetch,
  initialValue,
}: {
  reservationPk: number;
  refetch: () => void;
  initialValue: string;
}) {
  const { t } = useTranslation();
  const { notifyError, notifySuccess } = useNotification();
  const [updateWorkingMemo] = useMutation<
    Mutation,
    ReservationWorkingMemoMutationInput
  >(UPDATE_RESERVATION_WORKING_MEMO, {
    onCompleted: () => {
      refetch();
      notifySuccess(t("RequestedReservation.savedWorkingMemo"));
    },
    onError: () => {
      notifyError(t("RequestedReservation.errorSavingWorkingMemo"));
    },
  });

  const updateMemo = (memo: string) =>
    updateWorkingMemo({
      variables: { pk: reservationPk, workingMemo: memo },
    });

  return <WorkingMemo onMutate={updateMemo} initialValue={initialValue} />;
}

export function ApplicationWorkingMemo({
  applicationPk,
  refetch,
  initialValue,
}: {
  applicationPk: number;
  refetch: () => void;
  initialValue: string;
}) {
  const { t } = useTranslation();
  const { notifyError, notifySuccess } = useNotification();
  const [updateWorkingMemo] = useMutation<
    Mutation,
    ApplicationUpdateMutationInput
  >(UPDATE_APPLICATION_WORKING_MEMO, {
    onCompleted: () => {
      refetch();
      notifySuccess(t("RequestedReservation.savedWorkingMemo"));
    },
    onError: () => {
      notifyError(t("RequestedReservation.errorSavingWorkingMemo"));
    },
  });

  const updateMemo = (memo: string) =>
    updateWorkingMemo({
      variables: { pk: applicationPk, workingMemo: memo },
    });

  return <WorkingMemo onMutate={updateMemo} initialValue={initialValue} />;
}
