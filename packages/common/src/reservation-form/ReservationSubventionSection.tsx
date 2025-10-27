import React from "react";
import styled from "styled-components";
import { UseFormReturn } from "react-hook-form";
import { ReservationFormValueT } from "../schemas";
import { useTranslation } from "next-i18next";
import {
  constructReservationFieldId,
  constructReservationFieldLabel,
  RESERVATION_FIELD_MAX_TEXT_LENGTH,
  translateReserveeFormError,
} from "./util";
import { StyledCheckboxWrapper, StyledTextArea } from "./styled";
import { ControlledCheckbox } from "../components/form";
import { Strongish } from "../styled";

const Subheading = styled(Strongish)`
  display: block;
  margin-bottom: var(--spacing-s);
`;

export function ReservationSubventionSection({
  termsForDiscount,
  form,
}: {
  termsForDiscount: JSX.Element | string;
  form: UseFormReturn<ReservationFormValueT>;
}): React.ReactElement {
  const { t } = useTranslation();
  const {
    control,
    register,
    watch,
    formState: { errors },
  } = form;

  const applyingLabel = constructReservationFieldLabel(t, "COMMON", "applyingForFreeOfCharge");
  const applyingErrorText = translateReserveeFormError(t, applyingLabel, errors["applyingForFreeOfCharge"]);
  const reasonLabel = constructReservationFieldLabel(t, "COMMON", "freeOfChargeReason");
  const reasonError = translateReserveeFormError(t, reasonLabel, errors["freeOfChargeReason"]);
  return (
    <>
      <StyledCheckboxWrapper key="applyingForFreeOfCharge" $isWide>
        <Subheading>{t("reservationApplication:label.subHeadings.subvention")}</Subheading>{" "}
        <ControlledCheckbox
          id={constructReservationFieldId("applyingForFreeOfCharge")}
          name="applyingForFreeOfCharge"
          control={control}
          label={applyingLabel}
          error={applyingErrorText}
        />
        {termsForDiscount && <div style={{ marginTop: "0.5rem" }}>{termsForDiscount}</div>}
      </StyledCheckboxWrapper>
      <StyledTextArea
        label={reasonLabel}
        id={constructReservationFieldId("freeOfChargeReason")}
        key="freeOfChargeReason"
        {...register("freeOfChargeReason")}
        errorText={reasonError}
        invalid={reasonError != null}
        required
        maxLength={RESERVATION_FIELD_MAX_TEXT_LENGTH}
        $hidden={!watch("applyingForFreeOfCharge")}
        $isWide
        $height="92px"
      />
    </>
  );
}
