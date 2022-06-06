import { ApplicationEvent, Cell } from "../../types";
import {
  getApplicationEventsWhichMinDurationsIsNotFulfilled,
  getListOfApplicationEventTitles,
  getSelectedHours,
} from "../application";

jest.mock("next/config", () => () => ({
  serverRuntimeConfig: {},
  publicRuntimeConfig: {},
}));

jest.mock("next-i18next", () => ({
  i18n: {
    t: (str: string) => str,
  },
}));

describe("getSelectedHours", () => {
  test("with some data", () => {
    const selectorData = [
      [
        [{ state: 200 }, { state: false }],
        [{ state: 300 }, { state: 200 }],
      ],
    ];
    expect(getSelectedHours(selectorData as Cell[][][])).toEqual([3]);
  });

  test("with some data", () => {
    const selectorData = [
      [
        [{ state: 200 }, { state: false }],
        [{ state: 300 }, { state: 200 }],
      ],
      [[{ state: 200 }, { state: false }]],
    ];
    expect(getSelectedHours(selectorData as Cell[][][])).toEqual([3, 1]);
  });

  test("with some data", () => {
    const selectorData = [[[{ state: false }]], [[{ state: false }]]];
    expect(getSelectedHours(selectorData as Cell[][][])).toEqual([0, 0]);
  });

  test("with no data", () => {
    const selectorData = [[[{ state: false }]]];
    expect(getSelectedHours(selectorData as Cell[][][])).toEqual([0]);
  });
});

describe("getApplicationEventsWhichMinDurationsIsNotFulfilled", () => {
  test("with enough data", () => {
    const applicationEvents = [{ minDuration: "01:00:00" }];
    const selectorData = [[[{ state: 300 }]]];
    expect(
      getApplicationEventsWhichMinDurationsIsNotFulfilled(
        applicationEvents as ApplicationEvent[],
        selectorData as Cell[][][]
      )
    ).toEqual([]);
  });

  test("with missing data", () => {
    const applicationEvents = [{ minDuration: "01:30:00" }];
    const selectorData = [[[{ state: 200 }]]];
    expect(
      getApplicationEventsWhichMinDurationsIsNotFulfilled(
        applicationEvents as ApplicationEvent[],
        selectorData as Cell[][][]
      )
    ).toEqual([0]);
  });

  test("with missing data", () => {
    const applicationEvents = [
      { minDuration: "01:30:00" },
      { minDuration: "01:30:00" },
    ];
    const selectorData = [
      [[{ state: 200 }, { state: 300 }]],
      [[{ state: 200 }]],
    ];
    expect(
      getApplicationEventsWhichMinDurationsIsNotFulfilled(
        applicationEvents as ApplicationEvent[],
        selectorData as Cell[][][]
      )
    ).toEqual([1]);
  });
});

describe("getListOfApplicationEventTitles", () => {
  test("with one", () => {
    const applicationEvents = [{ name: "a" }];
    const ids = [0];
    expect(
      getListOfApplicationEventTitles(
        applicationEvents as ApplicationEvent[],
        ids
      )
    ).toEqual('"a"');
  });

  test("with two", () => {
    const applicationEvents = [{ name: "a" }, { name: "b" }];
    const ids = [0, 1];
    expect(
      getListOfApplicationEventTitles(
        applicationEvents as ApplicationEvent[],
        ids
      )
    ).toEqual('"a" common:and "b"');
  });

  test("with three", () => {
    const applicationEvents = [{ name: "a" }, { name: "b" }, { name: "c" }];
    const ids = [0, 1, 2];
    expect(
      getListOfApplicationEventTitles(
        applicationEvents as ApplicationEvent[],
        ids
      )
    ).toEqual('"a", "b" common:and "c"');
  });
});
