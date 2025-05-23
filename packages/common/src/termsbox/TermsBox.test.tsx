import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import TermsBox, { type TermBoxProps } from "./TermsBox";
import { vi, describe, test, expect } from "vitest";

const bodyText = `Excepteur ut veniam minim id. Veniam laboris laborum cupidatat nisi sunt est magna id voluptate. Ullamco elit do tempor et dolore. Sit dolore laborum excepteur laborum qui eiusmod. Nisi proident officia labore sunt sit labore. Non aute ut exercitation elit sint. Aute irure reprehenderit reprehenderit amet sunt velit irure voluptate.`;

const defaultProps = {
  id: "testing",
  heading:
    "A heading with somewhat long text that might wrap to multiple lines",
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

const renderComponent = (props?: Partial<TermBoxProps>) =>
  render(<TermsBox {...defaultProps} {...props} />);

describe("TermsBox", () => {
  test("should render with default props", () => {
    renderComponent();

    const link1 = screen.getByText(defaultProps.links[0]?.text ?? "");
    const link2 = screen.getByText(defaultProps.links[1]?.text ?? "");

    expect(screen.getByText(defaultProps.heading)).toBeInTheDocument();

    expect(screen.getByText(bodyText)).toBeInTheDocument();

    expect(link1).toBeInTheDocument();
    expect(link1).toHaveAttribute("href", defaultProps.links[0]?.href);
    expect(link1).toHaveAttribute("target", "_blank");

    expect(link2).toBeInTheDocument();
    expect(link2).toHaveAttribute("href", defaultProps.links[1]?.href);
    expect(link2).toHaveAttribute("target", "_blank");

    expect(screen.getByText(defaultProps.acceptLabel)).toBeInTheDocument();
  });

  test("should render without acceptance", () => {
    renderComponent({ acceptLabel: undefined });

    expect(
      screen.queryByText(defaultProps.acceptLabel)
    ).not.toBeInTheDocument();
  });

  test("should render without links", () => {
    renderComponent({ links: undefined });

    expect(screen.getByText(defaultProps.heading)).toBeInTheDocument();
    expect(screen.getByText(bodyText)).toBeInTheDocument();
    expect(screen.getByText(defaultProps.acceptLabel)).toBeInTheDocument();
  });

  test("should fire acceptance callback", () => {
    renderComponent();

    const checkbox = screen.getByTestId("terms-box__checkbox--accept-terms");

    fireEvent.click(checkbox);
    fireEvent.click(checkbox);

    expect(defaultProps.setAccepted).toHaveBeenCalledTimes(2);
  });
});
