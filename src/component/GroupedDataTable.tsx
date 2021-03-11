import React, { useState } from "react";
import styled from "styled-components";
import {
  Button,
  IconArrowDown,
  IconArrowUp,
  IconEye,
  IconEyeCrossed,
  IconSliders,
} from "hds-react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import orderBy from "lodash/orderBy";
import get from "lodash/get";
import isEqual from "lodash/isEqual";
import classNames from "classnames";
import FilterControls from "./FilterControls";
import {
  Application as ApplicationType,
  DataFilterConfig,
  DataFilterOption,
} from "../common/types";
import RecommendationDataTableGroup from "./ApplicationRound/RecommendationDataTableGroup";
import {
  Body,
  Table,
  TableWrapper,
  Heading,
  Row,
  Cell,
  Filters,
  FilterBtn,
} from "./DataTable";
import { breakpoints, SelectionCheckbox } from "../styles/util";
import { ReactComponent as IconOpenAll } from "../images/icon_open-all.svg";
import { ReactComponent as IconActivateSelection } from "../images/icon_select.svg";
import { ReactComponent as IconDisableSelection } from "../images/icon_unselect.svg";

type DataType = ApplicationType;

type OrderTypes = "asc" | "desc";

interface Column {
  title: string;
  key: string;
  transform?: (arg0: any) => string | JSX.Element;
}

export interface CellConfig {
  cols: Column[];
  index: string;
  sorting: string;
  order: OrderTypes;
  rowLink?: (arg0: string | number) => string;
}

interface IProps {
  groups: DataType[];
  cellConfig: CellConfig;
  filterConfig: DataFilterConfig[] | null;
  className?: string;
}

interface IToggleableButton {
  $isActive: boolean;
}

const Wrapper = styled.div``;

const HideHandledBtn = styled(Button).attrs(
  ({ $isActive }: IToggleableButton) => ({
    iconLeft: $isActive ? <IconEye /> : <IconEyeCrossed />,
    style: {
      "--filter-button-color": "transparent",
      "--color-bus": "var(--filter-button-color)",
      "--color-bus-dark": "var(--filter-button-color)",
      "--color-white": "var(--tilavaraus-admin-content-text-color)",
      "--background-color-disabled": "transparent",
      "--border-color-disabled": "transparent",
      "--color-disabled": "var(--color-black-50)",
    } as React.CSSProperties,
  })
)<IToggleableButton>``;

const ToggleVisibilityBtn = styled(Button).attrs({
  iconLeft: <IconOpenAll />,
  style: {
    "--filter-button-color": "transparent",
    "--color-bus": "var(--filter-button-color)",
    "--color-bus-dark": "var(--filter-button-color)",
    "--color-white": "var(--tilavaraus-admin-content-text-color)",
  } as React.CSSProperties,
})<IToggleableButton>`
  svg {
    ${({ $isActive }): string | false =>
      $isActive && "transform: rotate(180deg);"}
  }

  @media (min-width: ${breakpoints.xl}) {
    position: absolute;
    right: 6%;
  }
`;

const SelectionToggleBtn = styled(Button).attrs(
  ({ $isActive }: IToggleableButton) => ({
    iconLeft: $isActive ? <IconDisableSelection /> : <IconActivateSelection />,
    style: {
      "--filter-button-color": "transparent",
      "--color-bus": "var(--filter-button-color)",
      "--color-bus-dark": "var(--filter-button-color)",
      "--color-white": "var(--tilavaraus-admin-content-text-color)",
    } as React.CSSProperties,
  })
)<IToggleableButton>``;

const SelectionCell = styled(Cell)`
  &:after {
    content: none;
  }

  padding-right: var(--spacing-3-xs);
  width: calc(0.5em + var(--spacing-m));
  min-width: calc(0.5em + var(--spacing-m));
  overflow-x: visible !important;

  @media (min-width: ${breakpoints.l}) {
    width: var(--spacing-m);
    min-width: var(--spacing-m);
  }
`;

interface SortingProps {
  direction: OrderTypes;
}

function SortingArrow({ direction }: SortingProps): JSX.Element {
  return direction === "asc" ? <IconArrowDown /> : <IconArrowUp />;
}

