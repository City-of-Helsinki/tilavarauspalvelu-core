import React from "react";
import { gql } from "@apollo/client";
import { IconLocation } from "hds-react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { Flex, H1, fontMedium } from "ui/src/styled";
import { formatAddress } from "@/modules/helpers";
import type { UnitSubpageHeadFragment } from "@gql/gql-types";

interface IProps {
  title: string;
  unit: UnitSubpageHeadFragment | null | undefined;
}

const Name = styled.p`
  ${fontMedium};
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
          <span>{t("spaces:unitAddress")}</span>: <span>{formatAddress(unit)}</span>
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
    ...LocationFields
  }
`;
