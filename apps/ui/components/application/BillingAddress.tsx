import React from "react";
import { useTranslation } from "next-i18next";
import { TextInput } from "hds-react";
import { useFormContext } from "react-hook-form";
import { FormSubHeading } from "./styled";
import type { ApplicationFormPage3Values } from "./form";

export function BillingAddress() {
  const { t } = useTranslation();

  const {
    register,
    formState: { errors },
  } = useFormContext<ApplicationFormPage3Values>();

  const translateError = (errorMsg?: string) =>
    errorMsg ? t(`application:validation.${errorMsg}`) : "";

  return (
    <>
      <FormSubHeading as="h2">
        {t("application:Page3.subHeading.billingAddress")}
      </FormSubHeading>
      <TextInput
        {...register("billingAddress.streetAddress")}
        label={t("application:Page3.billingAddress.streetAddress")}
        id="billingAddress.streetAddress"
        required
        invalid={!!errors.billingAddress?.streetAddress?.message}
        errorText={translateError(
          errors.billingAddress?.streetAddress?.message
        )}
      />
      <TextInput
        {...register("billingAddress.postCode")}
        label={t("application:Page3.billingAddress.postCode")}
        id="billingAddress.postCode"
        required
        invalid={!!errors.billingAddress?.postCode?.message}
        errorText={translateError(errors.billingAddress?.postCode?.message)}
      />
      <TextInput
        {...register("billingAddress.city")}
        label={t("application:Page3.billingAddress.city")}
        id="billingAddress.city"
        required
        invalid={!!errors.billingAddress?.city?.message}
        errorText={translateError(errors.billingAddress?.city?.message)}
      />
    </>
  );
}
