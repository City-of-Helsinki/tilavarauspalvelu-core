import { describe, expect, it } from "vitest";
import {
  getOpeningHoursUrl,
  getApplicationRoundUrl,
  getReservationUrl,
  getApplicationUrl,
  getReservationUnitUrl,
  getSpacesResourcesUrl,
  getSpaceUrl,
  getResourceUrl,
  getUnitUrl,
  getMyUnitUrl,
  getReservationSeriesUrl,
  getNotificationListUrl,
  getNotificationUrl,
  getAccessibilityTermsUrl,
} from "./urls";

const API_BASE_URL = "https://api.test.hel.ninja";

function getReservationUnits(url: string): string | null {
  return new URL(url).searchParams.get("reservation_units");
}

describe("getOpeningHoursUrl", () => {
  it("builds the opening hours url for a single reservation unit", () => {
    const url = getOpeningHoursUrl(API_BASE_URL, 5);
    expect(new URL(url).pathname).toBe("/v1/edit_opening_hours/");
    expect(getReservationUnits(url)).toBe("5");
  });

  it("keeps only the positive pks in a list", () => {
    const url = getOpeningHoursUrl(API_BASE_URL, [1, 0, -2, 3]);
    expect(getReservationUnits(url)).toBe("1,3");
  });

  it("returns an empty string when none of the pks in a list are positive", () => {
    expect(getOpeningHoursUrl(API_BASE_URL, [0, -2])).toBe("");
  });

  it("returns an empty string for an empty list", () => {
    expect(getOpeningHoursUrl(API_BASE_URL, [])).toBe("");
  });

  it.each([null, 0, -1])("returns an empty string for the pk %s", (pk) => {
    expect(getOpeningHoursUrl(API_BASE_URL, pk)).toBe("");
  });

  it("adds the error url as a redirect target", () => {
    const errorUrl = "https://staff.test.hel.ninja/units/5";
    const url = getOpeningHoursUrl(API_BASE_URL, 5, errorUrl);
    expect(new URL(url).searchParams.get("redirect_on_error")).toBe(errorUrl);
  });
});

