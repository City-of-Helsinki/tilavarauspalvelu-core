import React from "react";
import styled from "styled-components";

const Label = styled.div`
  color: var(--color-black-70);
  font-size: var(--fontsize-body-m);
  line-height: var(--lineheight-l);
`;

const Value = styled.div`
  color: var(--color-black);
  font-size: var(--fontsize-body-l);
  line-height: var(--lineheight-l);
`;

interface IValueBoxProps {
  label: string;
  value: string | undefined | null | JSX.Element;
  style?: React.CSSProperties;
  className?: string;
}

export function ValueBox({
  label,
  value,
  ...rest
}: IValueBoxProps): JSX.Element {
  return (
    <div {...rest}>
      <Label>{label}</Label>
      <Value>{value || "-"}</Value>
    </div>
  );
}
