import React, { useState } from "react";
import styled from "styled-components";
import { Button, IconArrowDown, IconArrowUp, IconSliders } from "hds-react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import orderBy from "lodash/orderBy";
import get from "lodash/get";
import classNames from "classnames";
import { truncatedText } from "../styles/typography";
import { breakpoints, getGridFraction } from "../styles/util";
import FilterControls from "./FilterControls";
import {
  Application as ApplicationType,
  DataFilterConfig,
  DataFilterOption,
} from "../common/types";

type DataType = ApplicationType;

type OrderTypes = "asc" | "desc";

interface Column {
  title: string;
  key: string;
  transform?: (arg0: DataType) => string | JSX.Element;
}

export interface CellConfig {
  cols: Column[];
  index: string;
  sorting: string;
  order: OrderTypes;
  rowLink?: (arg0: string | number) => string;
}

interface IProps {
  data: DataType[];
  cellConfig: CellConfig;
  filterConfig: DataFilterConfig[];
  className?: string;
}

const Wrapper = styled.div``;

const Filters = styled.div`
  background-color: var(--tilavaraus-admin-gray);
  padding: 0 var(--spacing-xl);
  display: flex;
  align-items: center;
  justify-content: flex-start;
  height: 56px;
  position: relative;
`;

interface IFilterBtn {
  $filterControlsAreOpen: boolean;
  $filtersActive: boolean;
}

const FilterBtn = styled(Button).attrs(
  ({ $filterControlsAreOpen, $filtersActive }: IFilterBtn) => ({
    style: {
      "--filter-button-color": $filtersActive
        ? "var(--tilavaraus-admin-blue-dark)"
        : $filterControlsAreOpen
        ? "var(--color-silver)"
        : "transparent",
      "--color-bus": "var(--filter-button-color)",
      "--color-bus-dark": "var(--filter-button-color)",
      "--color-white": $filtersActive
        ? "white"
        : "var(--tilavaraus-admin-content-text-color)",
    } as React.CSSProperties,
  })
)<IFilterBtn>`
  ${({ $filtersActive }) =>
    $filtersActive &&
    `
    font-family: var(--tilavaraus-admin-font-bold);
    font-weight: bold;
  `}
`;

const tableBorder = (size = "0.5em") =>
  `${size} solid var(--tilavaraus-admin-gray)`;

const TableWrapper = styled.div`
  &:after {
    content: "";
    position: absolute;
    top: calc(var(--spacing-4-xl) - 12px);
    left: 0;
    right: 0;
    width: 100%;
    height: 12px;
    box-shadow: 0px 12px 16px 0 rgba(0, 0, 0, 0.13);
    z-index: 1;
  }

  position: relative;
  overflow-x: auto;
  width: 100%;
`;

const Table = styled.table`
  width: 100%;
  min-width: var(--breakpoint-m);
  padding: 0 var(--spacing-m);
  border-spacing: 0;

  @media (min-width: ${breakpoints.m}) {
    min-width: auto;
  }

  @media (min-width: ${breakpoints.xl}) {
    padding-right: ${getGridFraction(1)}%;
  }
`;

const Cell = styled.td`
  &:after {
    content: "";
    position: absolute;
    top: 1rem;
    right: 0;
    width: 1px;
    height: 2rem;
    background-color: #dadada;
  }

  &:first-of-type {
    padding-left: var(--spacing-m);
  }

  &:last-of-type {
    &:after {
      display: none;
    }

    border-right: 0 none;
  }

  ${truncatedText}
  position: relative;
  height: var(--spacing-4-xl);
  padding: 0 var(--spacing-xs);
`;

const Row = styled.tr<{ $clickable?: boolean }>`
  ${({ $clickable }) => $clickable && "cursor: pointer;"}
`;

const Heading = styled.thead`
  ${Cell} {
    &:first-of-type {
      padding-left: calc(0.5em + var(--spacing-m));
    }

    &.sortingActive {
      svg {
        position: absolute;
        top: 1.2em;
        transform: scale(0.7);
      }
    }

    ${truncatedText}
    font-weight: normal;
    text-align: left;
    user-select: none;
    cursor: pointer;
  }
`;

