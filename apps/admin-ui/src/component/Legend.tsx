import { Flex } from "common/styles/util";
import React from "react";
import styled from "styled-components";

type Props = {
  label: string;
  style: React.CSSProperties;
};

const Container = styled(Flex).attrs({
  $gap: "xs",
  $direction: "row",
  $alignItems: "center",
})`
  max-width: 14em;
  font-size: var(--fontsize-body-s);
`;

const Box = styled.div`
  min-height: 2.5em;
  min-width: 3em;
`;

export const LegendsWrapper = styled(Flex).attrs({
  $gap: "xl",
  $direction: "row",
  $wrap: "wrap",
})`
  padding: var(--spacing-m) 0;
`;

export function Legend({ label, style }: Props): JSX.Element {
  return (
    <Container>
      <Box style={style} />
      {label}
    </Container>
  );
}
