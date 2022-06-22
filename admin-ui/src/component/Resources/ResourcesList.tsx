import React, { useState, ChangeEvent } from "react";
import { IconArrowRight, TextInput, IconSearch } from "hds-react";
import { TFunction } from "i18next";
import { uniq } from "lodash";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { useDebounce } from "react-use";
import { useQuery, ApolloError } from "@apollo/client";

import { DataFilterConfig } from "../../common/types";
import { IngressContainer } from "../../styles/layout";
import { H1 } from "../../styles/typography";
import withMainMenu from "../withMainMenu";
import Loader from "../Loader";
import DataTable, { CellConfig } from "../DataTable";

import { breakpoints, Strong } from "../../styles/util";
import ClearButton from "../ClearButton";
import { RESOURCES_QUERY } from "../../common/queries";
import { Query, ResourceType } from "../../common/gql-types";
import BreadcrumbWrapper from "../BreadcrumbWrapper";
import { useNotification } from "../../context/NotificationContext";

const Wrapper = styled.div`
  padding: var(--spacing-layout-xl) 0;
`;

const SearchContainer = styled.div`
  display: grid;
  align-items: center;
  margin-top: var(--spacing-layout-xl);
  margin-bottom: var(--spacing-layout-m);
  position: relative;
  width: 100%;

  &&& input {
    padding-right: var(--spacing-2-xl);
    padding-left: var(--spacing-xl);
  }

  .searchIcon {
    position: absolute;
    left: 0;
    z-index: 1;
  }

  @media (min-width: ${breakpoints.s}) {
    width: 20rem;
  }
`;

const StyledInput = styled(TextInput).attrs({
  style: {
    "--border-width": "0",
  } as React.CSSProperties,
})``;

const ResourceCount = styled.div`
  font-family: var(--tilavaraus-admin-font-bold);
  font-weight: 700;
  font-size: var(--fontsize-heading-s);
  margin-bottom: var(--spacing-m);
`;

const getCellConfig = (t: TFunction): CellConfig => {
  return {
    cols: [
      {
        title: t("Resources.headings.name"),
        key: "nameFi",
        transform: ({ nameFi }: ResourceType) => <Strong>{nameFi}</Strong>,
      },
      {
        title: t("Resources.headings.unit"),
        key: "space.unit.nameFi",
      },
      {
        title: t("Resources.headings.district"),
        key: "space.unit.district.nameFi",
        transform: () => "???",
      },
      {
        title: t("Resources.headings.resourceType"),
        key: "resourceType",
        transform: ({ locationType }: ResourceType) => (
          <div
            style={{
              display: "flex",
              alignContent: "center",
              justifyContent: "space-between",
            }}
          >
            <span>{locationType || "?"}</span>
            <IconArrowRight />
          </div>
        ),
      },
    ],
    index: "pk",
    sorting: "name",
    order: "asc",
    rowLink: ({ space, pk }: ResourceType) =>
      `/unit/${space?.unit?.pk}/resource/edit/${pk}`,
  };
};

const getFilterConfig = (
  resources: ResourceType[],
  t: TFunction
): DataFilterConfig[] => {
  const buildings = uniq(
    resources.map((resource) => resource?.space?.unit?.nameFi || "")
  ).filter((n) => n);
  const types = uniq(resources.map((resource) => resource.locationType)).filter(
    (n) => n
  );
  // const districts = uniq(spaces.map((space: Space) => space.building.district));

  return [
    {
      title: t("Resources.headings.unit"),
      filters:
        buildings &&
        buildings.map((building: string) => ({
          title: building,
          key: "space.unit.nameFi",
          value: building || "",
        })),
    },
    {
      title: t("Resources.headings.resourceType"),
      filters:
        types &&
        types.map((type: string) => ({
          title: type,
          key: "locationType",
          value: type || "",
        })),
    },
  ];
};

const ResourcesList = (): JSX.Element => {
  const { notifyError } = useNotification();
  const { t } = useTranslation();

  const [resources, setResources] = useState<ResourceType[]>([]);
  const [filterConfig, setFilterConfig] = useState<DataFilterConfig[] | null>(
    null
  );
  const [cellConfig, setCellConfig] = useState<CellConfig | null>(null);
  const [searchTerm, setSearchTerm] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, cancelTypeahead] = useDebounce(
    () => {
      setSearchTerm(searchValue);
    },
    300,
    [searchValue]
  );

  useQuery<Query>(RESOURCES_QUERY, {
    onCompleted: (data) => {
      const result = data?.resources?.edges?.map(
        (r) => r?.node as ResourceType
      );
      if (result) {
        setResources(result);
        setCellConfig(getCellConfig(t));
        setFilterConfig(getFilterConfig(result, t));
      }
      setIsLoading(false);
    },
    onError: (err: ApolloError) => {
      notifyError(err.message);
      setIsLoading(false);
    },
  });

  if (isLoading || !resources || !filterConfig || !cellConfig) {
    return <Loader />;
  }

  const filteredResources = searchTerm
    ? resources.filter((resource: ResourceType) => {
        const searchTerms = searchTerm.toLowerCase().split(" ");
        const { nameFi, space, locationType } = resource;
        const buildingName = space?.building?.nameFi;
        const localizedName = nameFi || "???";

        return searchTerms.every((term: string) => {
          return (
            localizedName.toLowerCase().includes(term) ||
            String(buildingName).toLowerCase().includes(term) ||
            String(locationType).toLowerCase().includes(term)
          );
        });
      })
    : resources;

  return (
    <>
      <BreadcrumbWrapper route={["spaces-n-settings", "resources"]} />
      <Wrapper>
        <IngressContainer>
          <H1>{t("Resources.resourceListHeading")}</H1>
          <p>{t("Resources.resourceListDescription")}</p>
          <SearchContainer>
            <IconSearch className="searchIcon" />
            <StyledInput
              id="resourcesSearch"
              placeholder={t("Resources.searchPlaceholder")}
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                cancelTypeahead();
                setSearchValue(event.target.value);
              }}
              value={searchValue || ""}
            />
            {searchValue && (
              <ClearButton
                onClick={() => {
                  setSearchTerm(null);
                  setSearchValue(null);
                }}
              />
            )}
          </SearchContainer>
          <ResourceCount>
            {resources.length} {t("common.volumeUnit")}
          </ResourceCount>
        </IngressContainer>
        <DataTable
          groups={[{ id: 1, data: filteredResources }]}
          hasGrouping={false}
          config={{ filtering: true, rowFilters: true }}
          cellConfig={cellConfig}
          filterConfig={filterConfig}
        />
      </Wrapper>
    </>
  );
};

export default withMainMenu(ResourcesList);
