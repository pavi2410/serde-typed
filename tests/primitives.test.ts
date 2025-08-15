import { describe, expect, test } from "vitest";
import * as t from "../src/index.js";

describe("Primitive Serializers", () => {
  describe("String", () => {
    test("string serialization", () => {
      const result = t.string.serialize("hello");
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe("hello");
      }
    });

    test("string deserialization success", () => {
      const result = t.string.deserialize("hello");
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe("hello");
      }
    });

    test("string deserialization returns error on invalid input", () => {
      const result = t.string.deserialize(123);
      expect(result.isOk()).toBe(false);
      if (result.isErr()) {
        expect(result.error).toBe("Expected string, got number");
      }
    });
  });

  describe("Number", () => {
    test("number serialization", () => {
      const result = t.number.serialize(42);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(42);
      }
    });

    test("number deserialization success", () => {
      const result = t.number.deserialize(42);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(42);
      }
    });

    test("number deserialization returns error on invalid input", () => {
      const result = t.number.deserialize("not a number");
      expect(result.isOk()).toBe(false);
      if (result.isErr()) {
        expect(result.error).toBe("Expected number, got string");
      }
    });
  });

  describe("Boolean", () => {
    test("boolean serialization", () => {
      const result = t.boolean.serialize(true);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(true);
      }
    });

    test("boolean deserialization success", () => {
      const result = t.boolean.deserialize(false);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(false);
      }
    });

    test("boolean deserialization returns error on invalid input", () => {
      const result = t.boolean.deserialize("true");
      expect(result.isOk()).toBe(false);
      if (result.isErr()) {
        expect(result.error).toBe("Expected boolean, got string");
      }
    });
  });

  describe("Date", () => {
    test("date serialization", () => {
      const date = new Date("2023-12-25T10:30:00.000Z");
      const result = t.date.serialize(date);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe("2023-12-25T10:30:00.000Z");
      }
    });

    test("date deserialization success", () => {
      const result = t.date.deserialize("2023-12-25T10:30:00.000Z");
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(new Date("2023-12-25T10:30:00.000Z"));
      }
    });

    test("date deserialization returns error on invalid input", () => {
      const result1 = t.date.deserialize(123);
      expect(result1.isOk()).toBe(false);
      if (result1.isErr()) {
        expect(result1.error).toBe("Expected string for date, got number");
      }

      const result2 = t.date.deserialize("invalid-date");
      expect(result2.isOk()).toBe(false);
      if (result2.isErr()) {
        expect(result2.error).toBe("Invalid date string: invalid-date");
      }
    });
  });

  describe("Literal", () => {
    const literalSerde = t.literal("hello");

    test("serialize", () => {
      const result = literalSerde.serialize("hello");
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe("hello");
      }
    });

    test("deserialize success", () => {
      const result = literalSerde.deserialize("hello");
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe("hello");
      }
    });

    test("deserialize returns error on wrong literal", () => {
      const result = literalSerde.deserialize("world");
      expect(result.isOk()).toBe(false);
      if (result.isErr()) {
        expect(result.error).toBe("Expected literal hello, got world");
      }
    });
  });
});
