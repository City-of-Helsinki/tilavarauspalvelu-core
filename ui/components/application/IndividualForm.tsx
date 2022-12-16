import React from "react";
import { TextInput } from "hds-react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { Address, Application, ContactPerson } from "common/types/common";
import {
  FormSubHeading,
  SpanTwoColumns,
  TwoColumnContainer,
} from "../common/common";
import EmailInput from "./EmailInput";
import BillingAddress from "./BillingAddress";
import Buttons from "./Buttons";
import { deepCopy, applicationErrorText } from "../../modules/util";
import ApplicationForm from "./ApplicationForm";

type Props = {
  application: Application;
  onNext: (appToSave: Application) => void;
};

const IndividualForm = ({ application, onNext }: Props): JSX.Element | null => {
  const { t } = useTranslation();

  const form = useForm<ApplicationForm>({
    defaultValues: {
      contactPerson: { ...application.contactPerson } as ContactPerson,
      billingAddress: { ...application.billingAddress } as Address,
      additionalInformation: application.additionalInformation,
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  const prepareData = (data: Application): Application => {
    const applicationCopy = deepCopy(application);

    applicationCopy.applicantType = "individual";
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

  const onSubmit = (data: Application): void => {
    const appToSave = prepareData(data);

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
        <BillingAddress form={form} />
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
        <EmailInput form={form} />
      </TwoColumnContainer>
      <Buttons
        onSubmit={handleSubmit(onSubmit)}
        applicationId={application.id}
      />
    </form>
  );
};

export default IndividualForm;
