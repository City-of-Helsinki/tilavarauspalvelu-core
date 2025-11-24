import { createOptionMock } from "@test/test.gql.utils";
import { render, within } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import type { OptionsListT } from "ui/src/modules/search";
import SearchSingle from "@/pages/search";
import { AccessType } from "@gql/gql-types";
import { createGraphQLMocks } from "../gql.mocks";
import { MockedGraphQLProvider } from "../test.react.utils";

const { useRouter } = vi.hoisted(() => {
  const mockedRouterReplace = vi.fn();
  return {
    useRouter: () => ({ replace: mockedRouterReplace, query: "" }),
    mockedRouterReplace,
  };
});

const { mockedSearchParams, useSearchParams } = vi.hoisted(() => {
  const params = vi.fn();
  return {
    useSearchParams: params,
    mockedSearchParams: params,
  };
});

vi.mock("next/navigation", async (importOriginal) => {
  return {
    ...(await importOriginal()),
    useSearchParams,
  };
});

vi.mock("next/router", () => ({
  useRouter,
}));

const options: OptionsListT = createOptionMock();
const accessTypeOptions = Object.values(AccessType).map((value) => ({
  value,
  label: `access type ${value}`,
}));

function customRender(): ReturnType<typeof render> {
  const mocks = createGraphQLMocks();
  return render(
    <MockedGraphQLProvider mocks={mocks}>
      <SearchSingle options={options} />
    </MockedGraphQLProvider>
  );
}

