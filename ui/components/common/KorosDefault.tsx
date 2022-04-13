import { Koros } from "hds-react";
import React from "react";
import styled from "styled-components";

type Props = {
  from?: string;
  to?: string;
};

const Wrapper = styled.div<{ $from: string; $to: string }>`
  ${({ $from, $to }) => `
    background-color: ${$from};
    fill: ${$to};
  `}
  margin-bottom: -1px;
`;

const KorosDefault = ({ from, to }: Props): JSX.Element => {
  return (
    <Wrapper $from={from} $to={to}>
      <Koros type="basic" />
    </Wrapper>
  );
};

export default KorosDefault;
