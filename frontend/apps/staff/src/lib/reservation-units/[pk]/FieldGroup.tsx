import React from "react";
import styled from "styled-components";
import { Tooltip } from "hds-react";
import { fontMedium } from "ui/src/styled";

const FieldGroupWrapper = styled.div`
  display: grid;
  gap: var(--spacing-m);
  grid-template-columns: 1fr 32px;
  justify-content: space-between;
`;
// NOTE using span for easier css selectors
const FieldGroupHeading = styled.span`
  padding-bottom: var(--spacing-xs);
  display: block;
  ${fontMedium};
`;

export function FieldGroup({
  children,
  heading,
  tooltip = "",
  className,
  style,
  required,
}: {
  heading: string;
  tooltip?: string;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  required?: boolean;
}): JSX.Element {
  return (
    <div className={className} style={style}>
      <FieldGroupWrapper>
        <FieldGroupHeading>
          {heading} {required ? "*" : ""}
        </FieldGroupHeading>
        <Tooltip>{tooltip}</Tooltip>
      </FieldGroupWrapper>
      <div className="ReservationUnitEditor__FieldGroup-children">{children}</div>
    </div>
  );
}
