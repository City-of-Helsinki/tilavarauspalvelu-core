import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, test, expect, vi } from "vitest";
import type { IntendedUseCardFragment } from "@gql/gql-types";
import { IntendedUses } from "./IntendedUses";

const mockUseMedia = vi.fn();
vi.mock("react-use", () => ({ useMedia: (...args: unknown[]) => mockUseMedia(...args) }));

vi.mock("./ReservationUnitSearch", () => ({
  ReservationUnitSearch: () => <div data-testid="mocked-reservation-unit-search" />,
}));

function createIntendedUse(overrides: Partial<IntendedUseCardFragment> = {}): IntendedUseCardFragment {
  return {
    id: "intended-use-1",
    pk: 1,
    nameFi: "Liikunta FI",
    nameEn: "Sports EN",
    nameSv: "Sport SV",
    imageUrl: "https://example.com/image.jpg",
    smallUrl: null,
    ...overrides,
  };
}

describe("IntendedUses", () => {
  test("renders the heading and search box", () => {
    mockUseMedia.mockReturnValue(false);
    render(<IntendedUses intendedUses={[createIntendedUse()]} />);

    expect(screen.getByText("intendedUsesHeading")).toBeInTheDocument();
    expect(screen.getByTestId("mocked-reservation-unit-search")).toBeInTheDocument();
  });

  test("renders a card per intended use with a link to the search page", () => {
    mockUseMedia.mockReturnValue(false);
    const intendedUses = [
      createIntendedUse({ pk: 1, nameFi: "Liikunta" }),
      createIntendedUse({ pk: 2, nameFi: "Kokous" }),
    ];
    render(<IntendedUses intendedUses={intendedUses} />);

    const cards = screen.getAllByTestId("front-page__intended-uses__intended-use");
    expect(cards).toHaveLength(2);
    expect(screen.getByText("Liikunta")).toBeInTheDocument();
    expect(screen.getByText("Kokous")).toBeInTheDocument();

    const link = screen.getByText("Liikunta").closest("a");
    expect(link).toHaveAttribute("href", expect.stringContaining("intendedUses=1"));
  });

  test("falls back to imageUrl when smallUrl is missing, and to a pixel when both are missing", () => {
    mockUseMedia.mockReturnValue(false);
    const intendedUses = [
      createIntendedUse({ pk: 1, nameFi: "HasImageUrl", smallUrl: null, imageUrl: "https://example.com/full.jpg" }),
      createIntendedUse({ pk: 2, nameFi: "HasSmallUrl", smallUrl: "https://example.com/small.jpg", imageUrl: null }),
      createIntendedUse({ pk: 3, nameFi: "NoImage", smallUrl: null, imageUrl: null }),
    ];
    const { container } = render(<IntendedUses intendedUses={intendedUses} />);

    const images = container.querySelectorAll("img");
    expect(images[0]).toHaveAttribute("src", "https://example.com/full.jpg");
    expect(images[1]).toHaveAttribute("src", "https://example.com/small.jpg");
    expect(images[2]?.getAttribute("src")).not.toBe("");
  });

  test("shows a 'show more' toggle once the item count exceeds the mobile limit of 4", () => {
    mockUseMedia.mockReturnValue(true);
    const intendedUses = Array.from({ length: 5 }, (_, i) => createIntendedUse({ pk: i + 1, nameFi: `Use ${i + 1}` }));
    render(<IntendedUses intendedUses={intendedUses} />);

    expect(screen.getByTestId("show-all__toggle-button")).toBeInTheDocument();
  });

  test("does not show a 'show more' toggle when under the desktop limit of 8", () => {
    mockUseMedia.mockReturnValue(false);
    const intendedUses = Array.from({ length: 5 }, (_, i) => createIntendedUse({ pk: i + 1, nameFi: `Use ${i + 1}` }));
    render(<IntendedUses intendedUses={intendedUses} />);

    expect(screen.queryByTestId("show-all__toggle-button")).not.toBeInTheDocument();
  });
});
