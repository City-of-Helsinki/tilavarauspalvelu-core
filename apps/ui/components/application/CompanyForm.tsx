import React, { useState } from "react";
import { TextInput, Checkbox } from "hds-react";
import { useTranslation } from "next-i18next";
import { useFormContext } from "react-hook-form";
import { CheckboxWrapper } from "common/src/reservation-form/components";
import { ApplicationNode } from "common/types/gql-types";
import { applicationErrorText } from "@/modules/util";
import { FormSubHeading, TwoColumnContainer } from "../common/common";
import { EmailInput } from "./EmailInput";
import { BillingAddress } from "./BillingAddress";
import Buttons from "./Buttons";
import { ApplicationFormValues } from "./Form";

type Props = {
  application: ApplicationNode;
};

// TODO hasBillingAddress can be removed by using the form field
/*
const prepareData = (
  application: ApplicationNode,
  data: FormValues,
  hasBillingAddress: boolean
): Application => {
  const applicationCopy = deepCopy(application);
  applicationCopy.applicantType = "company";

  applicationCopy.contactPerson = data.contactPerson;
  applicationCopy.organisation = data.organisation;

  if (hasBillingAddress) {
    applicationCopy.billingAddress = data.billingAddress;
  } else {
    applicationCopy.billingAddress = null;
  }

  applicationCopy.additionalInformation = undefined;

  return applicationCopy;
};
*/

const CompanyForm = ({ application }: Props): JSX.Element | null => {
  const { t } = useTranslation();

  const [hasBillingAddress, setHasBillingAddress] = useState(
    application.billingAddress !== null
  );

  const {
    register,
    formState: { errors },
  } = useFormContext<ApplicationFormValues>();

  /*
  const form = useForm<FormValues>({
    defaultValues: {
      organisation: application.organisation ?? {},
      contactPerson: application.contactPerson ?? {},
      billingAddress: application.billingAddress ?? {},
    },
  });
  */

  return (
    <>
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
            maxLength: 255,
          })}
          label={t("application:Page3.organisation.streetAddress")}
          id="organisation.address.streetAddress"
          required
          invalid={!!errors.organisation?.address?.streetAddress?.type}
          errorText={applicationErrorText(
            t,
            errors.organisation?.address?.streetAddress?.type,
            {
              count: 255,
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
            maxLength: 255,
          })}
          label={t("application:Page3.organisation.city")}
          id="organisation.address.city"
          required
          invalid={!!errors.organisation?.address?.city?.type}
          errorText={applicationErrorText(
            t,
            errors.organisation?.address?.city?.type,
            {
              count: 255,
            }
          )}
        />
        <CheckboxWrapper>
          <Checkbox
            label={t("application:Page3.organisation.separateInvoicingAddress")}
            id="organisation.hasInvoicingAddress"
            name="organisation.hasInvoicingAddress"
            checked={hasBillingAddress}
            onClick={() => setHasBillingAddress(!hasBillingAddress)}
          />
        </CheckboxWrapper>
        {hasBillingAddress ? <BillingAddress /> : null}
        <FormSubHeading>
          {t("application:Page3.subHeading.contactInfo")}
        </FormSubHeading>
        <TextInput
          {...register("contactPerson.firstName", {
            required: true,
            maxLength: 255,
          })}
          label={t("application:Page3.contactPerson.firstName")}
          id="contactPerson.firstName"
          required
          invalid={!!errors.contactPerson?.firstName?.type}
          errorText={applicationErrorText(
            t,
            errors.contactPerson?.firstName?.type,
            {
              count: 255,
            }
          )}
        />
        <TextInput
          {...register("contactPerson.lastName", {
            required: true,
            maxLength: 255,
          })}
          label={t("application:Page3.contactPerson.lastName")}
          id="contactPerson.lastName"
          required
          invalid={!!errors.contactPerson?.lastName?.type}
          errorText={applicationErrorText(
            t,
            errors.contactPerson?.lastName?.type,
            {
              count: 255,
            }
          )}
        />
        <TextInput
          {...register("contactPerson.phoneNumber", {
            required: true,
            maxLength: 255,
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
              count: 255,
            }
          )}
        />
        <EmailInput />
      </TwoColumnContainer>
      {application.pk != null && (
        <Buttons applicationId={application.pk ?? 0} />
      )}
    </>
  );
};

export { CompanyForm };
