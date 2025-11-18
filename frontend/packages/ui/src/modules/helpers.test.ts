import { type TFunction } from "i18next";
import { describe, test, expect, it } from "vitest";
import { formatApiTimeInterval, formatListToCSV, getTranslation, stripHtml } from "./helpers";

describe("formatApiTimeInterval", () => {
  test("should properly format api time interval", () => {
    const t1 = "12:30:00";
    const t2 = "13:30:00";
    const result = formatApiTimeInterval({ beginTime: t1, endTime: t2 });
    expect(result).toBe("12:30–13:30");
  });

  test("should properly format api time interval without trailing minutes", () => {
    const t1 = "12:00:00";
    const t2 = "14:00:00";
    const result = formatApiTimeInterval({ beginTime: t1, endTime: t2 });
    expect(result).toBe("12–14");
  });

  test("should properly format api time interval without trailing minutes", () => {
    const t1 = "12:00:00";
    const t2 = "14:30:00";
    const result = formatApiTimeInterval({ beginTime: t1, endTime: t2 });
    expect(result).toBe("12–14:30");
  });

  test("should properly format api time interval without trailing minutes", () => {
    const t1 = "12:30:00";
    const t2 = "14:00:00";
    const result = formatApiTimeInterval({ beginTime: t1, endTime: t2 });
    expect(result).toBe("12:30–14");
  });

  test("should properly format api time interval without trailing minutes", () => {
    const t1 = "12:30:00";
    const t2 = "14:30:00";
    const result = formatApiTimeInterval({ beginTime: t1, endTime: t2 });
    expect(result).toBe("12:30–14:30");
  });

  test("should show ending 00:00 as 24:00", () => {
    const t1 = "00:00:00";
    const t2 = "00:00:00";
    const result = formatApiTimeInterval({ beginTime: t1, endTime: t2 });
    expect(result).toBe("0–24");
  });

  test("should properly format api time interval with trailing minutes", () => {
    const t1 = "12:00:00";
    const t2 = "14:00:00";
    const result = formatApiTimeInterval({
      beginTime: t1,
      endTime: t2,
      trailingMinutes: true,
    });
    expect(result).toBe("12:00–14:00");
  });
});

describe("formatListToCSV", () => {
  const mockT: TFunction = ((text: string) => text) as TFunction;
  test("should return empty string when given empty array", () => {
    const result = formatListToCSV(mockT, []);
    expect(result).toBe("");
  });
  test("should return single item when given single item array", () => {
    const result = formatListToCSV(mockT, ["item"]);
    expect(result).toBe("item");
  });
  test("should return and seperated when given two items", () => {
    const result = formatListToCSV(mockT, ["item1", "item2"]);
    expect(result).toBe("item1 common:and item2");
  });
  test("should return comma seperated when given three items", () => {
    const result = formatListToCSV(mockT, ["item1", "item2", "item3"]);
    expect(result).toBe("item1, item2 common:and item3");
  });
  test("should return comma seperated when given ten items", () => {
    const list = Array.from({ length: 10 }, (_, i) => `item${i + 1}`);
    const result = formatListToCSV(mockT, list);
    const res = list.slice(0, 9).join(", ") + ` common:and item10`;
    expect(result).toBe(res);
  });
});

