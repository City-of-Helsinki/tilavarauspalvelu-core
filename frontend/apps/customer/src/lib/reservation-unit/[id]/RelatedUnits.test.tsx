import React from "react";
import { MockedGraphQLProvider } from "@test/test.react.utils";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, test, expect, vi } from "vitest";
import { PaymentType, PriceUnit, RelatedReservationUnitsDocument } from "@gql/gql-types";
import type { RelatedUnitCardFieldsFragment } from "@gql/gql-types";
import { RelatedUnits } from "./RelatedUnits";

vi.mock("@/components/Carousel", () => ({
  Carousel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const { mockedUseMedia } = vi.hoisted(() => ({ mockedUseMedia: vi.fn((_query: string) => false) }));
vi.mock("react-use", () => ({ useMedia: mockedUseMedia }));

function createRelatedUnit(overrides: Partial<RelatedUnitCardFieldsFragment> = {}): RelatedUnitCardFieldsFragment {
  return {
    id: "ru-2",
    pk: 2,
    nameFi: "Related Unit",
    nameEn: "Related Unit EN",
    nameSv: "Related Unit SV",
    maxPersons: null,
    reservationUnitType: null,
    pricings: [],
    images: [],
    unit: {
      id: "unit-2",
      nameFi: "Related Unit's Unit",
      nameSv: "Related Unit's Unit SV",
      nameEn: "Related Unit's Unit EN",
    },
    ...overrides,
  };
}

function renderWithMocks({
  relatedUnits = [createRelatedUnit()],
  thisReservationUnitPk = 1,
  unitPk = 10,
}: {
  relatedUnits?: RelatedUnitCardFieldsFragment[];
  thisReservationUnitPk?: number;
  unitPk?: number;
} = {}) {
  const mocks = [
    {
      request: {
        query: RelatedReservationUnitsDocument,
        variables: { unit: [unitPk] },
      },
      result: {
        data: {
          reservationUnits: {
            edges: relatedUnits.map((node) => ({ node })),
          },
        },
      },
    },
  ];

  return render(
    <MockedGraphQLProvider mocks={mocks}>
      <RelatedUnits thisReservationUnitPk={thisReservationUnitPk} unitPk={unitPk} />
    </MockedGraphQLProvider>
  );
}

describe("RelatedUnits", () => {
  test("renders nothing when the query has no related units", async () => {
    const { container } = renderWithMocks({ relatedUnits: [] });
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  test("renders a card for each related unit, excluding the current one", async () => {
    renderWithMocks({
      relatedUnits: [createRelatedUnit({ pk: 1 }), createRelatedUnit({ pk: 2 }), createRelatedUnit({ pk: 3 })],
      thisReservationUnitPk: 1,
    });

    const headings = await screen.findAllByRole("heading", { name: "Related Unit" });
    expect(headings).toHaveLength(2);
  });

  test("renders the heading and related unit name", async () => {
    renderWithMocks();
    expect(await screen.findByText("reservationUnit:relatedReservationUnits")).toBeInTheDocument();
    expect(screen.getByText("Related Unit's Unit")).toBeInTheDocument();
  });

  test("shows reservation unit type, max persons and price when present", async () => {
    renderWithMocks({
      relatedUnits: [
        createRelatedUnit({
          maxPersons: 8,
          reservationUnitType: {
            id: "type-1",
            pk: 1,
            nameFi: "Meeting room",
            nameEn: "Meeting room",
            nameSv: "Meeting room",
          },
          pricings: [
            {
              id: "pricing-1",
              begins: "2020-01-01",
              priceUnit: PriceUnit.PerHour,
              paymentType: PaymentType.Online,
              lowestPrice: "0",
              highestPrice: "0",
              materialPriceDescriptionFi: "",
              materialPriceDescriptionEn: "",
              materialPriceDescriptionSv: "",
              taxPercentage: { id: "tax-1", pk: 1, value: "24" },
            },
          ],
        }),
      ],
    });

    expect(await screen.findByText("Meeting room")).toBeInTheDocument();
    expect(screen.getByText("reservationUnitCard:maxPersons", { exact: false })).toBeInTheDocument();
  });

  test("omits optional infos when absent", async () => {
    renderWithMocks();
    await screen.findByRole("heading", { name: "Related Unit" });
    expect(screen.queryByText("reservationUnitCard:maxPersons", { exact: false })).not.toBeInTheDocument();
  });

  test("skips the query when the unit has no pk", () => {
    renderWithMocks({ unitPk: 0 });
    // no request is made (skip: true), so the carousel/cards never render
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  test("shows 1 slide on mobile widths", async () => {
    mockedUseMedia.mockImplementation((query: string) => query.includes("max-width"));
    renderWithMocks();
    expect(await screen.findByRole("heading", { name: "Related Unit" })).toBeInTheDocument();
  });
});
