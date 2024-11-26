import { IconGroup, IconLocation } from "hds-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { breakpoints } from "common/src/common/style";
import type { SpaceQuery } from "@gql/gql-types";
import { formatAddress } from "@/common/util";
import { getUnitUrl } from "@/common/urls";
import { H1 } from "common";

interface IProps {
  title: string;
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

const Prop = styled.div<{ $disabled: boolean }>`
  display: flex;
  align-items: center;
  gap: var(--spacing-2-xs);
  font-family: var(--tilavaraus-admin-font-medium);
  font-weight: 500;
  margin-bottom: var(--spacing-xs);

  ${({ $disabled }) => $disabled && "opacity: 0.4;"}
`;

export function Head({
  title,
  space,
  surfaceArea,
  maxPersons,
}: IProps): JSX.Element {
  const { unit } = space || {};
  const { t } = useTranslation();

  const unitUrl = getUnitUrl(unit?.pk);

  return (
    <div>
      <H1 $noMargin>{title}</H1>
      <Address>
        {unit?.location
          ? formatAddress(unit?.location)
          : t("SpaceEditor.noAddress")}
      </Address>
      <Props>
        <Prop $disabled={!unit}>
          <IconLocation />{" "}
          {unit ? (
            <Link to={unitUrl}>{unit?.nameFi}</Link>
          ) : (
            t("SpaceEditor.noUnit")
          )}
        </Prop>
        <Prop $disabled={!maxPersons}>
          <IconGroup /> {maxPersons || t("SpaceEditor.noMaxPersons")}
        </Prop>
        <Prop $disabled={!surfaceArea}>
          {surfaceArea
            ? t("SpaceEditor.area", { surfaceArea })
            : t("SpaceEditor.noSurfaceArea")}
        </Prop>
      </Props>
    </div>
  );
}
