import { IconMenuDots } from "hds-react";
import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import FocusTrap from "focus-trap-react";
import ReactDOM from "react-dom";
import { Flex } from "../../styles/util";
import { toggleButtonCss } from "../../styles/buttonCss";
import { useTranslation } from "next-i18next";

const Container = styled.div`
  position: relative;
`;

const Popup = styled(Flex).attrs({ $gap: "none" })`
  background-color: white;
  padding: 0;
  position: absolute;
  right: 0;
  z-index: var(--tilavaraus-stack-popup-menu);

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

/* required to allow clicking the button to close it */
const Overlay = styled.div`
  position: absolute;
  z-index: var(--tilavaraus-stack-popup-menu-overlay);
  inset: 0;
`;

const ToggleButton = styled.button`
  ${toggleButtonCss}
`;

interface Item {
  name: string;
  disabled?: boolean;
  onClick: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

interface PopupMenuProps {
  items: Readonly<Item[]>;
  style?: React.CSSProperties;
  className?: string;
}

// TODO now this is relative to the button, but that causes few other issues
// - the popup is forced to open on the left side so using it on the left of a page would cause an overflow
// - the popup will expand containers the buttons are inside of (like <table>, not the cell)
// These seem to be ok for this use case, but for others would need some more work.
export function PopupMenu({
  items,
  style,
  className,
}: PopupMenuProps): JSX.Element {
  const buttonRef = useRef<HTMLDivElement>(null);
  const firstMenuItemRef = useRef<HTMLButtonElement>(null);

  const { t } = useTranslation();

  useEffect(() => {
    if (firstMenuItemRef.current) {
      firstMenuItemRef.current.focus();
    }
  });

  const [isOpen, setIsOpen] = useState(false);

  const openPopup = () => {
    setIsOpen(true);
    document.addEventListener("click", closePopup);
  };

  const closePopup = () => {
    setIsOpen(false);
    document.removeEventListener("click", closePopup);
  };

  const disabled = items.length === 0 || items.every((i) => i.disabled);

  return (
    <Container ref={buttonRef} style={style} className={className}>
      <ToggleButton
        onClick={(e) => {
          e.stopPropagation();
          openPopup();
        }}
        disabled={disabled}
        type="button"
        aria-label={isOpen ? t("common:close") : t("common:show")}
      >
        <IconMenuDots />
      </ToggleButton>
      {isOpen && buttonRef.current
        ? ReactDOM.createPortal(
            <PopupContent
              items={items}
              closePopup={closePopup}
              firstMenuItemRef={firstMenuItemRef}
            />,
            buttonRef.current
          )
        : null}
    </Container>
  );
}

// TODO add loading indicator also
function PopupContent({
  items,
  closePopup,
  firstMenuItemRef,
}: {
  items: PopupMenuProps["items"];
  closePopup: () => void;
  firstMenuItemRef: React.RefObject<HTMLButtonElement>;
}) {
  const canBeTrapped = items.some((i) => !i.disabled);
  return (
    <>
      <Overlay
        onKeyUp={closePopup}
        onClick={(e) => {
          e.stopPropagation();
          closePopup();
        }}
        role="button"
        tabIndex={-1}
      />
      <FocusTrap
        focusTrapOptions={{ allowOutsideClick: true }}
        active={canBeTrapped}
      >
        <Popup>
          {items.map((i, index) => (
            <ListButton
              key={i.name}
              ref={index === 0 ? firstMenuItemRef : undefined}
              type="button"
              disabled={i.disabled}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  closePopup();
                }
              }}
              onClick={(e) => {
                e.stopPropagation();
                closePopup();
                i.onClick(e);
              }}
            >
              {i.name}
            </ListButton>
          ))}
        </Popup>
      </FocusTrap>
    </>
  );
}
