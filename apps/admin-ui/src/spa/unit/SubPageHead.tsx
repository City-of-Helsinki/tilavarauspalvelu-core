import React from "react";
import { IconLocation } from "hds-react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { type UnitSubpageHeadFragment } from "@gql/gql-types";
import { formatAddress } from "@/common/util";
import { Flex, H1, fontMedium } from "common/styled";
import { gql } from "@apollo/client";

interface IProps {
  title: string;
  unit: UnitSubpageHeadFragment;
}

const Name = styled.p`
  ${fontMedium}
  margin: 0;
`;

export function SubPageHead({ title, unit }: IProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <>
      <H1 $noMargin>{title}</H1>
      <Flex $gap="xs" $alignItems="center" $direction="row">
        <IconLocation />
        <div>
          <Name>{unit?.nameFi}</Name>
          <span>{t("Unit.address")}</span>: <span>{formatAddress(unit.location)}</span>
        </div>
      </Flex>
    </>
  );
}

export const UNIT_SUBPAGE_HEAD_FRAGMENT = gql`
  fragment UnitSubpageHead on UnitNode {
    id
    pk
    nameFi
    location {
      ...LocationFields
    }
  }
`;