const processData = (
  groups: any[],
  sorting: string,
  order: "asc" | "desc",
  filters: DataFilterOption[],
  handledAreHidden: boolean
): any[] => {
  return groups.map((group) => {
    let data;
    if (filters.length > 0) {
      const filteredData = group.applications.filter((row: any): boolean => {
        return (
          filters.filter(
            (filter): boolean => get(row, filter.key) === filter.value
          ).length === filters.length
        );
      });

      data = filteredData;
    } else {
      data = group.applications;
    }

    if (handledAreHidden) {
      data = data.filter((row: any): boolean => row.status !== "validated");
    }

    return {
      ...group,
      applications: orderBy(data, [sorting], [order]),
    };
  });
};

function GroupedDataTable({
  groups,
  cellConfig,
  filterConfig,
  className,
}: IProps): JSX.Element {
  const [sorting, setSorting] = useState<string>(cellConfig.sorting);
  const [order, setOrder] = useState<OrderTypes>(cellConfig.order);
  const [filtersAreVisible, toggleFilterVisibility] = useState(false);
  const [filters, setFilters] = useState<DataFilterOption[]>([]);
  const [handledAreHidden, toggleHideHandled] = useState<boolean>(false);
  const [groupVisibility, setGroupVisibility] = useState<boolean[]>(
    groups.map(() => true)
  );
  const [isSelectionActive, toggleSelectionActivity] = useState<boolean>(false);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);

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

  const processedData = processData(
    groups,
    sorting,
    order,
    filters,
    handledAreHidden
  );
  const sortingEnabled: boolean = processedData.length > 0;

  const filterSomeGroupsAreHidden: boolean = groupVisibility.some(
    (visibility): boolean => !visibility
  );

  const toggleGroupVisibility = (forceOpen = false): void => {
    const shouldOpen = forceOpen || filterSomeGroupsAreHidden;
    setGroupVisibility(groups.map((): boolean => shouldOpen));
  };

  const updateSelection = (
    selection: number[],
    method?: "add" | "remove"
  ): void => {
    let result: number[];
    if (method) {
      result =
        method === "add"
          ? [...selectedRows, ...selection]
          : [...selectedRows.filter((row) => !selection.includes(row))];
    } else {
      result = selection;
    }

    setSelectedRows(result.sort((a, b) => a - b));
  };

  const getRowIds = (group?: number): number[] => {
    return group
      ? processedData
          .find((data) => data.id === group)
          .applications.map((data: any) => data.id)
      : processedData.flatMap((data) =>
          data.applications.map((application: any) => application.id)
        );
  };

  return (
    <Wrapper className={className}>
      {filterConfig && (
        <Filters>
          <FilterBtn
            data-testid="data-table__button--filter-toggle"
            iconLeft={<IconSliders />}
            onClick={(): void => toggleFilterVisibility(!filtersAreVisible)}
            className={classNames({ filterControlsAreOpen: filtersAreVisible })}
            $filterControlsAreOpen={filtersAreVisible}
            $filtersActive={filters.length > 0}
            disabled={filterConfig.length < 1 || isSelectionActive}
          >
            {t(`${filters.length > 0 ? "common.filtered" : "common.filter"}`)}
          </FilterBtn>
          <FilterControls
            filters={filters}
            visible={filtersAreVisible}
            applyFilters={setFilters}
            config={filterConfig}
          />
          <HideHandledBtn
            onClick={(): void => toggleHideHandled(!handledAreHidden)}
            disabled={isSelectionActive}
            $isActive={handledAreHidden}
          >
            {t(
              `common.${
                handledAreHidden ? "filterShowHandled" : "filterHideHandled"
              }`
            )}
          </HideHandledBtn>
          <SelectionToggleBtn
            onClick={(): void => {
              if (!isSelectionActive) {
                toggleGroupVisibility(true);
              }
              toggleSelectionActivity(!isSelectionActive);
            }}
            $isActive={isSelectionActive}
          >
            {t(
              `common.${
                isSelectionActive ? "disableSelection" : "activateSelection"
              }`
            )}
          </SelectionToggleBtn>
          <ToggleVisibilityBtn
            onClick={(): void => {
              toggleGroupVisibility();
            }}
            $isActive={!filterSomeGroupsAreHidden}
          >
            {t(`common.${filterSomeGroupsAreHidden ? "openAll" : "closeAll"}`)}
          </ToggleVisibilityBtn>
        </Filters>
      )}
      <TableWrapper>
        <Table data-testid="data-table">
          <Heading>
            <Row>
              {isSelectionActive && (
                <SelectionCell as="th">
                  <SelectionCheckbox
                    id="recommendation-all-checkbox"
                    onChange={(e) => {
                      updateSelection(e.target.checked ? getRowIds() : []);
                    }}
                    checked={isEqual(selectedRows, getRowIds())}
                  />
                </SelectionCell>
              )}
              {cellConfig.cols.map(
                (col): JSX.Element => {
                  const sortingActive = sortingEnabled && col.key === sorting;
                  const title = t(col.title);
                  return (
                    <Cell
                      as="th"
                      key={col.key}
                      onClick={(): void | false =>
                        sortingEnabled && setSortingAndOrder(col.key)
                      }
                      className={classNames({ sortingActive })}
                      title={title}
                    >
                      <span>{title}</span>
                      {sortingActive && <SortingArrow direction={order} />}
                    </Cell>
                  );
                }
              )}
            </Row>
          </Heading>
          <Body>
            {groups.length > 0 ? (
              processedData.map(
                (group: any, groupIndex: number): JSX.Element => {
                  return (
                    <RecommendationDataTableGroup
                      group={group}
                      key={group.id}
                      cols={cellConfig.cols.length}
                      index={groupIndex}
                      isVisible={groupVisibility[groupIndex]}
                      toggleGroupVisibility={(): void => {
                        const tempGroupVisibility = [...groupVisibility];
                        tempGroupVisibility[groupIndex] = !tempGroupVisibility[
                          groupIndex
                        ];
                        setGroupVisibility(tempGroupVisibility);
                      }}
                      isSelectionActive={isSelectionActive}
                      isSelected={() => {
                        return getRowIds(group.id).every((id) =>
                          selectedRows.includes(id)
                        );
                      }}
                      toggleSelection={updateSelection}
                      getRowIds={getRowIds}
                    >
                      {group.applications.map(
                        (row: any): JSX.Element => {
                          const rowKey = `${sorting}${order}${get(
                            row,
                            cellConfig.index
                          )}`;

                          return (
                            <Row
                              key={rowKey}
                              onClick={(): void => {
                                const rowId: number = get(
                                  row,
                                  cellConfig.index
                                );
                                if (isSelectionActive) {
                                  updateSelection(
                                    [rowId],
                                    selectedRows.includes(rowId)
                                      ? "remove"
                                      : "add"
                                  );
                                } else if (cellConfig.rowLink) {
                                  const link: string = cellConfig.rowLink(
                                    rowId
                                  );
                                  history.push(link);
                                }
                              }}
                              $clickable={!!cellConfig.rowLink}
                            >
                              {isSelectionActive && (
                                <SelectionCell>
                                  <SelectionCheckbox
                                    id={`recommendation-row-checkbox-${get(
                                      row,
                                      cellConfig.index
                                    )}`}
                                    onChange={(e) => {
                                      updateSelection(
                                        [get(row, cellConfig.index)],
                                        e.target.checked ? "add" : "remove"
                                      );
                                    }}
                                    checked={selectedRows.includes(
                                      get(row, cellConfig.index)
                                    )}
                                  />
                                </SelectionCell>
                              )}
                              {cellConfig.cols.map(
                                (col: Column): JSX.Element => {
                                  const colKey = `${rowKey}${col.key}`;
                                  const value = col.transform
                                    ? col.transform(row)
                                    : get(row, col.key);
                                  return <Cell key={colKey}>{value}</Cell>;
                                }
                              )}
                            </Row>
                          );
                        }
                      )}
                    </RecommendationDataTableGroup>
                  );
                }
              )
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

export default GroupedDataTable;
