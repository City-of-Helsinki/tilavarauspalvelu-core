import React from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { AddressNode } from "common/types/gql-types";
import { SpanTwoColumns } from "../common/common";
import LabelValue from "../common/LabelValue";
import { AddressFormValues } from "./Form";

const StyledLabelValue = styled(LabelValue).attrs({ theme: "thin" })``;

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
