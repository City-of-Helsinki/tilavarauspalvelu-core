import type { ApplicationEventScheduleNode } from "common/types/gql-types";
import { getEarliestScheduleStart } from "./applicationRoundAllocation";

describe("getEarliestScheduleStart", () => {
  test("get first matching time", () => {
    const applicationEventSchedules = [
      {
        begin: "09:00:00",
      },
      {
        begin: "08:00:00",
      },
      {
        begin: "09:30:00",
      },
      {
        begin: "09:00:00",
      },
      {
        begin: "08:00:00",
      },
    ] as ApplicationEventScheduleNode[];

    expect(getEarliestScheduleStart(applicationEventSchedules)).toBe(
      "08:00:00"
    );
  });

  test("get first matching time", () => {
    const applicationEventSchedules = [
      {
        begin: "09:00:00",
      },
      {
        begin: "06:00:00",
      },
      {
        begin: "09:30:00",
      },
      {
        begin: "06:30:00",
      },
      {
        begin: "08:00:00",
      },
    ] as ApplicationEventScheduleNode[];

    expect(getEarliestScheduleStart(applicationEventSchedules)).toBe(
      "06:00:00"
    );
  });

  test("run against empty input", () => {
    const applicationEventSchedules = [] as ApplicationEventScheduleNode[];

    expect(getEarliestScheduleStart(applicationEventSchedules)).toBeNull();
  });
});
