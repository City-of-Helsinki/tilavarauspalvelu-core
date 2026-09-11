import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, test, expect } from "vitest";
import { Footer } from "./Footer";

describe("Footer", () => {
  test("renders localized links using the provided feedback URL", () => {
    render(<Footer feedbackUrl="https://example.com/feedback" />);

    expect(screen.getByRole("link", { name: /footer:Navigation.serviceTermsLabel/ })).toHaveAttribute(
      "href",
      "/terms/service"
    );
    expect(screen.getByRole("link", { name: /footer:Base.Item.privacyStatement/ })).toHaveAttribute(
      "href",
      "/terms/privacy"
    );
    expect(screen.getByRole("link", { name: /footer:Base.Item.accessibilityStatement/ })).toHaveAttribute(
      "href",
      "/terms/accessibility"
    );
    expect(screen.getByRole("link", { name: /footer:Navigation.feedbackLabel/ })).toHaveAttribute(
      "href",
      "https://example.com/feedback?lang=fi"
    );
  });
});
