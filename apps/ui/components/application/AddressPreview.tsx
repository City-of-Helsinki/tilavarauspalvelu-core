import React from "react";
import { useTranslation } from "next-i18next";
import type { AddressNode } from "@gql/gql-types";
import { SpanTwoColumns } from "../common/common";
import { StyledLabelValue } from "./styled";

function Address({
  address,
  i18nMessagePrefix,
}: {
  address:
    | Pick<AddressNode, "streetAddressFi" | "postCode" | "cityFi">
    | undefined
    | null;
  i18nMessagePrefix: string;
}): JSX.Element | null {
  const { t } = useTranslation();

  if (!address) {
    return null;
  }

  return (
    <>
      <StyledLabelValue
        label={t(`${i18nMessagePrefix}.streetAddress`)}
        value={address.streetAddressFi}
      />
      <StyledLabelValue
        label={t(`${i18nMessagePrefix}.postCode`)}
        value={address.postCode}
      />
      <SpanTwoColumns>
        <StyledLabelValue
          label={t(`${i18nMessagePrefix}.city`)}
          value={address.cityFi}
        />
      </SpanTwoColumns>
    </>
  );
}

export default Address;
