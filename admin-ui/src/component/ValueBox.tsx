import React, { ReactNode } from "react";
import styled from "styled-components";

const Label = styled.div`
  font-family: var(--tilavaraus-admin-font-bold);
  font-weight: bold;
  font-size: var(--fontsize-heading-xs);
  margin-bottom: var(--spacing-xs);
  display: flex;
  align-items: center;

  svg {
    margin-right: var(--spacing-xs);
  }
`;

const Value = styled.div``;

const Wrapper = styled.div<{ $hasIcon: boolean }>`
  ${Value} {
    ${({ $hasIcon }) => $hasIcon && "padding-left: 2.3em;"}
  }
`;

interface IValueBoxProps {
  label: string;
  value: string | undefined | null;
  icon?: ReactNode;
  style?: React.CSSProperties;
}

function ValueBox({
  label,
  value = "-",
  icon,
  style,
  ...rest
}: IValueBoxProps): JSX.Element {
  return (
    <Wrapper style={style} {...rest} $hasIcon={!!icon}>
      <Label>
        {icon}
        {label}
      </Label>
      <Value>{value}</Value>
    </Wrapper>
  );
}

export default ValueBox;