describe("SearchSingle read query params", () => {
  function selectFilterParamsForTest(
    keys: Array<| "textSearch"
      | "startDate"
      | "endDate"
      | "intendedUses"
      | "units"
      | "equipments"
      | "reservationUnitTypes"
      | "timeBegin"
      | "timeEnd"
      | "duration"
      | "personsAllowed"
      | "accessTypes">
  ) {
    // Helper to return a list of objects to be used in "test.for([...])"
    const filterParams = {
      textSearch: {
        value: "TämäOnHakuArvo",
        tagText: 'searchForm:filters.textSearch {"label":"textSearch","value":["TämäOnHakuArvo"],"count":null}',
        formFieldText: undefined, // The text search field value can't be read
        initiallyOpen: false,
      },
      startDate: {
        value: "1.1.2025",
        tagText: 'searchForm:filters.startDate {"label":"startDate","value":["1.1.2025"],"count":null}',
        formFieldText: "1.1.2025",
        initiallyOpen: false,
      },
      endDate: {
        value: "31.12.2025",
        tagText: 'searchForm:filters.endDate {"label":"endDate","value":["31.12.2025"],"count":null}',
        formFieldText: "31.12.2025",
        initiallyOpen: false,
      },
      intendedUses: {
        value: "1",
        tagText: options.intendedUses[0]?.label,
        formFieldText: options.intendedUses[0]?.label,
        initiallyOpen: true,
      },
      units: {
        value: "1",
        tagText: options.units[0]?.label,
        formFieldText: options.units[0]?.label,
        initiallyOpen: true,
      },
      equipments: {
        value: "1",
        tagText: options.equipments[0]?.label,
        formFieldText: options.equipments[0]?.label,
        initiallyOpen: true,
      },
      reservationUnitTypes: {
        value: "1",
        tagText: options.reservationUnitTypes[0]?.label,
        formFieldText: options.reservationUnitTypes[0]?.label,
        initiallyOpen: false,
      },
      timeBegin: {
        value: "06:00",
        tagText: 'searchForm:filters.timeBegin {"label":"timeBegin","value":["06:00"],"count":null}',
        formFieldText: "06:00",
        initiallyOpen: true,
      },
      timeEnd: {
        value: "20:00",
        tagText: 'searchForm:filters.timeEnd {"label":"timeEnd","value":["20:00"],"count":null}',
        formFieldText: "20:00",
        initiallyOpen: true,
      },
      duration: {
        value: "30",
        tagText: 'searchForm:filters.duration {"unit":"common:abbreviations.minute {\\"count\\":30}"}',
        formFieldText: 'common:minute_other {"count":30}',
        initiallyOpen: true,
      },
      personsAllowed: {
        value: "15",
        tagText: 'searchForm:filters.personsAllowed {"label":"personsAllowed","value":["15"],"count":15}',
        formFieldText: "15",
        initiallyOpen: true,
      },
      accessTypes: {
        value: accessTypeOptions[0]?.value ?? "",
        tagText: `reservationUnit:accessTypes.${accessTypeOptions[0]?.value ?? ""}`,
        formFieldText: `reservationUnit:accessTypes.${accessTypeOptions[0]?.value}`,
        initiallyOpen: true,
      },
    };

    return keys.map((key) => {
      return { key, ...filterParams[key] };
    });
  }

  function setUrlSearchParams(key: string, value: string) {
    const params = new URLSearchParams();
    params.set(key, value);
    mockedSearchParams.mockReturnValue(params);
  }

  test("should render at all", () => {
    mockedSearchParams.mockReturnValue(new URLSearchParams());
    const view = customRender();

    const title = view.getByRole("heading", {
      name: "search:single.heading",
    });
    expect(title).toBeInTheDocument();

    const listContainer = view.getByTestId("list-with-pagination__list--container");
    expect(listContainer).toBeInTheDocument();
  });

  test.for(
    selectFilterParamsForTest([
      "textSearch",
      "startDate",
      "endDate",
      "intendedUses",
      "units",
      "equipments",
      "reservationUnitTypes",
      "timeBegin",
      "timeEnd",
      "duration",
      "personsAllowed",
      "accessTypes",
    ])
  )("Show filter tag for $key and accordian is correctly expanded", ({ key, value, tagText, initiallyOpen }) => {
    setUrlSearchParams(key, value);
    const view = customRender();

    const tags = view.getByTestId("search-form__filter--tags");
    expect(within(tags).getByText(tagText ?? "")).toBeInTheDocument();

    // Extra options accordion should be expanded, check by reading button text
    if (initiallyOpen) {
      view.getByRole("button", { name: "searchForm:showLessFilters" });
    } else {
      view.getByRole("button", { name: "searchForm:showMoreFilters" });
    }
  });

  test.for(
    selectFilterParamsForTest([
      "intendedUses",
      "units",
      "equipments",
      "reservationUnitTypes",
      "duration",
      "accessTypes",
    ])
  )("Use $key query param in form", ({ key, value, formFieldText }) => {
    setUrlSearchParams(key, value);
    const view = customRender();

    const fields = view.getByTestId("search-form__filters--optional");
    expect(within(fields).getByText(formFieldText || "")).toBeInTheDocument();
  });

  test.for(selectFilterParamsForTest(["startDate", "endDate"]))(
    "Use $key query param in form",
    ({ key, value, formFieldText }) => {
      setUrlSearchParams(key, value);
      const view = customRender();

      const fields = view.getByTestId("search-form__filters--optional");
      const field = within(fields).getByTestId(`search-form__filter--fields--${key}`);

      if (field instanceof HTMLInputElement) {
        expect(field.value).toBe(formFieldText ?? "");
      } else {
        throw new TypeError();
      }
    }
  );

  test.for(selectFilterParamsForTest(["timeBegin", "timeEnd"]))(
    "Use $key query param in form",
    ({ key, value, formFieldText }) => {
      setUrlSearchParams(key, value);
      const view = customRender();

      const fields = view.getByTestId("search-form__filters--optional");
      const field = within(fields).getByTestId(`search-form__filter--fields--${key}`);
      expect(within(field).getByText(formFieldText ?? "")).toBeInTheDocument();
    }
  );

  test.for(selectFilterParamsForTest(["personsAllowed"]))(
    "Use $key query param in form",
    ({ key, value, formFieldText }) => {
      setUrlSearchParams(key, value);
      const view = customRender();

      const fields = view.getByTestId("search-form__filters--optional");
      // Number input field has the role "spinbutton"
      const field = within(fields).getByRole("spinbutton", {
        name: "searchForm:labels.personsAllowed",
      });
      if (field instanceof HTMLInputElement) {
        expect(field.value).toBe(formFieldText ?? "");
      } else {
        throw new TypeError();
      }
    }
  );
});
