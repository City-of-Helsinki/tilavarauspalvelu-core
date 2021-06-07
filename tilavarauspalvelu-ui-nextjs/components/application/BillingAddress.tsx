import React from "react";
import { useTranslation } from "react-i18next";
import { TextInput } from "hds-react";
import { useForm } from "react-hook-form";
import { errorText } from "../../modules/util";

type Props = {
  register: ReturnType<typeof useForm>["register"];
  errors: ReturnType<typeof useForm>["errors"];
};

const BillingAddress = ({ register, errors }: Props): JSX.Element | null => {
  const { t } = useTranslation();
  return (
    <>
      <TextInput
        ref={register({ required: true })}
        label={t("Application.Page3.billingAddress.streetAddress")}
        id="billingAddress.streetAddress"
        name="billingAddress.streetAddress"
        required
        invalid={!!errors.billingAddress?.streetAddress?.type}
        errorText={errorText(t, errors.billingAddress?.streetAddress?.type)}
      />
      <TextInput
        ref={register({ required: true })}
        label={t("Application.Page3.billingAddress.postCode")}
        id="billingAddress.postCode"
        name="billingAddress.postCode"
        required
        invalid={!!errors.billingAddress?.postCode?.type}
        errorText={errorText(t, errors.billingAddress?.postCode?.type)}
      />
      <TextInput
        ref={register({ required: true })}
        label={t("Application.Page3.billingAddress.city")}
        id="billingAddress.city"
        name="billingAddress.city"
        required
        invalid={!!errors.billingAddress?.city?.type}
        errorText={errorText(t, errors.billingAddress?.city?.type)}
      />
    </>
  );
};

export default BillingAddress;
