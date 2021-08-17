import React, { useState, useEffect, useMemo } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import classNames from "classnames";
import { IconArrowRight, IconSliders, Notification } from "hds-react";
import uniq from "lodash/uniq";
import { IngressContainer } from "../../styles/layout";
import withMainMenu from "../withMainMenu";
import { H1, H3 } from "../../styles/typography";
import FilterContainer, { FilterBtn } from "../FilterContainer";
import FilterControls from "../FilterControls";
import {
  DataFilterConfig,
  DataFilterOption,
  UnitWIP,
} from "../../common/types";
import Loader from "../Loader";
import { getUnits } from "../../common/api";
import {
  filterData,
  parseAddressLine1,
  parseAddressLine2,
} from "../../common/util";
import UnitCard from "./UnitCard";
import Map from "./Map";
import { ReactComponent as MapMarker } from "../../images/map_marker.svg";
import { BasicLink, breakpoints } from "../../styles/util";

const Wrapper = styled.div``;

const ResultCount = styled(H3)`
  margin-top: var(--spacing-3-xl);
`;

const PopupContainer = styled.div`
  min-width: 8rem;
  margin: var(--spacing-xs);
  @media (min-width: ${breakpoints.m}) {
    min-width: 12rem;
  }
`;

const PopupName = styled.div`
  font-family: var(--tilavaraus-admin-font-bold);
  line-height: 24px;
`;

const PopupAddress = styled.div`
  font-family: var(--tilavaraus-admin-font-medium);
  font-size: var(--fontsize-body-s);
  line-height: 26px;
`;

const PopupLink = styled(BasicLink)`
  font-family: var(--tilavaraus-admin-font-bold);
  justify-content: flex-end;
  width: 100%;
  font-size: var(--fontsize-body-s);
`;

const UnitList = styled.div`
  margin: var(--spacing-m);
`;

const getFilterConfig = (units: UnitWIP[]): DataFilterConfig[] => {
  const services = uniq(units.map((unit) => unit.service)).filter((n) => n);
  const areas = uniq(units.map((unit) => unit.area)).filter((n) => n);

  return [
    {
      title: "Unit.headings.service",
      filters: services.map((value) => ({
        title: value,
        key: "service",
        value: value || "",
      })),
    },
    {
      title: "Unit.headings.area",
      filters: areas.map((area) => ({
        title: area,
        key: "area",
        value: area,
      })),
    },
  ];
};

const Units = (): JSX.Element => {
  const [isLoading, setIsLoading] = useState(true);
  const [units, setUnits] = useState<UnitWIP[]>([]);
  const [filtersAreVisible, toggleFilterVisibility] = useState(false);
  const [filters, setFilters] = useState<DataFilterOption[]>([]);
  const [filterConfig, setFilterConfig] = useState<DataFilterConfig[] | null>(
    null
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { t } = useTranslation();

  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const result = await getUnits();
        setUnits(result);
        setFilterConfig(getFilterConfig(result));
      } catch (error) {
        setErrorMsg("errors.errorFetchingData");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUnits();
  }, []);

  const filteredResults = useMemo(
    () => filterData(units, filters),
    [units, filters]
  );

  if (isLoading) {
    return <Loader />;
  }

  return (
    <Wrapper>
      <Map
        markers={filteredResults.map((r) => ({
          latitude: r.location.latitude,
          longitude: r.location.longitude,
          marker: MapMarker,
          children: (
            <PopupContainer>
              <PopupName>{r.name}</PopupName>
              <PopupAddress>{parseAddressLine1(r.location)}</PopupAddress>
              <PopupAddress>{parseAddressLine2(r.location)}</PopupAddress>
              <PopupLink to={`/unit/${r.id}`}>
                {t("Unit.linkToUnitPage")}
                <IconArrowRight />
              </PopupLink>
            </PopupContainer>
          ),
        }))}
      />
      <IngressContainer>
        <H1>{t("MainMenu.units")}</H1>
        <ResultCount>
          {filteredResults.length > 0
            ? t("Unit.unitCount", { count: filteredResults.length })
            : t("Unit.noUnits")}
        </ResultCount>
      </IngressContainer>
      {filterConfig && (
        <FilterContainer>
          <>
            <FilterBtn
              data-testid="data-table__button--filter-toggle"
              iconLeft={<IconSliders aria-hidden />}
              onClick={(): void => toggleFilterVisibility(!filtersAreVisible)}
              className={classNames({
                filterControlsAreOpen: filtersAreVisible,
              })}
              $filterControlsAreOpen={filtersAreVisible}
              $filtersActive={filters.length > 0}
              title={t(
                `${filters.length > 0 ? "common.filtered" : "common.filter"}`
              )}
            >
              {t(`${filters.length > 0 ? "common.filtered" : "common.filter"}`)}
            </FilterBtn>
            <FilterControls
              filters={filters}
              visible={filtersAreVisible}
              applyFilters={setFilters}
              config={filterConfig}
            />
          </>
        </FilterContainer>
      )}
      <UnitList>
        {filteredResults.map((unit) => (
          <UnitCard unit={unit} key={unit.id} />
        ))}
      </UnitList>
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

export default withMainMenu(Units);
