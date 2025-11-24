import React from "react";
import { gql } from "@apollo/client";
import { IconCheck } from "hds-react";
import styled from "styled-components";
import { fontMedium, Flex } from "ui/src/styled";
import { formatAddress } from "@/modules/helpers";
import type { UnitResourceInfoFieldsFragment } from "@gql/gql-types";

const UnitInfoWrapper = styled(Flex).attrs({
  $gap: "2-xs",
  $direction: "row",
})`
  margin: var(--spacing-m) 0;
  border-bottom: 1px solid var(--color-black);
`;

export const Parent = styled.div`
  ${fontMedium};
  margin-bottom: var(--spacing-m);
`;

export const Address = styled.span`
  ${fontMedium}
`;

export const Name = styled.div`
  margin: 0 0 var(--spacing-m) 0;
`;

export function UnitInfo({
  unit,
  parentName,
}: {
  unit: UnitResourceInfoFieldsFragment | null;
  parentName: string | null;
}) {
  return (
    <UnitInfoWrapper>
      <IconCheck />
      <div>
        <Name>{unit?.nameFi}</Name>
        <Parent>{parentName}</Parent>
      </div>
      {unit != null && <Address>{formatAddress(unit)}</Address>}
    </UnitInfoWrapper>
  );
}

export const UNIT_RESOURCE_INFO_FRAGMENT = gql`
  fragment UnitResourceInfoFields on UnitNode {
    id
    pk
    nameFi
    ...LocationFields
  }
`;
