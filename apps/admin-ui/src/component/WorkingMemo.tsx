import React, { useState } from "react";
import { Button, ButtonSize, ButtonVariant, TextArea } from "hds-react";
import { gql, type FetchResult } from "@apollo/client";
import {
  useUpdateApplicationWorkingMemoMutation,
  useUpdateReservationWorkingMemoMutation,
  type UpdateReservationWorkingMemoMutation,
  type UpdateApplicationWorkingMemoMutation,
} from "@gql/gql-types";
import { useTranslation } from "next-i18next";
import { successToast } from "common/src/components/toast";
import { ButtonContainer } from "common/styled";
import { useDisplayError } from "common/src/hooks";

function WorkingMemo({
  initialValue,
  onMutate,
  onSuccess,
}: {
  initialValue: string;
  onMutate: (
    memo: string
  ) => Promise<FetchResult<UpdateReservationWorkingMemoMutation | UpdateApplicationWorkingMemoMutation>>;
  onSuccess: () => void;
}) {
  const [workingMemo, setWorkingMemo] = useState<string>(initialValue);
  const { t } = useTranslation();
  const displayError = useDisplayError();

  const handleSave = async () => {
    try {
      const res = await onMutate(workingMemo);
      if (res.errors != null) {
        throw new Error(res.errors[0]?.message);
      }
      const { data } = res;
      if (data == null) {
        throw new Error("No data returned");
      }
      const mutRes =
        "updateReservationWorkingMemo" in data
          ? data.updateReservationWorkingMemo
          : "updateApplicationWorkingMemo" in data
            ? data.updateApplicationWorkingMemo
            : null;
      if (mutRes?.pk == null) {
        throw new Error("No data returned");
      }
      successToast({
        text: t("reservation:savedWorkingMemo"),
      });
      onSuccess();
    } catch (err) {
      displayError(err);
    }
  };

  const isButtonsDisabled = workingMemo === initialValue;

  return (
    <>
      <TextArea
        label={t("reservation:workingMemoLabel")}
        id="workingMemo"
        helperText={t("reservation:workingMemoHelperText")}
        value={workingMemo}
        onChange={(e) => setWorkingMemo(e.target.value)}
      />
      <ButtonContainer>
        <Button
          size={ButtonSize.Small}
          variant={ButtonVariant.Secondary}
          onClick={() => setWorkingMemo(initialValue || "")}
          disabled={isButtonsDisabled}
        >
          {t("common:cancel")}
        </Button>
        <Button size={ButtonSize.Small} onClick={handleSave} disabled={isButtonsDisabled}>
          {t("reservation:save")}
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

  return <WorkingMemo onMutate={updateMemo} initialValue={initialValue} onSuccess={refetch} />;
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

  return <WorkingMemo onMutate={updateMemo} initialValue={initialValue} onSuccess={refetch} />;
}

export const UPDATE_RESERVATION_WORKING_MEMO = gql`
  mutation UpdateReservationWorkingMemo($pk: Int!, $workingMemo: String!) {
    updateReservationWorkingMemo(input: { pk: $pk, workingMemo: $workingMemo }) {
      pk
      workingMemo
    }
  }
`;

export const UPDATE_APPLICATION_WORKING_MEMO = gql`
  mutation UpdateApplicationWorkingMemo($pk: Int!, $workingMemo: String!) {
    updateApplicationWorkingMemo(input: { pk: $pk, workingMemo: $workingMemo }) {
      pk
      workingMemo
    }
  }
`;
