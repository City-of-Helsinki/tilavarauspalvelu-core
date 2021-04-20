import React, { Dispatch, SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Button } from "hds-react";
import { breakpoints } from "../styles/util";

interface IProps {
  buttons: Button[];
  activeKey?: string;
  setActiveKey: Dispatch<SetStateAction<string>>;
  className?: string;
}

interface Button {
  key: string;
  text: string;
  callback?: () => void;
  disabled?: boolean;
}

interface IButtonProps {
  $active: boolean;
}

const Wrapper = styled.div`
  @media (min-width: ${breakpoints.m}) {
    white-space: nowrap;
  }
`;

const StyledButton = styled(Button).attrs(({ $active }: IButtonProps) => ({
  style: {
    "--border-color": "var(--color-black)",
    "--color-bus": $active ? "var(--color-black)" : "var(--color-white)",
    "--color": $active ? "var(--color-white)" : "var(--color-black)",
    "--color-focus": $active ? "var(--color-white)" : "var(--color-black)",
  } as React.CSSProperties,
}))<{ $active: boolean }>`
  display: block;
  width: 100%;

  span {
    padding: var(--spacing-xs);
    margin: 0;
  }

  @media (min-width: ${breakpoints.s}) {
    display: inline-flex;
    width: auto;
  }
`;

function BigRadio({
  buttons,
  activeKey,
  setActiveKey,
  className,
}: IProps): JSX.Element {
  const activeButton = activeKey
    ? buttons.find((n) => n.key === activeKey)
    : buttons[0];

  const { t } = useTranslation();

  return (
    <Wrapper className={className}>
      {buttons.map((button) => (
        <StyledButton
          $active={activeButton?.key === button.key}
          key={button.key}
          onClick={() => {
            if (button.callback) button.callback();
            setActiveKey(button.key);
          }}
          disabled={button.disabled}
        >
          {t(button.text)}
        </StyledButton>
      ))}
    </Wrapper>
  );
}

export default BigRadio;
