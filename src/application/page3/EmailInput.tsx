import React from 'react';
import { useTranslation } from 'react-i18next';
import { Notification, TextInput } from 'hds-react';
import { useForm } from 'react-hook-form';
import { SpanTwoColumns } from '../../component/common';

type Props = {
  register: ReturnType<typeof useForm>['register'];
};

const EmailInput = ({ register }: Props): JSX.Element | null => {
  const { t } = useTranslation();
  return (
    <>
      <SpanTwoColumns>
        <Notification
          size="small"
          label={t('Application.Page3.emailNotification')}>
          {t('Application.Page3.emailNotification')}
        </Notification>
      </SpanTwoColumns>
      <SpanTwoColumns>
        <TextInput
          ref={register({ required: true })}
          label={t('Application.Page3.email')}
          id="contactPerson.email"
          name="contactPerson.email"
          type="email"
          required
        />
      </SpanTwoColumns>
    </>
  );
};

export default EmailInput;
