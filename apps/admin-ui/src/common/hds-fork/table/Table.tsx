import classNames from "classnames";
import React, { useMemo, useState } from "react";
import { HeaderRow } from "./components/HeaderRow/HeaderRow";
import { SortingHeaderCell } from "./components/SortingHeaderCell/SortingHeaderCell";
import { TableBody } from "./components/TableBody/TableBody";
import { TableContainer } from "./components/TableContainer/TableContainer";
import styles from "./Table.module.scss";

type Header = {
  /**
   * Boolean indicating whether a column is sortable
   */
  isSortable?: boolean;
  /**
   * Key of header. Maps with the corresponding row data keys.
   */
  key: string;
  /**
   * Visible header name that is rendered.
   */
  headerName: string;
  customSortCompareFunction?: (a: unknown, b: unknown) => number;
  /**
   * Sort icon type to be used in sorting. Use type string if the content is a string, otherwise use type other.
   * @default 'string'
   */
  sortIconType?: "string" | "other";
  /**
   * Transform function for the corresponding row data. Use this to render custom content inside the table cell.
   */
  transform?: ({ args }: any) => string | JSX.Element; // eslint-disable-line @typescript-eslint/no-explicit-any
};

export interface TableCustomTheme {
  /**
   * Deprecated. Use --header-background-color instead.
   */
  "--background-color"?: string;
  /**
   * Custom background color for table headers.
   */
  "--header-background-color"?: string;
  /**
   * Custom background color for the table content.
   * @default 'var(--color-white)'
   */
  "--content-background-color"?: string;
}

type SelectedRow = string | number;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;
type Order = "asc" | "desc" | undefined;

export type TableProps = React.ComponentPropsWithoutRef<"table"> & {
  /**
   * Aria-label for checkbox selection.
   * @default 'Rivin valinta'
   */
  ariaLabelCheckboxSelection?: string;
  /**
   * Aria-label for sort button in ascending state.
   * @default 'Järjestetty nousevaan järjestykseen'
   */
  ariaLabelSortButtonAscending?: string;
  /**
   * Aria-label for sort button in descending state.
   * @default 'Järjestetty laskevaan järjestykseen'
   */
  ariaLabelSortButtonDescending?: string;
  /**
   * Aria-label for sort button in the unordered state.
   * @default ''
   */
  ariaLabelSortButtonUnset?: string;
  /**
   * Caption of the table.
   */
  caption?: string | React.ReactNode;
  /**
   * Boolean indicating whether the table has the checkbox selection column to select rows.
   * @default false
   */
  checkboxSelection?: boolean;
  /**
   * Text for clear selected rows button.
   * @default 'Tyhjennä valinnat'
   */
  clearSelectionsText?: string;
  /**
   * Columns of the table header row. Defines header name, optional sort icon type and optional cell row transform function.
   */
  cols: Array<Header>;
  /**
   *  Custom action buttons to place on top of the table.
   */
  customActionButtons?: React.ReactNode[];
  /**
   * Test id attribute that is passed to the html table element.
   * @default 'hds-table-data-testid'
   */
  dataTestId?: string;
  /**
   * Boolean indicating whether to use the dense variant of the table.
   * @default false
   */
  dense?: boolean;
  /**
   * Table heading.
   */
  heading?: string;
  /**
   * Table heading aria level.
   */
  headingAriaLevel?: number;
  /**
   * A custom class name passed to table heading.
   */
  headingClassName?: string;
  /**
   * Table heading id. Used to name table to assistive technologies. Only applicable when heading prop is used.
   * @default 'hds-table-heading-id'
   */
  headingId?: string;
  /**
   * Id that is passed to the native html table element.
   * @default 'hds-table-id'
   */
  id?: string;
  /**
   * Column key used as a unique identifier for a row
   */
  indexKey: string;
  /**
   * Key indicating a column that you wish to be initially sorted. Use undefined to have no column initially sorted.
   */
  initialSortingColumnKey?: string;
  /**
   * Sorting order applied for initial sorting.
   */
  initialSortingOrder?: "asc" | "desc";
  /**
   * Boolean indicating whether index column is rendered in the table.
   * @default true
   */
  renderIndexCol?: boolean;
  /**
   * Table rows. An array of objects where keys map with the keys of col.
   */
  rows: Array<Row>;
  /**
   * Text for the select all rows button.
   * @default 'Valitse kaikki rivit'
   */
  selectAllRowsText?: string;
  /**
   * Selected table rows.
   */
  selectedRows?: SelectedRow[];
  /**
   * Callback that updates selected rows.
   */
  setSelectedRows?: React.Dispatch<React.SetStateAction<SelectedRow[]>>;

  setSort?: (col: string) => void;
  /**
   * Boolean indicating whether table data cell text content is aligned right. Default is false -> text is aligned left.
   * @default false
   */
  textAlignContentRight?: boolean;
  /**
   * Custom theme to change table header background color.
   */
  theme?: TableCustomTheme; // Custom theme styles
  /**
   * Table variant. Use dark for dark brand background colors, and light for light brand background colors.
   * @default 'dark'
   */
  variant?: "dark" | "light";
  /**
   * Vertical headers of the table.
   */
  verticalHeaders?: Array<Header>;
  /**
   * Boolean indicating whether the table has vertical lines on columns
   */
  verticalLines?: boolean;
  /**
   * Boolean indicating whether the table has alternating row colors zebra style.
   */
  zebra?: boolean;
};

