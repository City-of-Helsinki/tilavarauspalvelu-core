import React, { useState, ChangeEvent } from "react";
import { IconArrowRight, Notification, TextInput, IconSearch } from "hds-react";
import { TFunction } from "i18next";
import { uniq } from "lodash";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { useDebounce } from "react-use";
import { useQuery, ApolloError } from "@apollo/client";

import { DataFilterConfig, LocalizationLanguages } from "../../common/types";
import { IngressContainer } from "../../styles/layout";
import { H1 } from "../../styles/typography";
import withMainMenu from "../withMainMenu";
import Loader from "../Loader";
import DataTable, { CellConfig } from "../DataTable";
import { isTranslationObject, localizedValue } from "../../common/util";
import { breakpoints, Strong } from "../../styles/util";
import ClearButton from "../ClearButton";
import { RESOURCES_QUERY } from "../../common/queries";
import { Query, ResourceType } from "../../common/gql-types";

const Wrapper = styled.div`
  padding: var(--spacing-layout-2-xl) 0;
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

const getCellConfig = (
  t: TFunction,
  language: LocalizationLanguages
): CellConfig => {
  return {
    cols: [
      {
        title: t("Resources.headings.name"),
        key: "name",
        transform: ({ name }: ResourceType) => (
          <Strong>{localizedValue(name, language)}</Strong>
        ),
      },
      {
        title: t("Resources.headings.building"),
        key: "space.building.name",
      },
      {
        title: t("Resources.headings.district"),
        key: "space.building.district.name",
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
    index: "id",
    sorting: "name",
    order: "asc",
    rowLink: ({ pk }: ResourceType) => `/resources/${pk}`,
  };
};

const getFilterConfig = (
  resources: ResourceType[],
  t: TFunction
): DataFilterConfig[] => {
  const buildings = uniq(
    resources.map((resource) => resource?.space?.building?.name || "")
  ).filter((n) => n);
  const types = uniq(resources.map((resource) => resource.locationType)).filter(
    (n) => n
  );
  // const districts = uniq(spaces.map((space: Space) => space.building.district));

  return [
    {
      title: t("Resources.headings.building"),
      filters:
        buildings &&
        buildings.map((building: string) => ({
          title: building,
          key: "space.building.name",
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
  const { t, i18n } = useTranslation();

  const [resources, setResources] = useState<ResourceType[]>([]);
  const [filterConfig, setFilterConfig] = useState<DataFilterConfig[] | null>(
    null
  );
  const [cellConfig, setCellConfig] = useState<CellConfig | null>(null);
  const [searchTerm, setSearchTerm] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
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
        setCellConfig(getCellConfig(t, i18n.language as LocalizationLanguages));
        setFilterConfig(getFilterConfig(result, t));
      }
      setIsLoading(false);
    },
    onError: (err: ApolloError) => {
      setErrorMsg(err.message);
      setIsLoading(false);
    },
  });

  if (errorMsg) {
    <Notification
      type="error"
      label={t("errors.functionFailed")}
      position="top-center"
      autoClose={false}
      dismissible
      closeButtonLabelText={t("common.close")}
      displayAutoCloseProgress={false}
      onClose={() => setErrorMsg(null)}
    >
      {t(errorMsg)}
    </Notification>;
  }

  if (isLoading || !resources || !filterConfig || !cellConfig) {
    return <Loader />;
  }

  const filteredResources = searchTerm
    ? resources.filter((resource: ResourceType) => {
        const searchTerms = searchTerm.toLowerCase().split(" ");
        const { name, space, locationType } = resource;
        const buildingName = space?.building?.name;
        const localizedName =
          name && isTranslationObject(name)
            ? localizedValue(name, i18n.language as LocalizationLanguages)
            : String(name);

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
  );
};

export default withMainMenu(ResourcesList);
