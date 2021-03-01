import React, { useState } from 'react';
import { TextInput, Checkbox } from 'hds-react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { Application, FormType } from '../../common/types';
import { SpanTwoColumns, TwoColumnContainer } from '../../component/common';
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

const CompanyForm = ({
  activeForm,
  setActiveForm,
  application,
  onNext,
}: Props): JSX.Element | null => {
  const { t } = useTranslation();

  const [hasBillingAddress, setHasBillingAddress] = useState(
    application.billingAddress !== null
  );

  const { register, handleSubmit } = useForm({
    defaultValues: {
      organisation: { ...application.organisation },
      contactPerson: { ...application.contactPerson },
      billingAddress: { ...application.billingAddress },
    },
  });

  const prepareData = (data: Application): Application => {
    const applicationCopy = deepCopy(application);
    applicationCopy.applicantType = 'company';

    applicationCopy.contactPerson = data.contactPerson;
    applicationCopy.organisation = data.organisation;

    if (hasBillingAddress) {
      applicationCopy.billingAddress = data.billingAddress;
    } else {
      applicationCopy.billingAddress = null;
    }

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
          <SpanTwoColumns>
            <TextInput
              ref={register({ required: true })}
              label={t('Application.Page3.company.name')}
              id="organisation.name"
              name="organisation.name"
              required
            />
            <TextInput
              ref={register({ required: true })}
              label={t('Application.Page3.company.coreBusiness')}
              id="organisation.coreBusiness"
              name="organisation.coreBusiness"
              required
            />
          </SpanTwoColumns>
          <TextInput
            ref={register({ required: true })}
            label={t('Application.Page3.company.registrationNumber')}
            id="organisation.identifier"
            name="organisation.identifier"
            required
          />
          <span />
          <TextInput
            ref={register({ required: true })}
            label={t('Application.Page3.organisation.streetAddress')}
            id="organisation.address.streetAddress"
            name="organisation.address.streetAddress"
            required
          />
          <TextInput
            ref={register({ required: true })}
            label={t('Application.Page3.organisation.postCode')}
            id="organisation.address.postCode"
            name="organisation.address.postCode"
            required
          />
          <TextInput
            ref={register({ required: true })}
            label={t('Application.Page3.organisation.city')}
            id="organisation.address.city"
            name="organisation.address.city"
            required
          />
          <Checkbox
            label={t('Application.Page3.organisation.separateInvoicingAddress')}
            id="organisation.hasInvoicingAddress"
            name="organisation.hasInvoicingAddress"
            checked={hasBillingAddress}
            onClick={() => setHasBillingAddress(!hasBillingAddress)}
          />
          {hasBillingAddress ? <BillingAddress register={register} /> : null}
          <TextInput
            ref={register({ required: true })}
            label={t('Application.Page3.contactPerson.phoneNumber')}
            id="contactPerson.phoneNumber"
            name="contactPerson.phoneNumber"
            required
          />
          <TextInput
            ref={register({ required: true })}
            label={t('Application.Page3.contactPerson.firstName')}
            id="contactPerson.firstName"
            name="contactPerson.firstName"
            required
          />
          <TextInput
            ref={register({ required: true })}
            label={t('Application.Page3.contactPerson.lastName')}
            id="contactPerson.lastName"
            name="contactPerson.lastName"
            required
          />
          <EmailInput register={register} />
        </TwoColumnContainer>
      </RadioButtons>
      <Buttons onSubmit={handleSubmit(onSubmit)} />
    </form>
  );
};

export default CompanyForm;
