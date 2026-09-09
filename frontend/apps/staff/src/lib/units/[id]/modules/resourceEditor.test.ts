import { describe, expect, it } from "vitest";
import { ResourceUpdateSchema } from "./resourceEditor";

describe("ResourceUpdateSchema", () => {
  describe("valid inputs", () => {
    it("accepts valid resource update with all fields", () => {
      const data = {
        nameFi: "Test Resource",
        nameSv: "Test Resurs",
        nameEn: "Test Resource",
        pk: 1,
        space: 5,
      };

      const result = ResourceUpdateSchema.parse(data);
      expect(result).toEqual(data);
    });

    it("accepts resource update without optional name fields", () => {
      const data = {
        nameFi: "Test Resource",
        nameSv: null,
        nameEn: null,
        space: 5,
      };

      const result = ResourceUpdateSchema.parse(data);
      expect(result.nameFi).toBe("Test Resource");
      expect(result.nameSv).toBeNull();
      expect(result.nameEn).toBeNull();
    });

    it("accepts resource update without pk (create case)", () => {
      const data = {
        nameFi: "New Resource",
        space: 10,
      };

      const result = ResourceUpdateSchema.parse(data);
      expect(result.nameFi).toBe("New Resource");
      expect(result.space).toBe(10);
      expect(result.pk).toBeUndefined();
    });

    it("accepts resource with minimal required fields", () => {
      const data = {
        nameFi: "A",
        space: 1,
      };

      const result = ResourceUpdateSchema.parse(data);
      expect(result).toEqual(data);
    });

    it("accepts resource with 80 character name", () => {
      const longName = "a".repeat(80);
      const data = {
        nameFi: longName,
        space: 5,
      };

      const result = ResourceUpdateSchema.parse(data);
      expect(result.nameFi).toBe(longName);
    });
  });

  describe("invalid inputs", () => {
    it("rejects empty nameFi", () => {
      const data = {
        nameFi: "",
        space: 5,
      };

      expect(() => ResourceUpdateSchema.parse(data)).toThrow();
    });

    it("rejects nameFi longer than 80 characters", () => {
      const data = {
        nameFi: "a".repeat(81),
        space: 5,
      };

      expect(() => ResourceUpdateSchema.parse(data)).toThrow();
    });

    it("rejects nameSv longer than 80 characters", () => {
      const data = {
        nameFi: "Test",
        nameSv: "a".repeat(81),
        space: 5,
      };

      expect(() => ResourceUpdateSchema.parse(data)).toThrow();
    });

    it("rejects nameEn longer than 80 characters", () => {
      const data = {
        nameFi: "Test",
        nameEn: "a".repeat(81),
        space: 5,
      };

      expect(() => ResourceUpdateSchema.parse(data)).toThrow();
    });

    it("rejects missing nameFi", () => {
      const data = {
        space: 5,
      };

      expect(() => ResourceUpdateSchema.parse(data)).toThrow();
    });

    it("rejects missing space", () => {
      const data = {
        nameFi: "Test",
      };

      expect(() => ResourceUpdateSchema.parse(data)).toThrow();
    });

    it("rejects space with value 0", () => {
      const data = {
        nameFi: "Test",
        space: 0,
      };

      expect(() => ResourceUpdateSchema.parse(data)).toThrow();
    });

    it("rejects space with negative value", () => {
      const data = {
        nameFi: "Test",
        space: -5,
      };

      expect(() => ResourceUpdateSchema.parse(data)).toThrow();
    });

    it("rejects pk with value 0", () => {
      const data = {
        nameFi: "Test",
        pk: 0,
        space: 5,
      };

      expect(() => ResourceUpdateSchema.parse(data)).toThrow();
    });

    it("rejects pk with negative value", () => {
      const data = {
        nameFi: "Test",
        pk: -1,
        space: 5,
      };

      expect(() => ResourceUpdateSchema.parse(data)).toThrow();
    });

    it("rejects non-string nameFi", () => {
      const data = {
        nameFi: 123,
        space: 5,
      };

      expect(() => ResourceUpdateSchema.parse(data)).toThrow();
    });

    it("rejects non-number space", () => {
      const data = {
        nameFi: "Test",
        space: "5",
      };

      expect(() => ResourceUpdateSchema.parse(data)).toThrow();
    });

    it("rejects non-number pk", () => {
      const data = {
        nameFi: "Test",
        pk: "1",
        space: 5,
      };

      expect(() => ResourceUpdateSchema.parse(data)).toThrow();
    });
  });

  describe("edge cases", () => {
    it("accepts empty string for optional names (nullish)", () => {
      const data = {
        nameFi: "Test",
        nameSv: "",
        nameEn: "",
        space: 5,
      };

      const result = ResourceUpdateSchema.parse(data);
      expect(result.nameSv).toBe("");
      expect(result.nameEn).toBe("");
    });

    it("handles undefined values for optional fields", () => {
      const data = {
        nameFi: "Test",
        nameSv: undefined,
        nameEn: undefined,
        space: 5,
      };

      const result = ResourceUpdateSchema.parse(data);
      expect(result.nameSv).toBeUndefined();
      expect(result.nameEn).toBeUndefined();
    });

    it("accepts pk as 1 (smallest valid value)", () => {
      const data = {
        nameFi: "Test",
        pk: 1,
        space: 5,
      };

      const result = ResourceUpdateSchema.parse(data);
      expect(result.pk).toBe(1);
    });

    it("accepts space as 1 (smallest valid value)", () => {
      const data = {
        nameFi: "Test",
        space: 1,
      };

      const result = ResourceUpdateSchema.parse(data);
      expect(result.space).toBe(1);
    });

    it("accepts large pk values", () => {
      const data = {
        nameFi: "Test",
        pk: 999_999,
        space: 5,
      };

      const result = ResourceUpdateSchema.parse(data);
      expect(result.pk).toBe(999_999);
    });

    it("accepts large space values", () => {
      const data = {
        nameFi: "Test",
        space: 999_999,
      };

      const result = ResourceUpdateSchema.parse(data);
      expect(result.space).toBe(999_999);
    });
  });
});
