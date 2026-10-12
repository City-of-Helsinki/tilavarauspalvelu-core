import React, { StrictMode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { Popover } from "./Popover";

function renderPopover({ onParentClick = vi.fn() }: { onParentClick?: () => void } = {}) {
  // StrictMode like the apps. It mounts effects twice, which exposes cleanup bugs.
  render(
    <StrictMode>
      <div>
        {/* oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
        <div onClick={onParentClick}>
          <Popover
            renderTrigger={(props) => (
              <button type="button" {...props}>
                Open
              </button>
            )}
          >
            {(close) => (
              <button type="button" onClick={close}>
                Inside
              </button>
            )}
          </Popover>
        </div>
        <button type="button">Outside</button>
      </div>
    </StrictMode>
  );
  return { user: userEvent.setup() };
}

describe("Popover", () => {
  test("opens and closes when the trigger is clicked", async () => {
    const { user } = renderPopover();
    const trigger = screen.getByRole("button", { name: "Open" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("button", { name: "Inside" })).not.toBeInTheDocument();

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Inside" })).toBeInTheDocument();

    await user.click(trigger);
    expect(screen.queryByRole("button", { name: "Inside" })).not.toBeInTheDocument();
  });

  test("moves focus into the panel when it opens", async () => {
    const { user } = renderPopover();
    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByRole("button", { name: "Inside" })).toHaveFocus();
  });

  test("closes on a click outside the panel", async () => {
    const { user } = renderPopover();
    await user.click(screen.getByRole("button", { name: "Open" }));
    await user.click(screen.getByRole("button", { name: "Outside" }));
    expect(screen.queryByRole("button", { name: "Inside" })).not.toBeInTheDocument();
  });

  test("closes on Escape and returns focus to the trigger", async () => {
    const { user } = renderPopover();
    const trigger = screen.getByRole("button", { name: "Open" });
    await user.click(trigger);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("button", { name: "Inside" })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  test("closes when the content calls close", async () => {
    const { user } = renderPopover();
    await user.click(screen.getByRole("button", { name: "Open" }));
    await user.click(screen.getByRole("button", { name: "Inside" }));
    expect(screen.queryByRole("button", { name: "Inside" })).not.toBeInTheDocument();
  });

  test("closes when the page scrolls", async () => {
    const { user } = renderPopover();
    await user.click(screen.getByRole("button", { name: "Open" }));
    fireEvent.scroll(document);
    expect(screen.queryByRole("button", { name: "Inside" })).not.toBeInTheDocument();
  });

  test("does not send clicks to the parents of the trigger", async () => {
    const onParentClick = vi.fn();
    const { user } = renderPopover({ onParentClick });
    await user.click(screen.getByRole("button", { name: "Open" }));
    await user.click(screen.getByRole("button", { name: "Inside" }));
    expect(onParentClick).not.toHaveBeenCalled();
  });
});
