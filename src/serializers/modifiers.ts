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

export function createOptionalSerializer<T>(serde: {
  throwing: ThrowingSerde<T, any>;
  safe: SafeSerde<T, any>;
}) {
  const throwing: ThrowingSerde<T | undefined, any> = {
    serialize: (value) =>
      value === undefined ? undefined : serde.throwing.serialize(value),
    deserialize: (serialized) =>
      serialized === undefined
        ? undefined
        : serde.throwing.deserialize(serialized),
  };

  const safe: SafeSerde<T | undefined, any> = {
    serialize: (value) =>
      value === undefined ? undefined : serde.safe.serialize(value),
    deserialize: (serialized) => {
      if (serialized === undefined) return Ok(undefined);
      return serde.safe.deserialize(serialized);
    },
  };

  return { throwing, safe };
}

export function createNullableSerializer<T>(serde: {
  throwing: ThrowingSerde<T, any>;
  safe: SafeSerde<T, any>;
}) {
  const throwing: ThrowingSerde<T | null, any> = {
    serialize: (value) =>
      value === null ? null : serde.throwing.serialize(value),
    deserialize: (serialized) =>
      serialized === null ? null : serde.throwing.deserialize(serialized),
  };

  const safe: SafeSerde<T | null, any> = {
    serialize: (value) => (value === null ? null : serde.safe.serialize(value)),
    deserialize: (serialized) => {
      if (serialized === null) return Ok(null);
      return serde.safe.deserialize(serialized);
    },
  };

  return { throwing, safe };
}

export function createDefaultSerializer<T>(
  serde: { throwing: ThrowingSerde<T, any>; safe: SafeSerde<T, any> },
  defaultValue: T,
) {
  const throwing: ThrowingSerde<T, any> = {
    serialize: serde.throwing.serialize,
    deserialize: (serialized) =>
      serialized === undefined
        ? defaultValue
        : serde.throwing.deserialize(serialized),
  };

  const safe: SafeSerde<T, any> = {
    serialize: serde.safe.serialize,
    deserialize: (serialized) => {
      if (serialized === undefined) return Ok(defaultValue);
      return serde.safe.deserialize(serialized);
    },
  };

  return { throwing, safe };
}

export function createMappedSerializer<T, K extends keyof T>(
  serde: { throwing: ThrowingSerde<T, any>; safe: SafeSerde<T, any> },
  mapping: Record<string, K>,
) {
  const throwing: ThrowingSerde<T, Record<string, any>> = {
    serialize: (value) => {
      const serialized = serde.throwing.serialize(value);
      const result: Record<string, any> = {};
      for (const [externalKey, internalKey] of Object.entries(mapping)) {
        result[externalKey] = serialized[internalKey];
      }
      return result;
    },
    deserialize: (serialized) => {
      if (
        typeof serialized !== "object" ||
        serialized === null ||
        Array.isArray(serialized)
      ) {
        throw new Error("Expected object for mapped type");
      }

      const obj = serialized as Record<string, unknown>;
      const mapped: Record<string, any> = {};
      for (const [externalKey, internalKey] of Object.entries(mapping)) {
        mapped[internalKey] = obj[externalKey];
      }
      return serde.throwing.deserialize(mapped);
    },
  };

  const safe: SafeSerde<T, Record<string, any>> = {
    serialize: (value) => {
      const serialized = serde.safe.serialize(value);
      const result: Record<string, any> = {};
      for (const [externalKey, internalKey] of Object.entries(mapping)) {
        result[externalKey] = serialized[internalKey];
      }
      return result;
    },
    deserialize: (serialized) => {
      if (
        typeof serialized !== "object" ||
        serialized === null ||
        Array.isArray(serialized)
      ) {
        return Err("Expected object for mapped type");
      }

      const obj = serialized as Record<string, unknown>;
      const mapped: Record<string, any> = {};

      for (const [externalKey, internalKey] of Object.entries(mapping)) {
        mapped[internalKey] = obj[externalKey];
      }

      return serde.safe.deserialize(mapped);
    },
  };

  return { throwing, safe };
}

export function createLazySerializer<T>(
  getSerdeFactory: () => {
    throwing: ThrowingSerde<T, any>;
    safe: SafeSerde<T, any>;
  },
) {
  let serde:
    | { throwing: ThrowingSerde<T, any>; safe: SafeSerde<T, any> }
    | undefined;

  const getSerde = () => {
    if (!serde) {
      serde = getSerdeFactory();
    }
    return serde;
  };

  const throwing: ThrowingSerde<T, any> = {
    serialize: (value) => getSerde().throwing.serialize(value),
    deserialize: (serialized) => getSerde().throwing.deserialize(serialized),
  };

  const safe: SafeSerde<T, any> = {
    serialize: (value) => getSerde().safe.serialize(value),
    deserialize: (serialized) => getSerde().safe.deserialize(serialized),
  };

  return { throwing, safe };
}

export function createRenameSerializer<T, K extends keyof T>(
  serde: { throwing: ThrowingSerde<T, any>; safe: SafeSerde<T, any> },
  fieldMapping: Partial<Record<K, string>>,
) {
  const throwing: ThrowingSerde<T, any> = {
    serialize: (value) => {
      const serialized = serde.throwing.serialize(value);
      const result: Record<string, any> = {};

      for (const key in serialized) {
        const mappedKey = fieldMapping[key as K] || key;
        result[mappedKey] = serialized[key];
      }

      return result;
    },
    deserialize: (serialized) => {
      if (
        typeof serialized !== "object" ||
        serialized === null ||
        Array.isArray(serialized)
      ) {
        throw new Error("Expected object for renamed type");
      }

      const obj = serialized as Record<string, unknown>;
      const reverseMapping: Record<string, string> = {};
      for (const [originalKey, mappedKey] of Object.entries(fieldMapping)) {
        reverseMapping[mappedKey as string] = originalKey;
      }

      const unmapped: Record<string, any> = {};
      for (const key in obj) {
        const originalKey = reverseMapping[key] || key;
        unmapped[originalKey] = obj[key];
      }

      return serde.throwing.deserialize(unmapped);
    },
  };

  const safe: SafeSerde<T, any> = {
    serialize: (value) => {
      const serialized = serde.safe.serialize(value);
      const result: Record<string, any> = {};

      for (const key in serialized) {
        const mappedKey = fieldMapping[key as K] || key;
        result[mappedKey] = serialized[key];
      }

      return result;
    },
    deserialize: (serialized) => {
      if (
        typeof serialized !== "object" ||
        serialized === null ||
        Array.isArray(serialized)
      ) {
        return Err("Expected object for renamed type");
      }

      const obj = serialized as Record<string, unknown>;
      const reverseMapping: Record<string, string> = {};
      for (const [originalKey, mappedKey] of Object.entries(fieldMapping)) {
        reverseMapping[mappedKey as string] = originalKey;
      }

      const unmapped: Record<string, any> = {};
      for (const key in obj) {
        const originalKey = reverseMapping[key] || key;
        unmapped[originalKey] = obj[key];
      }

      return serde.safe.deserialize(unmapped);
    },
  };

  return { throwing, safe };
}
