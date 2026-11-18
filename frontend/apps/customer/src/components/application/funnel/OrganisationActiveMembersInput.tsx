import React from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "next-i18next/pages";
import { ControlledNumberInput } from "ui/src/components/form";
import type { ApplicationPage3FormValues } from "./form";

/** The number of active members of the applicant organisation. Only the sports form asks it. */
export function OrganisationActiveMembersInput(): React.ReactElement {
  const { t } = useTranslation();
  const {
    control,
    formState: { errors },
  } = useFormContext<ApplicationPage3FormValues>();

  const errorMessage = errors.organisationActiveMembers?.message;

  return (
    <ControlledNumberInput
      control={control}
      name="organisationActiveMembers"
      label={t("application:Page3.organisationActiveMembers")}
      helperText={t("application:Page3.organisationActiveMembersHelper")}
      min={1}
      integerOnly
      errorText={errorMessage != null ? t(`application:validation.${errorMessage}`) : undefined}
    />
  );
}
