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
import {
  DataFilterConfig,
  LocalizationLanguages,
  Space,
} from "../../common/types";
import { IngressContainer } from "../../styles/layout";
import { H1 } from "../../styles/typography";
import withMainMenu from "../withMainMenu";
import Loader from "../Loader";
import DataTable, { CellConfig } from "../DataTable";
import { isTranslationObject, localizedValue } from "../../common/util";
import { breakpoints, Strong } from "../../styles/util";
import ClearButton from "../ClearButton";
import { SPACES_QUERY } from "../../common/queries";

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

const SpaceCount = styled.div`
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
        title: t("Spaces.headings.name"),
        key: "name",
        transform: ({ name }: Space) => (
          <Strong>{localizedValue(name, language)}</Strong>
        ),
      },
      {
        title: t("Spaces.headings.building"),
        key: "building.name",
      },
      {
        title: t("Spaces.headings.district"),
        key: "building.district.name",
      },
      {
        title: t("Spaces.headings.volume"),
        key: "maxPersons",
        transform: ({ maxPersons }: Space) => (
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
        transform: ({ surfaceArea }: Space) => (
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
    index: "id",
    sorting: "name",
    order: "asc",
    rowLink: ({ id }: Space) => `/spaces/${id}`,
  };
};

const getFilterConfig = (spaces: Space[], t: TFunction): DataFilterConfig[] => {
  const buildings = uniq(
    spaces.map((space: Space) => space?.building?.name || "")
  ).filter((n) => n);
  const districts = uniq(
    spaces
      .map((space: Space) => space?.building?.district?.name || "")
      .filter((n) => n)
  );

  return [
    {
      title: t("Spaces.headings.building"),
      filters:
        buildings &&
        buildings.map((building: string) => ({
          title: building,
          key: "building.name",
          value: building,
        })),
    },
    {
      title: t("Spaces.headings.district"),
      filters:
        districts &&
        districts.map((district: string) => ({
          title: district,
          key: "building.district.name",
          value: district,
        })),
    },
  ];
};

const SpacesList = (): JSX.Element => {
  const { t, i18n } = useTranslation();

  const [spaces, setSpaces] = useState<Space[]>([]);
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

  useQuery(SPACES_QUERY, {
    onCompleted: (data) => {
      const result = data?.spaces?.edges?.map(({ node }: any) => node); // eslint-disable-line
      setSpaces(result);
      setCellConfig(getCellConfig(t, i18n.language as LocalizationLanguages));
      setFilterConfig(getFilterConfig(result, t));
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
    ? spaces.filter((space: Space) => {
        const searchTerms = searchTerm.toLowerCase().split(" ");
        const { name, building } = space;
        const buildingName = building?.name?.toLowerCase();
        const districtName = building?.district?.name?.toLowerCase();
        const localizedName =
          name && isTranslationObject(name)
            ? localizedValue(
                name,
                i18n.language as LocalizationLanguages
              ).toLowerCase()
            : String(name).toLowerCase();

        return searchTerms.every((term: string) => {
          return (
            localizedName?.includes(term) ||
            buildingName?.includes(term) ||
            districtName?.includes(term)
          );
        });
      })
    : spaces;

  return (
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
  );
};

export default withMainMenu(SpacesList);
