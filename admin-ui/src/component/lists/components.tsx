import { get } from "lodash";
import React from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { breakpoints } from "common/src/common/style";
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

const TableWrapper = styled.div<TableWrapperProps>`
  div {
    overflow-x: auto;
    @media (min-width: ${breakpoints.xl}) {
      overflow-x: unset !important;
    }
  }
  table {
    width: 100%;
    th {
      color: black !important;
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
      white-space: nowrap;
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
  <TableWrapper
    $headingBackground="var(--color-black-10)"
    $tableBackground="var(--color-white)"
    $colWidths={
      props?.cols ? props.cols.map((col) => get(col, "width", "auto")) : []
    }
  >
    <Table {...props} />
  </TableWrapper>
);

const NoDataMessage = styled.span`
  line-height: 4;
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
