import React, { useState, ChangeEvent } from "react";
import { IconArrowRight, IconGroup, TextInput, IconSearch } from "hds-react";
import { TFunction } from "i18next";
import { uniq } from "lodash";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { H1, Strong } from "common/src/common/typography";
import { breakpoints } from "common/src/common/style";
import { useDebounce } from "react-use";
import { useQuery, ApolloError } from "@apollo/client";
import { Query, SpaceType } from "common/types/gql-types";
import { DataFilterConfig } from "../../common/types";
import withMainMenu from "../withMainMenu";
import Loader from "../Loader";
import DataTable, { CellConfig } from "../DataTable";
import ClearButton from "../ClearButton";
import { SPACES_QUERY } from "../../common/queries";
import BreadcrumbWrapper from "../BreadcrumbWrapper";
import { useNotification } from "../../context/NotificationContext";
import { spaceUrl } from "../../common/urls";
import { Container } from "../../styles/layout";

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

const SpaceCount = styled.div`
  font-family: var(--tilavaraus-admin-font-bold);
  font-weight: 700;
  font-size: var(--fontsize-heading-s);
  margin-bottom: var(--spacing-m);
`;

const getCellConfig = (t: TFunction): CellConfig => {
  return {
    cols: [
      {
        title: t("Spaces.headings.name"),
        key: "nameFi",
        transform: ({ nameFi }: SpaceType) => <Strong>{nameFi}</Strong>,
      },
      {
        title: t("Spaces.headings.unit"),
        key: "unit.nameFi",
      },
      {
        title: t("Spaces.headings.district"),
        key: "building.district.nameFi",
      },
      {
        title: t("Spaces.headings.volume"),
        key: "maxPersons",
        transform: ({ maxPersons }: SpaceType) => (
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
        title: t("Spaces.headings.size"),
        key: "surfaceArea",
        transform: ({ surfaceArea }: SpaceType) => (
          <div
            style={{
              display: "flex",
              alignContent: "center",
              justifyContent: "space-between",
            }}
          >
            <span>
              {surfaceArea || "?"}
              {t("common.areaUnitSquareMeter")}
            </span>
            <IconArrowRight />
          </div>
        ),
      },
    ],
    index: "pk",
    sorting: "name",
    order: "asc",
    rowLink: ({ pk, unit }: SpaceType) =>
      spaceUrl(Number(pk), Number(unit?.pk)),
  };
};

const getFilterConfig = (
  spaces: SpaceType[],
  t: TFunction
): DataFilterConfig[] => {
  const units = uniq(
    spaces.map((space: SpaceType) => space?.unit?.nameFi || "")
  ).filter((n) => n);

  return [
    {
      title: t("Spaces.headings.unit"),
      filters:
        units &&
        units.map((unit: string) => ({
          title: unit,
          key: "unit.nameFi",
          value: unit,
        })),
    },
  ];
};

const SpacesList = (): JSX.Element => {
  const { notifyError } = useNotification();
  const { t } = useTranslation();
  const [spaces, setSpaces] = useState<SpaceType[]>([]);
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

  useQuery<Query>(SPACES_QUERY, {
    onCompleted: (data) => {
      const result = data?.spaces?.edges?.map((s) => s?.node as SpaceType);
      if (result) {
        setSpaces(result);
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

  if (isLoading || !spaces || !filterConfig || !cellConfig) {
    return <Loader />;
  }

  const filteredSpaces = searchTerm
    ? spaces.filter((space: SpaceType) => {
        const searchTerms = searchTerm.toLowerCase().split(" ");
        const { nameFi, unit } = space;
        const unitName = unit?.nameFi?.toLowerCase();
        const localizedName = String(nameFi).toLowerCase();

        return searchTerms.every((term: string) => {
          return localizedName?.includes(term) || unitName?.includes(term);
        });
      })
    : spaces;

  return (
    <>
      <BreadcrumbWrapper route={["spaces-n-settings", "spaces"]} />
      <Container>
        <div>
          <H1 $legacy>{t("Spaces.spaceListHeading")}</H1>
          <p>{t("Spaces.spaceListDescription")}</p>
          <SearchContainer>
            <IconSearch className="searchIcon" />
            <StyledInput
              id="spacesSearch"
              placeholder={t("Spaces.searchPlaceholder")}
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
          <SpaceCount>
            {spaces.length} {t("common.volumeUnit")}
          </SpaceCount>
        </div>
        <DataTable
          groups={[{ id: 1, data: filteredSpaces }]}
          hasGrouping={false}
          config={{ filtering: true, rowFilters: true }}
          cellConfig={cellConfig}
          filterConfig={filterConfig}
        />
      </Container>
    </>
  );
};

export default withMainMenu(SpacesList);
