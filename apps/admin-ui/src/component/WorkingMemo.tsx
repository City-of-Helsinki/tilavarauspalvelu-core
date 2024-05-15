import React, { useState } from "react";
import { Button, TextArea } from "hds-react";
import styled from "styled-components";
import { FetchResult, useMutation } from "@apollo/client";
import {
  type ApplicationUpdateMutationInput,
  type Mutation,
  type ReservationWorkingMemoMutationInput,
} from "@gql/gql-types";
import { useTranslation } from "next-i18next";
import { useNotification } from "@/context/NotificationContext";
import {
  UPDATE_RESERVATION_WORKING_MEMO,
  UPDATE_APPLICATION_WORKING_MEMO,
} from "./queries";

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
  onMutate: (memo: string) => Promise<FetchResult<Mutation>>;
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
      if (
        data?.updateReservationWorkingMemo == null &&
        data?.updateApplication == null
      ) {
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
  const [updateWorkingMemo] = useMutation<
    Mutation,
    ReservationWorkingMemoMutationInput
  >(UPDATE_RESERVATION_WORKING_MEMO);

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
  const [updateWorkingMemo] = useMutation<
    Mutation,
    ApplicationUpdateMutationInput
  >(UPDATE_APPLICATION_WORKING_MEMO);

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
