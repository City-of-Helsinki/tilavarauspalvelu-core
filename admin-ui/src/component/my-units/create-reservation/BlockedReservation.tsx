import React from "react";
import { TextArea } from "hds-react";
import { UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { ReservationFormType } from "./types";

const BlockedReservation = ({
  form,
}: {
  form: UseFormReturn<ReservationFormType>;
}): JSX.Element => {
  const { t } = useTranslation();
  return (
    <TextArea
      label={t("ReservationDialog.comment")}
      id="ReservationDialog.comment"
      {...form.register("workingMemo")}
      errorText={form.formState.errors.workingMemo?.message}
    />
  );
};

export default BlockedReservation;
