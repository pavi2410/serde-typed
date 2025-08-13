import { describe, expect, test } from "vitest";
import * as t from "../src/index.js";

describe("Throwing Mode API", () => {
  describe("Primitives", () => {
    test("string serialization", () => {
      const result = t.string.serialize("hello");
      expect(result).toBe("hello");
    });

    test("string deserialization success", () => {
      const result = t.string.deserialize("hello");
      expect(result).toBe("hello");
    });

    test("string deserialization throws on invalid input", () => {
      expect(() => t.string.deserialize(123)).toThrow(
        "Expected string, got number",
      );
    });

    test("number serialization", () => {
      const result = t.number.serialize(42);
      expect(result).toBe(42);
    });

    test("number deserialization success", () => {
      const result = t.number.deserialize(42);
      expect(result).toBe(42);
    });

    test("number deserialization throws on invalid input", () => {
      expect(() => t.number.deserialize("not a number")).toThrow(
        "Expected number, got string",
      );
    });

    test("boolean serialization", () => {
      const result = t.boolean.serialize(true);
      expect(result).toBe(true);
    });

    test("boolean deserialization success", () => {
      const result = t.boolean.deserialize(false);
      expect(result).toBe(false);
    });

    test("boolean deserialization throws on invalid input", () => {
      expect(() => t.boolean.deserialize("true")).toThrow(
        "Expected boolean, got string",
      );
    });

    test("date serialization", () => {
      const date = new Date("2023-12-25T10:30:00.000Z");
      const result = t.date.serialize(date);
      expect(result).toBe("2023-12-25T10:30:00.000Z");
    });

    test("date deserialization success", () => {
      const result = t.date.deserialize("2023-12-25T10:30:00.000Z");
      expect(result).toEqual(new Date("2023-12-25T10:30:00.000Z"));
    });

    test("date deserialization throws on invalid input", () => {
      expect(() => t.date.deserialize(123)).toThrow(
        "Expected string for date, got number",
      );
      expect(() => t.date.deserialize("invalid-date")).toThrow(
        "Invalid date string: invalid-date",
      );
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
      expect(result).toBe("hello");
    });

    test("deserialize throws on wrong literal", () => {
      expect(() => literalSerde.deserialize("world")).toThrow(
        "Expected literal hello, got world",
      );
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
      expect(result).toEqual({ name: "Bob", age: 25, active: false });
    });

    test("deserialize throws on invalid object", () => {
      expect(() => PersonSerde.deserialize("not an object")).toThrow(
        "Expected object",
      );
    });

    test("deserialize throws on field error", () => {
      const data = { name: "Bob", age: "not a number", active: false };
      expect(() => PersonSerde.deserialize(data)).toThrow(
        "Field 'age': Expected number, got string",
      );
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
      expect(result).toEqual([10, 20, 30]);
    });

    test("deserialize throws on invalid array", () => {
      expect(() => NumberArraySerde.deserialize("not an array")).toThrow(
        "Expected array",
      );
    });

    test("deserialize throws on item error", () => {
      const data = [1, "not a number", 3];
      expect(() => NumberArraySerde.deserialize(data)).toThrow(
        "Array item at index 1: Expected number, got string",
      );
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
      expect(result).toBe("hello");
    });

    test("deserialize undefined value", () => {
      const result = OptionalStringSerde.deserialize(undefined);
      expect(result).toBe(undefined);
    });

    test("deserialize throws on invalid value", () => {
      expect(() => OptionalStringSerde.deserialize(123)).toThrow(
        "Expected string, got number",
      );
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
      expect(result).toBe("hello");
    });

    test("deserialize null value", () => {
      const result = NullableStringSerde.deserialize(null);
      expect(result).toBe(null);
    });

    test("deserialize throws on invalid value", () => {
      expect(() => NullableStringSerde.deserialize(123)).toThrow(
        "Expected string, got number",
      );
    });
  });
});
