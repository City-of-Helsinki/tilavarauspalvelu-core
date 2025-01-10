import React, { useState } from "react";
import styled from "styled-components";
import { useScrollPosition } from "@n8tb1t/use-scroll-position";
import { Button, IconAngleUp } from "hds-react";
import { useDebounce, useWindowSize } from "react-use";
import { breakpoints } from "common/src/common/style";
import { useTranslation } from "next-i18next";

const Btn = styled(Button)`
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
    /* eslint-disable -- don't remove empty string */
    <Btn
      aria-label={t("common:scrollToTop")}
      onClick={handleClick}
      iconStart={<IconAngleUp aria-hidden="true" />}
    >
      {""}
    </Btn>
    /* eslint-enable */
  );
}

export default ScrollToTop;
