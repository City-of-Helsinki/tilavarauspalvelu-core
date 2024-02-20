import { Weekday } from "../types/gql-types";

export type Day = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export function transformWeekday(d: Day): Weekday {
  switch (d) {
    case 0:
      return Weekday.Monday;
    case 1:
      return Weekday.Tuesday;
    case 2:
      return Weekday.Wednesday;
    case 3:
      return Weekday.Thursday;
    case 4:
      return Weekday.Friday;
    case 5:
      return Weekday.Saturday;
    case 6:
      return Weekday.Sunday;
  }
}

export function convertWeekday(d: Weekday): Day {
  switch (d) {
    case Weekday.Monday:
      return 0;
    case Weekday.Tuesday:
      return 1;
    case Weekday.Wednesday:
      return 2;
    case Weekday.Thursday:
      return 3;
    case Weekday.Friday:
      return 4;
    case Weekday.Saturday:
      return 5;
    case Weekday.Sunday:
      return 6;
  }
}
