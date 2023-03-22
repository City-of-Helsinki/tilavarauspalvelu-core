import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { RadioButton, SelectionGroup, TextArea } from "hds-react";
import type { ReservationUnitType } from "common/types/gql-types";
import { useTranslation } from "react-i18next";
import styled from "styled-components";

import {
  ReservationFormType,
  ReservationType,
} from "./create-reservation/types";
import StaffReservation from "./StaffReservation";

// hasMargin is a hack to deal with inconsistencies in Single and Recurring reservation
const CommentsTextArea = styled(TextArea)<{ $hasMargin?: boolean }>`
  max-width: var(--prose-width);
  ${({ $hasMargin }) => $hasMargin && "margin: 1rem 0;"}
`;

// TODO are buffers in different places for Recurring and Single reservations? Check the UI spec
const ReservationTypeForm = ({
  reservationUnit,
  children,
}: {
  reservationUnit: ReservationUnitType;
  children?: React.ReactNode;
}) => {
  const { t } = useTranslation();

  const {
    watch,
    control,
    register,
    formState: { errors },
    // FIXME use a common interface for this and recurring here
    // requires moving the ReservationForm to zod schema
  } = useFormContext<ReservationFormType>();
  const type = watch("type");

  return (
    <>
      <Controller
        name="type"
        control={control}
        render={({ field }) => (
          <SelectionGroup
            required
            disabled={reservationUnit == null}
            label={t("ReservationDialog.type")}
            errorText={
              errors.type?.message != null
                ? t(`ReservationDialog.validation.${errors.type?.message}`)
                : ""
            }
          >
            {Object.values(ReservationType)
              .filter((v) => typeof v === "string")
              .map((v) => (
                <RadioButton
                  key={v}
                  id={v}
                  checked={v === field.value}
                  label={t(`ReservationDialog.reservationType.${v}`)}
                  onChange={() => field.onChange(v)}
                />
              ))}
          </SelectionGroup>
        )}
      />
      {type === ReservationType.BLOCKED && (
        <CommentsTextArea
          $hasMargin
          label={t("ReservationDialog.comment")}
          id="ReservationDialog.comment"
          {...register("comments")}
        />
      )}
      {type === ReservationType.STAFF || type === ReservationType.NORMAL ? (
        <StaffReservation reservationUnit={reservationUnit}>
          {children}
          <CommentsTextArea
            id="ReservationDialog.comment"
            label={t("ReservationDialog.comment")}
            {...register("comments")}
          />
        </StaffReservation>
      ) : null}
    </>
  );
};

export default ReservationTypeForm;
