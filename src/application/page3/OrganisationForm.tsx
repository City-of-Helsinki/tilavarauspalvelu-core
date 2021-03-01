import React, { useEffect, useState } from 'react';
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

const OrganisationForm = ({
  activeForm,
  setActiveForm,
  application,
  onNext,
}: Props): JSX.Element | null => {
  const { t } = useTranslation();

  const { register, unregister, handleSubmit } = useForm({
    defaultValues: {
      organisation: { ...application.organisation },
      contactPerson: { ...application.contactPerson },
      billingAddress: { ...application.billingAddress },
    },
  });

  const [hasRegistration, setHasRegistration] = useState(
    Boolean(application.organisation?.identifier) // it is registered if identifier is set
  );
  const [hasBillingAddress, setHasBillingAddress] = useState(
    application.billingAddress !== null
  );

  useEffect(() => {
    if (hasRegistration) {
      register({ name: 'organisation.identifier', required: true });
    } else {
      unregister('organisation.identifier');
    }
  }, [hasRegistration, register, unregister]);

  const prepareData = (data: Application): Application => {
    const applicationCopy = deepCopy(application);

    applicationCopy.applicantType = hasRegistration
      ? 'association'
      : 'community';

    applicationCopy.contactPerson = data.contactPerson;
    applicationCopy.organisation = data.organisation;

    if (!hasRegistration && applicationCopy.organisation != null) {
      applicationCopy.organisation.identifier = null;
    }

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
              label={t('Application.Page3.organisation.name')}
              id="organisation.name"
              name="organisation.name"
              required
            />
            <TextInput
              ref={register({ required: true })}
              label={t('Application.Page3.organisation.coreBusiness')}
              id="organisation.coreBusiness"
              name="organisation.coreBusiness"
              required
            />
          </SpanTwoColumns>
          <TextInput
            ref={register({ required: hasRegistration })}
            label={t('Application.Page3.organisation.registrationNumber')}
            id="organisation.identifier"
            name="organisation.identifier"
            required={hasRegistration}
            disabled={!hasRegistration}
          />
          <Checkbox
            label={t('Application.Page3.organisation.notRegistered')}
            id="organisation.notRegistered"
            name="organisation.notRegistered"
            checked={!hasRegistration}
            onClick={() => setHasRegistration(!hasRegistration)}
          />
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

export default OrganisationForm;
