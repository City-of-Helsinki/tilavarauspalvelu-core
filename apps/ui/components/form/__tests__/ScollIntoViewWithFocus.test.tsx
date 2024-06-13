import { render } from "@testing-library/react";
import React from "react";
import ScrollIntoViewWithFocus from "../ScrollIntoViewWithFocus";

test("should scroll to component when focused", async () => {
  const scrollIntoViewMock = jest.fn();
  window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;
  render(
    <ScrollIntoViewWithFocus isFocused>
      <span>CHILDREN</span>
    </ScrollIntoViewWithFocus>
  );

  expect(scrollIntoViewMock).toHaveBeenCalledWith({
    block: "nearest",
    inline: "nearest",
  });
});
