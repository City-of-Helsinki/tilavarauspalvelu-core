import { describe, expect, it } from "vitest";
import {
  CONFIRMED,
  WAITING_PAYMENT,
  UNCONFIRMED,
  STAFF_RESERVATION,
  EVENT_BUFFER,
  BLOCKED,
  NOT_RESERVABLE,
  RESERVABLE,
  RESERVATION_UNIT_RELEASED,
  RESERVATION_UNIT_DRAFT,
  INTERSECTING_RESERVATION_UNIT,
  REST,
  CALENDAR_EVENT_BASE_STYLE,
  CALENDAR_LEGENDS,
  HDS_CLOCK_ICON_SVG,
} from "./calendarStyling";

describe("calendarStyling", () => {
  describe("event style constants", () => {
    it("CONFIRMED has expected style properties", () => {
      expect(CONFIRMED.style).toHaveProperty("background");
      expect(CONFIRMED.style).toHaveProperty("borderColor");
      expect(CONFIRMED.style.borderWidth).toBe("0px 0px 0px 3px");
      expect(CONFIRMED.style.borderStyle).toBe("solid");
    });

    it("WAITING_PAYMENT extends CONFIRMED with dashed border", () => {
      expect(WAITING_PAYMENT.style).toHaveProperty("background");
      expect(WAITING_PAYMENT.style.borderStyle).toBe("dashed");
    });

    it("UNCONFIRMED has correct styles", () => {
      expect(UNCONFIRMED.style.borderStyle).toBe("dashed");
      expect(UNCONFIRMED.style).toHaveProperty("background");
      expect(UNCONFIRMED.style).toHaveProperty("borderColor");
    });

    it("STAFF_RESERVATION has correct border configuration", () => {
      expect(STAFF_RESERVATION.style.borderWidth).toBe("0px 0px 0px 3px");
      expect(STAFF_RESERVATION.style.borderStyle).toBe("solid");
    });

    it("EVENT_BUFFER has flex display and opacity", () => {
      expect(EVENT_BUFFER.style.display).toBe("flex");
      expect(EVENT_BUFFER.style.opacity).toBe("0.5");
      expect(EVENT_BUFFER.style.alignItems).toBe("center");
      expect(EVENT_BUFFER.style.justifyContent).toBe("center");
    });

    it("BLOCKED has dashed or solid style", () => {
      expect(BLOCKED.style).toHaveProperty("background");
      expect(BLOCKED.style).toHaveProperty("borderColor");
    });

    it("NOT_RESERVABLE has pattern background", () => {
      expect(NOT_RESERVABLE.style.backgroundRepeat).toBe("repeat");
      expect(NOT_RESERVABLE.style.backgroundSize).toBe("7px");
      expect(NOT_RESERVABLE.style).toHaveProperty("backgroundImage");
    });

    it("RESERVABLE has transparent border", () => {
      expect(RESERVABLE.style.borderColor).toBe("transparent");
    });

    it("RESERVATION_UNIT_RELEASED is white with light border", () => {
      expect(RESERVATION_UNIT_RELEASED.style.background).toBe("var(--color-white)");
      expect(RESERVATION_UNIT_RELEASED.style.borderColor).toBe("var(--color-black-20)");
    });

    it("RESERVATION_UNIT_DRAFT has dashed border", () => {
      expect(RESERVATION_UNIT_DRAFT.style.background).toBe("var(--color-white)");
      expect(RESERVATION_UNIT_DRAFT.style.borderStyle).toBe("dashed");
      expect(RESERVATION_UNIT_DRAFT.style.width).toBe("4px");
    });

    it("INTERSECTING_RESERVATION_UNIT has diagonal pattern", () => {
      expect(INTERSECTING_RESERVATION_UNIT.style.backgroundSize).toBe("25px");
      expect(INTERSECTING_RESERVATION_UNIT.style.backgroundRepeat).toBe("repeat");
      expect(INTERSECTING_RESERVATION_UNIT.style).toHaveProperty("backgroundImage");
    });

    it("REST has custom variables", () => {
      expect(REST.style.background).toBe("var(--tilavaraus-event-rest-background)");
      expect(REST.style.borderColor).toBe("var(--tilavaraus-event-rest-border-color)");
      expect(REST.style.borderWidth).toBe("0px 0px 0px 3px");
    });
  });

  describe("CALENDAR_EVENT_BASE_STYLE", () => {
    it("has pointer cursor", () => {
      expect(CALENDAR_EVENT_BASE_STYLE.cursor).toBe("pointer");
    });

    it("has zero border radius", () => {
      expect(CALENDAR_EVENT_BASE_STYLE.borderRadius).toBe("0px");
    });

    it("has block display", () => {
      expect(CALENDAR_EVENT_BASE_STYLE.display).toBe("block");
    });

    it("has transparent border color", () => {
      expect(CALENDAR_EVENT_BASE_STYLE.borderColor).toBe("transparent");
    });

    it("has body-s font size", () => {
      expect(CALENDAR_EVENT_BASE_STYLE.fontSize).toBe("var(--fontsize-body-s)");
    });
  });

  describe("HDS_CLOCK_ICON_SVG", () => {
    it("is a data URL for SVG", () => {
      expect(HDS_CLOCK_ICON_SVG).toContain("url(");
      expect(HDS_CLOCK_ICON_SVG).toContain("data:image/svg+xml");
      expect(HDS_CLOCK_ICON_SVG).toContain("base64");
    });
  });

  describe("CALENDAR_LEGENDS", () => {
    it("is an array of legend entries", () => {
      expect(Array.isArray(CALENDAR_LEGENDS)).toBe(true);
      expect(CALENDAR_LEGENDS.length).toBeGreaterThan(0);
    });

    it("contains all expected event keys", () => {
      const keys = CALENDAR_LEGENDS.map((legend) => legend.key);
      expect(keys).toContain("CONFIRMED");
      expect(keys).toContain("WAITING_PAYMENT");
      expect(keys).toContain("UNCONFIRMED");
      expect(keys).toContain("STAFF_RESERVATION");
      expect(keys).toContain("INTERSECTING_RESERVATION_UNIT");
      expect(keys).toContain("PAUSE");
      expect(keys).toContain("CLOSED");
      expect(keys).toContain("NOT_RESERVABLE");
      expect(keys).toContain("RESERVABLE");
      expect(keys).toContain("REST");
      expect(keys).toContain("RESERVATION_UNIT_RELEASED");
      expect(keys).toContain("RESERVATION_UNIT_DRAFT");
    });

    it("each legend entry has required properties", () => {
      for (const legend of CALENDAR_LEGENDS) {
        expect(legend).toHaveProperty("key");
        expect(legend).toHaveProperty("label");
        expect(legend).toHaveProperty("style");
        expect(typeof legend.key).toBe("string");
        expect(typeof legend.label).toBe("string");
        expect(typeof legend.style).toBe("object");
      }
    });

    it("CONFIRMED legend has correct style", () => {
      const confirmed = CALENDAR_LEGENDS.find((l) => l.key === "CONFIRMED");
      expect(confirmed).toBeDefined();
      expect(confirmed?.label).toBe("myUnits:Calendar.legend.confirmed");
    });

    it("WAITING_PAYMENT legend has dashed border", () => {
      const waitingPayment = CALENDAR_LEGENDS.find((l) => l.key === "WAITING_PAYMENT");
      expect(waitingPayment?.style.borderStyle).toBe("dashed");
    });

    it("NOT_RESERVABLE legend has border style for display", () => {
      const notReservable = CALENDAR_LEGENDS.find((l) => l.key === "NOT_RESERVABLE");
      expect(notReservable?.style).toHaveProperty("borderStyle", "solid");
      expect(notReservable?.style).toHaveProperty("borderWidth", "1px");
    });

    it("PAUSE legend has background image with clock icon", () => {
      const pause = CALENDAR_LEGENDS.find((l) => l.key === "PAUSE");
      expect(pause?.style.backgroundImage).toContain("data:image/svg+xml");
      expect(pause?.style.backgroundRepeat).toBe("no-repeat");
      expect(pause?.style.backgroundPosition).toBe("center");
      expect(pause?.style.backgroundSize).toBe("20px");
    });

    it("RESERVATION_UNIT_DRAFT legend is read-only", () => {
      const draft = CALENDAR_LEGENDS.find((l) => l.key === "RESERVATION_UNIT_DRAFT");
      expect(draft).toBeDefined();
    });
  });
});
