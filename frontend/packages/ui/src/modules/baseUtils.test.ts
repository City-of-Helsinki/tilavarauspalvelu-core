import { describe, expect, it } from "vitest";
import { getReleaseVersion } from "./baseUtils";

describe("getReleaseVersion", () => {
  it("removes the v of a release tag", () => {
    expect(getReleaseVersion("v1.73.0", "0123456789abcdef")).toBe("1.73.0");
  });

  it("uses the short commit hash for main", () => {
    expect(getReleaseVersion("main", "0123456789abcdef")).toBe("01234567");
  });

  it("keeps main inside a tag", () => {
    expect(getReleaseVersion("v1.2.3-maintenance.1", "0123456789abcdef")).toBe("1.2.3-maintenance.1");
  });

  it("keeps a branch name that starts with v", () => {
    expect(getReleaseVersion("validation-fix", "0123456789abcdef")).toBe("validation-fix");
  });

  it("replaces slashes in a branch name", () => {
    expect(getReleaseVersion("1234/merge", "0123456789abcdef")).toBe("1234-merge");
  });

  it("returns local without branch and commit", () => {
    expect(getReleaseVersion(undefined, undefined)).toBe("local");
  });
});
