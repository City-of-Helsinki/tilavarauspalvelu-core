import React, { useState, useEffect, ChangeEvent } from "react";
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
import {
  DataFilterConfig,
  LocalizationLanguages,
  Space,
} from "../../common/types";
import { IngressContainer } from "../../styles/layout";
import { H1 } from "../../styles/typography";
import withMainMenu from "../withMainMenu";
import { getSpaces } from "../../common/api";
import Loader from "../Loader";
import DataTable, { CellConfig } from "../DataTable";
import { isTranslationObject, localizedValue } from "../../common/util";
import { breakpoints, Strong } from "../../styles/util";
import ClearButton from "../ClearButton";

const Wrapper = styled.div`
  padding-top: var(--spacing-layout-2-xl);
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
        title: t("Spaces.headings.unit"),
        key: "building.name",
      },
      {
        title: t("Spaces.headings.district"),
        key: "building.district",
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
            <span>{maxPersons}</span>
          </div>
        ),
      },
      {
        title: t("Spaces.headings.size"),
        key: "building.surfaceArea",
        transform: ({ surfaceArea }: Space) => (
          <div
            style={{
              display: "flex",
              alignContent: "center",
              justifyContent: "space-between",
            }}
          >
            <span>{surfaceArea}</span>
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
  // eslint-disable-next-line no-console
  console.log(uniq, spaces, t);
  // const units = uniq(spaces.map((space: Space) => space.building));
  // const districts = uniq(spaces.map((space: Space) => space.building.district));

  return [
    // {
    //   title: t("Spaces.headings.unit"),
    //   filters:
    //     units &&
    //     units.map((unit: ReservationUnitBuilding) => ({
    //       title: unit.name,
    //       key: "building.name",
    //       value: unit.name || "",
    //     })),
    // },
    // {
    //   title: t("Spaces.headings.district"),
    //   filters:
    //     districts &&
    //     districts.map((district: number) => ({
    //       title: String(district),
    //       key: "building.district",
    //       value: district || "",
    //     })),
    // },
  ];
};

const SpacesList = (): JSX.Element => {
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

  const { t, i18n } = useTranslation();

  useEffect(() => {
    const fetchSpaces = async () => {
      setErrorMsg(null);
      setIsLoading(true);

      try {
        const result = await getSpaces();
        setCellConfig(getCellConfig(t, i18n.language as LocalizationLanguages));
        setFilterConfig(getFilterConfig(result, t));
        setSpaces(result);
      } catch (error) {
        setErrorMsg(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSpaces();
  }, [t, i18n]);

  if (isLoading || !filterConfig || !cellConfig) {
    return <Loader />;
  }

  const filteredSpaces = searchTerm
    ? spaces.filter((space: Space) => {
        const searchTerms = searchTerm.toLowerCase().split(" ");
        // const { name, building } = space;
        const { name } = space;
        // const { name: unit, district } = building;
        const localizedName =
          name && isTranslationObject(name)
            ? localizedValue(name, i18n.language as LocalizationLanguages)
            : String(name);

        return searchTerms.every((term: string) => {
          return localizedName.toLowerCase().includes(term);
          // || String(unit).toLowerCase().includes(term) ||
          // String(district).toLowerCase().includes(term)
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
      {errorMsg && (
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
      )}
    </Wrapper>
  );
};

export default withMainMenu(SpacesList);
