import React, { useState } from "react";
import styled from "styled-components";
import { useScrollPosition } from "@n8tb1t/use-scroll-position";
import { IconAngleUp } from "hds-react";
import { useMedia } from "react-use";
import { focusStyles } from "common/styled";
import { useTranslation } from "next-i18next";
import { breakpoints } from "common/src/const";

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

function ScrollToTop(): JSX.Element | null {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);

  // TODO why disable this on mobile? (proably because it blocks some submit buttons)
  const isMobile = useMedia(`(max-width: ${breakpoints.m})`, false);

  const height = window.innerHeight;
  useScrollPosition(
    ({ currPos }) => {
      const yPos = Math.abs(currPos.y) + window.innerHeight;
      setIsVisible(yPos > height + 100);
    },
    undefined,
    undefined,
    undefined,
    300
  );

  const handleClick = () => {
    window.scroll({ top: 0, left: 0, behavior: "smooth" });
  };

  if (!isMobile || !isVisible) {
    return null;
  }
  return (
    <Btn aria-label={t("common:scrollToTop")} onClick={handleClick}>
      <IconAngleUp />
    </Btn>
  );
}

export default ScrollToTop;
