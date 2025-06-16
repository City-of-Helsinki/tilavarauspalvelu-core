import styled from "styled-components";
import React from "react";
import { Tooltip } from "hds-react";
import { fontBold } from "common/styled";

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
  ${fontBold};
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
    <FieldGroupWrapper className={className} style={style}>
      <div>
        <FieldGroupHeading>
          {heading} {required ? "*" : ""}
        </FieldGroupHeading>
        <div className="ReservationUnitEditor__FieldGroup-children">{children}</div>
      </div>
      <Tooltip>{tooltip}</Tooltip>
    </FieldGroupWrapper>
  );
}
