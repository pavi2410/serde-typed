import { describe, expect, test } from "vitest";
import * as t from "../src/index.js";

describe("Modifier Serializers", () => {
  describe("Optional", () => {
    const OptionalStringSerde = t.optional(t.string);

    test("serialize defined value", () => {
      const result = OptionalStringSerde.serialize("hello");
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe("hello");
      }
    });

    test("serialize undefined value", () => {
      const result = OptionalStringSerde.serialize(undefined);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(undefined);
      }
    });

    test("deserialize defined value", () => {
      const result = OptionalStringSerde.deserialize("hello");
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe("hello");
      }
    });

    test("deserialize undefined value", () => {
      const result = OptionalStringSerde.deserialize(undefined);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(undefined);
      }
    });

    test("deserialize returns error on invalid value", () => {
      const result = OptionalStringSerde.deserialize(123);
      expect(result.isOk()).toBe(false);
      if (result.isErr()) {
        expect(result.error).toBe("Expected string, got number");
      }
    });
  });

  describe("Nullable", () => {
    const NullableStringSerde = t.nullable(t.string);

    test("serialize non-null value", () => {
      const result = NullableStringSerde.serialize("hello");
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe("hello");
      }
    });

    test("serialize null value", () => {
      const result = NullableStringSerde.serialize(null);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(null);
      }
    });

    test("deserialize non-null value", () => {
      const result = NullableStringSerde.deserialize("hello");
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe("hello");
      }
    });

    test("deserialize null value", () => {
      const result = NullableStringSerde.deserialize(null);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(null);
      }
    });

    test("deserialize returns error on invalid value", () => {
      const result = NullableStringSerde.deserialize(123);
      expect(result.isOk()).toBe(false);
      if (result.isErr()) {
        expect(result.error).toBe("Expected string, got number");
      }
    });
  });
});
