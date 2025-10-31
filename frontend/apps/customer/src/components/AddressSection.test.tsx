import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getLocalizationLang } from "ui/src/modules/helpers";
import { getTranslation } from "ui/src/modules/util";
import { AddressFieldsFragment } from "@gql/gql-types";
import { AddressSection, createAccessibilityUrl, createGoogleUrl, createHslUrl, createMapUrl } from "./AddressSection";

const createAddressSectionMock = (proper = true): AddressFieldsFragment => ({
  id: "1",
  pk: proper ? 1 : null,
  tprekId: proper ? "12345" : null,
  addressStreetEn: proper ? "Test street 1 EN" : null,
  addressStreetFi: proper ? "Test street 1 FI" : null,
  addressStreetSv: proper ? "Test street 1 SV" : null,
  addressCityEn: proper ? "Helsinki EN" : null,
  addressCityFi: proper ? "Helsinki" : null,
  addressCitySv: proper ? "Helsingfors" : null,
  addressZip: proper ? "00100" : "",
});

const fi = getLocalizationLang("fi");

const customRender = (proper = true): ReturnType<typeof render> => {
  return render(<AddressSection title={"Test unit 1"} unit={createAddressSectionMock(proper)} />);
};

describe("Component: AddressSection | Test create url functions", () => {
  it("should return expected value/format with createMapUrl function", () => {
    const mock = createAddressSectionMock();
    expect(createMapUrl(fi, createAddressSectionMock())).toEqual(
      `https://palvelukartta.hel.fi/${fi}/unit/${mock.tprekId}`
    );
  });
  it("should return expected value/format with createGoogleUrl function", () => {
    const mock = createAddressSectionMock();
    const addressStreet = getTranslation(mock ?? {}, "addressStreet", fi);
    const addressCity = getTranslation(mock ?? {}, "addressCity", fi);
    const destination = encodeURI(`${addressStreet},${addressCity}`);
    expect(createGoogleUrl(fi, mock)).toEqual(
      `https://www.google.com/maps/dir/?api=1&hl=${fi}&destination=${destination}`
    );
  });
  it("should return expected value/format with createHslUrl function", () => {
    const mock = createAddressSectionMock();
    const addressStreet = getTranslation(mock ?? {}, "addressStreet", fi);
    const addressCity = getTranslation(mock ?? {}, "addressCity", fi);
    const destination = encodeURI(`${addressStreet},${addressCity}`);
    expect(createHslUrl(fi, createAddressSectionMock())).toEqual(
      `https://reittiopas.hsl.fi/reitti/-/${destination}/?locale=${fi}`
    );
  });
  it("should return expected value/format with createAccessibilityUrl function", () => {
    const mock = createAddressSectionMock();
    expect(createAccessibilityUrl(fi, createAddressSectionMock())).toEqual(
      `https://palvelukartta.hel.fi/${fi}/unit/${mock.tprekId}?p=1&t=accessibilityDetails`
    );
  });
});

const linkUrls = {
  Map: createMapUrl(fi, createAddressSectionMock()),
  Google: createGoogleUrl(fi, createAddressSectionMock()),
  HSL: createHslUrl(fi, createAddressSectionMock()),
  Accessibility: createAccessibilityUrl(fi, createAddressSectionMock()),
};

describe("Component: AddressSection | With proper content", () => {
  it("should show the unit name and address formatted correctly", () => {
    const view = customRender();
    const streetText = `${createAddressSectionMock()?.addressStreetFi}`;
    const cityText = `, ${createAddressSectionMock()?.addressZip} ${createAddressSectionMock()?.addressCityFi}`;
    // expect(view.getByRole("heading", { name: "Test unit 1" }));
    expect(view.getByText(streetText));
    expect(view.getByText(cityText));
  });
  it.for(Object.entries(linkUrls))("should render %o link with correct href", ([key, value]) => {
    const view = customRender();
    const linkName = `reservationUnit:link${key}`;
    const linkElement = view.getByRole("link", { name: linkName });
    expect(linkElement).toHaveAttribute("href", value);
  });
  it("should render four links", () => {
    const view = customRender();
    expect(view.getAllByRole("link")).toHaveLength(4);
  });
});

describe("Component: AddressSection | Without content", () => {
  it.for(Object.keys(linkUrls))("shouldn't render %o link without correct info", (key) => {
    const view = customRender(false);
    const linkName = `reservationUnit:link${key}`;
    const linkElement = view.queryByRole("link", { name: linkName });
    expect(linkElement).not.toBeInTheDocument();
  });
  it("shouldn't render any links at all, since no values are provided to the createURL functions", () => {
    const emptyView = customRender(false);
    expect(emptyView.queryAllByRole("link")).toHaveLength(0);
  });
});
