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

export const ApplicationInfoContainer = styled.div`
  margin: 0 var(--spacing-m);
  display: flex;
  flex-flow: column nowrap;
  @media (min-width: ${breakpoints.m}) {
    flex-flow: row wrap;
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

  /* Make InfoItemContainers rows of three columns */
  @media (min-width: ${breakpoints.m}) {
    width: ${(props) => (props.$fullWidth ? "100%" : "calc(100% / 3)")};
    > [class^="styled__InfoItem"] {
      padding-inline: var(--spacing-m);
    }
    &:first-child {
      border-top: var(--application-content-border);
    }
    &:nth-child(-n + 3) {
      border-top: 0;
    }
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
    /* first child in each row should be aligned with the left side of the parent content */
    *:nth-child(3n-2) > & {
      padding-left: 0;
    }
    /* every child except the last one in each row should show application-content-border as a divider */
    *:not(:nth-child(3n)) > & {
      border-right: var(--application-content-border);
    }
    /* last child in each row */
    *:nth-child(-n + 3) > & {
      border-top: 0;
    }

    *:last-child > & {
      border-right: 0;
    }
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
