import React, { useState } from "react";
import styled from "styled-components";
import { Button, IconArrowDown, IconArrowUp, IconSliders } from "hds-react";
import { useTranslation } from "react-i18next";
import orderBy from "lodash/orderBy";
import classNames from "classnames";
import { truncatedText } from "../styles/typography";
import { breakpoints, getGridFraction } from "../styles/util";
import { Application } from "../common/types";

type DataType = Application;

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
}

interface IProps {
  data: DataType[];
  cellConfig: CellConfig;
  className?: string;
}

const Wrapper = styled.div``;

const Filters = styled.div`
  background-color: var(--tilavaraus-admin-gray);
  padding: 0 var(--spacing-xl);
`;

const FilterBtn = styled(Button).attrs({
  style: {
    "--color-bus": "transparent",
    "--color-bus-dark": "--tilavaraus-admin-gray",
    "--color-white": "--tilavaraus-admin-content-text-color",
  },
})``;

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

const Row = styled.tr``;

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
        margin-left: 0.5em;
      }
    }

    font-weight: normal;
    text-align: left;
    cursor: pointer;
    user-select: none;
  }
`;

const Body = styled.tbody`
  ${Row} {
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
  order: "asc" | "desc"
): DataType[] => {
  return orderBy(data, [sorting], [order]);
};

function DataTable({ data, cellConfig, className }: IProps): JSX.Element {
  const [sorting, setSorting] = useState<string>(cellConfig.sorting);
  const [order, setOrder] = useState<OrderTypes>(cellConfig.order);

  const setSortingAndOrder = (colKey: string): void => {
    if (sorting === colKey) {
      setOrder(order === "desc" ? "asc" : "desc");
    } else {
      setOrder("asc");
    }
    setSorting(colKey);
  };

  const { t } = useTranslation();

  const processedData = processData(data, sorting, order);

  return (
    <Wrapper className={className}>
      <Filters>
        <FilterBtn iconLeft={<IconSliders />} onClick={() => {}}>
          {t("common.filter")}
        </FilterBtn>
      </Filters>
      <TableWrapper>
        <Table>
          <Heading>
            <Row>
              {cellConfig.cols.map((col) => {
                const sortingActive = col.key === sorting;
                return (
                  <Cell
                    as="th"
                    key={col.key}
                    onClick={() => setSortingAndOrder(col.key)}
                    className={classNames({ sortingActive })}
                  >
                    <span>{col.title}</span>
                    {sortingActive && <SortingArrow direction={order} />}
                  </Cell>
                );
              })}
            </Row>
          </Heading>
          <Body>
            {processedData.map((row: DataType) => (
              <Row key={`${sorting}${order}${row[cellConfig.index]}`}>
                {cellConfig.cols.map((col: Column) => {
                  const value = col.transform
                    ? col.transform(row)
                    : row[col.key];
                  return <Cell>{value}</Cell>;
                })}
              </Row>
            ))}
          </Body>
        </Table>
      </TableWrapper>
    </Wrapper>
  );
}

export default DataTable;
