import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { getDefaultServerSideProps, getCommonServerSideProps } from "./serverUtils";

describe("serverUtils", () => {
  describe("getDefaultServerSideProps", () => {
    it("returns default server-side props", () => {
      const props = getDefaultServerSideProps();

      expect(props).toHaveProperty("apiBaseUrl");
      expect(props).toHaveProperty("feedbackUrl");
      expect(props).toHaveProperty("isConsoleLoggingEnabled");
      expect(props).toHaveProperty("reservationUnitPreviewUrl");
      expect(props).toHaveProperty("version");
    });

    it("returns empty apiBaseUrl by default", () => {
      const props = getDefaultServerSideProps();
      expect(props.apiBaseUrl).toBe("");
    });

    it("returns empty feedbackUrl by default", () => {
      const props = getDefaultServerSideProps();
      expect(props.feedbackUrl).toBe("");
    });

    it("returns true for isConsoleLoggingEnabled by default", () => {
      const props = getDefaultServerSideProps();
      expect(props.isConsoleLoggingEnabled).toBe(true);
    });

    it("returns empty reservationUnitPreviewUrl by default", () => {
      const props = getDefaultServerSideProps();
      expect(props.reservationUnitPreviewUrl).toBe("");
    });

    it("returns a version string", () => {
      const props = getDefaultServerSideProps();
      expect(typeof props.version).toBe("string");
    });

    it("returns consistent props on multiple calls", () => {
      const props1 = getDefaultServerSideProps();
      const props2 = getDefaultServerSideProps();

      expect(props1.apiBaseUrl).toBe(props2.apiBaseUrl);
      expect(props1.feedbackUrl).toBe(props2.feedbackUrl);
      expect(props1.isConsoleLoggingEnabled).toBe(props2.isConsoleLoggingEnabled);
      expect(props1.reservationUnitPreviewUrl).toBe(props2.reservationUnitPreviewUrl);
      expect(props1.version).toBe(props2.version);
    });
  });

  describe("getCommonServerSideProps", () => {
    beforeEach(() => {
      // Mock the env module
      vi.doMock("@/env.mjs", () => ({
        env: {
          TILAVARAUS_API_URL: "https://api.example.com",
          FEEDBACK_URL: "https://feedback.example.com",
          ENABLE_CONSOLE_LOGGING: true,
          RESERVATION_UNIT_PREVIEW_URL_PREFIX: "https://preview.example.com",
        },
      }));
    });

    afterEach(() => {
      vi.resetModules();
    });

    it("returns a promise", () => {
      const result = getCommonServerSideProps();
      expect(result).toBeInstanceOf(Promise);
    });

    it("resolves with required properties", async () => {
      const props = await getCommonServerSideProps();

      expect(props).toHaveProperty("apiBaseUrl");
      expect(props).toHaveProperty("feedbackUrl");
      expect(props).toHaveProperty("isConsoleLoggingEnabled");
      expect(props).toHaveProperty("reservationUnitPreviewUrl");
      expect(props).toHaveProperty("version");
    });

    it("includes version in the result", async () => {
      const props = await getCommonServerSideProps();
      expect(typeof props.version).toBe("string");
    });

    it("returns empty strings when env variables are not set", async () => {
      vi.resetModules();
      vi.doMock("@/env.mjs", () => ({
        env: {
          TILAVARAUS_API_URL: undefined,
          FEEDBACK_URL: undefined,
          ENABLE_CONSOLE_LOGGING: undefined,
          RESERVATION_UNIT_PREVIEW_URL_PREFIX: undefined,
        },
      }));

      const { getCommonServerSideProps: getPropsWithEmptyEnv } = await import("./serverUtils");
      const props = await getPropsWithEmptyEnv();

      expect(props.apiBaseUrl).toBe("");
      expect(props.feedbackUrl).toBe("");
      expect(props.isConsoleLoggingEnabled).toBe(false);
      expect(props.reservationUnitPreviewUrl).toBe("");
    });

    it("respects env configuration when provided", async () => {
      const props = await getCommonServerSideProps();

      expect(props.apiBaseUrl).toBe("https://api.example.com");
      expect(props.feedbackUrl).toBe("https://feedback.example.com");
      expect(props.isConsoleLoggingEnabled).toBe(true);
      expect(props.reservationUnitPreviewUrl).toBe("https://preview.example.com");
    });
  });

  describe("StaffEnvConfig type", () => {
    it("getDefaultServerSideProps returns correct shape", () => {
      const props = getDefaultServerSideProps();

      // Verify the shape matches StaffEnvConfig
      const hasAllProps =
        typeof props.apiBaseUrl === "string" &&
        typeof props.feedbackUrl === "string" &&
        typeof props.isConsoleLoggingEnabled === "boolean" &&
        typeof props.reservationUnitPreviewUrl === "string" &&
        typeof props.version === "string";

      expect(hasAllProps).toBe(true);
    });
  });
});
