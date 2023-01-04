import React from "react";
import { Checkbox, SelectionGroup, TextArea } from "hds-react";
import { Controller, UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { ReservationUnitType } from "common/types/gql-types";
import { ReservationFormType } from "./types";
import { HR } from "../../lists/components";
import MetadataSetForm from "./MetadataSetForm";

type Props = {
  form: UseFormReturn<ReservationFormType>;
  reservationUnit: ReservationUnitType;
};

const StaffReservation = ({ form, reservationUnit }: Props): JSX.Element => {
  const { t } = useTranslation();

  const bufferControllers = [] as JSX.Element[];

  const bufferController = (
    name: "bufferTimeBefore" | "bufferTimeAfter",
    seconds: number
  ) => (
    <Controller
      name={name}
      control={form.control}
      render={({ field }) => (
        <Checkbox
          id={name}
          checked={String(field.value) === "true"}
          label={t(`ReservationDialog.${name}`, {
            minutes: seconds / 60,
          })}
          {...field}
          value={String(field.value)}
          onChange={() => {
            form.setValue(name, !field.value);
          }}
        />
      )}
    />
  );

  if (reservationUnit.bufferTimeBefore) {
    bufferControllers.push(
      bufferController("bufferTimeBefore", reservationUnit.bufferTimeBefore)
    );
  }

  if (reservationUnit.bufferTimeAfter) {
    bufferControllers.push(
      bufferController("bufferTimeAfter", reservationUnit.bufferTimeAfter)
    );
  }

  return (
    <>
      {bufferControllers.length > 0 ? (
        <SelectionGroup label={t("ReservationDialog.buffers")}>
          {bufferControllers}
        </SelectionGroup>
      ) : null}
      <TextArea
        label={t("ReservationDialog.comment")}
        id="ReservationDialog.comment"
        {...form.register("workingMemo")}
      />
      <HR />
      <MetadataSetForm reservationUnit={reservationUnit} form={form} />
    </>
  );
};

StaffReservation.displayName = "StaffResedrvation";
export default StaffReservation;
