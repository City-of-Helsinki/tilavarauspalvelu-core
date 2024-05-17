import React from "react";
import { type TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { type ApolloError } from "@apollo/client";
import { H1, Strong } from "common/src/common/typography";
import { useResourcesQuery, type ResourceNode } from "@gql/gql-types";
import { filterNonNullable } from "common/src/helpers";
import Loader from "@/component/Loader";
import BreadcrumbWrapper from "@/component/BreadcrumbWrapper";
import { useNotification } from "@/context/NotificationContext";
import { Container } from "@/styles/layout";
import { CustomTable } from "../Table";
import { Link } from "react-router-dom";
import { getResourceUrl } from "@/common/urls";

const ResourceCount = styled.div`
  font-family: var(--tilavaraus-admin-font-bold);
  font-weight: 700;
  font-size: var(--fontsize-heading-s);
  margin-bottom: var(--spacing-m);
`;

type ResourcesTableColumn = {
  headerName: string;
  key: string;
  isSortable: boolean;
  transform?: (space: ResourceNode) => JSX.Element | string;
};

function getColConfig(t: TFunction): ResourcesTableColumn[] {
  return [
    {
      headerName: t("Resources.headings.name"),
      isSortable: false,
      key: "nameFi",
      transform: (res: ResourceNode) => {
        const { pk, space, nameFi } = res;
        const link = getResourceUrl(pk, space?.unit?.pk);
        const name = nameFi != null && nameFi.length > 0 ? nameFi : "-";
        return (
          <Link to={link}>
            <Strong>{name}</Strong>
          </Link>
        );
      },
    },
    {
      headerName: t("Resources.headings.unit"),
      isSortable: false,
      key: "space.unit.nameFi",
    },
    {
      headerName: t("Resources.headings.district"),
      isSortable: false,
      key: "space.unit.district.nameFi",
      transform: () => "???",
    },
    {
      headerName: t("Resources.headings.resourceType"),
      isSortable: false,
      key: "resourceType",
      transform: ({ locationType }: ResourceNode) => (
        // TODO translate
        <span>{locationType || "?"}</span>
      ),
    },
  ];
}

function ResourcesList(): JSX.Element {
  const { notifyError } = useNotification();
  const { t } = useTranslation();

  const { data, loading: isLoading } = useResourcesQuery({
    onError: (err: ApolloError) => {
      notifyError(err.message);
    },
  });

  const resources = filterNonNullable(
    data?.resources?.edges?.map((r) => r?.node)
  );
  const rows = resources;
  const cols = getColConfig(t);
  // TODO filtering and sorting missing

  if (isLoading) {
    return <Loader />;
  }

  return (
    <>
      <BreadcrumbWrapper route={["spaces-n-settings", "resources"]} />
      <Container>
        <div>
          <H1 $legacy>{t("Resources.resourceListHeading")}</H1>
          <p>{t("Resources.resourceListDescription")}</p>
          <ResourceCount>
            {resources.length} {t("common.volumeUnit")}
          </ResourceCount>
        </div>
        <CustomTable indexKey="pk" rows={rows} cols={cols} />
      </Container>
    </>
  );
}

export default ResourcesList;
