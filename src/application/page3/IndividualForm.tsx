import React from 'react';
import { TextInput } from 'hds-react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import {
  Address,
  Application,
  ContactPerson,
  FormType,
} from '../../common/types';
import { TwoColumnContainer } from '../../component/common';
import RadioButtons from './RadioButtons';
import EmailInput from './EmailInput';
import BillingAddress from './BillingAddress';
import Buttons from './Buttons';
import { deepCopy } from '../../common/util';

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

  const { register, handleSubmit } = useForm({
    defaultValues: {
      contactPerson: { ...application.contactPerson },
      billingAddress: { ...application.billingAddress },
    },
  });

  const prepareData = (data: Application): Application => {
    const applicationCopy = deepCopy(application);

    applicationCopy.applicantType = 'individual';
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
            label={t('Application.Page3.firstName')}
            id="contactPerson.firstName"
            name="contactPerson.firstName"
            required
          />
          <TextInput
            ref={register({ required: true })}
            label={t('Application.Page3.lastName')}
            id="contactPerson.lastName"
            name="contactPerson.lastName"
            required
          />
          <BillingAddress register={register} />
          <TextInput
            ref={register({ required: true })}
            label={t('Application.Page3.contactPerson.phoneNumber')}
            id="contactPerson.phoneNumber"
            name="contactPerson.phoneNumber"
            required
          />
          <EmailInput register={register} />
        </TwoColumnContainer>
      </RadioButtons>
      <Buttons onSubmit={handleSubmit(onSubmit)} />
    </form>
  );
};

export default IndividualForm;