const Body = styled.tbody`
  ${Row} {
    &:hover {
      ${Cell} {
        background-color: var(--color-silver-light);
      }
    }
    &:first-of-type {
      ${Cell} {
        &:first-of-type {
          border-left: ${tableBorder()};
        }

        &:last-of-type {
          border-right: ${tableBorder()};
        }

        border-top: ${tableBorder("0.3em")};
      }
    }

    &:last-of-type {
      ${Cell} {
        &:first-of-type {
          border-left: ${tableBorder()};
        }

        &:last-of-type {
          border-right: ${tableBorder()};
        }
        border-bottom: ${tableBorder()};
      }
    }

    ${Cell} {
      &:first-of-type {
        border-left: ${tableBorder()};
      }
      &:last-of-type {
        border-right: ${tableBorder()};
      }

      border-bottom: ${tableBorder("0.3em")};
    }
  }
`;

interface SortingProps {
  direction: OrderTypes;
}

function SortingArrow({ direction }: SortingProps): JSX.Element {
  return direction === "asc" ? <IconArrowDown /> : <IconArrowUp />;
}

const processData = (
  data: DataType[],
  sorting: string,
  order: "asc" | "desc",
  filters: DataFilterOption[]
): DataType[] => {
  if (filters.length > 0) {
    const filteredData = data.filter((row) => {
      return (
        filters.filter((filter) => row[filter.key] === filter.value).length > 0
      );
    });

    return orderBy(filteredData, [sorting], [order]);
  }

  return orderBy(data, [sorting], [order]);
};

function DataTable({
  data,
  cellConfig,
  filterConfig,
  className,
}: IProps): JSX.Element {
  const [sorting, setSorting] = useState<string>(cellConfig.sorting);
  const [order, setOrder] = useState<OrderTypes>(cellConfig.order);
  const [filtersAreVisible, toggleFilterVisibility] = useState(false);
  const [filters, setFilters] = useState<DataFilterOption[]>([]);

  const setSortingAndOrder = (colKey: string): void => {
    if (sorting === colKey) {
      setOrder(order === "desc" ? "asc" : "desc");
    } else {
      setOrder("asc");
    }
    setSorting(colKey);
  };

  const { t } = useTranslation();
  const history = useHistory();

  const processedData = processData(data, sorting, order, filters);
  const sortingEnabled = processedData.length > 0;

  return (
    <Wrapper className={className}>
      <Filters>
        <FilterBtn
          iconLeft={<IconSliders />}
          onClick={() => toggleFilterVisibility(!filtersAreVisible)}
          className={classNames({ filterControlsAreOpen: filtersAreVisible })}
          $filterControlsAreOpen={filtersAreVisible}
          $filtersActive={filters.length > 0}
        >
          {t(`${filters.length > 0 ? "common.filtered" : "common.filter"}`)}
        </FilterBtn>
        <FilterControls
          filters={filters}
          visible={filtersAreVisible}
          applyFilters={setFilters}
          config={filterConfig}
        />
      </Filters>
      <TableWrapper>
        <Table>
          <Heading>
            <Row>
              {cellConfig.cols.map((col) => {
                const sortingActive = sortingEnabled && col.key === sorting;
                const title = t(col.title);
                return (
                  <Cell
                    as="th"
                    key={col.key}
                    onClick={() =>
                      sortingEnabled && setSortingAndOrder(col.key)
                    }
                    className={classNames({ sortingActive })}
                    title={title}
                  >
                    <span>{title}</span>
                    {sortingActive && <SortingArrow direction={order} />}
                  </Cell>
                );
              })}
            </Row>
          </Heading>
          <Body>
            {processedData.length > 0 ? (
              processedData.map((row: DataType) => {
                const rowKey = `${sorting}${order}${get(
                  row,
                  cellConfig.index
                )}`;
                return (
                  <Row
                    key={rowKey}
                    onClick={() => {
                      if (cellConfig.rowLink) {
                        const dataIndex = get(row, cellConfig.index);
                        const link = cellConfig.rowLink(dataIndex);
                        history.push(link);
                      }
                    }}
                    $clickable={!!cellConfig.rowLink}
                  >
                    {cellConfig.cols.map((col: Column) => {
                      const colKey = `${rowKey}${col.key}`;
                      const value = col.transform
                        ? col.transform(row)
                        : get(row, col.key);
                      return <Cell key={colKey}>{value}</Cell>;
                    })}
                  </Row>
                );
              })
            ) : (
              <Row>
                <Cell colSpan={cellConfig.cols.length}>
                  {t("common.noResults")}
                </Cell>
              </Row>
            )}
          </Body>
        </Table>
      </TableWrapper>
    </Wrapper>
  );
}

export default DataTable;
