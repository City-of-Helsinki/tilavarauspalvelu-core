import type { ApolloClient } from "@apollo/client";
import type { ReadonlyURLSearchParams } from "next/navigation";
import { describe, expect, test, vi } from "vitest";
import { AccessType, ReservationKind, ReservationUnitOrderingChoices, UnitOrderingChoices } from "@gql/gql-types";
import type { OptionsQuery } from "@gql/gql-types";
import { getSearchOptions, processVariables, translateOption } from "./search";

describe("processVariables", () => {
  test("builds direct-booking variables and cleans invalid values", () => {
    const params = new URLSearchParams({
      textSearch: "  studio  ",
      duration: "90",
      personsAllowed: "12",
      sort: "unitName",
      order: "desc",
      startDate: "2.1.2099",
      endDate: "3.1.2099",
      timeBegin: "09:00",
      timeEnd: "11:00",
      showOnlyReservable: "false",
    });
    params.append("units", "3");
    params.append("units", "0");
    params.append("intendedUses", "5");
    params.append("reservationUnitTypes", "7");
    params.append("equipments", "9");
    params.append("accessTypes", AccessType.PhysicalKey);
    params.append("accessTypes", "INVALID");

    expect(
      processVariables({
        values: params as unknown as ReadonlyURLSearchParams,
        language: "sv",
        kind: ReservationKind.Direct,
      })
    ).toEqual({
      textSearch: "  studio  ",
      intendedUses: [5],
      unit: [3],
      reservationUnitType: [7],
      equipments: [9],
      accessType: [AccessType.PhysicalKey],
      accessTypeBeginDate: "2099-01-02",
      accessTypeEndDate: "2099-01-03",
      reservableDateStart: "2099-01-02",
      reservableDateEnd: "2099-01-03",
      reservableTimeStart: "09:00",
      reservableTimeEnd: "11:00",
      reservableMinimumDurationMinutes: 90,
      showOnlyReservable: undefined,
      applicationRound: undefined,
      personsAllowed: 12,
      first: 36,
      orderBy: [ReservationUnitOrderingChoices.UnitNameSvDesc, ReservationUnitOrderingChoices.PkDesc],
      reservationKind: ReservationKind.Direct,
    });
  });

  test("builds seasonal variables with application round and default ordering", () => {
    const params = new URLSearchParams({
      duration: "0",
      sort: "unknown",
      startDate: "1.1.2020",
      endDate: "2.1.2020",
      showOnlyReservable: "true",
    });

    expect(
      processVariables({
        values: params as unknown as ReadonlyURLSearchParams,
        language: "en",
        kind: ReservationKind.Season,
        applicationRound: 15,
      })
    ).toEqual({
      textSearch: undefined,
      intendedUses: undefined,
      unit: undefined,
      reservationUnitType: undefined,
      equipments: undefined,
      accessType: undefined,
      accessTypeBeginDate: undefined,
      accessTypeEndDate: undefined,
      reservableDateStart: undefined,
      reservableDateEnd: undefined,
      reservableTimeStart: undefined,
      reservableTimeEnd: undefined,
      reservableMinimumDurationMinutes: undefined,
      showOnlyReservable: undefined,
      applicationRound: [15],
      personsAllowed: undefined,
      first: 36,
      orderBy: [ReservationUnitOrderingChoices.NameEnAsc, ReservationUnitOrderingChoices.PkAsc],
      reservationKind: ReservationKind.Season,
    });
  });

  test("supports type-rank sorting in finnish", () => {
    const params = new URLSearchParams({
      sort: "typeRank",
    });

    expect(
      processVariables({
        values: params as unknown as ReadonlyURLSearchParams,
        language: "fi",
        kind: ReservationKind.Direct,
      }).orderBy
    ).toEqual([ReservationUnitOrderingChoices.TypeRankAsc, ReservationUnitOrderingChoices.PkAsc]);
  });
});

describe("translateOption", () => {
  test("translates using the requested locale and falls back to pk 0", () => {
    expect(
      translateOption(
        {
          pk: null,
          nameFi: "Sali",
          nameEn: "Hall",
          nameSv: "Sal",
        },
        "en"
      )
    ).toEqual({
      value: 0,
      label: "Hall",
    });
  });
});

describe("getSearchOptions", () => {
  function createApolloClientMock(data: OptionsQuery) {
    const query = vi.fn().mockResolvedValue({ data });
    const client = {
      query,
    } satisfies Pick<ApolloClient<unknown>, "query">;

    return {
      apolloClient: client as unknown as ApolloClient<unknown>,
      query,
    };
  }

  const optionsData = {
    reservationUnitTypes: {
      edges: [
        {
          node: {
            id: "ReservationUnitTypeNode:1",
            pk: 1,
            nameFi: "Tila",
            nameEn: "Space",
            nameSv: "Lokal",
          },
        },
      ],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: null,
        endCursor: null,
      },
      totalCount: 1,
    },
    intendedUses: {
      edges: [
        {
          node: {
            id: "IntendedUseNode:1",
            pk: 2,
            nameFi: "Harjoitus",
            nameEn: "Practice",
            nameSv: "Träning",
            imageUrl: null,
            smallUrl: null,
            rank: 1,
          },
        },
      ],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: null,
        endCursor: null,
      },
      totalCount: 1,
    },
    reservationPurposes: {
      edges: [
        {
          node: {
            id: "PurposeNode:1",
            pk: 3,
            nameFi: "Kokous",
            nameEn: "Meeting",
            nameSv: "Möte",
          },
        },
      ],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: null,
        endCursor: null,
      },
      totalCount: 1,
    },
    ageGroups: {
      edges: [
        {
          node: {
            id: "AgeGroupNode:1",
            pk: 1,
            minimum: 10,
            maximum: 12,
          },
        },
      ],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: null,
        endCursor: null,
      },
      totalCount: 1,
    },
    equipmentsAll: [
      {
        id: "EquipmentNode:1",
        pk: 4,
        nameFi: "Projektori",
        nameEn: "Projector",
        nameSv: "Projektor",
      },
    ],
    unitsAll: [
      {
        id: "UnitNode:1",
        pk: 5,
        nameFi: "Maunula-talo",
        nameEn: "Maunula House",
        nameSv: "Månsasgården",
      },
    ],
  };

  test("queries direct options with direct-only filter", async () => {
    const { apolloClient, query } = createApolloClientMock(optionsData);

    const result = await getSearchOptions(apolloClient, "direct", "fi");

    expect(query).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: expect.objectContaining({
          unitsOrderBy: UnitOrderingChoices.NameFiAsc,
          onlyDirectBookable: true,
        }),
      })
    );
    expect(result.units).toEqual([{ value: 5, label: "Maunula-talo" }]);
    expect(result.equipments).toEqual([{ value: 4, label: "Projektori" }]);
    expect(result.ageGroups).toEqual([{ value: 1, label: "10 - 12" }]);
  });

  test("queries seasonal options with seasonal-only filter and swedish translations", async () => {
    const { apolloClient, query } = createApolloClientMock(optionsData);

    const result = await getSearchOptions(apolloClient, "seasonal", "sv");

    expect(query).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: expect.objectContaining({
          unitsOrderBy: UnitOrderingChoices.NameSvAsc,
          onlySeasonalBookable: true,
        }),
      })
    );
    expect(result.reservationUnitTypes).toEqual([{ value: 1, label: "Lokal" }]);
    expect(result.intendedUses).toEqual([{ value: 2, label: "Träning" }]);
    expect(result.reservationPurposes).toEqual([{ value: 3, label: "Möte" }]);
  });
});
