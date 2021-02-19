import React from 'react';
import { useTranslation } from 'react-i18next';
import { Application } from '../../common/types';
import { TwoColumnContainer } from '../../component/common';
import LabelValue from '../../component/LabelValue';
import Address from './AddressPreview';

const ApplicantInfoPreview = ({
  application,
}: {
  application: Application;
}): JSX.Element | null => {
  const { t } = useTranslation();

  return (
    <TwoColumnContainer>
      {application.applicantType !== 'individual' ? (
        <>
          <LabelValue
            label={t('Application.preview.organisation.name')}
            value={application.organisation?.name}
          />
          <LabelValue
            label={t('Application.preview.organisation.coreBusiness')}
            value={application.organisation?.coreBusiness}
          />
          <Address
            address={application.organisation?.address}
            i18nMessagePrefix="common.address"
          />
          <Address
            address={application.billingAddress}
            i18nMessagePrefix="common.billingAddress"
          />
        </>
      ) : null}
      <LabelValue
        label={t('Application.preview.firstName')}
        value={application.contactPerson?.firstName}
      />
      <LabelValue
        label={t('Application.preview.lastName')}
        value={application.contactPerson?.lastName}
      />
      <LabelValue
        label={t('Application.preview.email')}
        value={application.contactPerson?.email}
      />
      <LabelValue
        label={t('Application.preview.phoneNumber')}
        value={application.contactPerson?.phoneNumber}
      />
      {application.applicantType === 'individual' ? (
        <Address
          address={application.billingAddress}
          i18nMessagePrefix="common.address"
        />
      ) : null}
    </TwoColumnContainer>
  );
};

export default ApplicantInfoPreview;
