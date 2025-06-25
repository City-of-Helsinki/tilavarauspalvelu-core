import React from "react";
import { Checkbox } from "hds-react";
import { useTranslation } from "next-i18next";
import { useFormContext } from "react-hook-form";
import { ApplicantTypeChoice, MunicipalityChoice } from "@gql/gql-types";
import { ControlledSelect, ControlledCheckbox } from "common/src/components/form";
import { ApplicationFormTextInput, BillingAddress, ContactPersonSection } from ".";
import { type ApplicationPage3FormValues } from "./form";
import { FormSubHeading } from "./styled";

export function OrganisationForm(): JSX.Element {
  const { t } = useTranslation();

  const {
    control,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<ApplicationPage3FormValues>();

  const applicantType = watch("applicantType");
  const hasRegistration = applicantType === ApplicantTypeChoice.Association;
  const hasBillingAddress = watch("hasBillingAddress");

  const translateError = (errorMsg?: string) => (errorMsg ? t(`application:validation.${errorMsg}`) : "");

  const toggleRegistration = () => {
    if (!hasRegistration) {
      setValue("applicantType", ApplicantTypeChoice.Association);
    } else {
      setValue("applicantType", ApplicantTypeChoice.Community);
    }
  };

  const municipalityOptions = Object.values(MunicipalityChoice).map((value) => ({
    label: t(`Application.municipalities.${value.toUpperCase()}`),
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
      <Checkbox
        label={t("application:Page3.organisation.notRegistered")}
        id="organisation.notRegistered"
        name="organisation.notRegistered"
        checked={!hasRegistration}
        onClick={toggleRegistration}
      />
      <ApplicationFormTextInput name="organisationIdentifier" disabled={!hasRegistration} />
      <FormSubHeading>{t("application:Page3.sectionHeadings.postalAddress")}</FormSubHeading>
      <ApplicationFormTextInput name="organisationStreetAddress" />
      <ApplicationFormTextInput name="organisationPostCode" />
      <ApplicationFormTextInput name="organisationCity" />
      <ControlledCheckbox
        control={control}
        label={t("application:Page3.organisation.separateInvoicingAddress")}
        id="organisation.hasInvoicingAddress"
        name="hasBillingAddress"
      />
      {hasBillingAddress ? <BillingAddress /> : null}
      <ContactPersonSection />
    </>
  );
}
