import React from "react";
import { useTranslation } from "react-i18next";
import { TextInput } from "hds-react";
import { useForm } from "react-hook-form";
import { applicationErrorText } from "../../modules/util";
import { FormSubHeading } from "../common/common";

type Props = {
  register: ReturnType<typeof useForm>["register"];
  errors: ReturnType<typeof useForm>["errors"];
};

const BillingAddress = ({ register, errors }: Props): JSX.Element | null => {
  const { t } = useTranslation();

  return (
    <>
      <FormSubHeading as="h2">
        {t("application:Page3.subHeading.billingAddress")}
      </FormSubHeading>
      <TextInput
        ref={register({ required: true })}
        label={t("application:Page3.billingAddress.streetAddress")}
        id="billingAddress.streetAddress"
        name="billingAddress.streetAddress"
        required
        invalid={!!errors.billingAddress?.streetAddress?.type}
        errorText={applicationErrorText(
          t,
          errors.billingAddress?.streetAddress?.type
        )}
      />
      <TextInput
        ref={register({ required: true, maxLength: 32 })}
        label={t("application:Page3.billingAddress.postCode")}
        id="billingAddress.postCode"
        name="billingAddress.postCode"
        required
        invalid={!!errors.billingAddress?.postCode?.type}
        errorText={applicationErrorText(
          t,
          errors.billingAddress?.postCode?.type,
          { count: 32 }
        )}
      />
      <TextInput
        ref={register({ required: true })}
        label={t("application:Page3.billingAddress.city")}
        id="billingAddress.city"
        name="billingAddress.city"
        required
        invalid={!!errors.billingAddress?.city?.type}
        errorText={applicationErrorText(t, errors.billingAddress?.city?.type)}
      />
    </>
  );
};

export default BillingAddress;
