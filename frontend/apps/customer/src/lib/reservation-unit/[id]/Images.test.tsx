import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect, vi } from "vitest";
import { ReservationUnitImageType } from "@gql/gql-types";
import type { ImageFragment } from "@gql/gql-types";
import { Images } from "./Images";

// nuka-carousel clones slides for wraparound, which duplicates DOM nodes and
// makes queries ambiguous. Stub it so we test only Images' own logic.
vi.mock("@/components/Carousel", () => ({
  Carousel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

function createImage(overrides: Partial<ImageFragment> = {}): ImageFragment {
  return {
    id: "image-1",
    imageUrl: `https://example.com/full-${overrides.id ?? "1"}.jpg`,
    largeUrl: "https://example.com/large.jpg",
    mediumUrl: "https://example.com/medium.jpg",
    smallUrl: "https://example.com/small.jpg",
    imageType: ReservationUnitImageType.Main,
    ...overrides,
  };
}

describe("Images", () => {
  test("renders an empty wrapper when there are no images", () => {
    const { container } = render(<Images images={[]} contextName="Test Space" />);
    expect(container.querySelector("img")).not.toBeInTheDocument();
  });

  test("renders a carousel image per image using the large size and alt text", () => {
    const images = [createImage({ id: "1", largeUrl: "https://example.com/large-1.jpg" }), createImage({ id: "2", largeUrl: "https://example.com/large-2.jpg" })];
    render(<Images images={images} contextName="Test Space" />);

    const carouselImages = screen.getAllByAltText(/common:imgAltForSpace/);
    expect(carouselImages).toHaveLength(2);
    expect(carouselImages[0]).toHaveAttribute("src", "https://example.com/large-1.jpg");
    expect(carouselImages[1]).toHaveAttribute("src", "https://example.com/large-2.jpg");
  });

  test("opens the modal with the clicked image shown at large size", async () => {
    const user = userEvent.setup();
    const images = [createImage({ id: "1", largeUrl: "https://example.com/large-1.jpg" })];
    render(<Images images={images} contextName="Test Space" />);

    await user.click(screen.getByAltText(/common:imgAltForSpace.*#1/));

    const dialog = screen.getByRole("dialog");
    const [largeImage] = within(dialog).getAllByAltText("common:imgAltForSpace");
    expect(largeImage).toHaveAttribute("src", "https://example.com/large-1.jpg");
  });

  test("opens the modal when pressing Enter on a carousel image", async () => {
    const user = userEvent.setup();
    const images = [createImage({ id: "1" })];
    render(<Images images={images} contextName="Test Space" />);

    const carouselImage = screen.getByAltText(/common:imgAltForSpace.*#1/);
    carouselImage.focus();
    await user.keyboard("{Enter}");

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  test("does not open the modal when pressing a key other than Enter", async () => {
    const user = userEvent.setup();
    const images = [createImage({ id: "1" })];
    render(<Images images={images} contextName="Test Space" />);

    const carouselImage = screen.getByAltText(/common:imgAltForSpace.*#1/);
    carouselImage.focus();
    await user.keyboard("{Space}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  test("switches the large image when a thumbnail is clicked", async () => {
    const user = userEvent.setup();
    const images = [
      createImage({ id: "1", largeUrl: "https://example.com/large-1.jpg", smallUrl: "https://example.com/small-1.jpg" }),
      createImage({ id: "2", largeUrl: "https://example.com/large-2.jpg", smallUrl: "https://example.com/small-2.jpg" }),
    ];
    render(<Images images={images} contextName="Test Space" />);

    await user.click(screen.getByAltText(/common:imgAltForSpace.*#1/));
    const dialog = screen.getByRole("dialog");
    // buttons: [close, thumbnail-1, thumbnail-2]
    const buttons = within(dialog).getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(2);
    const secondThumbnailButton = buttons[2];
    if (!secondThumbnailButton) throw new Error("Second thumbnail button not found");
    await user.click(secondThumbnailButton);

    const largeImages = within(dialog).getAllByAltText("common:imgAltForSpace");
    expect(largeImages.length).toBeGreaterThan(0);
    const largeImage = largeImages[0];
    if (!largeImage) throw new Error("Large image not found");
    expect(largeImage).toHaveAttribute("src", "https://example.com/large-2.jpg");
  });

  test("closes the modal when the close button is clicked", async () => {
    const user = userEvent.setup();
    const images = [createImage({ id: "1" })];
    render(<Images images={images} contextName="Test Space" />);

    await user.click(screen.getByAltText(/common:imgAltForSpace.*#1/));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "common:close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
