import { get } from "lodash";
import React from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { Table, TableProps } from "../../common/hds-fork/table/Table";

type TableWrapperProps = {
  $headingBackground?: string;
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
    white-space: nowrap;
    border-collapse: collapse;
    th {
      font-family: var(--font-bold);
      padding: var(--spacing-xs);
      background: ${({ $headingBackground = "var(--color-black-10)" }) =>
        $headingBackground};
      position: sticky;
      top: 0;
      box-shadow: 0 2px 2px -1px rgba(0, 0, 0, 0.4);
      button {
        color: black !important;
      }
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

export const CustomTable = (
  props: TableProps & { setSort: (col: string) => void }
): JSX.Element => (
  <StyledTable
    $headingBackground="var(--color-black-10)"
    $tableBackground="var(--color-white)"
    $colWidths={
      props?.cols ? props.cols.map((col) => get(col, "width", "auto")) : []
    }
    {...props}
  />
);

const NoDataMessage = styled.span`
  line-height: 1.5;
`;

const A = styled(Link)`
  color: black;
`;

export const TableLink = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}): JSX.Element => <A to={href}>{children}</A>;

/**
 *
 * TODO revisit this and the usage when Rewiew is converted to gql
 * (currently lacking info about filters)
 */
export function DataOrMessage({
  data,
  filteredData,
  children,
  noData,
  noFilteredData,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filteredData: any[];
  children: JSX.Element;
  noData?: string;
  noFilteredData: string;
}): JSX.Element {
  if (filteredData.length) {
    return children;
  }

  if (data && data.length === 0) {
    return <NoDataMessage>{noData}</NoDataMessage>;
  }

  return <NoDataMessage>{noFilteredData}</NoDataMessage>;
}
