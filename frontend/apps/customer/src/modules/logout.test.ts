import { describe, expect, test } from "vitest";
import { getPostLogoutPath } from "./logout";

describe("getPostLogoutPath", () => {
  test("returns to a public page with its language and query", () => {
    expect(getPostLogoutPath("/en/reservation-unit/8?date=2024-01-02")).toBe("/en/reservation-unit/8?date=2024-01-02");
    expect(getPostLogoutPath("/sv/search")).toBe("/sv/search");
    expect(getPostLogoutPath("/recurring/5")).toBe("/recurring/5");
  });

  test("returns to the front page in the same language from a page that requires authentication", () => {
    expect(getPostLogoutPath("/en/reservations/5")).toBe("/en");
    expect(getPostLogoutPath("/sv/applications/3/view")).toBe("/sv");
    expect(getPostLogoutPath("/reservations/5/cancel")).toBe("/");
    expect(getPostLogoutPath("/en/reservation-unit/8/reservation/99")).toBe("/en");
  });

  test("returns to the front page when there is no return path", () => {
    expect(getPostLogoutPath(undefined)).toBe("/");
    expect(getPostLogoutPath("")).toBe("/");
  });

  test("does not return to another site", () => {
    expect(getPostLogoutPath("https://example.com/en")).toBe("/");
    expect(getPostLogoutPath("//example.com/en")).toBe("/");
    expect(getPostLogoutPath("/\\example.com")).toBe("/");
    expect(getPostLogoutPath("/\t/example.com")).toBe("/");
    expect(getPostLogoutPath("/\n/example.com")).toBe("/");
  });
});
