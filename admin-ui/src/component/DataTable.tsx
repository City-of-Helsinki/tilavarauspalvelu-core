import React, {
  Dispatch,
  SetStateAction,
  useEffect,
  useMemo,
  useState,
} from "react";
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
import pullAll from "lodash/pullAll";
import classNames from "classnames";
import FilterControls from "./FilterControls";
import { DataFilterConfig, DataFilterOption, DataGroup } from "../common/types";
import RecommendationDataTableGroup from "./ApplicationRound/RecommendationDataTableGroup";
import {
  breakpoints,
  getGridFraction,
  SelectionCheckbox,
} from "../styles/util";
import { ReactComponent as IconOpenAll } from "../images/icon_open-all.svg";
import { ReactComponent as IconActivateSelection } from "../images/icon_select.svg";
import { ReactComponent as IconDisableSelection } from "../images/icon_unselect.svg";
import { truncatedText } from "../styles/typography";
import FilterContainer, { FilterBtn } from "./FilterContainer";
import { filterData } from "../common/util";

export type OrderTypes = "asc" | "desc";

interface Column {
  title: string;
  key: string;
  transform?: ({ args }: any) => string | JSX.Element; // eslint-disable-line @typescript-eslint/no-explicit-any
}

interface GeneralConfig {
  filtering?: boolean;
  rowFilters?: boolean;
  handledStatuses?: string[];
  selection?: boolean;
}

export interface CellConfig {
  cols: Column[];
  index: string;
  sorting: string;
  order: OrderTypes;
  rowLink?: ({ id }: any) => string; // eslint-disable-line @typescript-eslint/no-explicit-any
  groupLink?: ({ id }: DataGroup) => string;
}

interface IProps {
  groups: DataGroup[];
  hasGrouping: boolean;
  config: GeneralConfig;
  cellConfig: CellConfig;
  filterConfig: DataFilterConfig[];
  setSelections?: Dispatch<SetStateAction<number[]>>;
  isRowDisabled?: (arg0: any) => boolean; // eslint-disable-line @typescript-eslint/no-explicit-any
  areAllRowsDisabled?: boolean;
  statusField?: string;
  getActiveRows?: (arg0: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  className?: string;
}

interface IToggleableButton {
  $isActive: boolean;
}

const Wrapper = styled.div``;

const tableBorder = (size = "0.5em"): string =>
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
  position: relative;

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
    padding-right: var(--spacing-m);
  }

  ${truncatedText}
  position: relative;
  height: var(--spacing-4-xl);
  padding: 0 var(--spacing-xs);
  user-select: none;

  a {
    display: inline;
  }
`;

export const Row = styled.tr<{
  $clickable?: boolean;
  $disabled?: boolean;
  $columnCount?: number;
}>`
  ${({ $clickable }) => $clickable && "cursor: pointer;"}
  ${({ $disabled }) =>
    $disabled &&
    `
    span.cellContent {
      opacity: 0.5;
      display: block;
    }
    cursor: default;
  `}

  ${Cell} {
    ${({ $columnCount }) =>
      $columnCount &&
      `
      max-width: ${1000 / $columnCount}px;
    `}
  }
`;

export const Heading = styled.thead`
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

    &.actionsEnabled {
      cursor: pointer;
    }

    ${truncatedText}
    font-weight: normal;
    text-align: left;
    user-select: none;
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

    font-size: var(--fontsize-body-s);
  }
`;

const HideHandledBtn = styled(Button).attrs(
  ({ $isActive }: IToggleableButton) => ({
    iconLeft: $isActive ? (
      <IconEye aria-hidden />
    ) : (
      <IconEyeCrossed aria-hidden />
    ),
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
  iconLeft: <IconOpenAll aria-hidden />,
  style: {
    "--filter-button-color": "transparent",
    "--color-bus": "var(--filter-button-color)",
    "--color-bus-dark": "var(--filter-button-color)",
    "--color-white": "var(--tilavaraus-admin-content-text-color)",
    "--background-color-disabled": "transparent",
    "--border-color-disabled": "transparent",
    "--color-disabled": "var(--color-black-50)",
  } as React.CSSProperties,
})<IToggleableButton>`
  &:disabled {
    svg {
      opacity: 0.5;
    }
  }

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
    iconLeft: $isActive ? (
      <IconDisableSelection aria-hidden />
    ) : (
      <IconActivateSelection aria-hidden />
    ),
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
)<IToggleableButton>`
  &:disabled {
    svg g {
      fill: var(--color-black-50);
    }
  }
`;

const SelectionCell = styled(Cell)`
  &:after {
    content: none;
  }

  padding-right: var(--spacing-3-xs);
  width: calc(0.5em + var(--spacing-m));
  min-width: calc(0.5em + var(--spacing-m));
  overflow-x: visible !important;
  border-bottom: ${tableBorder()};
  border-left: ${tableBorder()};

  @media (min-width: ${breakpoints.l}) {
    width: var(--spacing-m);
    min-width: var(--spacing-m);
  }
`;

