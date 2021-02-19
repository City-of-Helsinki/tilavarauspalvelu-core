import React from 'react';
import { useTranslation } from 'react-i18next';
import { TextInput } from 'hds-react';
import { useForm } from 'react-hook-form';

type Props = {
  register: ReturnType<typeof useForm>['register'];
};

const BillingAddress = ({ register }: Props): JSX.Element | null => {
  const { t } = useTranslation();
  return (
    <>
      <TextInput
        ref={register({ required: true })}
        label={t('Application.Page3.billingAddress.streetAddress')}
        id="billingAddress.streetAddress"
        name="billingAddress.streetAddress"
        required
      />
      <TextInput
        ref={register({ required: true })}
        label={t('Application.Page3.billingAddress.postCode')}
        id="billingAddress.postCode"
        name="billingAddress.postCode"
        required
      />
      <TextInput
        ref={register({ required: true })}
        label={t('Application.Page3.billingAddress.city')}
        id="billingAddress.city"
        name="billingAddress.city"
        required
      />
    </>
  );
};

export default BillingAddress;
