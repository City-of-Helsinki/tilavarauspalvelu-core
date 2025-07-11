import { IconGroup, IconLocation } from "hds-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import styled from "styled-components";
import type { SpaceQuery } from "@gql/gql-types";
import { formatAddress } from "@/common/util";
import { getUnitUrl } from "@/common/urls";
import { Flex, fontMedium, H1 } from "common/styled";
import { breakpoints } from "common/src/const";

interface IProps {
  title: string;
  // TODO narrow down
  space?: SpaceQuery["space"];
  maxPersons?: number;
  surfaceArea?: number;
}

const Address = styled.div`
  font-size: var(--fontsize-body-s);
`;

const Props = styled.div`
  padding: var(--spacing-xs) 0;
  grid-template-columns: 1fr 1fr;

  @media (min-width: ${breakpoints.s}) {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: var(--spacing-m);
  }
`;

const Prop = styled(Flex).attrs({
  $direction: "row",
  $alignItems: "center",
  $gap: "2-xs",
})<{ $disabled: boolean }>`
  ${fontMedium};
  margin-bottom: var(--spacing-xs);

  ${({ $disabled }) => $disabled && "opacity: 0.4;"}
`;

export function Head({ title, space, surfaceArea, maxPersons }: IProps): JSX.Element {
  const { unit } = space || {};
  const { t } = useTranslation();

  const unitUrl = getUnitUrl(unit?.pk);

  const address = formatAddress(unit) !== "-" ? formatAddress(unit) : t("SpaceEditor.noAddress");

  return (
    <div>
      <H1 $noMargin>{title}</H1>
      <Address>{address}</Address>
      <Props>
        <Prop $disabled={!unit}>
          <IconLocation /> {unit ? <Link to={unitUrl}>{unit?.nameFi}</Link> : t("SpaceEditor.noUnit")}
        </Prop>
        <Prop $disabled={!maxPersons}>
          <IconGroup /> {maxPersons || t("SpaceEditor.noMaxPersons")}
        </Prop>
        <Prop $disabled={!surfaceArea}>
          {surfaceArea ? t("SpaceEditor.area", { surfaceArea }) : t("SpaceEditor.noSurfaceArea")}
        </Prop>
      </Props>
    </div>
  );
}
