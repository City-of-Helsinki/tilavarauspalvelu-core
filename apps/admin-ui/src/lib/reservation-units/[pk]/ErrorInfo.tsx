import { UseFormReturn } from "react-hook-form";
import type { ReservationUnitEditFormValues } from "./form";
import { useTranslation } from "next-i18next";
import { getTranslatedError } from "@/modules/util";
import { Notification } from "hds-react";
import React from "react";

export function ErrorInfo({ form }: { form: UseFormReturn<ReservationUnitEditFormValues> }): JSX.Element | null {
  const { t } = useTranslation();

  const {
    formState: { errors },
  } = form;
  const hasErrors = Object.keys(errors).length > 0;
  const { pricings, accessTypes, ...otherErrors } = errors;

  if (!hasErrors) {
    return null;
  }

  // NOTE the type information for access type errors is too complex to handle (hence runtime checks)
  const nonNullAccessTypes = accessTypes != null && Array.isArray(accessTypes) ? accessTypes : [];
  const accessTypeErrors = nonNullAccessTypes.flatMap((pricing) =>
    Object.entries(pricing ?? {})
      .map(([key, value]) => {
        if (value != null && typeof value === "object" && "message" in value) {
          if (value?.message == null || typeof value.message !== "string") {
            return null;
          }
          const label = t(`reservationUnitEditor:label.${key}`);
          const errMsg = getTranslatedError(t, value.message);
          return `${label} : ${errMsg}`;
        }
        return null;
      })
      .filter((x): x is string => x != null)
  );
  // If there are no access types, then the error is directly in `accessTypes`
  if (accessTypes?.message) {
    const label = t(`reservationUnitEditor:label.accessTypes`);
    const errMsg = getTranslatedError(t, accessTypes.message);
    accessTypeErrors.push(`${label} : ${errMsg}`);
  }
  // If accessType is added, then removed, the error is under `accessTypes.root`
  if (accessTypes?.root?.message) {
    const label = t(`reservationUnitEditor:label.accessTypes`);
    const errMsg = getTranslatedError(t, accessTypes.root.message);
    accessTypeErrors.push(`${label} : ${errMsg}`);
  }

  // NOTE the type information for pricings errors is too complex to handle (hence runtime checks)
  const nonNullPricings = pricings != null && Array.isArray(pricings) ? pricings : [];
  const pricingErrors = nonNullPricings.flatMap((pricing) =>
    Object.entries(pricing ?? {})
      .map(([key, value]) => {
        if (value != null && typeof value === "object" && "message" in value) {
          if (value?.message == null || typeof value.message !== "string") {
            return null;
          }
          const label = t(`reservationUnitEditor:label.${key}`);
          const errMsg = getTranslatedError(t, value.message);
          return `${label} : ${errMsg}`;
        }
        return null;
      })
      .filter((x): x is string => x != null)
  );

  // TODO errors should be sorted based on the order of the form fields
  return (
    <Notification label={t("forms:ErrorSummary.label")} type="error">
      <ol>
        {Object.entries(otherErrors).map(([key, value]) => (
          <li key={key}>
            {t(`reservationUnitEditor:label.${key}`)}: {getTranslatedError(t, value?.message)}
          </li>
        ))}
        {pricingErrors.map((error) => (
          <li key={error}>{error}</li>
        ))}
        {accessTypeErrors.map((error) => (
          <li key={error}>{error}</li>
        ))}
      </ol>
    </Notification>
  );
}
