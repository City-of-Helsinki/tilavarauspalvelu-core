import { get } from "lodash";
import React from "react";
import styled from "styled-components";
import { Table, TableProps } from "hds-react";
import { fontBold } from "common";

type TableWrapperProps = {
  $tableBackground?: string;
  $colWidths?: string[];
};

export const HR = styled.hr`
  border: 0;
  border-top: 1px solid var(--color-black-20);
  width: 100%;
`;

const StyledTable = styled(Table)<TableWrapperProps>`
  &&& {
    width: 100%;
    white-space: nowrap;
    border-collapse: collapse;
    th {
      text-align: left;
      ${fontBold};
      padding: var(--spacing-xs);
      position: sticky;
      top: 0;
      box-shadow: 0 2px 2px -1px rgba(0, 0, 0, 0.4);
    }
    td {
      padding: var(--spacing-xs);
      background: ${({ $tableBackground = "transparent" }) => $tableBackground};
    }

    ${({ $colWidths }) =>
      $colWidths &&
      $colWidths.map(
        (width, idx) => `td:nth-of-type(${idx + 1}) {width: ${width};}`
      )};
  }
`;

// Custom sort callback for backwards compatibility (can be refactored out)
type Props = Omit<TableProps, "onSort"> & {
  setSort?: (col: string) => void;
  isLoading?: boolean;
  enableFrontendSorting?: boolean;
};

// @param isLoading - if true, table is rendered with a loading overlay
// TODO overlay and spinner for loading would be preferable over colour switching
export function CustomTable({
  isLoading,
  setSort,
  enableFrontendSorting,
  ...props
}: Props): JSX.Element {
  const [keyOverride, setKeyOverride] = React.useState<number>(0);
  const onSort = (order: "asc" | "desc", colKey: string) => {
    const field = order === "asc" ? colKey : `-${colKey}`;
    if (setSort) {
      setKeyOverride((prev) => prev + 1);
      setSort(field);
    }
  };

  return (
    <StyledTable
      {...props}
      variant="light"
      onSort={!enableFrontendSorting ? onSort : undefined}
      // NOTE when using backend sorting we need to unmount the table
      // otherwise the table header is not updated
      // unmounting on other data changes is not necessary and causes other bugs like automatic scrolling.
      key={`custom-table-${keyOverride}`}
      $tableBackground={
        isLoading ? "var(--color-black-10)" : "var(--color-white)"
      }
      $colWidths={
        props?.cols ? props.cols.map((col) => get(col, "width", "auto")) : []
      }
    />
  );
}
