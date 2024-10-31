import React from "react";
import { TextInput, Checkbox } from "hds-react";
import { useTranslation } from "next-i18next";
import { useFormContext } from "react-hook-form";
import { CheckboxWrapper } from "common/src/reservation-form/components";
import { TwoColumnContainer } from "common/src/reservation-form/styles";
import { applicationErrorText } from "@/modules/util";
import { FormSubHeading } from "../common/common";
import { EmailInput } from "./EmailInput";
import { BillingAddress } from "./BillingAddress";
import { ApplicationFormPage3Values } from "./Form";

const CompanyForm = (): JSX.Element => {
  const { t } = useTranslation();

  const {
    register,
    setValue,
    formState: { errors },
    watch,
  } = useFormContext<ApplicationFormPage3Values>();

  const hasBillingAddress = watch("hasBillingAddress");

  return (
    <TwoColumnContainer>
      <FormSubHeading>
        {t("application:Page3.subHeading.basicInfo")}
      </FormSubHeading>
      <TextInput
        {...register("organisation.name", {
          required: true,
          maxLength: 255,
        })}
        label={t("application:Page3.company.name")}
        id="organisation.name"
        name="organisation.name"
        required
        invalid={!!errors.organisation?.name?.type}
        errorText={applicationErrorText(t, errors.organisation?.name?.type, {
          count: 255,
        })}
      />
      <TextInput
        {...register("organisation.coreBusiness", {
          required: true,
          maxLength: 255,
        })}
        label={t("application:Page3.company.coreBusiness")}
        id="organisation.coreBusiness"
        required
        invalid={!!errors.organisation?.coreBusiness?.type}
        errorText={applicationErrorText(
          t,
          errors.organisation?.coreBusiness?.type,
          {
            count: 255,
          }
        )}
      />
      <TextInput
        id="organisation.identifier"
        {...register("organisation.identifier", {
          required: true,
          maxLength: 255,
        })}
        label={t("application:Page3.company.registrationNumber")}
        required
        invalid={!!errors.organisation?.identifier?.type}
        errorText={applicationErrorText(
          t,
          errors.organisation?.identifier?.type,
          {
            count: 255,
          }
        )}
      />
      <span />
      <FormSubHeading>
        {t("application:Page3.subHeading.postalAddress")}
      </FormSubHeading>
      <TextInput
        {...register("organisation.address.streetAddress", {
          required: true,
          maxLength: 80,
        })}
        label={t("application:Page3.organisation.streetAddress")}
        id="organisation.address.streetAddress"
        required
        invalid={!!errors.organisation?.address?.streetAddress?.type}
        errorText={applicationErrorText(
          t,
          errors.organisation?.address?.streetAddress?.type,
          {
            count: 80,
          }
        )}
      />
      <TextInput
        {...register("organisation.address.postCode", {
          required: true,
          maxLength: 32,
        })}
        label={t("application:Page3.organisation.postCode")}
        id="organisation.address.postCode"
        required
        invalid={!!errors.organisation?.address?.postCode?.type}
        errorText={applicationErrorText(
          t,
          errors.organisation?.address?.postCode?.type,
          { count: 32 }
        )}
      />
      <TextInput
        {...register("organisation.address.city", {
          required: true,
          maxLength: 80,
        })}
        label={t("application:Page3.organisation.city")}
        id="organisation.address.city"
        required
        invalid={!!errors.organisation?.address?.city?.type}
        errorText={applicationErrorText(
          t,
          errors.organisation?.address?.city?.type,
          {
            count: 80,
          }
        )}
      />
      <CheckboxWrapper>
        <Checkbox
          label={t("application:Page3.organisation.separateInvoicingAddress")}
          id="organisation.hasInvoicingAddress"
          name="organisation.hasInvoicingAddress"
          checked={hasBillingAddress}
          onClick={() => {
            if (!hasBillingAddress) {
              setValue("hasBillingAddress", true);
            } else {
              setValue("hasBillingAddress", false);
            }
          }}
        />
      </CheckboxWrapper>
      {hasBillingAddress ? <BillingAddress /> : null}
      <FormSubHeading>
        {t("application:Page3.subHeading.contactInfo")}
      </FormSubHeading>
      <TextInput
        {...register("contactPerson.firstName", {
          required: true,
          maxLength: 50,
        })}
        label={t("application:Page3.contactPerson.firstName")}
        id="contactPerson.firstName"
        required
        invalid={!!errors.contactPerson?.firstName?.type}
        errorText={applicationErrorText(
          t,
          errors.contactPerson?.firstName?.type,
          {
            count: 50,
          }
        )}
      />
      <TextInput
        {...register("contactPerson.lastName", {
          required: true,
          maxLength: 50,
        })}
        label={t("application:Page3.contactPerson.lastName")}
        id="contactPerson.lastName"
        required
        invalid={!!errors.contactPerson?.lastName?.type}
        errorText={applicationErrorText(
          t,
          errors.contactPerson?.lastName?.type,
          {
            count: 50,
          }
        )}
      />
      <TextInput
        {...register("contactPerson.phoneNumber", {
          required: true,
          maxLength: 50,
        })}
        label={t("application:Page3.contactPerson.phoneNumber")}
        id="contactPerson.phoneNumber"
        name="contactPerson.phoneNumber"
        required
        invalid={!!errors.contactPerson?.phoneNumber?.type}
        errorText={applicationErrorText(
          t,
          errors.contactPerson?.phoneNumber?.type,
          {
            count: 50,
          }
        )}
      />
      <EmailInput />
    </TwoColumnContainer>
  );
};

export { CompanyForm };
