import { get } from "lodash";
import React from "react";
import { Link } from "react-router-dom";
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
};

// @param isLoading - if true, table is rendered with a loading overlay
// TODO overlay and spinner for loading would be preferable over colour switching
export function CustomTable({
  isLoading,
  setSort,
  ...props
}: Props): JSX.Element {
  const onSort = (order: "asc" | "desc", colKey: string) => {
    const field = order === "asc" ? colKey : `-${colKey}`;
    if (setSort) {
      setSort(field);
    }
  };

  return (
    <StyledTable
      {...props}
      variant="light"
      onSort={onSort}
      // NOTE have to unmount on data changes because there is a bug in the Table component
      // removing this and using sort leaves ghost elements in the table.
      // also search indicators are not correct when search changes (initial direction / key)
      key={JSON.stringify(props.rows, replacer)}
      $tableBackground={
        isLoading ? "var(--color-black-10)" : "var(--color-white)"
      }
      $colWidths={
        props?.cols ? props.cols.map((col) => get(col, "width", "auto")) : []
      }
    />
  );
}

// React elements can't be serialized into json
function replacer(_key: string, value: unknown) {
  if (typeof value === "object" && value != null) {
    if (
      "$$typeof" in value &&
      value.$$typeof != null &&
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      value.$$typeof.toString() === "Symbol(react.element)"
    ) {
      return undefined;
    }
  }
  return value;
}

const A = styled(Link)`
  color: black;
`;

// NOTE not using IconButton because of hover effect
export const ExternalTableLink = styled.a`
  color: var(--color-black);
  display: flex;
  align-items: center;
  gap: var(--spacing-3-xs);
  & > svg {
    margin-top: var(--spacing-3-xs);
  }
`;

export const TableLink = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}): JSX.Element => <A to={href}>{children}</A>;
