import { describe, expect, test } from "vitest";
import * as t from "../src/index.js";

describe("Complex Serializers", () => {
  describe("Object", () => {
    const PersonSerde = t.object({
      name: t.string,
      age: t.number,
      active: t.boolean,
    });

    test("serialize", () => {
      const person = { name: "Alice", age: 30, active: true };
      const result = PersonSerde.serialize(person);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual({ name: "Alice", age: 30, active: true });
      }
    });

    test("deserialize success", () => {
      const data = { name: "Bob", age: 25, active: false };
      const result = PersonSerde.deserialize(data);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual({ name: "Bob", age: 25, active: false });
      }
    });

    test("deserialize returns error on invalid object", () => {
      const result = PersonSerde.deserialize("not an object");
      expect(result.isOk()).toBe(false);
      if (result.isErr()) {
        expect(result.error).toBe("Expected object");
      }
    });

    test("deserialize returns error on field error", () => {
      const data = { name: "Bob", age: "not a number", active: false };
      const result = PersonSerde.deserialize(data);
      expect(result.isOk()).toBe(false);
      if (result.isErr()) {
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
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual([1, 2, 3, 4, 5]);
      }
    });

    test("deserialize success", () => {
      const data = [10, 20, 30];
      const result = NumberArraySerde.deserialize(data);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual([10, 20, 30]);
      }
    });

    test("deserialize returns error on invalid array", () => {
      const result = NumberArraySerde.deserialize("not an array");
      expect(result.isOk()).toBe(false);
      if (result.isErr()) {
        expect(result.error).toBe("Expected array");
      }
    });

    test("deserialize returns error on item error", () => {
      const data = [1, "not a number", 3];
      const result = NumberArraySerde.deserialize(data);
      expect(result.isOk()).toBe(false);
      if (result.isErr()) {
        expect(result.error).toContain("Array item at index 1");
        expect(result.error).toContain("Expected number, got string");
      }
    });
  });

  describe("Serialization Error Propagation", () => {
    // Create a mock serde that can fail during serialization
    const failingSerde = {
      serialize: (value: string) => {
        if (value === "fail") {
          return {
            isOk: () => false,
            isErr: () => true,
            error: "Intentional failure",
          };
        }
        return { isOk: () => true, isErr: () => false, value };
      },
      deserialize: (serialized: unknown) => {
        if (typeof serialized === "string") {
          return { isOk: () => true, isErr: () => false, value: serialized };
        }
        return {
          isOk: () => false,
          isErr: () => true,
          error: "Expected string",
        };
      },
    };

    test("object serialization propagates field errors", () => {
      const objSerde = t.object({
        good: t.string,
        bad: failingSerde as any,
      });

      const result = objSerde.serialize({ good: "hello", bad: "fail" });
      expect(result.isOk()).toBe(false);
      if (result.isErr()) {
        expect(result.error).toContain("Field 'bad'");
        expect(result.error).toContain("Intentional failure");
      }
    });

    test("array serialization propagates item errors", () => {
      const arraySerde = t.array(failingSerde as any);

      const result = arraySerde.serialize(["good", "fail", "good"]);
      expect(result.isOk()).toBe(false);
      if (result.isErr()) {
        expect(result.error).toContain("Array item at index 1");
        expect(result.error).toContain("Intentional failure");
      }
    });
  });
});
