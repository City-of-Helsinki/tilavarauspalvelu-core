import type { ApolloClient } from "@apollo/client";
import { describe, test, expect, vi } from "vitest";
import type { OptionsQuery } from "@gql/gql-types";
import { queryOptions } from "./queryOptions";

function createMockApolloClient(data: OptionsQuery): ApolloClient<unknown> {
  return {
    query: vi.fn().mockResolvedValue({ data }),
  } as unknown as ApolloClient<unknown>;
}

function createOptionsData(overrides: Partial<OptionsQuery> = {}): OptionsQuery {
  return {
    reservationUnitTypes: { edges: [] },
    intendedUses: { edges: [] },
    reservationPurposes: {
      edges: [
        { node: { id: "p-2", pk: 2, nameFi: "Kokous", nameEn: "Meeting", nameSv: "Möte" } },
        { node: { id: "p-1", pk: 1, nameFi: "Liikunta", nameEn: "Sports", nameSv: "Sport" } },
      ],
    },
    ageGroups: {
      edges: [
        { node: { id: "a-1", pk: 1, minimum: 18, maximum: 30 } },
        { node: { id: "a-2", pk: 2, minimum: 1, maximum: 17 } },
      ],
    },
    equipmentsAll: [],
    unitsAll: [],
    ...overrides,
  };
}

describe("queryOptions", () => {
  test("maps reservation purposes to translated label/value options", async () => {
    const client = createMockApolloClient(createOptionsData());
    const result = await queryOptions(client, "fi");

    expect(result.purpose).toEqual([
      { label: "Kokous", value: 2 },
      { label: "Liikunta", value: 1 },
    ]);
  });

  test("maps and sorts age groups", async () => {
    const client = createMockApolloClient(createOptionsData());
    const result = await queryOptions(client, "fi");

    expect(result.ageGroup).toEqual([
      { label: "1 - 17", value: 2 },
      { label: "18 - 30", value: 1 },
    ]);
  });

  test("handles missing ageGroups without throwing", async () => {
    const client = createMockApolloClient(createOptionsData({ ageGroups: { edges: [] } }));
    const result = await queryOptions(client, "fi");

    expect(result.ageGroup).toEqual([]);
  });

  test("falls back to 0 for missing purpose/ageGroup pks", async () => {
    const client = createMockApolloClient(
      createOptionsData({
        reservationPurposes: {
          edges: [{ node: { id: "p-1", pk: null, nameFi: "Foo", nameEn: "Foo", nameSv: "Foo" } }],
        },
      })
    );
    const result = await queryOptions(client, "fi");

    expect(result.purpose).toEqual([{ label: "Foo", value: 0 }]);
  });
});
