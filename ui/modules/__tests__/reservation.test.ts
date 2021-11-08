import { getDurationOptions } from "../reservation";

jest.mock("next/config", () => () => ({
  serverRuntimeConfig: {},
  publicRuntimeConfig: {},
}));

test("getDurationOptions", () => {
  expect(getDurationOptions("0:30:00", "01:30:00")).toEqual([]);
  expect(getDurationOptions("00:30:00", "1:30:00")).toEqual([]);
  expect(getDurationOptions("00:30:00", "01:30:00")).toEqual([
    {
      label: "0:30",
      value: "0:30",
    },
    {
      label: "1:00",
      value: "1:00",
    },
    {
      label: "1:30",
      value: "1:30",
    },
  ]);
  expect(getDurationOptions("00:30:00", "08:30:00", "02:00:00")).toEqual([
    {
      label: "0:30",
      value: "0:30",
    },
    {
      label: "2:30",
      value: "2:30",
    },
    {
      label: "4:30",
      value: "4:30",
    },
    {
      label: "6:30",
      value: "6:30",
    },
    {
      label: "8:30",
      value: "8:30",
    },
  ]);
});
