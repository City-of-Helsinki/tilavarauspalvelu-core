import React, { useState } from "react";
import styled from "styled-components";
import { useScrollPosition } from "@n8tb1t/use-scroll-position";
import { Button, IconAngleUp } from "hds-react";

const Btn = styled(Button).attrs({
  style: {
    "--color-bus": "var(--color-black)",
  } as React.CSSProperties,
})`
  width: 40px;
  height: 40px;
  background-color: var(--color-black);
  color: var(--color-white);
  position: fixed;
  right: var(--spacing-l);
  bottom: var(--spacing-l);
  display: flex;
  align-items: center;
  justify-content: center;
`;

function ScrollToTop(): JSX.Element | null {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useScrollPosition(
    ({ currPos }) => {
      const yPos = Math.abs(currPos.y) + window.innerHeight;
      setIsVisible(yPos > 2000);
    },
    undefined,
    undefined,
    undefined,
    300
  );

  return isVisible ? (
    <Btn onClick={() => window.scroll({ top: 0, left: 0, behavior: "smooth" })}>
      <IconAngleUp />
    </Btn>
  ) : null;
}

export default ScrollToTop;
