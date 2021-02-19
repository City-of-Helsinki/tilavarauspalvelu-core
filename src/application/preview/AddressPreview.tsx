import React from 'react';
import { useTranslation } from 'react-i18next';
import { Address as AddressType } from '../../common/types';
import { SpanTwoColumns } from '../../component/common';
import LabelValue from '../../component/LabelValue';

const Address = ({
  address,
  i18nMessagePrefix,
}: {
  address?: AddressType | null;
  i18nMessagePrefix: string;
}): JSX.Element | null => {
  const { t } = useTranslation();

  if (!address) {
    return null;
  }

  return (
    <>
      <LabelValue
        label={t(`${i18nMessagePrefix}.streetAddress`)}
        value={address.streetAddress}
      />
      <LabelValue
        label={t(`${i18nMessagePrefix}.postCode`)}
        value={address.postCode}
      />
      <SpanTwoColumns>
        <LabelValue
          label={t(`${i18nMessagePrefix}.city`)}
          value={address.city}
        />
      </SpanTwoColumns>
    </>
  );
};

export default Address;
