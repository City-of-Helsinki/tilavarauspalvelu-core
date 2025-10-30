import React from "react";
import { useTranslation } from "next-i18next";
import { useFormContext } from "react-hook-form";
import { MunicipalityChoice } from "@gql/gql-types";
import { ControlledCheckbox, ControlledSelect } from "ui/src/components/form";
import { ApplicationFormTextInput, BillingAddress, ContactPersonSection } from ".";
import { type ApplicationPage3FormValues } from "./form";
import { FormSubHeading } from "./styled";

export function OrganisationForm(): JSX.Element {
  const { t } = useTranslation();
  const {
    control,
    formState: { errors },
    watch,
  } = useFormContext<ApplicationPage3FormValues>();

  const hasBillingAddress = watch("hasBillingAddress");
  const isRegisteredAssociation = watch("isRegisteredAssociation");

  const translateError = (errorMsg?: string) => (errorMsg ? t(`application:validation.${errorMsg}`) : "");

  const municipalityOptions = Object.values(MunicipalityChoice).map((value) => ({
    label: t(`common:municipalities.${value.toUpperCase()}`),
    value: value,
  }));

  return (
    <>
      <ApplicationFormTextInput name="organisationName" />
      <ApplicationFormTextInput name="organisationCoreBusiness" />
      <ControlledSelect
        control={control}
        required
        name="municipality"
        label={t("application:Page3.municipality")}
        options={municipalityOptions}
        error={translateError(errors.municipality?.message)}
      />
      <ControlledCheckbox
        control={control}
        label={t("application:Page3.organisationNotRegistered")}
        id="isRegisteredAssociation"
        name="isRegisteredAssociation"
        inverted
      />
      <ApplicationFormTextInput name="organisationIdentifier" disabled={!isRegisteredAssociation} />
      <FormSubHeading>{t("application:Page3.sectionHeadings.postalAddress")}</FormSubHeading>
      <ApplicationFormTextInput name="organisationStreetAddress" />
      <ApplicationFormTextInput name="organisationPostCode" />
      <ApplicationFormTextInput name="organisationCity" />
      <ControlledCheckbox
        control={control}
        label={t("application:Page3.organisationSeparateInvoicingAddress")}
        id="organisationHasInvoicingAddress"
        name="hasBillingAddress"
      />
      {hasBillingAddress ? <BillingAddress /> : null}
      <ContactPersonSection />
    </>
  );
}
