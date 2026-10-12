import React from "react";
import { useTranslation } from "next-i18next";
import { IconMenuDots } from "hds-react";
import styled from "styled-components";
import { Flex, toggleButtonCss } from "../styled";
import { Popover } from "./Popover";

const Menu = styled(Flex).attrs({ $gap: "none" })`
  background-color: white;
  padding: 0;

  border: 1px solid var(--color-black-50);
  :not(:has(> button:disabled)) {
    border: 1px solid var(--color-black);
  }
`;

const ListButton = styled.button`
  text-align: left;
  padding: var(--spacing-xs);
  white-space: nowrap;
  width: 100%;
  border: none;
  background-color: transparent;
  :hover {
    background-color: var(--color-black-10);
    cursor: pointer;
  }
  :focus {
    background-color: var(--color-bus);
    outline: none;
    color: var(--color-white);
  }
  :disabled {
    color: var(--color-black-50);
  }
`;

const ToggleButton = styled.button`
  ${toggleButtonCss}
`;

interface Item {
  name: string;
  disabled?: boolean;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

interface PopupMenuProps {
  items: Readonly<Item[]>;
  style?: React.CSSProperties;
  className?: string;
}

export function PopupMenu({ items, style, className }: PopupMenuProps): React.ReactElement {
  const { t } = useTranslation();

  const disabled = items.every((i) => i.disabled); // returns `true` for an empty array

  return (
    <div style={style} className={className}>
      <Popover
        align="end"
        renderTrigger={(triggerProps, isOpen) => (
          <ToggleButton
            {...triggerProps}
            disabled={disabled}
            type="button"
            aria-label={isOpen ? t("common:close") : t("common:show")}
          >
            <IconMenuDots />
          </ToggleButton>
        )}
      >
        {(close) => (
          <Menu>
            {items.map((i) => (
              <ListButton
                key={i.name}
                type="button"
                disabled={i.disabled}
                onClick={(e) => {
                  close();
                  i.onClick(e);
                }}
              >
                {i.name}
              </ListButton>
            ))}
          </Menu>
        )}
      </Popover>
    </div>
  );
}
