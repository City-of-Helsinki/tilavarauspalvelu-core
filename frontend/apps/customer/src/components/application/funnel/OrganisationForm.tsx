import React from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "next-i18next/pages";
import { ControlledCheckbox, ControlledSelect } from "ui/src/components/form";
import { MunicipalityChoice } from "@gql/gql-types";
import { FormSubHeading, PostCodeCityRow } from "@/styled/application";
import { ApplicationFormTextInput } from "./ApplicationFormTextInput";
import { BillingAddress } from "./BillingAddress";
import { ContactPersonSection } from "./CompanyForm";
import type { ApplicationPage3FormValues } from "./form";
import { OrganisationActiveMembersInput } from "./OrganisationActiveMembersInput";

export function OrganisationForm({ isSportsForm }: Readonly<{ isSportsForm: boolean }>): React.ReactElement {
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
      {isSportsForm && <OrganisationActiveMembersInput />}
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
      <PostCodeCityRow>
        <ApplicationFormTextInput name="organisationPostCode" />
        <ApplicationFormTextInput name="organisationCity" />
      </PostCodeCityRow>
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
