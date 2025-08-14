import { Err, Ok } from "@rustify/result";
import { createSerde } from "@/serializers/index.js";
import type { SafeSerde, Serde } from "@/types/index.js";

export function createOptionalSerde<T>(serde: {
  throwing: Serde<T, any>;
  safe: SafeSerde<T, any>;
}) {
  const safe: SafeSerde<T | undefined, any> = {
    serialize: (value) =>
      value === undefined ? undefined : serde.safe.serialize(value),
    deserialize: (serialized) => {
      if (serialized === undefined) return Ok(undefined);
      return serde.safe.deserialize(serialized);
    },
  };

  return createSerde(safe);
}

export function createNullableSerde<T>(serde: {
  throwing: Serde<T, any>;
  safe: SafeSerde<T, any>;
}) {
  const safe: SafeSerde<T | null, any> = {
    serialize: (value) => (value === null ? null : serde.safe.serialize(value)),
    deserialize: (serialized) => {
      if (serialized === null) return Ok(null);
      return serde.safe.deserialize(serialized);
    },
  };

  return createSerde(safe);
}

export function createDefaultSerde<T>(
  serde: { throwing: Serde<T, any>; safe: SafeSerde<T, any> },
  defaultValue: T,
) {
  const safe: SafeSerde<T, any> = {
    serialize: serde.safe.serialize,
    deserialize: (serialized) => {
      if (serialized === undefined) return Ok(defaultValue);
      return serde.safe.deserialize(serialized);
    },
  };

  return createSerde(safe);
}

export function createMappedSerde<T, K extends keyof T>(
  serde: { throwing: Serde<T, any>; safe: SafeSerde<T, any> },
  mapping: Record<string, K>,
) {
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
        mapped[internalKey as string] = obj[externalKey];
      }

      return serde.safe.deserialize(mapped);
    },
  };

  return createSerde(safe);
}

export function createLazySerde<T>(
  getSerdeFactory: () => {
    throwing: Serde<T, any>;
    safe: SafeSerde<T, any>;
  },
) {
  let serde: { throwing: Serde<T, any>; safe: SafeSerde<T, any> } | undefined;

  const getSerde = () => {
    if (!serde) {
      serde = getSerdeFactory();
    }
    return serde;
  };

  const safe: SafeSerde<T, any> = {
    serialize: (value) => getSerde().safe.serialize(value),
    deserialize: (serialized) => getSerde().safe.deserialize(serialized),
  };

  return createSerde(safe);
}

export function createRenameSerde<T, K extends keyof T>(
  serde: { throwing: Serde<T, any>; safe: SafeSerde<T, any> },
  fieldMapping: Partial<Record<K, string>>,
) {
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

  return createSerde(safe);
}
