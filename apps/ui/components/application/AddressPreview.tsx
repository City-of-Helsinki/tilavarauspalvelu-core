import React from "react";
import { useTranslation } from "next-i18next";
import { AddressNode } from "common/types/gql-types";
import { SpanTwoColumns } from "../common/common";
import { StyledLabelValue } from "./styled";
import { AddressFormValues } from "./Form";

const Address = ({
  address,
  i18nMessagePrefix,
}: {
  address: AddressNode | AddressFormValues | undefined;
  i18nMessagePrefix: string;
}): JSX.Element | null => {
  const { t } = useTranslation();

  if (!address) {
    return null;
  }

  return (
    <>
      <StyledLabelValue
        label={t(`${i18nMessagePrefix}.streetAddress`)}
        value={address.streetAddress}
      />
      <StyledLabelValue
        label={t(`${i18nMessagePrefix}.postCode`)}
        value={address.postCode}
      />
      <SpanTwoColumns>
        <StyledLabelValue
          label={t(`${i18nMessagePrefix}.city`)}
          value={address.city}
        />
      </SpanTwoColumns>
    </>
  );
};

export default Address;
