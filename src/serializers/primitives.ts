import { createSerde } from "@/serializers/index.js";
import type { SafeSerde, Serde } from "@/types/index.js";
import type { Result } from "@rustify/result";
import { Err, Ok } from "@rustify/result";

export const createStringSerde = () => {
  const safe: SafeSerde<string, string> = {
    serialize: (value) => value,
    deserialize: (serialized) =>
      typeof serialized === "string"
        ? Ok(serialized)
        : Err(`Expected string, got ${typeof serialized}`),
  };

  return createSerde(safe);
};

export const createNumberSerde = () => {
  const safe: SafeSerde<number, number> = {
    serialize: (value) => value,
    deserialize: (serialized) =>
      typeof serialized === "number"
        ? Ok(serialized)
        : Err(`Expected number, got ${typeof serialized}`),
  };

  return createSerde(safe);
};

export const createBooleanSerde = () => {
  const safe: SafeSerde<boolean, boolean> = {
    serialize: (value) => value,
    deserialize: (serialized) =>
      typeof serialized === "boolean"
        ? Ok(serialized)
        : Err(`Expected boolean, got ${typeof serialized}`),
  };

  return createSerde(safe);
};

export const createDateSerde = () => {
  const safe: SafeSerde<Date, string> = {
    serialize: (value) => value.toISOString(),
    deserialize: (serialized) => {
      if (typeof serialized !== "string") {
        return Err(`Expected string for date, got ${typeof serialized}`);
      }
      const dateObj = new Date(serialized);
      return Number.isNaN(dateObj.getTime())
        ? Err(`Invalid date string: ${serialized}`)
        : Ok(dateObj);
    },
  };

  return createSerde(safe);
};

export function createLiteralSerde<T extends string | number | boolean>(
  literal: T,
) {
  const safe: SafeSerde<T, T> = {
    serialize: () => literal,
    deserialize: (serialized) =>
      serialized === literal
        ? Ok(literal)
        : Err(`Expected literal ${literal}, got ${serialized}`),
  };

  return createSerde(safe);
}

export function createEnumSerde<T extends Record<string, string | number>>(
  enumObject: T,
) {
  const validValues = Object.values(enumObject);

  const safe: SafeSerde<T[keyof T], T[keyof T]> = {
    serialize: (value) => value,
    deserialize: (serialized) =>
      validValues.includes(serialized as T[keyof T])
        ? Ok(serialized as T[keyof T])
        : Err(
            `Invalid enum value: ${serialized}. Expected one of: ${validValues.join(", ")}`,
          ),
  };

  return createSerde(safe);
}

export function createTransformSerde<T, S, U>(
  baseSerde: { throwing: Serde<T, S>; safe: SafeSerde<T, S> },
  serializeTransform: (value: U) => T,
  _deserializeTransform: (value: T) => U,
  safeDeserializeTransform: (value: T) => Result<U, string>,
) {
  const safe: SafeSerde<U, S> = {
    serialize: (value: U) =>
      baseSerde.safe.serialize(serializeTransform(value)),
    deserialize: (serialized: unknown) => {
      const result = baseSerde.safe.deserialize(serialized);
      if (result.isErr()) return result;
      return safeDeserializeTransform(result.value);
    },
  };

  return createSerde(safe);
}
