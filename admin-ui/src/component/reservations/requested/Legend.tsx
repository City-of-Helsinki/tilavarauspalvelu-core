import React from "react";
import styled from "styled-components";

type Props = {
  color: string;
  border: string;
  label: string;
};

const Container = styled.div`
  width: 11em;
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--fontsize-body-s);
`;

const Box = styled.div`
  min-height: 2.5em;
  min-width: 3em;
`;

const Legend = ({ label, color, border }: Props): JSX.Element => {
  return (
    <Container>
      <Box style={{ background: color, border }} />
      {label}
    </Container>
  );
};

export default Legend;
