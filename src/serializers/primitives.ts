import type { Result } from "@/utils/result.js";
import { Err, Ok } from "@/utils/result.js";

interface ThrowingSerde<T, S> {
  serialize: (value: T) => S;
  deserialize: (serialized: unknown) => T;
}

interface SafeSerde<T, S> {
  serialize: (value: T) => S;
  deserialize: (serialized: unknown) => Result<T, string>;
}

export const createStringSerializer = () => {
  const throwing: ThrowingSerde<string, string> = {
    serialize: (value) => value,
    deserialize: (serialized) => {
      if (typeof serialized !== "string") {
        throw new Error(`Expected string, got ${typeof serialized}`);
      }
      return serialized;
    },
  };

  const safe: SafeSerde<string, string> = {
    serialize: (value) => value,
    deserialize: (serialized) =>
      typeof serialized === "string"
        ? Ok(serialized)
        : Err(`Expected string, got ${typeof serialized}`),
  };

  return { throwing, safe };
};

export const createNumberSerializer = () => {
  const throwing: ThrowingSerde<number, number> = {
    serialize: (value) => value,
    deserialize: (serialized) => {
      if (typeof serialized !== "number") {
        throw new Error(`Expected number, got ${typeof serialized}`);
      }
      return serialized;
    },
  };

  const safe: SafeSerde<number, number> = {
    serialize: (value) => value,
    deserialize: (serialized) =>
      typeof serialized === "number"
        ? Ok(serialized)
        : Err(`Expected number, got ${typeof serialized}`),
  };

  return { throwing, safe };
};

export const createBooleanSerializer = () => {
  const throwing: ThrowingSerde<boolean, boolean> = {
    serialize: (value) => value,
    deserialize: (serialized) => {
      if (typeof serialized !== "boolean") {
        throw new Error(`Expected boolean, got ${typeof serialized}`);
      }
      return serialized;
    },
  };

  const safe: SafeSerde<boolean, boolean> = {
    serialize: (value) => value,
    deserialize: (serialized) =>
      typeof serialized === "boolean"
        ? Ok(serialized)
        : Err(`Expected boolean, got ${typeof serialized}`),
  };

  return { throwing, safe };
};

export const createDateSerializer = () => {
  const throwing: ThrowingSerde<Date, string> = {
    serialize: (value) => value.toISOString(),
    deserialize: (serialized) => {
      if (typeof serialized !== "string") {
        throw new Error(`Expected string for date, got ${typeof serialized}`);
      }
      const dateObj = new Date(serialized);
      if (Number.isNaN(dateObj.getTime())) {
        throw new Error(`Invalid date string: ${serialized}`);
      }
      return dateObj;
    },
  };

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

  return { throwing, safe };
};

export function createLiteralSerializer<T extends string | number | boolean>(
  literal: T,
) {
  const throwing: ThrowingSerde<T, T> = {
    serialize: () => literal,
    deserialize: (serialized) => {
      if (serialized !== literal) {
        throw new Error(`Expected literal ${literal}, got ${serialized}`);
      }
      return literal;
    },
  };

  const safe: SafeSerde<T, T> = {
    serialize: () => literal,
    deserialize: (serialized) =>
      serialized === literal
        ? Ok(literal)
        : Err(`Expected literal ${literal}, got ${serialized}`),
  };

  return { throwing, safe };
}

export function createEnumSerializer<T extends Record<string, string | number>>(
  enumObject: T,
) {
  const validValues = Object.values(enumObject);

  const throwing: ThrowingSerde<T[keyof T], T[keyof T]> = {
    serialize: (value) => value,
    deserialize: (serialized) => {
      if (!validValues.includes(serialized as T[keyof T])) {
        throw new Error(
          `Invalid enum value: ${serialized}. Expected one of: ${validValues.join(", ")}`,
        );
      }
      return serialized as T[keyof T];
    },
  };

  const safe: SafeSerde<T[keyof T], T[keyof T]> = {
    serialize: (value) => value,
    deserialize: (serialized) =>
      validValues.includes(serialized as T[keyof T])
        ? Ok(serialized as T[keyof T])
        : Err(
            `Invalid enum value: ${serialized}. Expected one of: ${validValues.join(", ")}`,
          ),
  };

  return { throwing, safe };
}

export function createTransformSerializer<T, S, U>(
  baseSerde: { throwing: ThrowingSerde<T, S>; safe: SafeSerde<T, S> },
  serializeTransform: (value: U) => T,
  deserializeTransform: (value: T) => U,
  safeDeserializeTransform: (value: T) => Result<U, string>,
) {
  const throwing: ThrowingSerde<U, S> = {
    serialize: (value) =>
      baseSerde.throwing.serialize(serializeTransform(value)),
    deserialize: (serialized) =>
      deserializeTransform(baseSerde.throwing.deserialize(serialized)),
  };

  const safe: SafeSerde<U, S> = {
    serialize: (value) => baseSerde.safe.serialize(serializeTransform(value)),
    deserialize: (serialized) => {
      const result = baseSerde.safe.deserialize(serialized);
      if (!result.ok) return result;
      return safeDeserializeTransform(result.value);
    },
  };

  return { throwing, safe };
}
