import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect } from "vitest";
import { AccordionWithIcons } from "./AccordionWithIcons";

describe("AccordionWithIcons", () => {
  test("renders the heading, icon list, and closed children by default", () => {
    render(
      <AccordionWithIcons heading="My heading" icons={[{ text: "5 people", icon: <svg /> }]}>
        <div>hidden content</div>
      </AccordionWithIcons>
    );

    expect(screen.getByRole("heading", { name: "My heading" })).toBeInTheDocument();
    expect(screen.getByText("5 people")).toBeInTheDocument();
    expect(screen.getByText("hidden content")).not.toBeVisible();
  });

  test("renders open when initiallyOpen is set", () => {
    render(
      <AccordionWithIcons heading="My heading" initiallyOpen>
        <div>visible content</div>
      </AccordionWithIcons>
    );

    expect(screen.getByText("visible content")).toBeVisible();
  });

  test("toggles content visibility when the toggle button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <AccordionWithIcons heading="My heading">
        <div>toggle content</div>
      </AccordionWithIcons>
    );

    const button = screen.getByRole("button", { name: "common:show" });
    expect(screen.getByText("toggle content")).not.toBeVisible();

    await user.click(button);
    expect(screen.getByText("toggle content")).toBeVisible();
    expect(screen.getByRole("button", { name: "common:close" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "common:close" }));
    expect(screen.getByText("toggle content")).not.toBeVisible();
  });

  test("renders an optional textPostfix alongside the icon text", () => {
    render(
      <AccordionWithIcons heading="My heading" icons={[{ text: "Price", textPostfix: "€10", icon: <svg /> }]}>
        <div>content</div>
      </AccordionWithIcons>
    );

    expect(screen.getByText("Price")).toBeInTheDocument();
    expect(screen.getByText("€10")).toBeInTheDocument();
  });
});
