import { Koros } from "hds-react";
import React from "react";
import styled from "styled-components";

type Props = {
  to?: string;
  style?: React.CSSProperties;
  className?: string;
};

const Wrapper = styled.div<{ $fill?: string }>`
  background-color: var(--tilavaraus-hero-background-color);
  fill: ${({ $fill }) => $fill || "var(--color-white)"};
  margin-bottom: -1px;
`;

const KorosDefault = ({ to, ...rest }: Props): JSX.Element => {
  return (
    <Wrapper {...rest} $fill={to}>
      <Koros type="basic" />
    </Wrapper>
  );
};

export default KorosDefault;
