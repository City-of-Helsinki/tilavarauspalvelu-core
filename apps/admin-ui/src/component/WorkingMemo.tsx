import React, { useState } from "react";
import { Button, TextArea } from "hds-react";
import styled from "styled-components";
import { type FetchResult } from "@apollo/client";
import {
  useUpdateApplicationWorkingMemoMutation,
  useUpdateReservationWorkingMemoMutation,
  type UpdateReservationWorkingMemoMutation,
  type UpdateApplicationWorkingMemoMutation,
} from "@gql/gql-types";
import { useTranslation } from "next-i18next";
import { useNotification } from "@/context/NotificationContext";

const ButtonContainer = styled.div`
  display: flex;
  gap: var(--spacing-m);
  justify-content: flex-end;
  margin-top: var(--spacing-m);
`;

function WorkingMemo({
  initialValue,
  onMutate,
  onSuccess,
}: {
  initialValue: string;
  onMutate: (
    memo: string
  ) => Promise<
    FetchResult<
      | UpdateReservationWorkingMemoMutation
      | UpdateApplicationWorkingMemoMutation
    >
  >;
  onSuccess: () => void;
}) {
  const [workingMemo, setWorkingMemo] = useState<string>(initialValue);
  const { notifyError, notifySuccess } = useNotification();
  const { t } = useTranslation();

  const handleSave = async () => {
    // TODO awful error handling code, real problem is the lack of error design
    // compounded with using two separate mutations here
    try {
      const res = await onMutate(workingMemo);
      if (res.errors != null) {
        throw new Error(res.errors[0].message);
      }
      const { data } = res;
      if (data == null) {
        throw new Error("No data returned");
      }
      const mutRes =
        "updateReservationWorkingMemo" in data
          ? data.updateReservationWorkingMemo
          : "updateApplication" in data
            ? data.updateApplication
            : null;
      if (mutRes?.pk == null) {
        throw new Error("No data returned");
      }
      notifySuccess(t("RequestedReservation.savedWorkingMemo"));
      onSuccess();
    } catch (ex) {
      if (ex instanceof Error) {
        const { message } = ex;
        if (message === "No permission to mutate.") {
          notifyError(t("errors.noPermission"));
          return;
        }
        if (message === "No data returned") {
          notifyError(t("errors.mutationNoDataReturned"));
          return;
        }
      }
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
      <ButtonContainer>
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
      </ButtonContainer>
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
  const [updateWorkingMemo] = useUpdateReservationWorkingMemoMutation();

  const updateMemo = (memo: string) =>
    updateWorkingMemo({
      variables: { pk: reservationPk, workingMemo: memo },
    });

  return (
    <WorkingMemo
      onMutate={updateMemo}
      initialValue={initialValue}
      onSuccess={refetch}
    />
  );
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
  const [updateWorkingMemo] = useUpdateApplicationWorkingMemoMutation();

  const updateMemo = (memo: string) =>
    updateWorkingMemo({
      variables: { pk: applicationPk, workingMemo: memo },
    });

  return (
    <WorkingMemo
      onMutate={updateMemo}
      initialValue={initialValue}
      onSuccess={refetch}
    />
  );
}
