import React from "react";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, test, expect } from "vitest";
import { TermsBox, type TermBoxProps } from "./TermsBox";

const bodyText = `Excepteur ut veniam minim id. Veniam laboris laborum cupidatat nisi sunt est magna id voluptate. Ullamco elit do tempor et dolore. Sit dolore laborum excepteur laborum qui eiusmod. Nisi proident officia labore sunt sit labore. Non aute ut exercitation elit sint. Aute irure reprehenderit reprehenderit amet sunt velit irure voluptate.`;

const defaultProps = {
  id: "testing",
  heading: "A heading with somewhat long text that might wrap to multiple lines",
  body: <span>{bodyText}</span>,
  links: [
    { href: "https://www.google.com", text: "Google" },
    { href: "https://www.hel.fi", text: "Helsinki" },
  ],
  acceptLabel:
    "Esse mollit reprehenderit officia cillum. Sit voluptate aliquip veniam sit labore sit proident proident velit dolore dolor velit. Minim in et esse sint esse minim est qui dolore.",
  accepted: false,
  setAccepted: vi.fn(),
};

const renderComponent = (props: TermBoxProps) => render(<TermsBox {...props} />);

describe("TermsBox", () => {
  test("should render with all props", () => {
    const view = renderComponent(defaultProps);
    expect(view.getByText(defaultProps.heading)).toBeInTheDocument();
    expect(view.getByText(bodyText)).toBeInTheDocument();
    for (const link of defaultProps.links) {
      const anchor = view.getByText(link.text);
      expect(anchor).toBeInTheDocument();
      expect(anchor).toHaveAttribute("href", link.href);
      expect(anchor).toHaveAttribute("target", "_blank");
    }
    expect(view.getByText(defaultProps.acceptLabel)).toBeInTheDocument();
  });

  test("should render with JSX body", () => {
    const view = renderComponent({ body: defaultProps.body });
    const body = view.getByText(bodyText);
    expect(body).toBeInTheDocument();
    expect(body.tagName).toBe("SPAN");
  });

  test("should render with string body", () => {
    const view = renderComponent({ body: "string body" });
    const body = view.getByText("string body");
    expect(body).toBeInTheDocument();
    expect(body.tagName).toBe("P");
  });

  test("should render with only heading", () => {
    const { heading } = defaultProps;
    const view = renderComponent({ heading, body: "" });
    expect(view.getByRole("heading", { name: heading })).toBeInTheDocument();
  });

  test("should render with only links", () => {
    const view = renderComponent({ links: defaultProps.links, body: "" });
    expect(view.queryByRole("list")).toBeInTheDocument();
  });

  test("should not have link container with no links", () => {
    const view = renderComponent({ body: "" });
    expect(view.queryByRole("list")).not.toBeInTheDocument();
  });

  test("should NOT render accept checkbox without setAccepted", () => {
    const view = renderComponent({ ...defaultProps, setAccepted: undefined });
    const checkbox = view.queryByRole("checkbox");
    expect(checkbox).not.toBeInTheDocument();
  });

  test("should NOT render accept checkbox without acceptLabel", () => {
    const view = renderComponent({
      ...defaultProps,
      acceptLabel: undefined,
    });
    const checkbox = view.queryByRole("checkbox");
    expect(checkbox).not.toBeInTheDocument();
  });

  test.for([[true], [false]] as const)("should toggle acceptance callback ", async ([accepted]) => {
    const user = userEvent.setup();
    const setAccepted = vi.fn();
    const view = renderComponent({ ...defaultProps, setAccepted, accepted });
    const checkbox = view.getByRole("checkbox", {
      name: defaultProps.acceptLabel,
    });
    expect(checkbox).toBeInTheDocument();
    await user.click(checkbox);
    expect(setAccepted).toHaveBeenCalledExactlyOnceWith(!accepted);
  });
});
