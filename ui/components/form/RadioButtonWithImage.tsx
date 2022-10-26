import React, { ReactElement } from "react";
import styled from "styled-components";
import { capitalize } from "../../modules/util";

type Props = {
  id: string;
  icon: ReactElement;
  label: string;
  checked: boolean;
  onClick: () => void;
};

const height = "100px";

const Wrapper = styled.button<{ $checked: boolean }>`
  --color-border: var(--color-black-30);
  --color-checked: var(--color-bus);

  box-sizing: border-box;
  border: ${({ $checked }) =>
    $checked
      ? "1px solid var(--color-checked)"
      : "1px solid var(--color-border)"};
  border-radius: 2px;
  max-width: 163px;
  min-width: 163px;
  height: ${height};
  cursor: pointer;
  user-select: none;
  background-color: var(--color-white);
  padding: 0;
`;

const InnerWrapper = styled.div<{ $checked: boolean }>`
  border: 4px double transparent;
  padding: var(--spacing-xs);
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: inherit;
  height: 100%;

  ${({ $checked }) =>
    $checked &&
    `
    border-color: var(--color-checked);
    color: var(--color-checked);
  `};
`;

const Label = styled.label`
  margin-top: var(--spacing-2-xs);
  cursor: pointer;
  align-self: center;
  font-size: var(--fontsize-body-s);
  text-align: center;
`;

const HiddenInput = styled.input`
  visibility: hidden;
  width: 0;
  height: 0;
`;

const RadioButtonWithImage = ({
  id,
  icon,
  label,
  checked,
  onClick,
}: Props): JSX.Element => {
  return (
    <Wrapper
      onClick={() => onClick()}
      tabIndex={0}
      onKeyDown={(e) => {
        if ([" ", "Enter"].includes(e.key)) {
          e.preventDefault();
          onClick();
        }
      }}
      $checked={checked}
    >
      <InnerWrapper $checked={checked}>
        {icon}
        <Label htmlFor={id}>{capitalize(label)}</Label>
        <HiddenInput
          id={id}
          name={id}
          type="radio"
          checked={checked}
          value={id}
          onChange={() => {}}
        />
      </InnerWrapper>
    </Wrapper>
  );
};

export default RadioButtonWithImage;
