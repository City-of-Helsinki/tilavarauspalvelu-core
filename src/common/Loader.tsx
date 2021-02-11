import React, { useLayoutEffect, useState } from "react";
import styled from "styled-components";
import { LoadingSpinner } from "hds-react";

interface IProps {
  delay?: number;
}

const Wrapper = styled.div<{ delay: number; isVisible: boolean }>`
  width: 100%;
  display: flex;
  justify-content: center;
  margin-top: 4em;
  visibility: ${({ isVisible }) => (isVisible ? "visible" : "hidden")};
`;

function Loader({ delay = 2000 }: IProps): JSX.Element {
  const [isVisible, setIsVisible] = useState(false);

  useLayoutEffect(() => {
    setTimeout(() => setIsVisible(true), delay);
  }, [delay]);

  return (
    <Wrapper delay={delay} isVisible={isVisible}>
      <LoadingSpinner />
    </Wrapper>
  );
}

export default Loader;
