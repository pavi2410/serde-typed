import { createSerde } from "@/serializers/index.js";
import type { SafeSerde, Serde } from "@/types/index.js";
import { Err, Ok } from "@rustify/result";

export function createObjectSerde<T extends Record<string, any>>(
  fields: {
    [K in keyof T]: {
      throwing: Serde<T[K], any>;
      safe: SafeSerde<T[K], any>;
    };
  },
) {
  const safe: SafeSerde<T, Record<string, any>> = {
    serialize: (value) => {
      const result: Record<string, any> = {};
      for (const key in fields) {
        result[key] = fields[key]!.safe.serialize(value[key]);
      }
      return result;
    },
    deserialize: (serialized) => {
      if (
        typeof serialized !== "object" ||
        serialized === null ||
        Array.isArray(serialized)
      ) {
        return Err("Expected object");
      }

      const result = {} as T;
      const obj = serialized as Record<string, unknown>;

      for (const key in fields) {
        const fieldResult = fields[key]!.safe.deserialize(obj[key]);
        if (fieldResult.isErr()) {
          return Err(`Field '${key}': ${fieldResult.error}`);
        }
        result[key] = fieldResult.value;
      }
      return Ok(result);
    },
  };

  return createSerde(safe);
}

export function createArraySerde<T>(itemSerde: {
  throwing: Serde<T, any>;
  safe: SafeSerde<T, any>;
}) {
  const safe: SafeSerde<T[], any[]> = {
    serialize: (value) => value.map((item) => itemSerde.safe.serialize(item)),
    deserialize: (serialized) => {
      if (!Array.isArray(serialized)) {
        return Err("Expected array");
      }

      const result: T[] = [];
      for (let i = 0; i < serialized.length; i++) {
        const itemResult = itemSerde.safe.deserialize(serialized[i]);
        if (itemResult.isErr()) {
          return Err(`Array item at index ${i}: ${itemResult.error}`);
        }
        result.push(itemResult.value);
      }
      return Ok(result);
    },
  };

  return createSerde(safe);
}

export function createTupleSerde<T extends readonly any[]>(
  ...serdes: {
    [K in keyof T]: {
      throwing: Serde<T[K], any>;
      safe: SafeSerde<T[K], any>;
    };
  }
) {
  const safe: SafeSerde<T, any[]> = {
    serialize: (value) =>
      serdes.map((serde, i) => serde.safe.serialize(value[i])),
    deserialize: (serialized) => {
      if (!Array.isArray(serialized)) {
        return Err("Expected array for tuple");
      }

      if (serialized.length !== serdes.length) {
        return Err(
          `Expected tuple of length ${serdes.length}, got ${serialized.length}`,
        );
      }

      const result: any[] = [];
      for (let i = 0; i < serdes.length; i++) {
        const itemResult = serdes[i]!.safe.deserialize(serialized[i]);
        if (itemResult.isErr()) {
          return Err(`Tuple item at index ${i}: ${itemResult.error}`);
        }
        result.push(itemResult.value);
      }
      return Ok(result as unknown as T);
    },
  };

  return createSerde(safe);
}

export function createUnionSerde<T extends Record<string, any>>(
  variants: {
    [K in keyof T]: {
      throwing: Serde<T[K], any>;
      safe: SafeSerde<T[K], any>;
    };
  },
  tagExtractor: (value: T[keyof T]) => keyof T,
  tagField: string = "type",
) {
  const safe: SafeSerde<T[keyof T], any> = {
    serialize: (value) => {
      const tag = tagExtractor(value);
      const serialized = variants[tag]!.safe.serialize(value);
      return { [tagField]: tag, ...serialized };
    },
    deserialize: (serialized) => {
      if (
        typeof serialized !== "object" ||
        serialized === null ||
        Array.isArray(serialized)
      ) {
        return Err("Expected object for union");
      }

      const obj = serialized as Record<string, unknown>;
      const tag = obj[tagField] as keyof T;

      if (!variants[tag]) {
        return Err(`Unknown union variant: ${String(tag)}`);
      }

      return variants[tag]!.safe.deserialize(serialized);
    },
  };

  return createSerde(safe);
}

export function createRecordSerde<T>(valueSerde: {
  throwing: Serde<T, any>;
  safe: SafeSerde<T, any>;
}) {
  const safe: SafeSerde<Record<string, T>, Record<string, any>> = {
    serialize: (value) => {
      const result: Record<string, any> = {};
      for (const key in value) {
        result[key] = valueSerde.safe.serialize(value[key]!);
      }
      return result;
    },
    deserialize: (serialized) => {
      if (
        typeof serialized !== "object" ||
        serialized === null ||
        Array.isArray(serialized)
      ) {
        return Err("Expected object for record");
      }

      const result: Record<string, T> = {};
      const obj = serialized as Record<string, unknown>;

      for (const key in obj) {
        const valueResult = valueSerde.safe.deserialize(obj[key]);
        if (valueResult.isErr()) {
          return Err(`Record key '${key}': ${valueResult.error}`);
        }
        result[key] = valueResult.value;
      }
      return Ok(result);
    },
  };

  return createSerde(safe);
}
