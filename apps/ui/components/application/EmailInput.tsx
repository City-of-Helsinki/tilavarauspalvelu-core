import React from "react";
import { useTranslation } from "next-i18next";
import { useFormContext } from "react-hook-form";
import { Notification, NotificationSize, TextInput } from "hds-react";
import { type ApplicationPage3FormValues } from "./form";
import { SpanFullRow } from "./styled";

export function EmailInput() {
  const { t } = useTranslation();

  const {
    register,
    formState: { errors },
  } = useFormContext<ApplicationPage3FormValues>();

  const translateError = (errorMsg?: string) =>
    errorMsg ? t(`application:validation.${errorMsg}`) : "";

  return (
    <>
      <SpanFullRow>
        <Notification
          size={NotificationSize.Small}
          label={t("application:Page3.emailNotification")}
        >
          {t("application:Page3.emailNotification")}
        </Notification>
      </SpanFullRow>
      <TextInput
        {...register("contactPerson.email")}
        label={t("application:Page3.email")}
        id="contactPerson.email"
        name="contactPerson.email"
        type="email"
        required
        invalid={!!errors.contactPerson?.email?.message}
        errorText={translateError(errors.contactPerson?.email?.message)}
      />
    </>
  );
}
