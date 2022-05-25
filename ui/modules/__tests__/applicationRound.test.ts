import { getApplicationRoundName } from "../applicationRound";
import { ApplicationRoundType } from "../gql-types";

jest.mock("next/config", () => () => ({
  serverRuntimeConfig: {},
  publicRuntimeConfig: {},
}));

jest.mock("next-i18next", () => ({
  i18n: {
    language: "fi",
  },
}));

describe("getApplicationRoundName", () => {
  it("should return the name of the application round", () => {
    const applicationRound = {
      nameFi: "Round 1 FI",
      nameEn: "Round 1 EN",
      nameSv: "Round 1 SV",
    } as ApplicationRoundType;

    expect(getApplicationRoundName(applicationRound)).toEqual("Round 1 FI");
  });

  it("should return the name of the application round in the current language", () => {
    const applicationRound = {
      nameFi: "Round 1 FI",
      nameEn: "Round 1 EN",
      nameSv: "Round 1 SV",
    } as ApplicationRoundType;

    expect(getApplicationRoundName(applicationRound, "sv")).toEqual(
      "Round 1 SV"
    );
  });

  it("should return the name of the application round in the default language", () => {
    const applicationRound = {
      nameFi: "Round 1 FI",
      nameEn: "",
      nameSv: "",
    } as ApplicationRoundType;

    expect(getApplicationRoundName(applicationRound, "sv")).toEqual(
      "Round 1 FI"
    );
  });

  it("should return the name of the application round in the default language", () => {
    const applicationRound = {
      nameFi: "Round 1 FI",
    } as ApplicationRoundType;

    expect(getApplicationRoundName(applicationRound, "sv")).toEqual(
      "Round 1 FI"
    );
  });

  it("should return the name of the application round in the default language", () => {
    const applicationRound = {
      nameFi: "Round 1 FI",
      nameEn: null,
      nameSv: null,
    } as ApplicationRoundType;

    expect(getApplicationRoundName(applicationRound, "sv")).toEqual(
      "Round 1 FI"
    );
  });
});
