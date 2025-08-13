import { describe, expect, test } from "vitest";
import * as t from "../src/safe.js";

describe("Safe Mode API", () => {
  describe("Primitives", () => {
    test("string serialization", () => {
      const result = t.string.serialize("hello");
      expect(result).toBe("hello");
    });

    test("string deserialization success", () => {
      const result = t.string.deserialize("hello");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe("hello");
      }
    });

    test("string deserialization returns error on invalid input", () => {
      const result = t.string.deserialize(123);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("Expected string, got number");
      }
    });

    test("number serialization", () => {
      const result = t.number.serialize(42);
      expect(result).toBe(42);
    });

    test("number deserialization success", () => {
      const result = t.number.deserialize(42);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(42);
      }
    });

    test("number deserialization returns error on invalid input", () => {
      const result = t.number.deserialize("not a number");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("Expected number, got string");
      }
    });

    test("boolean serialization", () => {
      const result = t.boolean.serialize(true);
      expect(result).toBe(true);
    });

    test("boolean deserialization success", () => {
      const result = t.boolean.deserialize(false);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(false);
      }
    });

    test("boolean deserialization returns error on invalid input", () => {
      const result = t.boolean.deserialize("true");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("Expected boolean, got string");
      }
    });

    test("date serialization", () => {
      const date = new Date("2023-12-25T10:30:00.000Z");
      const result = t.date.serialize(date);
      expect(result).toBe("2023-12-25T10:30:00.000Z");
    });

    test("date deserialization success", () => {
      const result = t.date.deserialize("2023-12-25T10:30:00.000Z");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(new Date("2023-12-25T10:30:00.000Z"));
      }
    });

    test("date deserialization returns error on invalid input", () => {
      const result1 = t.date.deserialize(123);
      expect(result1.ok).toBe(false);
      if (!result1.ok) {
        expect(result1.error).toBe("Expected string for date, got number");
      }

      const result2 = t.date.deserialize("invalid-date");
      expect(result2.ok).toBe(false);
      if (!result2.ok) {
        expect(result2.error).toBe("Invalid date string: invalid-date");
      }
    });
  });

  describe("Literal", () => {
    const literalSerde = t.literal("hello");

    test("serialize", () => {
      const result = literalSerde.serialize("hello");
      expect(result).toBe("hello");
    });

    test("deserialize success", () => {
      const result = literalSerde.deserialize("hello");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe("hello");
      }
    });

    test("deserialize returns error on wrong literal", () => {
      const result = literalSerde.deserialize("world");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("Expected literal hello, got world");
      }
    });
  });

  describe("Object", () => {
    const PersonSerde = t.object({
      name: t.string,
      age: t.number,
      active: t.boolean,
    });

    test("serialize", () => {
      const person = { name: "Alice", age: 30, active: true };
      const result = PersonSerde.serialize(person);
      expect(result).toEqual({ name: "Alice", age: 30, active: true });
    });

    test("deserialize success", () => {
      const data = { name: "Bob", age: 25, active: false };
      const result = PersonSerde.deserialize(data);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual({ name: "Bob", age: 25, active: false });
      }
    });

    test("deserialize returns error on invalid object", () => {
      const result = PersonSerde.deserialize("not an object");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("Expected object");
      }
    });

    test("deserialize returns error on field error", () => {
      const data = { name: "Bob", age: "not a number", active: false };
      const result = PersonSerde.deserialize(data);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("Field 'age'");
        expect(result.error).toContain("Expected number, got string");
      }
    });
  });

  describe("Array", () => {
    const NumberArraySerde = t.array(t.number);

    test("serialize", () => {
      const numbers = [1, 2, 3, 4, 5];
      const result = NumberArraySerde.serialize(numbers);
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    test("deserialize success", () => {
      const data = [10, 20, 30];
      const result = NumberArraySerde.deserialize(data);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual([10, 20, 30]);
      }
    });

    test("deserialize returns error on invalid array", () => {
      const result = NumberArraySerde.deserialize("not an array");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("Expected array");
      }
    });

    test("deserialize returns error on item error", () => {
      const data = [1, "not a number", 3];
      const result = NumberArraySerde.deserialize(data);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("Array item at index 1");
        expect(result.error).toContain("Expected number, got string");
      }
    });
  });

  describe("Optional", () => {
    const OptionalStringSerde = t.optional(t.string);

    test("serialize defined value", () => {
      const result = OptionalStringSerde.serialize("hello");
      expect(result).toBe("hello");
    });

    test("serialize undefined value", () => {
      const result = OptionalStringSerde.serialize(undefined);
      expect(result).toBe(undefined);
    });

    test("deserialize defined value", () => {
      const result = OptionalStringSerde.deserialize("hello");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe("hello");
      }
    });

    test("deserialize undefined value", () => {
      const result = OptionalStringSerde.deserialize(undefined);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(undefined);
      }
    });

    test("deserialize returns error on invalid value", () => {
      const result = OptionalStringSerde.deserialize(123);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("Expected string, got number");
      }
    });
  });

  describe("Nullable", () => {
    const NullableStringSerde = t.nullable(t.string);

    test("serialize non-null value", () => {
      const result = NullableStringSerde.serialize("hello");
      expect(result).toBe("hello");
    });

    test("serialize null value", () => {
      const result = NullableStringSerde.serialize(null);
      expect(result).toBe(null);
    });

    test("deserialize non-null value", () => {
      const result = NullableStringSerde.deserialize("hello");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe("hello");
      }
    });

    test("deserialize null value", () => {
      const result = NullableStringSerde.deserialize(null);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(null);
      }
    });

    test("deserialize returns error on invalid value", () => {
      const result = NullableStringSerde.deserialize(123);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("Expected string, got number");
      }
    });
  });
});
