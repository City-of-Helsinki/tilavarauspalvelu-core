import React from "react";
import styled from "styled-components";

type Props = {
  label: string;
  style: React.CSSProperties;
};

const Container = styled.div`
  max-width: 14em;
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--fontsize-body-s);
`;

const Box = styled.div`
  min-height: 2.5em;
  min-width: 3em;
`;

const Legend = ({ label, style }: Props): JSX.Element => {
  return (
    <Container>
      <Box style={style} />
      {label}
    </Container>
  );
};

export default Legend;
