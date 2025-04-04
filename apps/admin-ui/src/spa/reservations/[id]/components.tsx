import React from "react";
import { KVWrapper, Label, Value } from "@/styled";
import styled from "styled-components";
import { Accordion as AccordionBase } from "hds-react";

export const Accordion = styled(AccordionBase).attrs({
  closeButton: false,
})`
  > div > div:not([class^="LoadingSpinner-module_loadingSpinner"]) {
    width: 100%;
  }

  && {
    --icon-size: 24px;

    [class^="Accordion-module_accordionHeader__"] {
      --icon-size: 32px;
    }
  }
`;

export function DataWrapper({
  label,
  children,
  isWide,
  isSummary,
}: Readonly<{
  label: string;
  children: React.ReactNode;
  isWide?: boolean;
  isSummary?: boolean;
}>): JSX.Element {
  const testSection = isSummary ? "summary" : "info";
  const testId = `reservation__${testSection}--${label}`;
  return (
    <KVWrapper $isWide={isWide} $isSummary={isSummary}>
      <Label $isSummary={isSummary}>{label}:</Label>
      <Value data-testid={testId} $isSummary={isSummary}>
        {children}
      </Value>
    </KVWrapper>
  );
}
