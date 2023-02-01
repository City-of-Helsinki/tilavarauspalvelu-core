import React from "react";
import { useTranslation } from "next-i18next";
import { UseFormReturn } from "react-hook-form";
import { Notification, TextInput } from "hds-react";
import { SpanTwoColumns } from "../common/common";
import { applicationErrorText } from "../../modules/util";
import ApplicationForm from "./ApplicationForm";

type Props = {
  form: UseFormReturn<ApplicationForm>;
};

const EmailInput = ({
  form: {
    register,
    formState: { errors },
  },
}: Props): JSX.Element | null => {
  const { t } = useTranslation();
  return (
    <>
      <SpanTwoColumns>
        <Notification
          size="small"
          label={t("application:Page3.emailNotification")}
        >
          {t("application:Page3.emailNotification")}
        </Notification>
      </SpanTwoColumns>
      <TextInput
        {...register("contactPerson.email", {
          required: true,
          maxLength: 255,
          pattern:
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        })}
        label={t("application:Page3.email")}
        id="contactPerson.email"
        name="contactPerson.email"
        type="email"
        required
        invalid={!!errors.contactPerson?.email?.type}
        errorText={applicationErrorText(t, errors.contactPerson?.email?.type, {
          count: 255,
        })}
      />
    </>
  );
};

export default EmailInput;
