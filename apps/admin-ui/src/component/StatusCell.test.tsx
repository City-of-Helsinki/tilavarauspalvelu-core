import React from "react";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import StatusCell from "./StatusCell";

test("StatusCell", async () => {
  const { container } = render(
    <StatusCell text="Link text" status="allocated" type="applicationEvent" />
  );

  const linkIcon = await screen.findByTestId("status-cell__link--icon");

  expect(linkIcon.getAttribute("aria-label")).toBe("ApplicationEvent.gotoLink");
  expect(await axe(container)).toHaveNoViolations();
});
