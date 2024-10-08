import styled from "styled-components";
import { Notification } from "hds-react";
import LabelValue from "../common/LabelValue";
import TermsBox from "common/src/termsbox/TermsBox";
import { breakpoints, fontMedium, fontRegular } from "common";
import { AccordionWithState } from "@/components/Accordion";

export const CheckboxContainer = styled.div`
  margin-top: var(--spacing-m);
  display: flex;
  align-items: center;
`;

export const StyledNotification = styled(Notification)`
  line-height: var(--fontsize-heading-m);
  margin-top: var(--spacing-m);

  svg {
    position: relative;
    top: -2px;
  }
`;

export const StyledLabelValue = styled(LabelValue).attrs({ theme: "thin" })``;

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
    margin-bottom: var(--spacing-layout-s);
  }
`;

export const ApplicationSectionHeader = styled.h2`
  display: flex;
  justify-content: space-between;
  width: calc(100% - 2 * var(--spacing-m));
  height: 26px;
  margin: 0 var(--spacing-m);
  padding: var(--spacing-m) 0;
  border-bottom: var(--application-content-border);
  font-size: var(--fontsize-heading-s);
  [class*="statusLabel__"] {
    position: relative;
    transform: translateY(-4px);
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

export const InfoItemContainer = styled.div<{ $fullWidth?: boolean }>`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-content: flex-end;
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

export const InfoItem = styled.div`
  margin: var(--spacing-m) 0;
  height: 100%;
  display: flex;
  box-sizing: border-box;
  width: 100%;
  gap: var(--spacing-m);
  flex-direction: column;
  align-items: stretch;
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
      white-space: nowrap;
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

export const ScheduleDay = styled.div`
  display: grid;
  grid-template-columns: 3rem 1fr 1fr;
  span:last-child {
    padding-left: var(--spacing-xs);
  }
`;

export const TermsAccordion = styled(AccordionWithState)`
  --accordion-border-color: var(--color-black-90);
  [class^="Button-module_label"] div {
    font-size: var(--fontsize-heading-s);
  }
`;

export const CompactTermsBox = styled(TermsBox)`
  margin-bottom: 0;
`;
