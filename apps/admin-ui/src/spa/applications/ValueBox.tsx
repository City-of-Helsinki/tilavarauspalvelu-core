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

const Wrapper = styled.div``;

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
    <Wrapper {...rest}>
      <Label>{label}</Label>
      <Value>{value || "-"}</Value>
    </Wrapper>
  );
}
