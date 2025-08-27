import React from "react";
import { IconGroup, IconLocation } from "hds-react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import type { LocationFieldsFragment, Maybe, ReservationUnitNode } from "@gql/gql-types";
import { formatAddress } from "@/common/util";
import { getUnitUrl } from "@/common/urls";
import { Flex, fontMedium, H1 } from "common/styled";
import { breakpoints } from "common/src/const";
import Link from "next/link";

interface IProps {
  title: string;
  space: {
    unit: LocationFieldsFragment & Pick<ReservationUnitNode, "nameFi" | "pk">;
  } | null;
  maxPersons?: Maybe<number>;
  surfaceArea?: Maybe<number>;
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

const Value = styled(Flex).attrs({
  $direction: "row",
  $alignItems: "center",
  $gap: "2-xs",
})<{ $disabled: boolean }>`
  ${fontMedium};
  margin-bottom: var(--spacing-xs);

  ${({ $disabled }) => $disabled && "opacity: 0.4;"}
`;

export function SpaceHead({ title, space, surfaceArea, maxPersons }: IProps): JSX.Element {
  const { unit } = space || {};
  const { t } = useTranslation();

  const unitUrl = getUnitUrl(unit?.pk);

  const address = formatAddress(unit) !== "-" ? formatAddress(unit) : t("spaces:noAddress");

  return (
    <div>
      <H1 $noMargin>{title}</H1>
      <Address>{address}</Address>
      <Props>
        <Value $disabled={!unit}>
          <IconLocation /> {unit ? <Link href={unitUrl}>{unit?.nameFi}</Link> : t("spaces:noUnit")}
        </Value>
        <Value $disabled={!maxPersons}>
          <IconGroup /> {maxPersons || t("spaces:noMaxPersons")}
        </Value>
        <Value $disabled={!surfaceArea}>
          {surfaceArea ? t("spaces:SpaceEditor.area", { surfaceArea }) : t("spaces:noSurfaceArea")}
        </Value>
      </Props>
    </div>
  );
}
