import React from "react";
import { Checkbox } from "hds-react";
import { useTranslation } from "next-i18next";
import { useFormContext } from "react-hook-form";
import { ApplicantTypeChoice } from "@gql/gql-types";
import { ControlledSelect, ControlledCheckbox } from "common/src/components/form";
import { ApplicationFormTextInput, BillingAddress, ContactPersonSection } from ".";
import { type ApplicationPage3FormValues } from "./form";
import { FormSubHeading } from "./styled";
import { type OptionsT } from "@/modules/search";

type Props = {
  homeCityOptions: OptionsT["cities"];
};

export function OrganisationForm({ homeCityOptions }: Props): JSX.Element {
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

  return (
    <>
      <ApplicationFormTextInput name="organisation.name" />
      <ApplicationFormTextInput name="organisation.coreBusiness" />
      <ControlledSelect
        control={control}
        required
        name="homeCity"
        label={t("application:Page3.homeCity")}
        options={homeCityOptions}
        error={translateError(errors.homeCity?.message)}
      />
      <Checkbox
        label={t("application:Page3.organisation.notRegistered")}
        id="organisation.notRegistered"
        name="organisation.notRegistered"
        checked={!hasRegistration}
        onClick={toggleRegistration}
      />
      <ApplicationFormTextInput name="organisation.identifier" disabled={!hasRegistration} />
      <FormSubHeading>{t("application:Page3.sectionHeadings.postalAddress")}</FormSubHeading>
      <ApplicationFormTextInput name="organisation.address.streetAddress" />
      <ApplicationFormTextInput name="organisation.address.postCode" />
      <ApplicationFormTextInput name="organisation.address.city" />
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
