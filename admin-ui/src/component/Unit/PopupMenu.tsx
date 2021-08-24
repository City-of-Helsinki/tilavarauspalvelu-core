import { Button, IconMenuDots } from "hds-react";
import React, { RefObject, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import FocusTrap from "focus-trap-react";
import ReactDOM from "react-dom";

interface IProps {
  items: {
    name: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onClick: (e: any) => void;
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
`;

const Popup = styled.div`
  display: flex;
  flex-direction: column;
  background-color: white;
  padding: 0;
  z-index: 501;
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

let open = false;

const usePopup = (
  ref: RefObject<HTMLDivElement | undefined>
): [() => void, () => void, DOMRect | null] => {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const openModal = () => {
    open = true;
    if (ref?.current) {
      setRect(ref.current.getBoundingClientRect());
    }
  };
  const closeModal = () => {
    open = false;
    setRect(null);
  };
  return [openModal, closeModal, rect];
};

const PopupMenu = ({ items }: IProps): JSX.Element => {
  const buttonRef = useRef<HTMLDivElement>(null);
  const firstMenuItemRef = useRef<HTMLButtonElement>(null);
  const [openPopup, closePopup, rect] = usePopup(buttonRef);

  let popupRoot = document.getElementById("popup-root") as HTMLDivElement;

  if (!popupRoot) {
    popupRoot = document.createElement("div");
    popupRoot.setAttribute("id", "popup-root");
    document.body.appendChild(popupRoot);
  }

  useEffect(() => {
    if (firstMenuItemRef.current) {
      firstMenuItemRef.current.focus();
    }
  });

  const style = rect ? { top: rect.top + 36, left: rect.left - 120 } : {};

  const content = (
    <>
      <Overlay
        onKeyPress={closePopup}
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
      {open && popupRoot ? ReactDOM.createPortal(content, popupRoot) : null}
    </Container>
  );
};

export default PopupMenu;
