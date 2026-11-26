import { Notification } from "hds-react";
import styled from "styled-components";
import { breakpoints } from "ui/src/modules/const";
import { fontMedium, fontRegular, Flex, FullRow, H5 } from "ui/src/styled";

export const StyledNotification = styled(Notification)`
  line-height: var(--fontsize-heading-m);
  margin-top: var(--spacing-m);

  svg {
    position: relative;
    top: -2px;
  }
`;

export const ApplicationSection = styled.section`
  display: flex;
  flex-flow: column;
  padding: 0;
  grid-template-columns: repeat(3, 1fr);
  border: 1px solid var(--color-black-90);
  /* --application-content-border is the dashed border used between items within an ApplicationSection */
  --application-content-border: 1px dashed var(--color-black-30);
  border-bottom: 0;

  &:last-of-type {
    border-bottom: 1px solid var(--color-black-90);
  }
`;

export const ApplicationSectionHeader = styled.h2`
  position: relative;
  display: flex;
  justify-content: space-between;
  width: calc(100% - 2 * var(--spacing-m));
  margin: 0 var(--spacing-m);
  padding: var(--spacing-m) 0;
  border-bottom: var(--application-content-border);
  font-size: var(--fontsize-heading-s);
  [class*="statusLabel__"] {
    position: absolute;
    top: var(--spacing-m);
    right: 0;
    height: 26px;
    ${fontRegular};
  }
`;

type ApplicationInfoContainerProps = {
  // The number of InfoItemContainers in one row on a wide screen. The default is 3.
  $columnCount?: 3 | 4;
  // Keep the divider above the first row, when the container follows another ApplicationInfoContainer.
  $hasDividerAbove?: boolean;
};

const getColumnCount = ({ $columnCount }: ApplicationInfoContainerProps) => $columnCount ?? 3;

/** Puts the InfoItemContainers in rows on a wide screen, with dashed dividers between them. */
export const ApplicationInfoContainer = styled.div<ApplicationInfoContainerProps>`
  margin: 0 var(--spacing-m);
  display: flex;
  flex-flow: column nowrap;
  @media (min-width: ${breakpoints.m}) {
    --application-info-columns: ${getColumnCount};
    flex-flow: row wrap;

    /* The first row has no divider above it */
    > :nth-child(-n + ${getColumnCount}) {
      ${({ $hasDividerAbove }) => ($hasDividerAbove ? "" : "border-top: 0;")}
    }
    /* The first item in each row is aligned with the left side of the parent content */
    > :nth-child(${getColumnCount}n + 1) > * {
      padding-left: 0;
    }
    /* Each item that is not the last one in its row has a divider on the right */
    > :not(:nth-child(${getColumnCount}n)):not(:last-child) > * {
      border-right: var(--application-content-border);
    }
  }
`;

export const InfoItemContainer = styled(Flex).attrs({
  $alignItems: "flex-end",
  $gap: "none",
})<{ $fullWidth?: boolean }>`
  box-sizing: border-box;
  position: relative;
  background: var(--color-white);
  width: 100%;
  font-size: var(--fontsize-body-m);
  border-top: var(--application-content-border);

  /* ApplicationInfoContainer sets the number of columns */
  @media (min-width: ${breakpoints.m}) {
    width: ${(props) => (props.$fullWidth ? "100%" : "calc(100% / var(--application-info-columns))")};
  }
`;

export const InfoItem = styled(Flex).attrs({
  $alignItems: "stretch",
  $marginTop: "m",
  $marginBottom: "m",
})`
  height: 100%;
  box-sizing: border-box;
  width: 100%;
  padding: 0;

  h3 {
    display: flex;
    gap: var(--spacing-m);
    margin: 0;
    line-height: 1;
    ${fontMedium};
    font-size: inherit;
    [class*="Tooltip-module_root"] {
      /* Position the tooltip button and prevent it from stretching the info-label heading */
      margin-top: -4px;
      margin-bottom: -8px;
    }
  }

  p {
    display: flex;
    font-size: var(--fontsize-body-m);
    margin: 0;
    flex-grow: 1;
    align-items: flex-end;
  }

  ul,
  ol {
    margin: 0;
    padding-inline: var(--spacing-m);
  }

  li {
    h4 {
      display: inline;
      ${fontRegular};
    }
    span {
      ${fontMedium};
    }
  }

  @media (min-width: ${breakpoints.m}) {
    padding-inline: var(--spacing-m);
  }
`;

export const RegularText = styled.span`
  &&& {
    font-size: var(--fontsize-body-m);
    ${fontRegular};
  }
`;

export const ScheduleDay = styled.div`
  display: grid;
  grid-template-columns: 3rem 1fr 1fr;
  span:last-child {
    padding-left: var(--spacing-xs);
  }
`;

export const SpanFullRow = styled(FullRow).attrs({ as: "span" })``;

export const FormSubHeading = styled(H5).attrs({ as: "h2" })`
  margin: 0;
  grid-column: 1 / -1;
`;

/** Puts the post code and the city in one cell of the page 3 form grid.
 * The 3:5 ratio is close to the design, which has 136.5px for the post code and 224px for the city. */
export const PostCodeCityRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(0, 5fr);
  align-items: baseline;
  gap: var(--spacing-m);
`;