describe("getTranslation", () => {
  test("allows unknown parameters", () => {
    const t3 = {
      nameFi: "foobar",
      nameEn: "bar",
      nameSv: "sv",
      somethingElse: {
        bar: "fooba",
      },
    };
    expect(getTranslation(t3, "name", "fi")).toBe("foobar");
    expect(getTranslation(t3, "name", "en")).toBe("bar");
    expect(getTranslation(t3, "name", "sv")).toBe("sv");
  });

  test("non string types are an error", () => {
    // @ts-expect-error -- enforce that this will not compile
    expect(() => getTranslation({ nameFi: { foobar: "" }, nameEn: "", nameSv: "" }, "name", "fi")).toThrow();
  });

  test("null is converted to an empty string", () => {
    const dict = { nameFi: null, nameEn: null, nameSv: null };
    expect(getTranslation(dict, "name", "fi")).toBe("");
    expect(getTranslation(dict, "name", "en")).toBe("");
    expect(getTranslation(dict, "name", "sv")).toBe("");
  });

  test("missing a lang is a compile error", () => {
    const dict = { nameFi: "foobar", nameEn: "bazbar" };
    // @ts-expect-error -- enforce that this will not compile
    expect(getTranslation(dict, "name", "fi")).toBe("foobar");
    // @ts-expect-error -- enforce that this will not compile
    expect(() => getTranslation(dict, "name", "sv")).toThrow();
  });

  test("invalid key is an error", () => {
    const dict = { nameFi: "foobar", nameEn: "bazbar", nameSv: "foobar" };
    // @ts-expect-error -- enforce that this will not compile
    expect(() => getTranslation(dict, "description", "fi")).toThrow();
  });

  test.for(["description", "foobar", "some", "abc", "cat", "dog"])("works for other keys : %key", (key) => {
    const dict = {
      [`${key}Fi`]: "bar FI",
      [`${key}En`]: "bar EN",
      [`${key}Sv`]: "bar SV",
    };
    expect(getTranslation(dict, key, "fi")).toBe("bar FI");
    expect(getTranslation(dict, key, "en")).toBe("bar EN");
    expect(getTranslation(dict, key, "sv")).toBe("bar SV");
  });

  test("empty object is an error", () => {
    // @ts-expect-error -- enforce that this will not compile
    expect(() => getTranslation({}, "name", "fi")).toThrow();
  });

  test("null is an error", () => {
    // @ts-expect-error -- enforce that this will not compile
    expect(() => getTranslation(null, "name", "fi")).toThrow();
  });

  test("undefined is an error", () => {
    // @ts-expect-error -- enforce that this will not compile
    expect(() => getTranslation(undefined, "name", "fi")).toThrow();
  });
});

describe("stripHtml", () => {
  it("should remove simple HTML tags", () => {
    expect(stripHtml("<p>Hello world</p>")).toBe("Hello world");
    expect(stripHtml("<strong>Bold text</strong>")).toBe("Bold text");
    expect(stripHtml("<div><span>Nested</span></div>")).toBe("Nested");
  });

  it("should decode common HTML entities", () => {
    expect(stripHtml("Hello &amp; world")).toBe("Hello & world");
    expect(stripHtml("&lt;tag&gt;")).toBe("<tag>");
    expect(stripHtml("&quot;quoted&quot;")).toBe('"quoted"');
    expect(stripHtml("&apos;apostrophe&apos;")).toBe("'apostrophe'");
    // Note: &nbsp; decodes to non-breaking space (U+00A0), not regular space
    expect(stripHtml("Non&nbsp;breaking&nbsp;space")).toBe("Non\u00A0breaking\u00A0space");
  });

  it("should handle numeric HTML entities", () => {
    expect(stripHtml("&#65;&#66;&#67;")).toBe("ABC");
    expect(stripHtml("&#x41;&#x42;&#x43;")).toBe("ABC");
  });

  it("should handle complex HTML with tags and entities", () => {
    expect(stripHtml("<p>Hello &amp; <strong>world</strong>!</p>")).toBe("Hello & world!");
    expect(stripHtml("<div>Test &lt;code&gt; &amp; text</div>")).toBe("Test <code> & text");
  });

  it("should handle empty strings", () => {
    expect(stripHtml("")).toBe("");
  });

  it("should handle strings without HTML", () => {
    expect(stripHtml("Plain text")).toBe("Plain text");
  });

  it("should handle self-closing tags", () => {
    expect(stripHtml("Line 1<br/>Line 2")).toBe("Line 1Line 2");
    expect(stripHtml("Image here: <img src='test.jpg' />")).toBe("Image here:");
  });

  it("should handle multiple nested tags", () => {
    expect(stripHtml("<div><p>Paragraph <strong>with <em>nested</em> tags</strong></p></div>")).toBe(
      "Paragraph with nested tags"
    );
  });

  it("should decode entities and remove tags in one pass", () => {
    expect(stripHtml('<a href="test">Link &amp; text &lt;here&gt;</a>')).toBe("Link & text <here>");
  });
});
