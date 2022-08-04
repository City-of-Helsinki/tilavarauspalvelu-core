import {
  ApplicationEventScheduleResultType,
  ApplicationEventScheduleType,
  ApplicationEventType,
} from "../../../common/gql-types";
import {
  getApplicationEventScheduleResultStatuses,
  getEarliestScheduleStart,
} from "./applicationRoundAllocation";

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
    ] as ApplicationEventScheduleType[];

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
    ] as ApplicationEventScheduleType[];

    expect(getEarliestScheduleStart(applicationEventSchedules)).toBe(
      "06:00:00"
    );
  });

  test("run against empty input", () => {
    const applicationEventSchedules = [] as ApplicationEventScheduleType[];

    expect(getEarliestScheduleStart(applicationEventSchedules)).toBeNull();
  });
});

describe("getApplicationEventScheduleResultStatuses", () => {
  test("get no data", () => {
    const applicationEvents = [
      {
        applicationEventSchedules: [
          {
            applicationEventScheduleResult: {
              accepted: false,
              declined: false,
              allocatedDay: 2,
              allocatedBegin: "09:00:00",
              allocatedEnd: "13:30:00",
            } as unknown as ApplicationEventScheduleResultType,
          },
          {
            applicationEventScheduleResult: {
              accepted: false,
              declined: false,
              allocatedDay: 2,
              allocatedBegin: "09:00:00",
              allocatedEnd: "13:30:00",
            } as unknown as ApplicationEventScheduleResultType,
          },
        ],
      },
    ] as ApplicationEventType[];

    expect(
      getApplicationEventScheduleResultStatuses(applicationEvents)
    ).toEqual({
      acceptedSlots: [],
      declinedSlots: [],
    });
  });

  test("get some data", () => {
    const applicationEvents = [
      {
        applicationEventSchedules: [
          {
            applicationEventScheduleResult: {
              accepted: true,
              declined: false,
              allocatedDay: 2,
              allocatedBegin: "09:00:00",
              allocatedEnd: "12:30:00",
            } as unknown as ApplicationEventScheduleResultType,
          },
          {
            applicationEventScheduleResult: {
              accepted: false,
              declined: true,
              allocatedDay: 1,
              allocatedBegin: "09:00:00",
              allocatedEnd: "10:00:00",
            } as unknown as ApplicationEventScheduleResultType,
          },
        ],
      },
    ] as ApplicationEventType[];

    expect(
      getApplicationEventScheduleResultStatuses(applicationEvents)
    ).toEqual({
      acceptedSlots: [
        "2-9-00",
        "2-9-30",
        "2-10-00",
        "2-10-30",
        "2-11-00",
        "2-11-30",
        "2-12-00",
      ],
      declinedSlots: ["1-9-00", "1-9-30"],
    });
  });

  test("get some data", () => {
    const applicationEvents = [
      {
        applicationEventSchedules: [
          {
            applicationEventScheduleResult: {
              accepted: true,
              declined: false,
              allocatedDay: 2,
              allocatedBegin: "08:00:00",
              allocatedEnd: "10:30:00",
            } as unknown as ApplicationEventScheduleResultType,
          },
          {
            applicationEventScheduleResult: {
              accepted: false,
              declined: true,
              allocatedDay: 2,
              allocatedBegin: "08:00:00",
              allocatedEnd: "10:30:00",
            } as unknown as ApplicationEventScheduleResultType,
          },
        ],
      },
    ] as ApplicationEventType[];

    expect(
      getApplicationEventScheduleResultStatuses(applicationEvents)
    ).toEqual({
      acceptedSlots: ["2-8-00", "2-8-30", "2-9-00", "2-9-30", "2-10-00"],
      declinedSlots: ["2-8-00", "2-8-30", "2-9-00", "2-9-30", "2-10-00"],
    });
  });
});
