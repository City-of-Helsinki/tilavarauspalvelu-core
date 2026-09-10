import React, { useEffect } from "react";
import type { ReactElement } from "react";
import { useForm } from "react-hook-form";
import { MockedProvider } from "@apollo/client/testing";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GraphQLError } from "graphql";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getUnitUrl } from "@/modules/urls";
import { ArchiveReservationUnitDocument } from "@gql/gql-types";
import type { ReservationUnitEditQuery, UnitSubpageHeadFragment } from "@gql/gql-types";
import { BottomButtonsStripe } from "./BottomButtonsStripe";
import { convertReservationUnit } from "./form";
import type { ReservationUnitEditFormValues } from "./form";

type Node = NonNullable<ReservationUnitEditQuery["reservationUnit"]>;

const mockPush = vi.fn();
const mockBack = vi.fn();
vi.mock("next/router", () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
}));

const mockErrorToast = vi.fn();
const mockSuccessToast = vi.fn();
vi.mock("ui/src/components/toast", () => ({
  errorToast: (...args: unknown[]) => mockErrorToast(...args),
  successToast: (...args: unknown[]) => mockSuccessToast(...args),
}));

function createReservationUnit(overrides: Partial<Node> = {}): Node {
  return {
    pk: 5,
    extUuid: "uuid-1",
    nameFi: "Test unit",
    ...overrides,
  } as Node;
}

type ModalContent = ReactElement | null;

function Harness({
  reservationUnit,
  unit,
  previewUrlPrefix = "https://preview",
  onSubmit = vi.fn().mockResolvedValue(5),
  setModalContent,
  makeDirty = false,
  initialIsDraft,
  mocks = [],
}: {
  reservationUnit?: Node;
  unit?: UnitSubpageHeadFragment | null;
  previewUrlPrefix?: string;
  onSubmit?: (values: ReservationUnitEditFormValues) => Promise<number>;
  setModalContent: (content: ModalContent) => void;
  makeDirty?: boolean;
  initialIsDraft?: boolean;
  mocks?: ReadonlyArray<unknown>;
}) {
  const form = useForm<ReservationUnitEditFormValues>({
    defaultValues: {
      ...convertReservationUnit(reservationUnit),
      ...(initialIsDraft != null ? { isDraft: initialIsDraft } : {}),
    },
  });

  useEffect(() => {
    if (makeDirty) {
      form.setValue("nameFi", "dirty value", { shouldDirty: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [makeDirty]);

  return (
    <MockedProvider mocks={mocks as never}>
      <BottomButtonsStripe
        reservationUnit={reservationUnit}
        unit={unit}
        previewUrlPrefix={previewUrlPrefix}
        setModalContent={setModalContent}
        onSubmit={onSubmit}
        form={form}
      />
    </MockedProvider>
  );
}

beforeEach(() => {
  mockPush.mockReset();
  mockBack.mockReset();
  mockErrorToast.mockReset();
  mockSuccessToast.mockReset();
});

describe("BottomButtonsStripe", () => {
  it("disables archive and preview when there is no saved reservation unit", () => {
    render(<Harness setModalContent={vi.fn()} />);

    expect(screen.getByRole("button", { name: "reservationUnitEditor:archive" })).toBeDisabled();
    const previewLink = screen.getByText("reservationUnitEditor:preview").closest("a");
    expect(previewLink).toHaveAttribute("disabled");
  });

  it("enables archive and builds a preview link when a reservation unit is saved", () => {
    render(<Harness reservationUnit={createReservationUnit()} setModalContent={vi.fn()} />);

    expect(screen.getByRole("button", { name: "reservationUnitEditor:archive" })).toBeEnabled();
    const previewLink = screen.getByRole("link", { name: "reservationUnitEditor:preview" });
    expect(previewLink).toHaveAttribute("href", "https://preview/5?ru=uuid-1");
  });

  it("goes back immediately when there are no unsaved changes", async () => {
    render(<Harness setModalContent={vi.fn()} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "common:prev" }));

    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it("shows a discard-changes confirmation when going back with unsaved changes", async () => {
    const setModalContent = vi.fn();
    render(<Harness setModalContent={setModalContent} makeDirty />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "common:prev" }));

    expect(mockBack).not.toHaveBeenCalled();
    expect(setModalContent).toHaveBeenCalledTimes(1);
    const dialog = setModalContent.mock.calls[0]?.[0] as ReactElement<{
      onAccept: () => void;
      onClose: () => void;
    }>;
    expect(dialog.props.onAccept).toBeInstanceOf(Function);

    dialog.props.onAccept();
    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(setModalContent).toHaveBeenLastCalledWith(null);
  });

  it("opens an archive confirmation dialog and archives on accept", async () => {
    const setModalContent = vi.fn();
    const reservationUnit = createReservationUnit();
    const unit = { id: "unit-1", pk: 10, nameFi: "Test unit" } as UnitSubpageHeadFragment;
    const mocks = [
      {
        request: { query: ArchiveReservationUnitDocument, variables: { input: { pk: 5 } } },
        result: { data: { archiveReservationUnit: { pk: 5 } } },
      },
    ];
    render(<Harness reservationUnit={reservationUnit} unit={unit} setModalContent={setModalContent} mocks={mocks} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "reservationUnitEditor:archive" }));

    expect(setModalContent).toHaveBeenCalledTimes(1);
    const dialog = setModalContent.mock.calls[0]?.[0] as ReactElement<{ onAccept: () => Promise<void> }>;

    await dialog.props.onAccept();

    await waitFor(() =>
      expect(mockSuccessToast).toHaveBeenCalledWith({ text: "reservationUnitEditor:ArchiveDialog.success" })
    );
    expect(mockPush).toHaveBeenCalledWith(getUnitUrl(unit.pk));
    expect(mockPush).toHaveBeenCalledWith("/units/10/");
    expect(setModalContent).toHaveBeenLastCalledWith(null);
  });

  it("shows an error toast when archiving fails", async () => {
    const setModalContent = vi.fn();
    const reservationUnit = createReservationUnit();
    const mocks = [
      {
        request: { query: ArchiveReservationUnitDocument, variables: { input: { pk: 5 } } },
        result: { errors: [new GraphQLError("boom")] },
      },
    ];
    render(<Harness reservationUnit={reservationUnit} setModalContent={setModalContent} mocks={mocks} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "reservationUnitEditor:archive" }));
    const dialog = setModalContent.mock.calls[0]?.[0] as ReactElement<{ onAccept: () => Promise<void> }>;
    await dialog.props.onAccept();

    await waitFor(() => expect(mockErrorToast).toHaveBeenCalled());
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("saves as draft: sets isDraft true and calls onSubmit", async () => {
    const onSubmit = vi.fn().mockResolvedValue(1);
    render(<Harness setModalContent={vi.fn()} onSubmit={onSubmit} makeDirty initialIsDraft={false} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "reservationUnitEditor:saveAsDraft" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({ isDraft: true });
  });

  it("publishes: sets isDraft false and calls onSubmit", async () => {
    const onSubmit = vi.fn().mockResolvedValue(1);
    render(<Harness setModalContent={vi.fn()} onSubmit={onSubmit} makeDirty initialIsDraft />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "reservationUnitEditor:saveAndPublish" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({ isDraft: false });
  });

  it("shows an error toast when submitting fails", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("failed"));
    render(<Harness setModalContent={vi.fn()} onSubmit={onSubmit} makeDirty initialIsDraft={false} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "reservationUnitEditor:saveAsDraft" }));

    await waitFor(() => expect(mockErrorToast).toHaveBeenCalled());
  });
});
