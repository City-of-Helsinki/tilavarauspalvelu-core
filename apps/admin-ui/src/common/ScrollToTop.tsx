import React, { useState } from "react";
import styled from "styled-components";
import { useScrollPosition } from "@n8tb1t/use-scroll-position";
import { IconAngleUp } from "hds-react";
import { useDebounce, useWindowSize } from "react-use";
import { breakpoints } from "common/src/common/style";
import { useTranslation } from "next-i18next";
import { focusStyles } from "common/styles/cssFragments";

const Btn = styled.button`
  --min-size: 44px;
  & {
    --background-color-focus: var(--color-black);
    --color-focus: var(--color-white);
  }

  border: none;
  background-color: var(--color-black);
  color: var(--color-white);

  position: fixed;
  right: var(--spacing-l);
  bottom: var(--spacing-l);
  min-height: var(--min-size);
  min-width: var(--min-size);

  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: var(--color-black-80);
  }
  ${focusStyles}
`;

const breakpoint = breakpoints.m;

function ScrollToTop(): JSX.Element | null {
  const { t } = useTranslation();
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  const { width } = useWindowSize();

  const checkBreakpoint = (w: number) => {
    setIsEnabled(w > parseInt(breakpoint, 10));
  };

  // eslint-disable-next-line no-empty-pattern
  const [] = useDebounce(
    () => {
      checkBreakpoint(width);
    },
    300,
    [width]
  );

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

  const handleClick = () => {
    window.scroll({ top: 0, left: 0, behavior: "smooth" });
  };

  if (!isEnabled || !isVisible) {
    return null;
  }
  return (
    <Btn aria-label={t("common:scrollToTop")} onClick={handleClick}>
      <IconAngleUp aria-hidden="true" />
    </Btn>
  );
}

export default ScrollToTop;
