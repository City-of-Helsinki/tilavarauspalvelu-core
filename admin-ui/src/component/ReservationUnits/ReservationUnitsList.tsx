import React, { useState } from "react";
import { IconArrowRight, Notification, IconSearch, IconGroup } from "hds-react";
import { TFunction } from "i18next";
import { uniq } from "lodash";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { useQuery, ApolloError } from "@apollo/client";

import { DataFilterConfig, LocalizationLanguages } from "../../common/types";
import { IngressContainer } from "../../styles/layout";
import { H1 } from "../../styles/typography";
import withMainMenu from "../withMainMenu";
import Loader from "../Loader";
import DataTable, { CellConfig } from "../DataTable";
import { localizedPropValue } from "../../common/util";
import { BasicLink, Strong } from "../../styles/util";
import { RESERVATION_UNITS_QUERY } from "../../common/queries";
import {
  Query,
  QueryReservationUnitArgs,
  ReservationUnitType,
} from "../../common/gql-types";

const Wrapper = styled.div`
  padding: var(--spacing-layout-2-xl) 0;
`;

const SearchContainer = styled.div`
  margin: var(--spacing-layout-l) 0;
`;

const ReservationUnitCount = styled.div`
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
        key: "nameFi",
        transform: ({ nameFi }: ReservationUnitType) => (
          <Strong>{nameFi}</Strong>
        ),
      },
      {
        title: t("ReservationUnits.headings.unitName"),
        key: "unit.nameFi",
        transform: (resUnit: ReservationUnitType) =>
          localizedPropValue(resUnit, "unit.name", language),
      },
      {
        title: t("ReservationUnits.headings.district"),
        key: "unit.district.nameFi",
        transform: (resUnit: ReservationUnitType) =>
          localizedPropValue(resUnit, "unit.district.name", language),
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
            <span>
              {localizedPropValue(reservationUnitType, "name", language)}
            </span>
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
    rowLink: ({ pk, unit }: ReservationUnitType) =>
      `/unit/${unit?.pk}/reservationUnit/edit/${pk}`,
  };
};

const getFilterConfig = (
  reservationUnits: ReservationUnitType[],
  t: TFunction
): DataFilterConfig[] => {
  const types = uniq(
    reservationUnits.map(
      (reservationUnit) => reservationUnit.reservationUnitType?.nameFi
    )
  ).filter((n) => Boolean(n));

  return [
    {
      title: t("ReservationUnits.headings.reservationUnitType"),
      filters:
        types &&
        types.map((type) => ({
          title: type || "?",
          key: "reservationUnitType.name",
          value: type || "",
        })),
    },
  ];
};

const ReservationUnitsList = (): JSX.Element => {
  const { t, i18n } = useTranslation();

  const [reservationUnits, setReservationUnits] = useState<
    ReservationUnitType[]
  >([]);
  const [filterConfig, setFilterConfig] = useState<DataFilterConfig[] | null>(
    null
  );
  const [cellConfig, setCellConfig] = useState<CellConfig | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useQuery<Query, QueryReservationUnitArgs>(RESERVATION_UNITS_QUERY, {
    onCompleted: (data) => {
      const result = data?.reservationUnits?.edges?.map(
        (ru) => ru?.node as ReservationUnitType
      );
      if (result) {
        setReservationUnits(result);
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

  if (isLoading || !reservationUnits || !filterConfig || !cellConfig) {
    return <Loader />;
  }

  return (
    <Wrapper>
      <IngressContainer>
        <H1>{t("ReservationUnits.reservationUnitListHeading")}</H1>
        <p>{t("ReservationUnits.reservationUnitListDescription")}</p>
        <SearchContainer>
          <BasicLink to="/reservationUnits/search">
            <IconSearch />
            {t("ReservationUnits.switchToSearch")}
          </BasicLink>
        </SearchContainer>
        <ReservationUnitCount>
          {reservationUnits.length} {t("common.volumeUnit")}
        </ReservationUnitCount>
      </IngressContainer>
      <DataTable
        groups={[{ id: 1, data: reservationUnits }]}
        hasGrouping={false}
        config={{ filtering: true, rowFilters: true }}
        cellConfig={cellConfig}
        filterConfig={filterConfig}
      />
    </Wrapper>
  );
};

export default withMainMenu(ReservationUnitsList);
