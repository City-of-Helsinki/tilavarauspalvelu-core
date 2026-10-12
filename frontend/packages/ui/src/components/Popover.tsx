import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FocusTrap } from "focus-trap-react";
import styled from "styled-components";

// Space between the trigger and the panel, and the minimum space between the panel and the window edge
const GAP_PX = 4;

const Panel = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  z-index: var(--tilavaraus-stack-popup-menu);
  outline: none;
`;

export type PopoverTriggerProps = {
  ref: React.RefObject<HTMLButtonElement | null>;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  "aria-expanded": boolean;
};

interface PopoverProps {
  /// Render the button that opens and closes the popover. Spread the props on a <button>.
  renderTrigger: (props: PopoverTriggerProps, isOpen: boolean) => React.ReactNode;
  /// Content of the popover. Use the function form to close the popover from the content.
  children: React.ReactNode | ((close: () => void) => React.ReactNode);
  /// Which edge of the trigger the panel aligns to
  align?: "start" | "end";
}

/// Button that opens a panel below it (or above it if there is no space below).
/// The panel is rendered in document.body with a fixed position,
/// so containers with overflow do not clip it and tables do not grow because of it.
/// The panel closes on Escape, on a click outside it, and when the page scrolls or resizes.
/// Focus moves into the panel when it opens and goes back to the trigger when it closes.
export function Popover({ renderTrigger, children, align = "start" }: PopoverProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const isInside = (target: EventTarget | null) =>
      target instanceof Node && (panelRef.current?.contains(target) || triggerRef.current?.contains(target));

    const handlePointerDown = (e: PointerEvent) => {
      if (!isInside(e.target)) {
        close();
      }
    };
    // The position is computed only once, so close the panel instead of moving it with the trigger.
    // Scroll events do not bubble. Use capture to see the scroll of any container, such as the calendar.
    const handleScroll = (e: Event) => {
      if (!isInside(e.target)) {
        close();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", close);
    };
  }, [isOpen, close]);

  // Layout effect so the panel is in the correct place before the browser paints it
  useLayoutEffect(() => {
    if (isOpen && triggerRef.current && panelRef.current) {
      placePanel(triggerRef.current, panelRef.current, align);
    }
  }, [isOpen, align]);

  const triggerProps: PopoverTriggerProps = {
    ref: triggerRef,
    onClick: (e) => {
      // React events bubble from the trigger to its parents, which can also have click handlers
      e.stopPropagation();
      setIsOpen((prev) => !prev);
    },
    "aria-expanded": isOpen,
  };

  return (
    <>
      {renderTrigger(triggerProps, isOpen)}
      {isOpen &&
        createPortal(
          <FocusTrap
            focusTrapOptions={{
              allowOutsideClick: true,
              // The keydown listener above closes the popover on Escape. Unmount then deactivates the trap.
              // Do not close in onDeactivate. StrictMode deactivates the trap on mount, which closes the popover at once.
              escapeDeactivates: false,
              fallbackFocus: () => panelRef.current ?? document.body,
              setReturnFocus: () => triggerRef.current ?? false,
              preventScroll: true,
            }}
          >
            {/* React events bubble through the portal to the parents of the trigger. Stop them here. */}
            <Panel ref={panelRef} tabIndex={-1} onClick={(e) => e.stopPropagation()}>
              {typeof children === "function" ? children(close) : children}
            </Panel>
          </FocusTrap>,
          document.body
        )}
    </>
  );
}

function placePanel(trigger: HTMLElement, panel: HTMLElement, align: "start" | "end"): void {
  const triggerRect = trigger.getBoundingClientRect();
  const panelRect = panel.getBoundingClientRect();

  const below = triggerRect.bottom + GAP_PX;
  const above = triggerRect.top - GAP_PX - panelRect.height;
  const fitsBelow = below + panelRect.height <= window.innerHeight;
  const top = fitsBelow || above < 0 ? below : above;

  const preferredLeft = align === "end" ? triggerRect.right - panelRect.width : triggerRect.left;
  const maxLeft = window.innerWidth - panelRect.width - GAP_PX;
  const left = Math.max(GAP_PX, Math.min(preferredLeft, maxLeft));

  panel.style.top = `${top}px`;
  panel.style.left = `${left}px`;
}
