import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ReservationUnitImageType } from "@gql/gql-types";
import { ImageEditor } from "./ImageEditor";
import type { ImageFormType } from "./form";

const MAIN_IMAGE: ImageFormType = {
  pk: 1,
  imageUrl: "https://example.com/main.jpg",
  mediumUrl: "https://example.com/main-medium.jpg",
  imageType: ReservationUnitImageType.Main,
};

const OTHER_IMAGE: ImageFormType = {
  pk: 2,
  imageUrl: "https://example.com/other.jpg",
  mediumUrl: "https://example.com/other-medium.jpg",
  imageType: ReservationUnitImageType.Other,
};

const DELETED_IMAGE: ImageFormType = {
  pk: 3,
  imageUrl: "https://example.com/deleted.jpg",
  imageType: ReservationUnitImageType.Other,
  deleted: true,
};

function Harness({ images, setImages }: { images: ImageFormType[]; setImages: (images: ImageFormType[]) => void }) {
  return <ImageEditor images={images} setImages={setImages} />;
}

describe("ImageEditor", () => {
  it("renders the file input and one image per non-deleted image", () => {
    render(<Harness images={[MAIN_IMAGE, OTHER_IMAGE, DELETED_IMAGE]} setImages={vi.fn()} />);

    expect(screen.getByLabelText("reservationUnitEditor:ImageEditor.label")).toBeInTheDocument();
    expect(screen.getAllByRole("img")).toHaveLength(2);
  });

  it("shows the main-image label for the main image and a promote button for others", () => {
    render(<Harness images={[MAIN_IMAGE, OTHER_IMAGE]} setImages={vi.fn()} />);

    expect(screen.getByText("reservationUnitEditor:ImageEditor.mainImage")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "reservationUnitEditor:ImageEditor.useAsMainImage" })
    ).toBeInTheDocument();
  });

  it("promotes another image to be the main image", async () => {
    const setImages = vi.fn();
    const user = userEvent.setup();
    render(<Harness images={[MAIN_IMAGE, OTHER_IMAGE]} setImages={setImages} />);

    await user.click(screen.getByRole("button", { name: "reservationUnitEditor:ImageEditor.useAsMainImage" }));

    expect(setImages).toHaveBeenCalledWith([
      { ...MAIN_IMAGE, imageType: ReservationUnitImageType.Other },
      { ...OTHER_IMAGE, imageType: ReservationUnitImageType.Main },
    ]);
  });

  it("marks a saved image (positive pk) as deleted instead of removing it", async () => {
    const setImages = vi.fn();
    const user = userEvent.setup();
    render(<Harness images={[MAIN_IMAGE, OTHER_IMAGE]} setImages={setImages} />);

    const [, secondRemoveButton] = screen.getAllByRole("button", { name: "common:remove" });
    if (!secondRemoveButton) throw new Error("expected a second remove button");
    await user.click(secondRemoveButton);

    expect(setImages).toHaveBeenCalledWith([
      { ...MAIN_IMAGE, deleted: undefined },
      { ...OTHER_IMAGE, deleted: true },
    ]);
  });

  it("removes an unsaved image (non-positive pk) outright", async () => {
    const setImages = vi.fn();
    const user = userEvent.setup();
    const unsavedImage: ImageFormType = { ...OTHER_IMAGE, pk: -1 };
    render(<Harness images={[MAIN_IMAGE, unsavedImage]} setImages={setImages} />);

    const [, secondRemoveButton] = screen.getAllByRole("button", { name: "common:remove" });
    if (!secondRemoveButton) throw new Error("expected a second remove button");
    await user.click(secondRemoveButton);

    expect(setImages).toHaveBeenCalledWith([MAIN_IMAGE]);
  });
});
