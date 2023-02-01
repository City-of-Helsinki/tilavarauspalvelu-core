import React, { ReactNode } from "react";
import styled from "styled-components";
import { IconAngleDown, IconAngleUp } from "hds-react";
import { get } from "lodash";
import { useNavigate } from "react-router-dom";
import { breakpoints } from "common/src/common/style";
import { SpaceType } from "common/types/gql-types";
import { CellConfig, Row, Column, Cell } from "../DataTable";

interface IProps {
  group: { data: SpaceType[] };
  hasGrouping: boolean;
  cols: number;
  index: number;
  isVisible: boolean;
  toggleGroupVisibility: () => void;
  children: ReactNode;
  cellConfig: CellConfig;
}

const SpacerRow = styled.tr`
  td {
    background-color: var(--color-white);
    border-top: 4px solid var(--tilavaraus-admin-gray);
    padding: 0;
  }
`;

const ActionCol = styled.div`
  display: grid;
  grid-template-columns: 1fr 44px;
  width: 100%;
`;

const GroupToggle = styled.button`
  display: flex;
  align-items: center;
  border: 0;
  background: transparent;
  cursor: pointer;
  margin-left: var(--spacing-l);

  svg {
    margin-left: var(--spacing-xs);
    position: relative;
    top: -1px;
  }

  @media (min-width: ${breakpoints.l}) {
    margin-left: 0;
  }
`;

const Prefix = styled.div<{
  $width: number;
}>`
  display: inline-block;
  width: ${(props) => props.$width}px;
  border-right: 6px solid var(--color-black-40);
  margin-right: 10px;
  background-color: var(--tilavaraus-admin-gray);
`;

const CellWrapper = styled.div`
  display: flex;
  height: 100%;
`;

const CellContentWrapper = styled.div`
  display: flex;
  align-items: center;
  height: 100%;
`;

const StyledCell = styled(Cell)<{
  $isChildren: boolean;
}>`
  ${({ $isChildren }) =>
    $isChildren &&
    `
    border-bottom: 0 solid var(--tilavaraus-admin-gray) !important;
  `}
`;

const ParentRow = styled(Row)`
  td {
    border-bottom: 0 !important;
  }
`;

const StyledRow = styled(Row)<{
  $isChildren: boolean;
}>`
  ${({ $isChildren }) =>
    $isChildren &&
    `
background-color: var(--gray-light);
td:first-of-type {
  padding-left: 0;
}
`}
`;

const PREFIX_DEPTH_WIDTH_PX = 20;

const depth = (space: SpaceType): number =>
  space.parent ? 1 + depth(space.parent) : 0;

const renderColumn = (
  row: SpaceType,
  cellConfig: CellConfig,
  colIndex: number,
  prefixWidth: number,
  isChildRow: boolean
): JSX.Element => {
  const col: Column = cellConfig.cols[colIndex];
  const rowKey = get(row, cellConfig.index);
  const colKey = `${rowKey}${col.key}`;
  const value = col.transform ? col.transform(row) : get(row, col.key);
  return (
    <StyledCell $isChildren={isChildRow} key={colKey}>
      {colIndex === 0 && prefixWidth !== 0 ? (
        <CellWrapper>
          <Prefix $width={prefixWidth}>{"\u00a0"}</Prefix>
          <CellContentWrapper>
            <span className="cellContent">{value}</span>
          </CellContentWrapper>
        </CellWrapper>
      ) : (
        <span className="cellContent">{value}</span>
      )}
    </StyledCell>
  );
};

function SpaceTreeDataTableGroup({
  group,
  hasGrouping,
  isVisible,
  toggleGroupVisibility,
  children,
  cellConfig,
}: IProps): JSX.Element {
  const history = useNavigate();
  if (hasGrouping === false) {
    return <> {children} </>;
  }
  const groupChildren = (
    group.data.length > 1 ? group.data.slice(1) : group.data
  ).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (row: SpaceType): JSX.Element => {
      const rowKey = get(row, cellConfig.index);

      const prefixWidth = PREFIX_DEPTH_WIDTH_PX * depth(row);
      const isChildRow = row.parent !== null;

      return (
        <StyledRow
          $isChildren={isChildRow}
          key={rowKey}
          onClick={(): void => {
            if (cellConfig.rowLink) {
              history(cellConfig.rowLink(row));
            }
          }}
          $clickable={!!cellConfig.rowLink}
          $disabled={false}
          $columnCount={cellConfig.cols.length}
        >
          {cellConfig.cols.map((col, index) =>
            renderColumn(
              row,
              cellConfig,
              index,
              (index === 0 && prefixWidth) || 0,
              isChildRow
            )
          )}
        </StyledRow>
      );
    }
  );

  const root = group.data[0];
  const colCount = cellConfig.cols.length;
  const lastCol = cellConfig.cols[colCount - 1] as Column;

  return (
    <>
      {group.data.length > 1 ? (
        <ParentRow
          key={root.pk}
          $clickable={false}
          $disabled={false}
          $columnCount={cellConfig.cols.length}
        >
          {cellConfig.cols
            .slice(0, cellConfig.cols.length - 1)
            .map(
              (col: Column, index): JSX.Element =>
                renderColumn(root, cellConfig, index, 0, false)
            )}
          <Cell
            key={`${get(root, cellConfig.index)}${
              cellConfig.cols[cellConfig.cols.length - 1].key
            }`}
          >
            <span className="cellContent">
              <ActionCol>
                {lastCol.transform
                  ? lastCol.transform(root)
                  : get(root, lastCol.key)}
                <GroupToggle as="button" onClick={toggleGroupVisibility}>
                  {isVisible ? (
                    <IconAngleUp aria-hidden />
                  ) : (
                    <IconAngleDown aria-hidden />
                  )}
                </GroupToggle>
              </ActionCol>
            </span>
          </Cell>
        </ParentRow>
      ) : null}

      {isVisible ? groupChildren : null}
      {group.data.length > 1 ? (
        <SpacerRow aria-hidden>
          <td colSpan={colCount} />
        </SpacerRow>
      ) : null}
    </>
  );
}

export default SpaceTreeDataTableGroup;
