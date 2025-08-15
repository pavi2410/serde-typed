import type { Result } from "@rustify/result";
import { Err, Ok } from "@rustify/result";
import type { Serde } from "@/types.js";

export const createStringSerde = (): Serde<string, string> => ({
  serialize: (value) => Ok(value),
  deserialize: (serialized) =>
    typeof serialized === "string"
      ? Ok(serialized)
      : Err(`Expected string, got ${typeof serialized}`),
});

export const createNumberSerde = (): Serde<number, number> => ({
  serialize: (value) => Ok(value),
  deserialize: (serialized) =>
    typeof serialized === "number"
      ? Ok(serialized)
      : Err(`Expected number, got ${typeof serialized}`),
});

export const createBooleanSerde = (): Serde<boolean, boolean> => ({
  serialize: (value) => Ok(value),
  deserialize: (serialized) =>
    typeof serialized === "boolean"
      ? Ok(serialized)
      : Err(`Expected boolean, got ${typeof serialized}`),
});

export const createDateSerde = (): Serde<Date, string> => ({
  serialize: (value) => Ok(value.toISOString()),
  deserialize: (serialized) => {
    if (typeof serialized !== "string") {
      return Err(`Expected string for date, got ${typeof serialized}`);
    }
    const dateObj = new Date(serialized);
    return Number.isNaN(dateObj.getTime())
      ? Err(`Invalid date string: ${serialized}`)
      : Ok(dateObj);
  },
});

export function createLiteralSerde<T extends string | number | boolean>(
  literal: T,
): Serde<T, T> {
  return {
    serialize: () => Ok(literal),
    deserialize: (serialized) =>
      serialized === literal
        ? Ok(literal)
        : Err(`Expected literal ${literal}, got ${serialized}`),
  };
}

export function createEnumSerde<T extends Record<string, string | number>>(
  enumObject: T,
): Serde<T[keyof T], T[keyof T]> {
  const validValues = Object.values(enumObject);

  return {
    serialize: (value) => Ok(value),
    deserialize: (serialized) =>
      validValues.includes(serialized as T[keyof T])
        ? Ok(serialized as T[keyof T])
        : Err(
            `Invalid enum value: ${serialized}. Expected one of: ${validValues.join(", ")}`,
          ),
  };
}

export function createTransformSerde<T, S, U>(
  baseSerde: Serde<T, S>,
  serializeTransform: (value: U) => T,
  _deserializeTransform: (value: T) => U,
  safeDeserializeTransform: (value: T) => Result<U, string>,
): Serde<U, S> {
  return {
    serialize: (value: U) => {
      try {
        return baseSerde.serialize(serializeTransform(value));
      } catch (error) {
        return Err(
          `Transform error: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    },
    deserialize: (serialized: unknown) => {
      const result = baseSerde.deserialize(serialized);
      if (result.isErr()) return result;
      return safeDeserializeTransform(result.value);
    },
  };
}
