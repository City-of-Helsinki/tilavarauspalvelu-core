import React, { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import {
  IconAngleDown,
  IconAngleUp,
  IconArrowRight,
  IconLocation,
} from "hds-react";
import { ApplicationStatus, DataGroup } from "../../common/types";
import { H3 } from "../../styles/typography";
import { BasicLink, breakpoints, SelectionCheckbox } from "../../styles/util";

interface IProps {
  group: DataGroup;
  hasGrouping: boolean;
  cols: number;
  index: number;
  isVisible: boolean;
  toggleGroupVisibility: () => void;
  isSelectionActive: boolean;
  isSelected: boolean;
  toggleSelection: (arg0: number[], arg1: "add" | "remove") => void;
  groupRows: number[];
  groupLink?: ({ id }: DataGroup) => string;
  children: ReactNode;
}

const HeadingRow = styled.tr`
  background-color: var(--tilavaraus-admin-gray);
`;

const Left = styled.div`
  display: inline-flex;
`;

const CheckboxWrapper = styled.div`
  margin: var(--spacing-xs) var(--spacing-s) 0 -1px;
  width: var(--spacing-m);
`;

const Content = styled.div`
  padding: var(--spacing-s) var(--spacing-2-xl) var(--spacing-s)
    var(--spacing-l);

  h3 {
    display: flex;
    align-content: center;
    margin: var(--spacing-xs) 0;

    svg {
      margin-left: var(--spacing-xs);
    }
  }

  @media (min-width: ${breakpoints.l}) {
    display: flex;
    justify-content: space-between;
  }
`;

const Title = styled.div`
  display: inline-grid;
`;

const SpacerRow = styled.tr<{ $index: number }>`
  display: ${({ $index }) => ($index === 0 ? "none" : "table-row")};

  td {
    background-color: var(--color-white);
    height: var(--spacing-s);
    border-top: var(--spacing-3-xs) solid var(--tilavaraus-admin-gray);
  }
`;

const ReservationUnit = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: var(--spacing-xs);

  svg {
    margin-right: var(--spacing-xs);
  }
`;

const Count = styled(H3)`
  display: flex;
  align-items: center;
  text-transform: lowercase;
  border: 0;
  background: transparent;
  cursor: pointer;

  svg {
    margin-left: var(--spacing-xs);
    position: relative;
    top: -1px;
  }
`;

function RecommendationDataTableGroup({
  group,
  hasGrouping,
  cols,
  index,
  isVisible,
  toggleGroupVisibility,
  isSelectionActive,
  isSelected,
  toggleSelection,
  groupRows,
  groupLink,
  children,
}: IProps): JSX.Element {
  const { t } = useTranslation();

  const unhandledReservationCount = group.data
    .map((application: any) => application.status) // eslint-disable-line @typescript-eslint/no-explicit-any
    .filter((status: ApplicationStatus) =>
      ["in_review", "review_done"].includes(status)
    ).length;

  const colCount: number = isSelectionActive ? cols + 1 : cols;

  if (hasGrouping === false) {
    return <>{children}</>;
  }

  return (
    <>
      <SpacerRow $index={index}>
        <td colSpan={colCount} />
      </SpacerRow>
      <HeadingRow>
        <td colSpan={colCount}>
          <Content>
            <Left>
              <CheckboxWrapper>
                {isSelectionActive && (
                  <SelectionCheckbox
                    id={`recommendation-group-checkbox-${index}`}
                    onChange={(e) => {
                      toggleSelection(
                        groupRows,
                        e.target.checked ? "add" : "remove"
                      );
                    }}
                    checked={isSelected}
                    disabled={groupRows.length < 1}
                    aria-label={t(
                      `common.${
                        isSelected ? "deselectGroupX" : "selectGroupX"
                      }`,
                      { group: group.space.name }
                    )}
                  />
                )}
              </CheckboxWrapper>
              <Title>
                <H3>
                  {groupLink ? (
                    <BasicLink to={groupLink(group)}>
                      {group.space.name} <IconArrowRight />
                    </BasicLink>
                  ) : (
                    group.space.name
                  )}
                </H3>
                <ReservationUnit>
                  <IconLocation />
                  {group.reservationUnit.name}
                </ReservationUnit>
              </Title>
            </Left>
            <Count as="button" onClick={toggleGroupVisibility}>
              {`${unhandledReservationCount} ${t(
                "Application.statuses.allocated"
              )}`}
              {isVisible ? <IconAngleUp /> : <IconAngleDown />}
            </Count>
          </Content>
        </td>
      </HeadingRow>
      {isVisible ? children : null}
    </>
  );
}

export default RecommendationDataTableGroup;
