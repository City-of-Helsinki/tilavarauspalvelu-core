import { Button, IconMenuDots } from "hds-react";
import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import FocusTrap from "focus-trap-react";
import ReactDOM from "react-dom";

interface IProps {
  items: {
    name: string;
    onClick: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  }[];
}

const RowButton = styled(Button)`
  color: var(--color-black);
  padding: 0;
  border-radius: 0;
  span {
    padding: 0;
  }
`;

const MenuIcon = styled(IconMenuDots)`
  margin-left: auto;
`;

const Container = styled.div`
  margin-left: auto;
  position: relative;
`;

const Popup = styled.div`
  display: flex;
  flex-direction: column;
  background-color: white;
  padding: 0;
  z-index: var(--tilavaraus-admin-stack-popup-menu);
  border: 2px solid var(--color-black);
  button {
    text-align: left;
    padding: var(--spacing-xs);
    width: 100%;
    border: none;
    background-color: transparent;
    :focus {
      background-color: var(--color-bus);
      outline: none;
      color: var(--color-white);
    }
  }
`;

const Overlay = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  z-index: 500;
  left: 0;
  background-color: transparent;
`;

// TODO now this is relative to the button, but that causes few other issues
// - the popup is forced to open on the left side so using it on the left of a page would cause an overflow
// - the popup will expand containers the buttons are inside of (like <table>, not the cell)
// These seem to be ok for this use case, but for others would need some more work.
export function PopupMenu({ items }: IProps): JSX.Element {
  const buttonRef = useRef<HTMLDivElement>(null);
  const firstMenuItemRef = useRef<HTMLButtonElement>(null);

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

  return (
    <Container ref={buttonRef}>
      <RowButton
        onClick={(e) => {
          e.stopPropagation();
          openPopup();
        }}
        iconLeft={<MenuIcon />}
        variant="supplementary"
      >
        {" "}
      </RowButton>
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

function PopupContent({
  items,
  closePopup,
  firstMenuItemRef,
}: {
  items: IProps["items"];
  closePopup: () => void;
  firstMenuItemRef: React.RefObject<HTMLButtonElement>;
}) {
  const style = { top: 36, right: 0 };
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
      <FocusTrap focusTrapOptions={{ allowOutsideClick: true }}>
        <Popup style={{ ...style, position: "absolute" }}>
          {items.map((i, index) => (
            <button
              key={i.name}
              ref={index === 0 ? firstMenuItemRef : undefined}
              type="button"
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
            </button>
          ))}
        </Popup>
      </FocusTrap>
    </>
  );
}
