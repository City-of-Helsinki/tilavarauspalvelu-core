import { afterEach, describe, expect, test, vi } from "vitest";
import type { ApolloClient, NormalizedCacheObject } from "@apollo/client";
import { TermsOfUseTypeChoices } from "@gql/gql-types";
import {
  getCommonServerSideProps,
  getDefaultServerSideProps,
  getGenericTerms,
  getReservationByOrderUuid,
  getVersion,
} from "./serverUtils";

const { envMock, getVersionMock, logErrorMock } = vi.hoisted(() => ({
  envMock: {
    ENABLE_CONSOLE_LOGGING: false,
    FEEDBACK_URL: "",
    HOTJAR_ENABLED: false,
    MATOMO_ENABLED: false,
    PROFILE_UI_URL: "",
    TILAVARAUS_API_URL: "",
  },
  getVersionMock: vi.fn(() => "mock-version"),
  logErrorMock: vi.fn(),
}));

vi.mock("@/env.mjs", () => ({
  env: envMock,
}));

vi.mock("./baseUtils", () => ({
  getVersion: getVersionMock,
}));

vi.mock("@ui/modules/errors", () => ({
  logError: logErrorMock,
}));

afterEach(() => {
  logErrorMock.mockClear();
  getVersionMock.mockClear();
  Object.assign(envMock, {
    ENABLE_CONSOLE_LOGGING: false,
    FEEDBACK_URL: "",
    HOTJAR_ENABLED: false,
    MATOMO_ENABLED: false,
    PROFILE_UI_URL: "",
    TILAVARAUS_API_URL: "",
  });
});

describe("serverUtils", () => {
  test("re-exports getVersion and returns default props", () => {
    expect(getVersion()).toBe("mock-version");
    expect(getDefaultServerSideProps()).toEqual({
      apiBaseUrl: "",
      isConsoleLoggingEnabled: true,
      isHotjarEnabled: false,
      isMatomoEnabled: false,
      profileLink: "",
      feedbackUrl: "",
      version: "mock-version",
    });
  });

  test("reads common props from env with safe fallbacks", () => {
    Object.assign(envMock, {
      ENABLE_CONSOLE_LOGGING: true,
      FEEDBACK_URL: "https://feedback.example",
      HOTJAR_ENABLED: true,
      MATOMO_ENABLED: true,
      PROFILE_UI_URL: "https://profile.example",
      TILAVARAUS_API_URL: "https://api.example",
    });

    expect(getCommonServerSideProps()).toEqual({
      apiBaseUrl: "https://api.example",
      isConsoleLoggingEnabled: true,
      isHotjarEnabled: true,
      isMatomoEnabled: true,
      profileLink: "https://profile.example",
      feedbackUrl: "https://feedback.example",
      version: "mock-version",
    });
  });

  test("getGenericTerms returns the first matching node and logs when missing", async () => {
    const apolloClient = {
      query: vi
        .fn()
        .mockResolvedValueOnce({
          data: {
            termsOfUse: {
              edges: [
                {
                  node: {
                    id: "TermsOfUseNode:1",
                    pk: "booking",
                    termsType: TermsOfUseTypeChoices.Generic,
                    nameFi: "Ehdot",
                    nameEn: "Terms",
                    nameSv: "Villkor",
                    textFi: "Fi",
                    textEn: "En",
                    textSv: "Sv",
                  },
                },
              ],
            },
          },
        })
        .mockResolvedValueOnce({
          data: {
            termsOfUse: {
              edges: [],
            },
          },
        }),
    } satisfies Pick<ApolloClient<unknown>, "query">;

    expect(await getGenericTerms(apolloClient as ApolloClient<unknown>)).toMatchObject({
      pk: "booking",
      nameEn: "Terms",
    });

    expect(await getGenericTerms(apolloClient as ApolloClient<unknown>)).toBeNull();
    expect(logErrorMock).toHaveBeenCalledWith('No terms of use found for slug "booking"');
  });

  test("getReservationByOrderUuid returns reservation only when pk exists", async () => {
    const apolloClient = {
      query: vi
        .fn()
        .mockResolvedValueOnce({
          data: {
            order: {
              reservation: {
                id: "ReservationNode:1",
                pk: 8,
                state: "CONFIRMED",
                paymentOrder: null,
              },
            },
          },
        })
        .mockResolvedValueOnce({
          data: {
            order: {
              reservation: {
                id: "ReservationNode:2",
                pk: null,
                state: "CONFIRMED",
                paymentOrder: null,
              },
            },
          },
        }),
    } satisfies Pick<ApolloClient<NormalizedCacheObject>, "query">;

    expect(await getReservationByOrderUuid(apolloClient as ApolloClient<NormalizedCacheObject>, "uuid-1")).toMatchObject({
      pk: 8,
    });
    expect(await getReservationByOrderUuid(apolloClient as ApolloClient<NormalizedCacheObject>, "uuid-2")).toBeNull();
  });
});
