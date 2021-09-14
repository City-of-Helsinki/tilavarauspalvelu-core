import { IconSliders } from "hds-react";
import { uniq } from "lodash";
import React, { useMemo, useState } from "react";
import i18next from "i18next";

import { useTranslation } from "react-i18next";
import {
  DataFilterConfig,
  DataFilterOption,
  ReservationUnitType,
} from "../../common/types";
import { filterData } from "../../common/util";
import FilterContainer, { FilterBtn } from "../FilterContainer";
import FilterControls from "../FilterControls";
import ReservationUnitCard from "./ReservationUnitCard";
import { ContentContainer } from "../../styles/layout";

interface IProps {
  reservationUnits: ReservationUnitType[];
}

const getFilterConfig = (units: ReservationUnitType[]): DataFilterConfig[] => {
  const types = uniq(units.map((unit) => unit.reservationUnitType));
  const status = uniq(units.map((unit) => unit.status));

  return [
    {
      title: "ReservationUnit.headings.service",
      filters: types.map((value) => ({
        title: value.name || "",
        key: "reservationUnitType.pk",
        value: value.pk,
      })),
    },
    {
      // wip no api yet
      title: "ReservationUnit.headings.status",
      filters: status.map((value) => ({
        title: i18next.t(value),
        key: "status",
        value,
      })),
    },
  ];
};

const ReservationUnitList = ({ reservationUnits }: IProps): JSX.Element => {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<DataFilterOption[]>([]);
  const filterConfig = getFilterConfig(reservationUnits);
  const [filtersAreVisible, toggleFilterVisibility] = useState(false);

  const filteredResults = useMemo(
    () => filterData(reservationUnits, filters),
    [reservationUnits, filters]
  );

  return (
    <>
      <FilterContainer>
        <>
          <FilterBtn
            data-testid="data-table__button--filter-toggle"
            iconLeft={<IconSliders aria-hidden />}
            onClick={(): void => toggleFilterVisibility(!filtersAreVisible)}
            className={filtersAreVisible ? "filterControlsAreOpen" : ""}
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
      <ContentContainer>
        <div>
          {filteredResults.map((resUnit) => (
            <ReservationUnitCard reservationUnit={resUnit} key={resUnit.pk} />
          ))}
        </div>
      </ContentContainer>
    </>
  );
};

export default ReservationUnitList;