const HeadingSelectionCell = styled(SelectionCell)`
  border: 0;
`;

interface SortingProps {
  direction: OrderTypes;
}

function SortingArrow({ direction }: SortingProps): JSX.Element {
  return direction === "asc" ? (
    <IconArrowDown aria-hidden />
  ) : (
    <IconArrowUp aria-hidden />
  );
}

const processData = (
  groups: any[], // eslint-disable-line @typescript-eslint/no-explicit-any
  sorting: string,
  order: "asc" | "desc",
  filters: DataFilterOption[],
  handledAreHidden: boolean,
  statusField: string,
  handledStatuses?: string[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any[] => {
  return groups.map((group) => {
    let data;
    if (filters.length > 0) {
      data = filterData(group.data, filters);
    } else {
      data = group.data;
    }

    if (handledAreHidden) {
      data = data.filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (row: any): boolean =>
          !!handledStatuses && !handledStatuses.includes(get(row, statusField))
      );
    }

    return {
      ...group,
      data: orderBy(data, [sorting], [order]),
    };
  });
};

function DataTable({
  groups,
  setSelections,
  hasGrouping,
  config = {
    filtering: false,
    rowFilters: false,
    handledStatuses: [],
    selection: false,
  },
  cellConfig,
  filterConfig,
  isRowDisabled = () => false,
  areAllRowsDisabled,
  statusField = "status",
  getActiveRows,
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

  useEffect(() => {
    if (setSelections) {
      setSelections(selectedRows);
    }
  }, [setSelections, selectedRows]);

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

  const processedData = useMemo(
    () =>
      processData(
        groups,
        sorting,
        order,
        filters,
        handledAreHidden,
        statusField,
        config.handledStatuses
      ),
    [groups, sorting, order, filters, handledAreHidden, statusField, config]
  );

  const flatData = useMemo(
    () => processedData.flatMap((n) => n.data),
    [processedData]
  );

  useEffect(() => {
    if (getActiveRows) getActiveRows(flatData);
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const actionsEnabled: boolean =
    groups.flatMap((group) => group.data).length > 0;

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

  const disabledRows = processedData
    .flatMap((data) =>
      data.data.flatMap(
        (n: any) => isRowDisabled(n) && get(n, cellConfig.index) // eslint-disable-line @typescript-eslint/no-explicit-any
      )
    )
    .filter((n) => n);

  const getRowIds = (group?: number): number[] => {
    const result = group
      ? processedData
          .find((data) => data.id === group)
          .data.map((data: any) => get(data, cellConfig.index)) // eslint-disable-line @typescript-eslint/no-explicit-any
      : processedData.flatMap((data) =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data.data.flatMap((n: any) => get(n, cellConfig.index))
        );

    return pullAll(result, disabledRows);
  };

  const areAllRowsSelected: boolean = isEqual(selectedRows, getRowIds());

  const noResults = (
    <Row key="no-results">
      <Cell colSpan={cellConfig.cols.length}>{t("common.noResults")}</Cell>
    </Row>
  );

  return (
    <Wrapper className={className}>
      {config.filtering && (
        <FilterContainer>
          {config.rowFilters && (
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
                disabled={
                  !actionsEnabled ||
                  (filterConfig && filterConfig.length < 1) ||
                  isSelectionActive
                }
                title={t(
                  `${filters.length > 0 ? "common.filtered" : "common.filter"}`
                )}
              >
                {t(
                  `${filters.length > 0 ? "common.filtered" : "common.filter"}`
                )}
              </FilterBtn>
              <FilterControls
                filters={filters}
                visible={filtersAreVisible}
                applyFilters={setFilters}
                config={filterConfig}
              />
            </>
          )}
          {!!config.handledStatuses?.length &&
            config.handledStatuses.length > 0 && (
              <HideHandledBtn
                onClick={(): void => toggleHideHandled(!handledAreHidden)}
                disabled={!actionsEnabled || isSelectionActive}
                $isActive={handledAreHidden}
                title={t(
                  `common.${
                    handledAreHidden ? "filterShowHandled" : "filterHideHandled"
                  }`
                )}
              >
                {t(
                  `common.${
                    handledAreHidden ? "filterShowHandled" : "filterHideHandled"
                  }`
                )}
              </HideHandledBtn>
            )}
          {config.selection && (
            <SelectionToggleBtn
              onClick={(): void => {
                if (!isSelectionActive) {
                  toggleGroupVisibility(true);
                }
                setSelectedRows([]);
                toggleSelectionActivity(!isSelectionActive);
              }}
              $isActive={isSelectionActive}
              disabled={!actionsEnabled}
              title={t(
                `common.${
                  isSelectionActive ? "disableSelection" : "activateSelection"
                }`
              )}
            >
              {t(
                `common.${
                  isSelectionActive ? "disableSelection" : "activateSelection"
                }`
              )}
            </SelectionToggleBtn>
          )}
          {hasGrouping && (
            <ToggleVisibilityBtn
              onClick={(): void => {
                toggleGroupVisibility();
              }}
              disabled={!actionsEnabled}
              $isActive={!filterSomeGroupsAreHidden}
              title={t(
                `common.${filterSomeGroupsAreHidden ? "openAll" : "closeAll"}`
              )}
            >
              {t(
                `common.${filterSomeGroupsAreHidden ? "openAll" : "closeAll"}`
              )}
            </ToggleVisibilityBtn>
          )}
        </FilterContainer>
      )}
      <TableWrapper>
        <Table data-testid="data-table">
          <Heading>
            <Row>
              {isSelectionActive && (
                <HeadingSelectionCell as="th">
                  <SelectionCheckbox
                    id="recommendation-all-checkbox"
                    onChange={(e) => {
                      updateSelection(e.target.checked ? getRowIds() : []);
                    }}
                    checked={areAllRowsSelected && !areAllRowsDisabled}
                    disabled={areAllRowsDisabled}
                    aria-label={t(
                      `common.${
                        areAllRowsSelected ? "deselectAllRows" : "selectAllRows"
                      }`
                    )}
                  />
                </HeadingSelectionCell>
              )}
              {cellConfig.cols.map((col): JSX.Element => {
                const sortingActive = actionsEnabled && col.key === sorting;
                const title = t(col.title);
                return (
                  <Cell
                    as="th"
                    key={col.key}
                    onClick={(): void | false =>
                      actionsEnabled && setSortingAndOrder(col.key)
                    }
                    className={classNames({ sortingActive, actionsEnabled })}
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
            {flatData.length > 0
              ? processedData.map(
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (group: any, groupIndex: number): JSX.Element => {
                    const groupRows = getRowIds(group.id);

                    return (
                      <RecommendationDataTableGroup
                        group={group}
                        hasGrouping={hasGrouping}
                        key={group.id || "group"}
                        cols={cellConfig.cols.length}
                        index={groupIndex}
                        isVisible={groupVisibility[groupIndex]}
                        toggleGroupVisibility={(): void => {
                          const tempGroupVisibility = [...groupVisibility];
                          tempGroupVisibility[groupIndex] =
                            !tempGroupVisibility[groupIndex];
                          setGroupVisibility(tempGroupVisibility);
                        }}
                        isSelectionActive={isSelectionActive}
                        isSelected={
                          groupRows.length > 0 &&
                          groupRows.every((id) => selectedRows.includes(id))
                        }
                        toggleSelection={updateSelection}
                        groupRows={groupRows}
                        groupLink={cellConfig.groupLink}
                      >
                        {group.data.map(
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          (row: any): JSX.Element => {
                            const rowKey = `${sorting}${order}${get(
                              row,
                              cellConfig.index
                            )}`;
                            const rowId: number = get(row, cellConfig.index);

                            return (
                              <Row
                                key={rowKey}
                                onClick={(): void => {
                                  if (isSelectionActive) {
                                    if (!isRowDisabled(row)) {
                                      updateSelection(
                                        [rowId],
                                        selectedRows.includes(rowId)
                                          ? "remove"
                                          : "add"
                                      );
                                    }
                                  } else if (cellConfig.rowLink) {
                                    const link: string =
                                      cellConfig.rowLink(row);
                                    history.push(link);
                                  }
                                }}
                                $clickable={!!cellConfig.rowLink}
                                $disabled={
                                  isSelectionActive &&
                                  isRowDisabled &&
                                  isRowDisabled(row)
                                }
                                $columnCount={cellConfig.cols.length}
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
                                          [rowId],
                                          e.target.checked ? "add" : "remove"
                                        );
                                      }}
                                      checked={selectedRows.includes(rowId)}
                                      aria-label={t(
                                        `common.${
                                          selectedRows.includes(rowId)
                                            ? "deselectRowX"
                                            : "selectRowX"
                                        }`,
                                        {
                                          row: rowId,
                                        }
                                      )}
                                      disabled={
                                        isRowDisabled && isRowDisabled(row)
                                      }
                                    />
                                  </SelectionCell>
                                )}
                                {cellConfig.cols.map(
                                  (col: Column): JSX.Element => {
                                    const colKey = `${rowKey}${col.key}`;
                                    const value = col.transform
                                      ? col.transform(row)
                                      : get(row, col.key);
                                    return (
                                      <Cell key={colKey}>
                                        <span className="cellContent">
                                          {value}
                                        </span>
                                      </Cell>
                                    );
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
              : noResults}
          </Body>
        </Table>
      </TableWrapper>
    </Wrapper>
  );
}

export default DataTable;
