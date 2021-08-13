import React from "react";
import { TextInput } from "hds-react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import {
  Address,
  Application,
  ContactPerson,
  FormType,
} from "../../modules/types";
import { TwoColumnContainer } from "../common/common";
import RadioButtons from "./RadioButtons";
import EmailInput from "./EmailInput";
import BillingAddress from "./BillingAddress";
import Buttons from "./Buttons";
import { deepCopy, errorText } from "../../modules/util";

type Props = {
  activeForm: FormType;
  setActiveForm: (id: FormType) => void;
  application: Application;
  onNext: (appToSave: Application) => void;
};

const IndividualForm = ({
  activeForm,
  setActiveForm,
  application,
  onNext,
}: Props): JSX.Element | null => {
  const { t } = useTranslation();

  const { register, handleSubmit, errors } = useForm({
    defaultValues: {
      contactPerson: { ...application.contactPerson } as ContactPerson,
      billingAddress: { ...application.billingAddress } as Address,
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

    return applicationCopy;
  };

  const onSubmit = (data: Application): void => {
    const appToSave = prepareData(data);

    onNext(appToSave);
  };

  return (
    <form>
      <RadioButtons activeForm={activeForm} setActiveForm={setActiveForm}>
        <TwoColumnContainer>
          <TextInput
            ref={register({ required: true })}
            label={t("application:Page3.firstName")}
            id="contactPerson.firstName"
            name="contactPerson.firstName"
            required
            invalid={!!errors.contactPerson?.firstName?.type}
            errorText={errorText(t, errors.contactPerson?.firstName?.type)}
          />
          <TextInput
            ref={register({ required: true })}
            label={t("application:Page3.lastName")}
            id="contactPerson.lastName"
            name="contactPerson.lastName"
            required
            invalid={!!errors.contactPerson?.lastName?.type}
            errorText={errorText(t, errors.contactPerson?.lastName?.type)}
          />
          <BillingAddress register={register} errors={errors} />
          <TextInput
            ref={register({ required: true })}
            label={t("application:Page3.phoneNumber")}
            id="contactPerson.phoneNumber"
            name="contactPerson.phoneNumber"
            required
            invalid={!!errors.contactPerson?.phoneNumber?.type}
            errorText={errorText(t, errors.contactPerson?.phoneNumber?.type)}
          />
          <EmailInput register={register} errors={errors} />
        </TwoColumnContainer>
      </RadioButtons>
      <Buttons
        onSubmit={handleSubmit(onSubmit)}
        applicationId={application.id}
      />
    </form>
  );
};

export default IndividualForm;
