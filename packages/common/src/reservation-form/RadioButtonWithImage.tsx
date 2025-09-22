import type { ReactElement } from "react";
import React from "react";
import styled from "styled-components";
import { Flex, focusStyles } from "../../styled";

type Props = {
  id?: string;
  icon: ReactElement;
  label: string;
  checked: boolean;
  onClick: () => void;
};

const BUTTON_HEIGHT = "100px";

const Button = styled.button<{ $checked: boolean }>`
  --color-border: var(--color-black-30);
  --color-checked: var(--color-bus);
  --button-height: ${BUTTON_HEIGHT};

  box-sizing: border-box;
  border: ${({ $checked }) => ($checked ? "1px solid var(--color-checked)" : "1px solid var(--color-border)")};
  border-radius: 2px;
  max-width: 163px;
  min-width: 163px;
  height: var(--button-height);
  cursor: pointer;
  user-select: none;
  background-color: var(--color-white);
  padding: 0;

  ${focusStyles}
  &:hover {
    border-color: var(--color-checked);
  }
`;

const InnerWrapper = styled(Flex).attrs({
  $gap: "none",
  $alignItems: "center",
})<{ $checked: boolean }>`
  border: 4px double transparent;
  padding: var(--spacing-xs);

  box-sizing: inherit;
  height: 100%;

  ${({ $checked }) =>
    $checked &&
    `
    border-color: var(--color-checked);
    color: var(--color-checked);
  `};
`;

const Label = styled.span`
  margin-top: var(--spacing-2-xs);
  cursor: pointer;
  align-self: center;
  font-size: var(--fontsize-body-s);
  text-align: center;
`;

export function RadioButtonWithImage({ id, icon, label, checked, onClick }: Props): JSX.Element {
  const clickHandler = (e: React.MouseEvent) => {
    e.preventDefault();
    onClick();
  };
  const keyDownHandler = (e: React.KeyboardEvent) => {
    if ([" ", "Enter"].includes(e.key)) {
      e.preventDefault();
      onClick();
    }
  };
  return (
    <Button id={id} type="button" onClick={clickHandler} tabIndex={0} onKeyDown={keyDownHandler} $checked={checked}>
      <InnerWrapper $checked={checked}>
        {icon}
        <Label>{label}</Label>
      </InnerWrapper>
    </Button>
  );
}
