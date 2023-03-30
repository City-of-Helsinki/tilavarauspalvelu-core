import { ApplicationEvent, Cell } from "common";
import {
  getApplicationEventsWhichMinDurationsIsNotFulfilled,
  getListOfApplicationEventTitles,
  getLongestChunks,
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

describe("getLongestChunks", () => {
  test("with some data", () => {
    const selectorData: Cell[][][] = [
      [
        [
          {
            key: "7-1",
            hour: 7,
            label: "7 - 8",
            state: false,
          },
          {
            key: "8-1",
            hour: 8,
            label: "8 - 9",
            state: 300,
          },
          {
            key: "9-1",
            hour: 9,
            label: "9 - 10",
            state: 300,
          },
          {
            key: "10-1",
            hour: 10,
            label: "10 - 11",
            state: 300,
          },
          {
            key: "11-1",
            hour: 11,
            label: "11 - 12",
            state: false,
          },
          {
            key: "12-1",
            hour: 12,
            label: "12 - 13",
            state: false,
          },
          {
            key: "13-1",
            hour: 13,
            label: "13 - 14",
            state: 300,
          },
          {
            key: "14-1",
            hour: 14,
            label: "14 - 15",
            state: 300,
          },
          {
            key: "15-1",
            hour: 15,
            label: "15 - 16",
            state: false,
          },
          {
            key: "16-1",
            hour: 16,
            label: "16 - 17",
            state: false,
          },
          {
            key: "17-1",
            hour: 17,
            label: "17 - 18",
            state: false,
          },
          {
            key: "18-1",
            hour: 18,
            label: "18 - 19",
            state: false,
          },
          {
            key: "19-1",
            hour: 19,
            label: "19 - 20",
            state: 300,
          },
          {
            key: "20-1",
            hour: 20,
            label: "20 - 21",
            state: false,
          },
          {
            key: "21-1",
            hour: 21,
            label: "21 - 22",
            state: false,
          },
          {
            key: "22-1",
            hour: 22,
            label: "22 - 23",
            state: false,
          },
          {
            key: "23-1",
            hour: 23,
            label: "23 - 24",
            state: false,
          },
        ],
      ],
      [
        [
          {
            key: "7-1",
            hour: 7,
            label: "7 - 8",
            state: false,
          },
          {
            key: "8-1",
            hour: 8,
            label: "8 - 9",
            state: false,
          },
          {
            key: "9-1",
            hour: 9,
            label: "9 - 10",
            state: false,
          },
          {
            key: "10-1",
            hour: 10,
            label: "10 - 11",
            state: false,
          },
          {
            key: "11-1",
            hour: 11,
            label: "11 - 12",
            state: 300,
          },
          {
            key: "12-1",
            hour: 12,
            label: "12 - 13",
            state: 300,
          },
          {
            key: "13-1",
            hour: 13,
            label: "13 - 14",
            state: false,
          },
          {
            key: "14-1",
            hour: 14,
            label: "14 - 15",
            state: false,
          },
          {
            key: "15-1",
            hour: 15,
            label: "15 - 16",
            state: false,
          },
          {
            key: "16-1",
            hour: 16,
            label: "16 - 17",
            state: false,
          },
          {
            key: "17-1",
            hour: 17,
            label: "17 - 18",
            state: 200,
          },
          {
            key: "18-1",
            hour: 18,
            label: "18 - 19",
            state: 200,
          },
          {
            key: "19-1",
            hour: 19,
            label: "19 - 20",
            state: 200,
          },
          {
            key: "20-1",
            hour: 20,
            label: "20 - 21",
            state: 200,
          },
          {
            key: "21-1",
            hour: 21,
            label: "21 - 22",
            state: false,
          },
          {
            key: "22-1",
            hour: 22,
            label: "22 - 23",
            state: false,
          },
          {
            key: "23-1",
            hour: 23,
            label: "23 - 24",
            state: false,
          },
        ],
      ],
    ];
    expect(getLongestChunks(selectorData)).toEqual([3, 4]);
  });

  test("with some data", () => {
    const selectorData = [
      [
        [
          {
            key: "20-1",
            hour: 20,
            label: "20 - 21",
            state: 200,
          },
          {
            key: "21-1",
            hour: 21,
            label: "21 - 22",
            state: false,
          },
        ],
        [
          {
            key: "11-1",
            hour: 11,
            label: "11 - 12",
            state: 300,
          },
          {
            key: "12-1",
            hour: 12,
            label: "12 - 13",
            state: 300,
          },
        ],
      ],
      [
        [
          {
            key: "10-1",
            hour: 10,
            label: "10 - 11",
            state: 300,
          },
          {
            key: "11-1",
            hour: 11,
            label: "11 - 12",
            state: false,
          },
        ],
      ],
    ];
    expect(getLongestChunks(selectorData as Cell[][][])).toEqual([2, 1]);
  });

  test("with some data", () => {
    const selectorData = [[[{ state: false }]], [[{ state: false }]]];
    expect(getLongestChunks(selectorData as Cell[][][])).toEqual([0, 0]);
  });

  test("with no data", () => {
    const selectorData = [[[{ state: false }]]];
    expect(getLongestChunks(selectorData as Cell[][][])).toEqual([0]);
  });
});

describe("getApplicationEventsWhichMinDurationsIsNotFulfilled", () => {
  test("with enough data", () => {
    const applicationEvents = [{ minDuration: "01:00:00" }];
    const selectorData: Cell[][][] = [
      [[{ key: "7-1", hour: 7, label: "7 - 8", state: 300 }]],
    ];
    expect(
      getApplicationEventsWhichMinDurationsIsNotFulfilled(
        applicationEvents as ApplicationEvent[],
        selectorData as Cell[][][]
      )
    ).toEqual([]);
  });

  test("with missing data", () => {
    const applicationEvents = [{ minDuration: "01:30:00" }];
    const selectorData: Cell[][][] = [
      [[{ key: "7-1", hour: 7, label: "7 - 8", state: 200 }]],
    ];
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
      [
        [
          { key: "7-1", hour: 7, label: "7 - 8", state: 200 },
          { key: "8-1", hour: 8, label: "8 - 9", state: 200 },
          { key: "9-1", hour: 8, label: "9 - 10", state: 200 },
        ],
      ],
      [
        [
          { key: "7-1", hour: 7, label: "7 - 8", state: 200 },
          { key: "7-1", hour: 7, label: "7 - 8", state: 200 },
        ],
      ],
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
