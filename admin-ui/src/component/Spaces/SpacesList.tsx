import React, { useState, ChangeEvent } from "react";
import {
  IconArrowRight,
  IconGroup,
  Notification,
  TextInput,
  IconSearch,
} from "hds-react";
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
import { SPACES_QUERY } from "../../common/queries";
import { Query, SpaceType } from "../../common/gql-types";
import BreadcrumbWrapper from "../BreadcrumbWrapper";

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
    rowLink: ({ pk, unit }: SpaceType) => `unit/${unit?.pk}/space/edit/${pk}`,
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
  const { t } = useTranslation();

  const [spaces, setSpaces] = useState<SpaceType[]>([]);
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
      setErrorMsg(err.message);
      setIsLoading(false);
    },
  });

  if (errorMsg) {
    return (
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
      </Notification>
    );
  }

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
      <Wrapper>
        <IngressContainer>
          <H1>{t("Spaces.spaceListHeading")}</H1>
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
        </IngressContainer>
        <DataTable
          groups={[{ id: 1, data: filteredSpaces }]}
          hasGrouping={false}
          config={{ filtering: true, rowFilters: true }}
          cellConfig={cellConfig}
          filterConfig={filterConfig}
        />
      </Wrapper>
    </>
  );
};

export default withMainMenu(SpacesList);
