import React from "react";
import { KVWrapper, Label, Value } from "@/styled";
import { LoadingSpinner } from "hds-react";

export function DataWrapper({
  label,
  children,
  isWide,
  isSummary,
  isLoading,
}: Readonly<{
  label: string;
  children: React.ReactNode;
  isWide?: boolean;
  isSummary?: boolean;
  isLoading?: boolean;
}>): JSX.Element {
  const testSection = isSummary ? "summary" : "info";
  const testId = `reservation__${testSection}--${label}`;
  return (
    <KVWrapper $isWide={isWide} $isSummary={isSummary}>
      <Label $isSummary={isSummary}>{label}:</Label>
      <Value data-testid={testId} $isSummary={isSummary}>
        {/* eslint-disable-next-line react/jsx-no-useless-fragment */}
        {isLoading ? <LoadingSpinner small /> : <>{children}</>}
      </Value>
    </KVWrapper>
  );
}
