import React from "react";
import { TextInput } from "hds-react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { Address, Application, ContactPerson } from "../../modules/types";
import {
  FormSubHeading,
  SpanTwoColumns,
  TwoColumnContainer,
} from "../common/common";
import EmailInput from "./EmailInput";
import BillingAddress from "./BillingAddress";
import Buttons from "./Buttons";
import { deepCopy, applicationErrorText } from "../../modules/util";

type Props = {
  application: Application;
  onNext: (appToSave: Application) => void;
};

const IndividualForm = ({ application, onNext }: Props): JSX.Element | null => {
  const { t } = useTranslation();

  const { register, handleSubmit, errors } = useForm({
    defaultValues: {
      contactPerson: { ...application.contactPerson } as ContactPerson,
      billingAddress: { ...application.billingAddress } as Address,
      additionalInformation: application.additionalInformation,
    },
  });

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
        <FormSubHeading>
          {t("application:Page3.subHeading.basicInfo")}
        </FormSubHeading>
        <TextInput
          ref={register({ required: true })}
          label={t("application:Page3.firstName")}
          id="contactPerson.firstName"
          name="contactPerson.firstName"
          required
          invalid={!!errors.contactPerson?.firstName?.type}
          errorText={applicationErrorText(
            t,
            errors.contactPerson?.firstName?.type
          )}
        />
        <TextInput
          ref={register({ required: true })}
          label={t("application:Page3.lastName")}
          id="contactPerson.lastName"
          name="contactPerson.lastName"
          required
          invalid={!!errors.contactPerson?.lastName?.type}
          errorText={applicationErrorText(
            t,
            errors.contactPerson?.lastName?.type
          )}
        />
        <BillingAddress register={register} errors={errors} />
        <FormSubHeading>
          {t("application:Page3.subHeading.contactInfo")}
        </FormSubHeading>
        <TextInput
          ref={register({ required: true })}
          label={t("application:Page3.phoneNumber")}
          id="contactPerson.phoneNumber"
          name="contactPerson.phoneNumber"
          required
          invalid={!!errors.contactPerson?.phoneNumber?.type}
          errorText={applicationErrorText(
            t,
            errors.contactPerson?.phoneNumber?.type
          )}
        />
        <SpanTwoColumns>
          <TextInput
            ref={register({ required: false })}
            label={t("application:Page3.additionalInformation")}
            id="additionalInformation"
            name="additionalInformation"
          />
        </SpanTwoColumns>
        <EmailInput register={register} errors={errors} />
      </TwoColumnContainer>
      <Buttons
        onSubmit={handleSubmit(onSubmit)}
        applicationId={application.id}
      />
    </form>
  );
};

export default IndividualForm;
