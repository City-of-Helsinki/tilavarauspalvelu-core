import { vi, describe, test, expect } from "vitest";
import { type ReservationNode, ReservationStartInterval } from "../../gql/gql-types";
import { getEventBuffers } from "../components/calendar/util";
import { getIntervalMinutes } from "./conversion";
import { getTranslation } from "./util";

const tfunction = (str: string, options: { count: number }) => {
  const countStr = options?.count > 1 ? "plural" : "singular";
  return options?.count ? `${options.count} ${countStr}` : str;
};

vi.mock("next-i18next", () => ({
  i18n: {
    t: (str: string, options: { count: number }) => tfunction(str, options),
  },
}));

test("getIntervalMinutes", () => {
  expect(getIntervalMinutes(ReservationStartInterval.Interval_15Minutes)).toBe(15);
  expect(getIntervalMinutes(ReservationStartInterval.Interval_30Minutes)).toBe(30);
  expect(getIntervalMinutes(ReservationStartInterval.Interval_60Minutes)).toBe(60);
  expect(getIntervalMinutes(ReservationStartInterval.Interval_90Minutes)).toBe(90);
});

describe("getEventBuffers", () => {
  test("outputs correct buffers", () => {
    const events = [
      {
        id: "1234",
        beginsAt: new Date("2019-09-22T12:00:00+00:00").toString(),
        endsAt: new Date("2019-09-22T13:00:00+00:00").toString(),
        bufferTimeBefore: 3600,
        bufferTimeAfter: 5400,
      },
      {
        id: "3456",
        beginsAt: new Date("2019-09-22T15:00:00+00:00").toString(),
        endsAt: new Date("2019-09-22T16:00:00+00:00").toString(),
        bufferTimeBefore: null,
        bufferTimeAfter: 9000,
      },
    ] as ReservationNode[];

    expect(getEventBuffers([])).toEqual([]);
    expect(getEventBuffers(events)).toEqual([
      {
        start: new Date("2019-09-22T11:00:00+00:00"),
        end: new Date("2019-09-22T12:00:00+00:00"),
        event: {
          ...events[0],
          state: "BUFFER",
        },
      },
      {
        start: new Date("2019-09-22T13:00:00+00:00"),
        end: new Date("2019-09-22T14:30:00+00:00"),
        event: {
          ...events[0],
          state: "BUFFER",
        },
      },
      {
        start: new Date("2019-09-22T16:00:00+00:00"),
        end: new Date("2019-09-22T18:30:00+00:00"),
        event: {
          ...events[1],
          state: "BUFFER",
        },
      },
    ]);
  });
});

describe("getTranslation", () => {
  test("allows unknown parameters", () => {
    const t3 = {
      nameFi: "foobar",
      nameEn: "bar",
      nameSv: "sv",
      somethingElse: {
        bar: "fooba",
      },
    };
    expect(getTranslation(t3, "name", "fi")).toBe("foobar");
    expect(getTranslation(t3, "name", "en")).toBe("bar");
    expect(getTranslation(t3, "name", "sv")).toBe("sv");
  });

  test("non string types are an error", () => {
    // @ts-expect-error -- enforce that this will not compile
    expect(() => getTranslation({ nameFi: { foobar: "" }, nameEn: "", nameSv: "" }, "name", "fi")).toThrow();
  });

  test("null is converted to an empty string", () => {
    const dict = { nameFi: null, nameEn: null, nameSv: null };
    expect(getTranslation(dict, "name", "fi")).toBe("");
    expect(getTranslation(dict, "name", "en")).toBe("");
    expect(getTranslation(dict, "name", "sv")).toBe("");
  });

  test("missing a lang is a compile error", () => {
    const dict = { nameFi: "foobar", nameEn: "bazbar" };
    // @ts-expect-error -- enforce that this will not compile
    expect(getTranslation(dict, "name", "fi")).toBe("foobar");
    // @ts-expect-error -- enforce that this will not compile
    expect(() => getTranslation(dict, "name", "sv")).toThrow();
  });

  test("invalid key is an error", () => {
    const dict = { nameFi: "foobar", nameEn: "bazbar", nameSv: "foobar" };
    // @ts-expect-error -- enforce that this will not compile
    expect(() => getTranslation(dict, "description", "fi")).toThrow();
  });

  test.for(["description", "foobar", "some", "abc", "cat", "dog"])("works for other keys : %key", (key) => {
    const dict = {
      [`${key}Fi`]: "bar FI",
      [`${key}En`]: "bar EN",
      [`${key}Sv`]: "bar SV",
    };
    expect(getTranslation(dict, key, "fi")).toBe("bar FI");
    expect(getTranslation(dict, key, "en")).toBe("bar EN");
    expect(getTranslation(dict, key, "sv")).toBe("bar SV");
  });

  test("empty object is an error", () => {
    // @ts-expect-error -- enforce that this will not compile
    expect(() => getTranslation({}, "name", "fi")).toThrow();
  });

  test("null is an error", () => {
    // @ts-expect-error -- enforce that this will not compile
    expect(() => getTranslation(null, "name", "fi")).toThrow();
  });

  test("undefined is an error", () => {
    // @ts-expect-error -- enforce that this will not compile
    expect(() => getTranslation(undefined, "name", "fi")).toThrow();
  });
});
