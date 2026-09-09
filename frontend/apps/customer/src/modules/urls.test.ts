import { describe, expect, test } from "vitest";
import {
  applicationsPath,
  getApplicationPath,
  getApplicationReservationPath,
  getApplicationRoundPath,
  getApplicationSectionPath,
  getFeedbackUrl,
  getReservationInProgressPath,
  getReservationPath,
  getReservationUnitPath,
  getSingleSearchPath,
  reservationsPath,
} from "./urls";

describe("urls", () => {
  test("exports stable base paths", () => {
    expect(applicationsPath).toBe("/applications/");
    expect(reservationsPath).toBe("/reservations/");
  });

  test("builds recurring and search paths", () => {
    const params = new URLSearchParams({ textSearch: "halli", page: "2" });
    expect(getApplicationRoundPath(5, "criteria")).toBe("/recurring/5/criteria");
    expect(getApplicationRoundPath(undefined)).toBe("");
    expect(getSingleSearchPath(params)).toBe("/search/?textSearch=halli&page=2");
    expect(getSingleSearchPath()).toBe("/search/");
  });

  test("builds application-related paths and handles missing ids", () => {
    expect(getApplicationPath(12, "page2")).toBe("/applications/12/page2");
    expect(getApplicationPath(null)).toBe("");
    expect(getApplicationReservationPath(2, 7)).toBe("/applications/2/reservations/7/cancel");
    expect(getApplicationReservationPath(undefined, 7)).toBe("");
    expect(getApplicationSectionPath(3, 2)).toBe("/applications/2/sections/3/view");
    expect(getApplicationSectionPath(3, 2, "cancel")).toBe("/applications/2/sections/3/cancel");
  });

  test("builds reservation paths with page, notification and step", () => {
    expect(getReservationPath(4)).toBe("/reservations/4/");
    expect(getReservationPath(4, "edit", "paid")).toBe("/reservations/4/edit?notify=paid");
    expect(getReservationPath(undefined)).toBe("");
    expect(getReservationInProgressPath(8, 99, 1)).toBe("/reservation-unit/8/reservation/99?step=1");
    expect(getReservationInProgressPath(8, 99)).toBe("/reservation-unit/8/reservation/99");
  });

  test("builds reservation unit paths and feedback urls", () => {
    const params = new URLSearchParams({ date: "2024-01-02", duration: "60" });
    expect(getReservationUnitPath(42, params)).toBe("/reservation-unit/42?date=2024-01-02&duration=60");
    expect(getReservationUnitPath(undefined)).toBe("");
    expect(getFeedbackUrl("https://feedback.example/form", { language: "sv" })).toBe(
      "https://feedback.example/form?lang=sv"
    );
    expect(getFeedbackUrl("not a url", { language: "fi" })).toBeNull();
  });
});