const processRows = (
  rows: Row[],
  order: Order,
  sorting: string | undefined,
  cols: Header[]
) => {
  const sortingEnabled = cols.some((column) => {
    return column.isSortable === true;
  });

  if (!sortingEnabled || !order || !sorting) {
    return [...rows];
  }

  const sortColumn = cols.find((column) => {
    return column.key === sorting;
  });

  const customSortCompareFunction = sortColumn
    ? sortColumn.customSortCompareFunction
    : undefined;

  if (customSortCompareFunction) {
    const sortedRows = [...rows].sort((a, b) => {
      const aValue = a[sorting];
      const bValue = b[sorting];

      return customSortCompareFunction(aValue, bValue);
    });

    if (order === "asc") {
      return sortedRows;
    }
    if (order === "desc") {
      return sortedRows.reverse();
    }
  }

  return [...rows].sort((a, b) => {
    const aValue = a[sorting];
    const bValue = b[sorting];

    if (aValue < bValue) {
      return order === "asc" ? -1 : 1;
    }
    if (aValue > bValue) {
      return order === "asc" ? 1 : -1;
    }

    return 0;
  });
};

export const Table = ({
  ariaLabelSortButtonAscending = "Järjestetty nousevaan järjestykseen",
  ariaLabelSortButtonDescending = "Järjestetty laskevaan järjestykseen",
  ariaLabelSortButtonUnset = "",
  caption,
  checkboxSelection = false,
  cols,
  customActionButtons,
  dataTestId = "hds-table-data-testid",
  dense = false,
  heading,
  headingAriaLevel = 2,
  headingClassName,
  headingId = "hds-table-heading-id",
  id = "hds-table-id",
  indexKey,
  initialSortingColumnKey,
  initialSortingOrder,
  renderIndexCol = true,
  rows,
  textAlignContentRight = false,
  theme,
  variant = "dark",
  verticalHeaders,
  verticalLines = false,
  zebra = false,
  setSort = () => null,
  ...rest
}: TableProps): JSX.Element => {
  if (verticalHeaders && verticalHeaders.length && checkboxSelection) {
    // eslint-disable-next-line no-console
    console.warn(
      "Incompatible props verticalHeaders and checkboxSelection provided. Cannot use checkboxSelection when verticalHeaders is applied"
    );
    // eslint-disable-next-line no-param-reassign
    checkboxSelection = false;
  }

  if (checkboxSelection && caption) {
    // eslint-disable-next-line no-console
    console.warn(
      "Cannot use caption prop when checkboxSelection is set to true. Use heading prop instead"
    );
  }

  if (theme && theme["--background-color"]) {
    // eslint-disable-next-line no-console
    console.warn(
      "--background-color is deprecated, and will be removed in a future release. Please use --header-background-color instead"
    );

    /* eslint-disable no-param-reassign */
    theme["--header-background-color"] = theme["--background-color"];
    delete theme["--background-color"];
    /* eslint-enable no-param-reassign */
  }

  const [sorting] = useState<string | undefined>(initialSortingColumnKey);
  const [order] = useState<"asc" | "desc" | undefined>(initialSortingOrder);

  const processedRows = useMemo(
    () => processRows(rows, order, sorting, cols),
    [rows, sorting, order, cols]
  );

  const hasCustomActionButtons =
    customActionButtons && customActionButtons.length > 0;

  const visibleColumns = renderIndexCol
    ? cols
    : cols.filter((column) => column.key !== indexKey);

  return (
    <>
      {(checkboxSelection || heading || hasCustomActionButtons) && (
        <div className={styles.actionContainer}>
          {heading && (
            <div
              id={headingId}
              role="heading"
              aria-level={headingAriaLevel}
              className={classNames(styles.heading, headingClassName)}
            >
              {heading}
            </div>
          )}
        </div>
      )}
      <TableContainer
        variant={variant}
        dataTestId={dataTestId}
        dense={dense}
        id={id}
        zebra={zebra}
        verticalLines={verticalLines}
        headingId={heading ? headingId : undefined}
        {...rest}
      >
        <thead>
          <HeaderRow>
            {verticalHeaders && verticalHeaders.length && <td />}
            {visibleColumns.map((column) => {
              if (column.isSortable) {
                return (
                  <SortingHeaderCell
                    key={column.key}
                    colKey={column.key}
                    title={column.headerName}
                    ariaLabelSortButtonUnset={ariaLabelSortButtonUnset}
                    ariaLabelSortButtonAscending={ariaLabelSortButtonAscending}
                    ariaLabelSortButtonDescending={
                      ariaLabelSortButtonDescending
                    }
                    setSortingAndOrder={setSort}
                    order={
                      (sorting === column.key ? order : "unset") || "unset"
                    }
                    sortIconType={column.sortIconType || "other"}
                  />
                );
              }
              return (
                <th key={column.key} scope="col">
                  {column.headerName}
                </th>
              );
            })}
          </HeaderRow>
        </thead>
        <TableBody textAlignContentRight={textAlignContentRight}>
          {processedRows.map((row, index) => (
            <tr key={String(row[indexKey])}>
              {verticalHeaders && verticalHeaders.length && (
                <th scope="row">{verticalHeaders[index].headerName}</th>
              )}
              {visibleColumns.map((column, cellIndex) => {
                return (
                  <td
                    data-testid={`${column.key}-${index}`}
                    key={cellIndex} // eslint-disable-line react/no-array-index-key
                  >
                    {column.transform && column.transform(row)}
                    {!column.transform && row[column.key]}
                  </td>
                );
              })}
            </tr>
          ))}
        </TableBody>
      </TableContainer>
    </>
  );
};
