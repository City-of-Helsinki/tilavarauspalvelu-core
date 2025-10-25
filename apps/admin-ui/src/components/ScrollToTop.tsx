import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { IconAngleUp } from "hds-react";
import { focusStyles } from "common/styled";
import { useTranslation } from "next-i18next";

const Btn = styled.button`
  --min-size: 34px;
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

export function ScrollToTop(): JSX.Element | null {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const POLL_INTERVAL = 300;
    const timer = setInterval(() => {
      const height = window.innerHeight;
      const currPos = window.scrollY;
      const yPos = currPos + window.innerHeight;
      setIsVisible(yPos > height + 100);
    }, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  const handleClick = () => {
    window.scroll({ top: 0, left: 0, behavior: "smooth" });
  };

  if (!isVisible) {
    return null;
  }
  return (
    <Btn aria-label={t("common:scrollToTop")} onClick={handleClick}>
      <IconAngleUp />
    </Btn>
  );
}
