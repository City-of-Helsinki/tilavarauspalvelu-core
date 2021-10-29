import React from "react";
import { useTranslation } from "react-i18next";
import { Notification, TextInput } from "hds-react";
import { useForm } from "react-hook-form";
import { SpanTwoColumns } from "../common/common";
import { applicationErrorText } from "../../modules/util";

type Props = {
  register: ReturnType<typeof useForm>["register"];
  errors: ReturnType<typeof useForm>["errors"];
};

const EmailInput = ({ register, errors }: Props): JSX.Element | null => {
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
      <SpanTwoColumns>
        <TextInput
          ref={register({
            required: true,
            pattern:
              /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
          })}
          label={t("application:Page3.email")}
          id="contactPerson.email"
          name="contactPerson.email"
          type="email"
          required
          invalid={!!errors.contactPerson?.email?.type}
          errorText={applicationErrorText(t, errors.contactPerson?.email?.type)}
        />
      </SpanTwoColumns>
    </>
  );
};

export default EmailInput;
