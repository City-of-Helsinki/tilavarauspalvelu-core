import React from "react";
import { useTranslation } from "next-i18next";
import { TextInput } from "hds-react";
import { useFormContext } from "react-hook-form";
import { applicationErrorText } from "@/modules/util";
import { FormSubHeading } from "../common/common";
import type { ApplicationFormPage3Values } from "./Form";

const BillingAddress = () => {
  const { t } = useTranslation();

  const {
    register,
    formState: { errors },
  } = useFormContext<ApplicationFormPage3Values>();

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

export { BillingAddress };
