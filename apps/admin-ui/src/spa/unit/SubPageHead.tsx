import { IconLocation } from "hds-react";
import React from "react";
import { H1, fontMedium } from "common/src/common/typography";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { type UnitWithSpacesAndResourcesQuery } from "@gql/gql-types";
import { formatAddress } from "@/common/util";
import { Flex } from "common/styles/util";

// TODO should use a fragment that is shared by both UnitQuery and UnitWithSpacesAndResourcesQuery
type UnitType = NonNullable<UnitWithSpacesAndResourcesQuery["unit"]>;
interface IProps {
  title: string;
  unit: UnitType;
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
        <IconLocation aria-hidden="true" />
        <div>
          <Name>{unit?.nameFi}</Name>
          <span>{t("Unit.address")}</span>:{" "}
          <span>{formatAddress(unit.location)}</span>
        </div>
      </Flex>
    </>
  );
}
