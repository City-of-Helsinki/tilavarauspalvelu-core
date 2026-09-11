import React from "react";
import type { FieldError, FieldErrors } from "react-hook-form";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { FormErrorSummary } from "./FormErrorSummary";

function makeErrors(fields: Record<string, string>): FieldErrors {
  const errors: FieldErrors = {};
  for (const [key, message] of Object.entries(fields)) {
    errors[key] = { type: "validate", message } satisfies FieldError;
  }
  return errors;
}

vi.mock("next-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("FormErrorSummary", () => {
  it("returns null when there are no errors", () => {
    const { container } = render(<FormErrorSummary errors={{}} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders when there are errors", () => {
    const errors = makeErrors({ field1: "field1Error" });
    const { container } = render(<FormErrorSummary errors={errors} />);
    expect(container.querySelector("ul")).toBeInTheDocument();
  });

  it("renders error list items for each error", () => {
    const errors = makeErrors({ field1: "field1Error", field2: "field2Error" });
    render(<FormErrorSummary errors={errors} />);
    const listItems = screen.getAllByRole("listitem");
    expect(listItems).toHaveLength(2);
  });

  it("uses default error prefix when fieldNamePrefix is not provided", () => {
    const errors = makeErrors({ field1: "field1Error" });
    const { container } = render(<FormErrorSummary errors={errors} />);
    expect(container.querySelector("ul")).toBeInTheDocument();
  });

  it("uses custom fieldNamePrefix when provided", () => {
    const errors = makeErrors({ field1: "field1Error" });
    const { container } = render(<FormErrorSummary errors={errors} fieldNamePrefix="customPrefix" />);
    expect(container.querySelector("ul")).toBeInTheDocument();
  });

  it("strips trailing dot from fieldNamePrefix", () => {
    const errors = makeErrors({ field1: "field1Error" });
    const { container } = render(<FormErrorSummary errors={errors} fieldNamePrefix="customPrefix." />);
    expect(container.querySelector("ul")).toBeInTheDocument();
  });

  it("focuses summary on mount", () => {
    const errors = makeErrors({ field1: "field1Error" });
    const { container } = render(<FormErrorSummary errors={errors} />);
    const wrapper = container.querySelector("[tabindex='-1']");
    expect(wrapper).toHaveFocus();
  });

  it("renders error items", () => {
    const errors = makeErrors({ field1: "field1Error" });
    render(<FormErrorSummary errors={errors} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
  });

  it("handles multiple errors with proper indexing", () => {
    const errors = makeErrors({
      firstName: "firstNameError",
      lastName: "lastNameError",
      email: "emailError",
    });
    render(<FormErrorSummary errors={errors} />);
    const listItems = screen.getAllByRole("listitem");
    expect(listItems).toHaveLength(3);
  });
});
