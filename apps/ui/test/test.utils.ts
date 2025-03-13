import {
  ApplicationRoundFieldsFragment,
  ApplicationRoundStatusChoice,
  type IsReservableFieldsFragment,
} from "@/gql/gql-types";
import { type ReservableMap, type RoundPeriod } from "@/modules/reservable";
import { fireEvent, render, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReservationStartInterval } from "common/gql/gql-types";
import { base64encode } from "common/src/helpers";
import { addDays } from "date-fns";
import { expect } from "vitest";

// Default implementation fakes all timers (expect tick), remove performance from the list
export const TIMERS_TO_FAKE = [
  "setTimeout",
  "clearTimeout",
  "setInterval",
  "clearInterval",
  "setImmediate",
  "clearImmediate",
  "Date",
] as const;

export const arrowUpKeyPressHelper = (): boolean =>
  fireEvent.keyDown(document, { code: 38, key: "ArrowUp" });

export const arrowDownKeyPressHelper = (): boolean =>
  fireEvent.keyDown(document, { code: 40, key: "ArrowDown" });

export const enterKeyPressHelper = (): boolean =>
  fireEvent.keyDown(document, { code: 13, key: "Enter" });

export const escKeyPressHelper = (): boolean =>
  fireEvent.keyDown(document, { code: 27, key: "Escape" });

export const tabKeyPressHelper = (): boolean =>
  fireEvent.keyDown(document, { code: 9, key: "Tab" });

type ReservationUnitType = Omit<
  IsReservableFieldsFragment,
  "reservableTimeSpans"
>;
type MockReservationUnitProps = {
  bufferTimeBefore?: number;
  bufferTimeAfter?: number;
  reservableTimes?: ReservableMap;
  interval?: ReservationStartInterval;
  maxReservationDuration?: IsReservableFieldsFragment["maxReservationDuration"];
  minReservationDuration?: IsReservableFieldsFragment["minReservationDuration"];
  activeApplicationRounds?: RoundPeriod[];
  reservationsMinDaysBefore?: number;
  reservationsMaxDaysBefore?: number | null;
};
/// create a mock for IsReservableFragment (not a full reservation unit)
export function createMockReservationUnit({
  bufferTimeBefore = 0,
  bufferTimeAfter = 0,
  interval = ReservationStartInterval.Interval_15Mins,
  maxReservationDuration = 0,
  minReservationDuration = 0,
  reservationsMinDaysBefore = 0,
  reservationsMaxDaysBefore = null,
}: MockReservationUnitProps): ReservationUnitType {
  const reservationUnit: ReservationUnitType = {
    id: "1",
    bufferTimeBefore: 60 * 60 * bufferTimeBefore,
    bufferTimeAfter: 60 * 60 * bufferTimeAfter,
    maxReservationDuration,
    minReservationDuration,
    reservationStartInterval: interval,
    reservationsMaxDaysBefore,
    reservationsMinDaysBefore,
    reservationBegins: addDays(new Date(), -1).toISOString(),
    reservationEnds: addDays(new Date(), 180).toISOString(),
  };
  return reservationUnit;
}

export function createMockApplicationRound({
  pk = 1,
  status,
  applicationPeriodEnd,
  applicationPeriodBegin,
}: {
  pk?: number;
  status: ApplicationRoundStatusChoice;
  applicationPeriodEnd: Date;
  applicationPeriodBegin: Date;
}): Readonly<ApplicationRoundFieldsFragment> {
  return {
    id: base64encode(`ApplicationRoundNode:${pk}`),
    pk,
    nameFi: `ApplicationRound ${pk} FI`,
    nameSv: `ApplicationRound ${pk} SV`,
    nameEn: `ApplicationRound ${pk} EN`,
    status,
    reservationPeriodBegin: "2024-02-01T00:00:00Z",
    reservationPeriodEnd: "2025-01-01T00:00:00Z",
    publicDisplayBegin: "2024-02-01T00:00:00Z",
    publicDisplayEnd: "2025-01-01T00:00:00Z",
    applicationPeriodBegin: applicationPeriodBegin.toISOString(),
    applicationPeriodEnd: applicationPeriodEnd.toISOString(),
    reservationUnits: [1, 2, 3].map((pk) => ({
      id: base64encode(`ReservationUnitNode:${pk}`),
      pk,
      unit: {
        id: base64encode(`UnitNode:${pk}`),
        pk,
      },
    })),
  };
}

export function createMockReservationUnitType(
  props: { name: string; pk?: number } | null
) {
  if (props == null) {
    return null;
  }
  const { name, pk } = props;
  return {
    id: `ReservationUnitTypeNode:${pk ?? 1}`,
    pk: pk ?? 1,
    ...generateNameFragment(name),
  };
}

export function generateNameFragment(name: string) {
  return {
    nameFi: `${name} FI`,
    nameSv: `${name} SV`,
    nameEn: `${name} EN`,
  };
}

export async function selectOption(
  view: ReturnType<typeof render>,
  listLabel: RegExp | string,
  optionLabel: RegExp | string
) {
  const user = userEvent.setup();
  const btn = view.getByLabelText(listLabel, {
    selector: "button",
  });
  expect(btn).toBeInTheDocument();
  expect(btn).not.toHaveAttribute("aria-disabled", "true");
  await user.click(btn);
  const listbox = view.getByRole("listbox");
  const type = within(listbox).getByText(optionLabel);
  expect(type).toBeInTheDocument();
  await user.click(type);
}
