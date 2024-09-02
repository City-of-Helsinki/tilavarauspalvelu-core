import React from "react";
import { IconGroup } from "hds-react";
import { useTranslation, type TFunction } from "next-i18next";
import styled from "styled-components";
import { H1, Strong } from "common/src/common/typography";
import { type ApolloError } from "@apollo/client";
import { useSpacesQuery, type SpaceNode } from "@gql/gql-types";
import Loader from "@/component/Loader";
import { errorToast } from "common/src/common/toast";
import { Container } from "@/styles/layout";
import { filterNonNullable } from "common/src/helpers";
import { CustomTable } from "@/component/Table";
import { Link } from "react-router-dom";
import { getSpaceUrl } from "@/common/urls";

const SpaceCount = styled.div`
  font-family: var(--tilavaraus-admin-font-bold);
  font-weight: 700;
  font-size: var(--fontsize-heading-s);
  margin-bottom: var(--spacing-m);
`;

type SpacesTableColumn = {
  headerName: string;
  key: string;
  isSortable: boolean;
  transform?: (space: SpaceNode) => JSX.Element | string;
};

function getColConfig(t: TFunction): SpacesTableColumn[] {
  return [
    {
      headerName: t("Spaces.headings.name"),
      key: "nameFi",
      isSortable: false,
      transform: ({ nameFi, unit, pk }: SpaceNode) => {
        const link = getSpaceUrl(pk, unit?.pk);
        return (
          <Link to={link}>
            <Strong>{nameFi}</Strong>
          </Link>
        );
      },
    },
    {
      headerName: t("Spaces.headings.unit"),
      key: "unit.nameFi",
      isSortable: false,
      transform: (space: SpaceNode) => <span>{space.unit?.nameFi ?? "-"}</span>,
    },
    {
      headerName: t("Spaces.headings.district"),
      key: "building.district.nameFi",
      isSortable: false,
      transform: () => <span>-</span>,
    },
    {
      headerName: t("Spaces.headings.volume"),
      isSortable: false,
      key: "maxPersons",
      transform: ({ maxPersons }: SpaceNode) => (
        <div
          style={{
            display: "flex",
            alignContent: "center",
            gap: "var(--spacing-xs)",
          }}
        >
          <IconGroup />
          <span>{maxPersons || "?"}</span>
        </div>
      ),
    },
    {
      headerName: t("Spaces.headings.size"),
      isSortable: false,
      key: "surfaceArea",
      transform: ({ surfaceArea }: SpaceNode) => (
        <span>
          {surfaceArea || "?"}
          {t("common.areaUnitSquareMeter")}
        </span>
      ),
    },
  ];
}

/// The global list page that is not linked in the menu
function SpacesList(): JSX.Element {
  const { t } = useTranslation();

  const { data, loading: isLoading } = useSpacesQuery({
    onError: (err: ApolloError) => {
      errorToast({ text: err.message });
    },
  });

  if (isLoading) {
    return <Loader />;
  }

  const spaces = filterNonNullable(data?.spaces?.edges?.map((s) => s?.node));

  const rows = spaces;
  const cols = getColConfig(t);

  return (
    <Container>
      <div>
        <H1 $legacy>{t("Spaces.spaceListHeading")}</H1>
        <p>{t("Spaces.spaceListDescription")}</p>
        <SpaceCount>
          {spaces.length} {t("common.volumeUnit")}
        </SpaceCount>
      </div>
      <CustomTable indexKey="pk" rows={rows} cols={cols} />
    </Container>
  );
}

export default SpacesList;
