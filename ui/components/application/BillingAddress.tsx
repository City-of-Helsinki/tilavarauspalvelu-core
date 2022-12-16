import React from "react";
import { useTranslation } from "react-i18next";
import { TextInput } from "hds-react";
import { UseFormReturn } from "react-hook-form";
import { applicationErrorText } from "../../modules/util";
import { FormSubHeading } from "../common/common";
import ApplicationForm from "./ApplicationForm";

type Props = {
  form: UseFormReturn<ApplicationForm>;
};

const BillingAddress = ({
  form: {
    register,
    formState: { errors },
  },
}: Props): JSX.Element | null => {
  const { t } = useTranslation();

  return (
    <>
      <FormSubHeading as="h2">
        {t("application:Page3.subHeading.billingAddress")}
      </FormSubHeading>
      <TextInput
        {...register("billingAddress.streetAddress", {
          required: true,
          maxLength: 255,
        })}
        label={t("application:Page3.billingAddress.streetAddress")}
        id="billingAddress.streetAddress"
        required
        invalid={!!errors.billingAddress?.streetAddress?.type}
        errorText={applicationErrorText(
          t,
          errors.billingAddress?.streetAddress?.type,
          {
            count: 255,
          }
        )}
      />
      <TextInput
        {...register("billingAddress.postCode", {
          required: true,
          maxLength: 32,
        })}
        label={t("application:Page3.billingAddress.postCode")}
        id="billingAddress.postCode"
        required
        invalid={!!errors.billingAddress?.postCode?.type}
        errorText={applicationErrorText(
          t,
          errors.billingAddress?.postCode?.type,
          { count: 32 }
        )}
      />
      <TextInput
        {...register("billingAddress.city", { required: true, maxLength: 255 })}
        label={t("application:Page3.billingAddress.city")}
        id="billingAddress.city"
        required
        invalid={!!errors.billingAddress?.city?.type}
        errorText={applicationErrorText(t, errors.billingAddress?.city?.type, {
          count: 255,
        })}
      />
    </>
  );
};

export default BillingAddress;
