import { Err, Ok } from "@rustify/result";
import type { Serde } from "@/types.js";

export function createOptionalSerde<T>(
  serde: Serde<T, any>,
): Serde<T | undefined, any> {
  return {
    serialize: (value) =>
      value === undefined ? undefined : serde.serialize(value),
    deserialize: (serialized) => {
      if (serialized === undefined) return Ok(undefined);
      return serde.deserialize(serialized);
    },
  };
}

export function createNullableSerde<T>(
  serde: Serde<T, any>,
): Serde<T | null, any> {
  return {
    serialize: (value) => (value === null ? null : serde.serialize(value)),
    deserialize: (serialized) => {
      if (serialized === null) return Ok(null);
      return serde.deserialize(serialized);
    },
  };
}

export function createDefaultSerde<T>(
  serde: Serde<T, any>,
  defaultValue: T,
): Serde<T, any> {
  return {
    serialize: serde.serialize,
    deserialize: (serialized) => {
      if (serialized === undefined) return Ok(defaultValue);
      return serde.deserialize(serialized);
    },
  };
}

export function createMappedSerde<T, K extends keyof T>(
  serde: Serde<T, any>,
  mapping: Record<string, K>,
): Serde<T, Record<string, any>> {
  return {
    serialize: (value) => {
      const serialized = serde.serialize(value);
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

      return serde.deserialize(mapped);
    },
  };
}

export function createLazySerde<T>(
  getSerdeFactory: () => Serde<T, any>,
): Serde<T, any> {
  let serde: Serde<T, any> | undefined;

  const getSerde = () => {
    if (!serde) {
      serde = getSerdeFactory();
    }
    return serde;
  };

  return {
    serialize: (value) => getSerde().serialize(value),
    deserialize: (serialized) => getSerde().deserialize(serialized),
  };
}

export function createRenameSerde<T, K extends keyof T>(
  serde: Serde<T, any>,
  fieldMapping: Partial<Record<K, string>>,
): Serde<T, any> {
  return {
    serialize: (value) => {
      const serialized = serde.serialize(value);
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

      return serde.deserialize(unmapped);
    },
  };
}
