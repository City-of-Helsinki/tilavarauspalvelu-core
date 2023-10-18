import React from "react";
import { TextInput } from "hds-react";
import { useTranslation } from "next-i18next";
import { FormProvider, useForm } from "react-hook-form";
import { Address, Application, ContactPerson } from "common/types/common";
import { deepCopy, applicationErrorText } from "@/modules/util";
import {
  FormSubHeading,
  SpanTwoColumns,
  TwoColumnContainer,
} from "../common/common";
import { EmailInput } from "./EmailInput";
import { BillingAddress } from "./BillingAddress";
import Buttons from "./Buttons";

type Props = {
  application: Application;
  onNext: (appToSave: Application) => void;
};

type FormValues = {
  contactPerson: ContactPerson;
  billingAddress: Address;
  additionalInformation: string;
};

const prepareData = (
  application: Application,
  data: FormValues
): Application => {
  const applicationCopy = deepCopy(application);

  applicationCopy.applicantType = "individual";
  // TODO why is this done like this? it's not type safe but is there a reason for it?
  if (!applicationCopy.contactPerson) {
    applicationCopy.contactPerson = {} as ContactPerson;
  }
  applicationCopy.contactPerson = data.contactPerson;

  if (!applicationCopy.billingAddress) {
    applicationCopy.billingAddress = {} as Address;
  }

  applicationCopy.organisation = null;
  applicationCopy.billingAddress = data.billingAddress;
  applicationCopy.additionalInformation = data.additionalInformation;

  return applicationCopy;
};

const IndividualForm = ({ application, onNext }: Props): JSX.Element | null => {
  const { t } = useTranslation();

  const form = useForm<FormValues>({
    defaultValues: {
      contactPerson: application.contactPerson ?? {},
      billingAddress: application.billingAddress ?? {},
      additionalInformation: application.additionalInformation,
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  const onSubmit = (data: FormValues): void => {
    const appToSave = prepareData(application, data);
    onNext(appToSave);
  };

  return (
    <form>
      <TwoColumnContainer>
        <FormSubHeading as="h2">
          {t("application:Page3.subHeading.basicInfo")}
        </FormSubHeading>
        <TextInput
          {...register("contactPerson.firstName", {
            required: true,
            maxLength: 255,
          })}
          label={t("application:Page3.firstName")}
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
          label={t("application:Page3.lastName")}
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
        <FormProvider {...form}>
          <BillingAddress />
        </FormProvider>
        <FormSubHeading as="h2">
          {t("application:Page3.subHeading.contactInfo")}
        </FormSubHeading>
        <TextInput
          {...register("contactPerson.phoneNumber", {
            required: true,
            maxLength: 255,
          })}
          label={t("application:Page3.phoneNumber")}
          id="contactPerson.phoneNumber"
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
        <SpanTwoColumns>
          <TextInput
            {...register("additionalInformation", {
              required: false,
              maxLength: 255,
            })}
            label={t("application:Page3.additionalInformation")}
            id="additionalInformation"
            errorText={applicationErrorText(
              t,
              errors.additionalInformation?.type,
              {
                count: 255,
              }
            )}
          />
        </SpanTwoColumns>
        <FormProvider {...form}>
          <EmailInput />
        </FormProvider>
      </TwoColumnContainer>
      {application.id && (
        <Buttons
          onSubmit={handleSubmit(onSubmit)}
          applicationId={application.id}
        />
      )}
    </form>
  );
};

export default IndividualForm;