describe("URL generation functions", () => {
  describe("getApplicationRoundUrl", () => {
    it("returns empty string for null or invalid ID", () => {
      expect(getApplicationRoundUrl(null)).toBe("");
      expect(getApplicationRoundUrl(undefined)).toBe("");
      expect(getApplicationRoundUrl(0)).toBe("");
      expect(getApplicationRoundUrl(-1)).toBe("");
    });

    it("builds URL with ID only", () => {
      expect(getApplicationRoundUrl(5)).toBe("/application-rounds/5/");
    });

    it("appends page parameter when provided", () => {
      expect(getApplicationRoundUrl(5, "criteria")).toBe("/application-rounds/5/criteria");
    });
  });

  describe("getReservationUrl", () => {
    it("returns empty string for null or invalid ID", () => {
      expect(getReservationUrl(null)).toBe("");
      expect(getReservationUrl(undefined)).toBe("");
      expect(getReservationUrl(0)).toBe("");
      expect(getReservationUrl(-1)).toBe("");
    });

    it("builds URL without prefix by default", () => {
      expect(getReservationUrl(5)).toBe("/reservations/5");
    });

    it("includes PUBLIC_URL prefix when requested", () => {
      const url = getReservationUrl(5, true);
      expect(url).toContain("/reservations/5");
    });
  });

  describe("getApplicationUrl", () => {
    it("returns empty string for null or invalid ID", () => {
      expect(getApplicationUrl(null)).toBe("");
      expect(getApplicationUrl(undefined)).toBe("");
      expect(getApplicationUrl(0)).toBe("");
      expect(getApplicationUrl(-1)).toBe("");
    });

    it("builds URL with application ID only", () => {
      expect(getApplicationUrl(42)).toBe("/applications/42");
    });

    it("appends section ID as anchor when provided", () => {
      expect(getApplicationUrl(42, 10)).toBe("/applications/42#10");
    });

    it("ignores invalid section ID", () => {
      expect(getApplicationUrl(42, 0)).toBe("/applications/42");
      expect(getApplicationUrl(42, -1)).toBe("/applications/42");
    });
  });

  describe("getReservationUnitUrl", () => {
    it("returns empty string when both unit and reservation unit are invalid", () => {
      expect(getReservationUnitUrl(null, null)).toBe("");
      expect(getReservationUnitUrl(undefined, undefined)).toBe("");
    });

    it("builds URL with reservation unit only", () => {
      expect(getReservationUnitUrl(null, 5)).toBe("/reservation-units/5");
    });

    it("builds URL with unit and reservation unit", () => {
      expect(getReservationUnitUrl(10, 5)).toBe("/units/10/reservation-units/5");
    });

    it("uses 'new' as default reservation unit", () => {
      expect(getReservationUnitUrl(10)).toBe("/units/10/reservation-units/new");
    });

    it("handles 'new' string for reservation unit", () => {
      expect(getReservationUnitUrl(10, "new")).toBe("/units/10/reservation-units/new");
    });
  });

  describe("getSpacesResourcesUrl", () => {
    it("returns empty string for null or undefined unit", () => {
      expect(getSpacesResourcesUrl(null)).toBe("");
      expect(getSpacesResourcesUrl(undefined)).toBe("");
    });

    it("builds URL with unit ID", () => {
      expect(getSpacesResourcesUrl(5)).toBe("/units/5/spaces-resources");
    });
  });

  describe("getSpaceUrl", () => {
    it("returns empty string when either ID is invalid", () => {
      expect(getSpaceUrl(null, 5)).toBe("");
      expect(getSpaceUrl(5, null)).toBe("");
      expect(getSpaceUrl(undefined, 5)).toBe("");
      expect(getSpaceUrl(5, undefined)).toBe("");
    });

    it("builds URL with both space and unit IDs", () => {
      expect(getSpaceUrl(3, 5)).toBe("/units/5/spaces/3");
    });
  });

  describe("getResourceUrl", () => {
    it("returns empty string when either ID is invalid", () => {
      expect(getResourceUrl(null, 5)).toBe("");
      expect(getResourceUrl(5, null)).toBe("");
      expect(getResourceUrl(undefined, 5)).toBe("");
      expect(getResourceUrl(5, undefined)).toBe("");
    });

    it("builds URL with both resource and unit IDs", () => {
      expect(getResourceUrl(2, 5)).toBe("/units/5/resources/2");
    });
  });

  describe("getUnitUrl", () => {
    it("builds URL with unit ID only", () => {
      expect(getUnitUrl(5)).toBe("/units/5/");
    });

    it("appends page parameter when provided", () => {
      expect(getUnitUrl(5, "spaces-resources")).toBe("/units/5/spaces-resources");
    });

    it("handles undefined unit ID", () => {
      expect(getUnitUrl(undefined)).toContain("/units/");
    });
  });

  describe("getMyUnitUrl", () => {
    it("builds URL with unit ID", () => {
      expect(getMyUnitUrl(5)).toBe("/my-units/5");
    });

    it("handles undefined unit ID", () => {
      expect(getMyUnitUrl(undefined)).toContain("/my-units/");
    });
  });

  describe("getReservationSeriesUrl", () => {
    it("returns empty string for invalid unit ID", () => {
      expect(getReservationSeriesUrl(null)).toBe("");
      expect(getReservationSeriesUrl(undefined)).toBe("");
      expect(getReservationSeriesUrl(0)).toBe("");
      expect(getReservationSeriesUrl(-1)).toBe("");
    });

    it("builds URL for listing series", () => {
      expect(getReservationSeriesUrl(5)).toBe("/my-units/5/recurring");
    });

    it("builds URL for specific series", () => {
      expect(getReservationSeriesUrl(5, 10)).toBe("/my-units/5/recurring/10/");
    });

    it("builds URL with page parameter", () => {
      expect(getReservationSeriesUrl(5, 10, "completed")).toBe("/my-units/5/recurring/10/completed");
    });

    it("ignores invalid series ID", () => {
      expect(getReservationSeriesUrl(5, 0)).toBe("/my-units/5/recurring");
      expect(getReservationSeriesUrl(5, -1)).toBe("/my-units/5/recurring");
    });
  });

  describe("notification URLs", () => {
    it("getNotificationListUrl returns notification list URL", () => {
      expect(getNotificationListUrl()).toBe("/notifications");
    });

    it("getNotificationUrl returns empty string for invalid ID", () => {
      expect(getNotificationUrl(null)).toBe("");
      expect(getNotificationUrl(undefined)).toBe("");
      expect(getNotificationUrl(0)).toBe("");
      expect(getNotificationUrl(-1)).toBe("");
    });

    it("getNotificationUrl builds URL with ID", () => {
      expect(getNotificationUrl(5)).toBe("/notifications/5");
    });
  });

  describe("getAccessibilityTermsUrl", () => {
    it("returns a URL with accessibility terms path", () => {
      const url = getAccessibilityTermsUrl();
      expect(url).toContain("/terms/accessibility-admin");
    });
  });
});
