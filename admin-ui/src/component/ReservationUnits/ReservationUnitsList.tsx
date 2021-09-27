import React, { useState, ChangeEvent } from "react";
import {
  IconArrowRight,
  Notification,
  TextInput,
  IconSearch,
  IconGroup,
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
  ReservationUnitType,
} from "../../common/types";
import { IngressContainer } from "../../styles/layout";
import { H1 } from "../../styles/typography";
import withMainMenu from "../withMainMenu";
import Loader from "../Loader";
import DataTable, { CellConfig } from "../DataTable";
import { localizedValue } from "../../common/util";
import { breakpoints, Strong } from "../../styles/util";
import ClearButton from "../ClearButton";
import { RESERVATION_UNITS_QUERY } from "../../common/queries";

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
        title: t("ReservationUnits.headings.name"),
        key: "name",
        transform: ({ name }: ReservationUnitType) => (
          <Strong>{localizedValue(name, language)}</Strong>
        ),
      },
      {
        title: t("ReservationUnits.headings.unitName"),
        key: "unit.name",
        transform: ({ unit }: ReservationUnitType) => unit.name,
      },
      {
        title: t("ReservationUnits.headings.district"),
        key: "unit.district.name",
      },
      {
        title: t("ReservationUnits.headings.reservationUnitType"),
        key: "reservationUnitType.name",
        transform: ({ reservationUnitType }: ReservationUnitType) => (
          <div
            style={{
              display: "flex",
              alignContent: "center",
              justifyContent: "space-between",
            }}
          >
            <span>{reservationUnitType?.name || "?"}</span>
            <IconArrowRight />
          </div>
        ),
      },
      {
        title: t("ReservationUnits.headings.maxPersons"),
        key: "maxPersons",
        transform: ({ maxPersons }: ReservationUnitType) => (
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
        title: t("ReservationUnits.headings.surfaceArea"),
        key: "surfaceArea",
        transform: ({ surfaceArea }: ReservationUnitType) => (
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
    rowLink: ({ pk }: ReservationUnitType) => `/ReservationUnits/${pk}`,
  };
};

const getFilterConfig = (
  reservationUnits: ReservationUnitType[],
  t: TFunction
): DataFilterConfig[] => {
  const types = uniq(
    reservationUnits.map(
      (reservationUnit) => reservationUnit.reservationUnitType?.name
    )
  ).filter((n) => Boolean(n));

  return [
    {
      title: t("ReservationUnits.headings.reservationUnitType"),
      filters:
        types &&
        types.map((type: string) => ({
          title: type,
          key: "reservationUnitType.name",
          value: type || "",
        })),
    },
  ];
};

const ReservationUnitsList = (): JSX.Element => {
  const { t, i18n } = useTranslation();

  const [resources, setResources] = useState<ReservationUnitType[]>([]);
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

  useQuery(RESERVATION_UNITS_QUERY, {
    onCompleted: (data) => {
      const result = data?.reservationUnits?.edges?.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ({ node }: any) => node
      );
      setResources(result);
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
    ? resources.filter((reservationUnit: ReservationUnitType) => {
        const searchTerms = searchTerm.toLowerCase().split(" ");
        const { name } = reservationUnit;
        const localizedName = localizedValue(name, i18n.language);
        const unitName = reservationUnit.unit.name;

        return searchTerms.every((term: string) => {
          return (
            localizedName.toLowerCase().includes(term) ||
            String(unitName).toLowerCase().includes(term)
          );
        });
      })
    : resources;

  return (
    <Wrapper>
      <IngressContainer>
        <H1>{t("ReservationUnits.reservationUnitListHeading")}</H1>
        <p>{t("ReservationUnits.reservationUnitListDescription")}</p>
        <SearchContainer>
          <IconSearch className="searchIcon" />
          <StyledInput
            id="resourcesSearch"
            placeholder={t("ReservationUnits.searchPlaceHolder")}
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

export default withMainMenu(ReservationUnitsList);
