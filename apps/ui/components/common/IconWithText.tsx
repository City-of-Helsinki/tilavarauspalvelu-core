import React, { ReactElement, ReactNode } from "react";
import styled from "styled-components";

type IconWithTextProps = {
  icon: ReactElement;
  text?: string | ReactElement | ReactNode;
  className?: string;
};

const Container = styled.div`
  display: grid;
  grid-auto-rows: 1fr;
  align-items: center;
  grid-template-columns: 1.5em 1fr 4fr;
  margin-top: var(--spacing-s);
  white-space: nowrap;
`;

const SpanTwoColumns = styled.span`
  margin-left: var(--spacing-xs);
  grid-column: 2 / 4;
`;

const IconWithText = ({
  icon,
  text = "",
  className,
  ...rest
}: IconWithTextProps): JSX.Element => (
  <Container className={className} {...rest}>
    {text && (
      <>
        {icon}
        <SpanTwoColumns>{text}</SpanTwoColumns>
      </>
    )}
  </Container>
);

export default IconWithText;
